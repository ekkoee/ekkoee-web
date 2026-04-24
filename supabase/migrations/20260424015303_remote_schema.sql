


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."is_admin"("uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = uid AND role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"("uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_company_ids"("uid" "uuid") RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT company_id FROM user_roles WHERE user_id = uid;
$$;


ALTER FUNCTION "public"."user_company_ids"("uid" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."agent_logs" (
    "id" bigint NOT NULL,
    "agent_id" "uuid",
    "company_id" "uuid",
    "event_type" "text" NOT NULL,
    "severity" "text" DEFAULT 'info'::"text",
    "message" "text",
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."agent_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."agent_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."agent_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."agent_logs_id_seq" OWNED BY "public"."agent_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."agents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'standby'::"text",
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "last_heartbeat" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."agents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "industry" "text",
    "contact_email" "text",
    "contact_phone" "text",
    "contract_type" "text" DEFAULT 'poc'::"text",
    "contract_start" "date",
    "contract_end" "date",
    "monthly_fee" numeric,
    "status" "text" DEFAULT 'setup'::"text",
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "nda_signed" boolean DEFAULT false,
    "nda_signed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_stats" (
    "id" bigint NOT NULL,
    "company_id" "uuid",
    "date" "date" NOT NULL,
    "total_detections" integer DEFAULT 0,
    "pass_rate" numeric DEFAULT 0,
    "active_agents" integer DEFAULT 0,
    "alerts_count" integer DEFAULT 0,
    "uptime_percent" numeric DEFAULT 100,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."daily_stats" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."daily_stats_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."daily_stats_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."daily_stats_id_seq" OWNED BY "public"."daily_stats"."id";



CREATE TABLE IF NOT EXISTS "public"."edge_servers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "hostname" "text" NOT NULL,
    "ip_address" "text",
    "gpu_model" "text",
    "gpu_memory_gb" integer,
    "os_version" "text",
    "api_key_hash" "text" NOT NULL,
    "last_heartbeat" timestamp with time zone,
    "status" "text" DEFAULT 'offline'::"text",
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."edge_servers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "company_id" "uuid",
    "role" "text" DEFAULT 'viewer'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."agent_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."agent_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."daily_stats" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."daily_stats_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."agent_logs"
    ADD CONSTRAINT "agent_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."daily_stats"
    ADD CONSTRAINT "daily_stats_company_id_date_key" UNIQUE ("company_id", "date");



ALTER TABLE ONLY "public"."daily_stats"
    ADD CONSTRAINT "daily_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."edge_servers"
    ADD CONSTRAINT "edge_servers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_company_id_key" UNIQUE ("user_id", "company_id");



CREATE INDEX "agent_logs_agent_time_idx" ON "public"."agent_logs" USING "btree" ("agent_id", "created_at" DESC);



CREATE INDEX "agent_logs_company_time_idx" ON "public"."agent_logs" USING "btree" ("company_id", "created_at" DESC);



CREATE INDEX "agents_company_idx" ON "public"."agents" USING "btree" ("company_id");



CREATE INDEX "companies_slug_idx" ON "public"."companies" USING "btree" ("slug");



CREATE INDEX "daily_stats_company_date_idx" ON "public"."daily_stats" USING "btree" ("company_id", "date" DESC);



CREATE INDEX "edge_servers_company_idx" ON "public"."edge_servers" USING "btree" ("company_id");



CREATE INDEX "user_roles_company_idx" ON "public"."user_roles" USING "btree" ("company_id");



CREATE INDEX "user_roles_user_idx" ON "public"."user_roles" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."agent_logs"
    ADD CONSTRAINT "agent_logs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_logs"
    ADD CONSTRAINT "agent_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_stats"
    ADD CONSTRAINT "daily_stats_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."edge_servers"
    ADD CONSTRAINT "edge_servers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."agent_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_logs_admin_write" ON "public"."agent_logs" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "agent_logs_read_own" ON "public"."agent_logs" FOR SELECT USING ((("company_id" IN ( SELECT "public"."user_company_ids"("auth"."uid"()) AS "user_company_ids")) OR "public"."is_admin"("auth"."uid"())));



ALTER TABLE "public"."agents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agents_admin_write" ON "public"."agents" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "agents_read_own" ON "public"."agents" FOR SELECT USING ((("company_id" IN ( SELECT "public"."user_company_ids"("auth"."uid"()) AS "user_company_ids")) OR "public"."is_admin"("auth"."uid"())));



ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "companies_admin_write" ON "public"."companies" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "companies_read_own" ON "public"."companies" FOR SELECT USING ((("id" IN ( SELECT "public"."user_company_ids"("auth"."uid"()) AS "user_company_ids")) OR "public"."is_admin"("auth"."uid"())));



ALTER TABLE "public"."daily_stats" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "daily_stats_admin_write" ON "public"."daily_stats" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "daily_stats_read_own" ON "public"."daily_stats" FOR SELECT USING ((("company_id" IN ( SELECT "public"."user_company_ids"("auth"."uid"()) AS "user_company_ids")) OR "public"."is_admin"("auth"."uid"())));



ALTER TABLE "public"."edge_servers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "edge_servers_admin_write" ON "public"."edge_servers" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "edge_servers_read_own" ON "public"."edge_servers" FOR SELECT USING ((("company_id" IN ( SELECT "public"."user_company_ids"("auth"."uid"()) AS "user_company_ids")) OR "public"."is_admin"("auth"."uid"())));



ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_roles_admin_write" ON "public"."user_roles" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "user_roles_read_self" ON "public"."user_roles" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."agent_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."agents";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."daily_stats";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_company_ids"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_company_ids"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_company_ids"("uid" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."agent_logs" TO "anon";
GRANT ALL ON TABLE "public"."agent_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."agent_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."agent_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."agent_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."agents" TO "anon";
GRANT ALL ON TABLE "public"."agents" TO "authenticated";
GRANT ALL ON TABLE "public"."agents" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."daily_stats" TO "anon";
GRANT ALL ON TABLE "public"."daily_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_stats" TO "service_role";



GRANT ALL ON SEQUENCE "public"."daily_stats_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."daily_stats_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."daily_stats_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."edge_servers" TO "anon";
GRANT ALL ON TABLE "public"."edge_servers" TO "authenticated";
GRANT ALL ON TABLE "public"."edge_servers" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


