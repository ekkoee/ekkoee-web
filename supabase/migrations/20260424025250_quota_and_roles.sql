-- ekkoee incremental migration
-- Purpose: add quota system + role refactor + simulator sessions + RLS revamp
-- Baseline: 20260424015303_remote_schema.sql

-- =============================================================
-- Section 1: companies quota columns
-- =============================================================
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS monthly_ai_quota integer NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS monthly_budget_cents integer NOT NULL DEFAULT 50000;

COMMENT ON COLUMN public.companies.monthly_ai_quota IS
  'Monthly AI call count limit per company';
COMMENT ON COLUMN public.companies.monthly_budget_cents IS
  'Monthly AI budget cap in cents (global circuit breaker)';

-- =============================================================
-- Section 2: user_roles new columns + role migration + CHECK
-- =============================================================
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS daily_ai_limit integer,
  ADD COLUMN IF NOT EXISTS is_platform_admin boolean NOT NULL DEFAULT false;

-- Migrate legacy 'admin' role to new dual-axis model
UPDATE public.user_roles
SET is_platform_admin = true,
    role = 'owner'
WHERE role = 'admin';

-- Migrate legacy 'manager' role to 'engineer' (technical lead, not people manager)
UPDATE public.user_roles
SET role = 'engineer'
WHERE role = 'manager';

-- Constrain role to four valid values
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('owner', 'engineer', 'operator', 'viewer'));

COMMENT ON COLUMN public.user_roles.daily_ai_limit IS
  'Per-user daily AI call limit (NULL = use company default)';
COMMENT ON COLUMN public.user_roles.is_platform_admin IS
  'ekkoee platform admin flag (cross-company), orthogonal to role';

-- =============================================================
-- Section 3: ai_usage_log table
-- =============================================================
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  task_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'failed')),
  input_tokens integer,
  output_tokens integer,
  cost_cents integer,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS ai_usage_log_company_time_idx
  ON public.ai_usage_log (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_log_user_time_idx
  ON public.ai_usage_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_log_pending_idx
  ON public.ai_usage_log (status) WHERE status = 'pending';

-- =============================================================
-- Section 4: simulator_sessions table
-- =============================================================
CREATE TABLE IF NOT EXISTS public.simulator_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  session_name text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS simulator_sessions_company_time_idx
  ON public.simulator_sessions (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS simulator_sessions_user_time_idx
  ON public.simulator_sessions (user_id, created_at DESC);

-- =============================================================
-- Section 5: check_and_reserve_quota function
-- =============================================================
CREATE OR REPLACE FUNCTION public.check_and_reserve_quota(
  p_user_id uuid,
  p_company_id uuid,
  p_task_type text
) RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $func$
DECLARE
  v_company_quota integer;
  v_company_budget_cents integer;
  v_user_daily_limit integer;
  v_user_role text;
  v_current_month_count integer;
  v_current_month_cost_cents integer;
  v_user_today_count integer;
  v_log_id uuid;
BEGIN
  -- Lock the company row to serialize quota checks
  SELECT monthly_ai_quota, monthly_budget_cents
    INTO v_company_quota, v_company_budget_cents
    FROM public.companies
   WHERE id = p_company_id
   FOR UPDATE;

  IF v_company_quota IS NULL THEN
    RAISE EXCEPTION 'company_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT role, daily_ai_limit
    INTO v_user_role, v_user_daily_limit
    FROM public.user_roles
   WHERE user_id = p_user_id AND company_id = p_company_id;

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'user_not_in_company' USING ERRCODE = 'P0002';
  END IF;

  IF v_user_role IN ('operator', 'viewer') THEN
    RAISE EXCEPTION 'role_not_allowed' USING ERRCODE = '42501';
  END IF;

  -- Count pending + success to prevent race-condition bypass
  SELECT count(*), COALESCE(sum(cost_cents), 0)
    INTO v_current_month_count, v_current_month_cost_cents
    FROM public.ai_usage_log
   WHERE company_id = p_company_id
     AND status IN ('pending', 'success')
     AND created_at >= date_trunc('month', now());

  IF v_current_month_count >= v_company_quota THEN
    RAISE EXCEPTION 'company_quota_exceeded' USING ERRCODE = '22023';
  END IF;

  IF v_current_month_cost_cents >= v_company_budget_cents THEN
    RAISE EXCEPTION 'company_budget_exceeded' USING ERRCODE = '22023';
  END IF;

  -- Owner bypasses per-user daily limit
  IF v_user_role <> 'owner' AND v_user_daily_limit IS NOT NULL THEN
    SELECT count(*)
      INTO v_user_today_count
      FROM public.ai_usage_log
     WHERE user_id = p_user_id
       AND status IN ('pending', 'success')
       AND created_at >= date_trunc('day', now());

    IF v_user_today_count >= v_user_daily_limit THEN
      RAISE EXCEPTION 'user_daily_limit_exceeded' USING ERRCODE = '22023';
    END IF;
  END IF;

  INSERT INTO public.ai_usage_log (user_id, company_id, task_type, status)
  VALUES (p_user_id, p_company_id, p_task_type, 'pending')
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$func$;

REVOKE ALL ON FUNCTION public.check_and_reserve_quota(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_reserve_quota(uuid, uuid, text) TO authenticated;

COMMENT ON FUNCTION public.check_and_reserve_quota IS
  'API route calls this to reserve quota; returns log id on success, raises on failure. AI route later updates the log with status/tokens/cost.';

-- =============================================================
-- Section 6: RLS + new is_platform_admin helper, is_admin rewire
-- =============================================================
CREATE OR REPLACE FUNCTION public.is_platform_admin(uid uuid)
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $func$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = uid AND is_platform_admin = true
  );
$func$;

GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid)
  TO anon, authenticated, service_role;

-- Rewire legacy is_admin() to use new flag (all existing RLS policies inherit)
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $func$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = uid AND is_platform_admin = true
  );
$func$;

-- ai_usage_log: read-only from frontend; writes go through SECURITY DEFINER function
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_usage_log_read_own ON public.ai_usage_log
  FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids(auth.uid()))
    OR public.is_platform_admin(auth.uid())
  );

GRANT SELECT ON public.ai_usage_log TO authenticated;
GRANT ALL ON public.ai_usage_log TO service_role;

-- simulator_sessions: users own their sessions
ALTER TABLE public.simulator_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY simulator_sessions_read_own ON public.simulator_sessions
  FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids(auth.uid()))
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY simulator_sessions_write_own ON public.simulator_sessions
  FOR ALL
  USING (
    user_id = auth.uid()
    AND company_id IN (SELECT public.user_company_ids(auth.uid()))
  )
  WITH CHECK (
    user_id = auth.uid()
    AND company_id IN (SELECT public.user_company_ids(auth.uid()))
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulator_sessions TO authenticated;
GRANT ALL ON public.simulator_sessions TO service_role;

-- user_roles: owner can manage teammates within their own company
CREATE POLICY user_roles_owner_manage ON public.user_roles
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'owner'
    )
    -- owners cannot promote anyone to platform admin
    AND is_platform_admin = false
  );

-- =============================================================
-- Section 7: updated_at trigger for simulator_sessions
-- =============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS simulator_sessions_set_updated_at ON public.simulator_sessions;
CREATE TRIGGER simulator_sessions_set_updated_at
  BEFORE UPDATE ON public.simulator_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- Section 8: camptec quota seed
-- =============================================================
UPDATE public.companies
SET monthly_ai_quota = 5000,
    monthly_budget_cents = 100000
WHERE slug = 'camptec';