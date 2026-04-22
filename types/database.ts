export type UserRole = "admin" | "manager" | "viewer";

export type Company = {
  id: string;
  slug: string;
  name: string;
  industry: string | null;
  contact_email: string | null;
  contract_type: string | null;
  status: string;
  created_at: string;
};

export type Agent = {
  id: string;
  company_id: string;
  name: string;
  type: string;
  description: string | null;
  status: "running" | "standby" | "error" | "training";
  config: Record<string, unknown>;
  metrics: Record<string, unknown>;
  last_heartbeat: string | null;
  created_at: string;
};

export type AgentLog = {
  id: number;
  agent_id: string;
  company_id: string;
  event_type: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export type DailyStat = {
  id: number;
  company_id: string;
  date: string;
  total_detections: number;
  pass_rate: number;
  active_agents: number;
  alerts_count: number;
  uptime_percent: number;
};
