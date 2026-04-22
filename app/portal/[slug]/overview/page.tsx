import { notFound, redirect } from "next/navigation";
import AgentStatusList from "@/components/portal/AgentStatusList";
import LiveLogFeed from "@/components/portal/LiveLogFeed";
import PortalShell from "@/components/portal/PortalShell";
import StatCard from "@/components/portal/StatCard";
import { createClient } from "@/lib/supabase/server";
import type { Agent, AgentLog, Company, DailyStat } from "@/types/database";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("slug", slug)
    .single<Company>();

  if (!company) notFound();

  const [agentsRes, logsRes, statsRes] = await Promise.all([
    supabase
      .from("agents")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at"),
    supabase
      .from("agent_logs")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("daily_stats")
      .select("*")
      .eq("company_id", company.id)
      .order("date", { ascending: false })
      .limit(7),
  ]);

  const agents = (agentsRes.data ?? []) as Agent[];
  const logs = (logsRes.data ?? []) as AgentLog[];
  const stats = (statsRes.data ?? []) as DailyStat[];

  const latest = stats[0] ?? null;
  const totalDetections7d = stats.reduce(
    (sum, s) => sum + (s.total_detections ?? 0),
    0
  );
  const avgPassRate =
    stats.length > 0
      ? stats.reduce((s, r) => s + Number(r.pass_rate), 0) / stats.length
      : 0;

  const runningCount = agents.filter((a) => a.status === "running").length;

  return (
    <PortalShell
      companyName={company.name}
      companySlug={company.slug}
      userEmail={user.email ?? "—"}
    >
      <div className="overview-head">
        <div className="sec-label">[01] OVERVIEW</div>
        <h1 className="overview-title">
          {company.name}{" "}
          <span className="overview-sub">&middot; production floor</span>
        </h1>
        <div className="overview-meta">
          status:{" "}
          <span className="hud-grn">{company.status.toUpperCase()}</span>{" "}
          <span className="hud-sep">//</span> contract:{" "}
          {company.contract_type?.toUpperCase() ?? "—"}{" "}
          <span className="hud-sep">//</span>{" "}
          <span className="hud-grn">● LIVE</span>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="PASS RATE · today"
          value={latest ? Number(latest.pass_rate).toFixed(1) : "—"}
          unit={latest ? "%" : ""}
          delta={`avg 7d: ${avgPassRate.toFixed(1)}%`}
        />
        <StatCard
          label="ACTIVE AGENTS"
          value={runningCount}
          unit={`/${agents.length}`}
          delta={
            runningCount === agents.length
              ? "all systems nominal"
              : "⚠ some standby"
          }
        />
        <StatCard
          label="DETECTIONS · 7d"
          value={totalDetections7d.toLocaleString()}
          delta={`${stats.length} days of data`}
          wide
        />
        <StatCard
          label="UPTIME · latest"
          value={latest ? Number(latest.uptime_percent).toFixed(2) : "—"}
          unit={latest ? "%" : ""}
          delta="SLA target: 99.5%"
          wide
        />
      </div>

      <AgentStatusList agents={agents} />

      <LiveLogFeed companyId={company.id} initialLogs={logs} />

      <style>{`
        .overview-head { margin-bottom: 32px; }
        .overview-title {
          font-family: var(--font-brand);
          font-weight: 700;
          font-size: clamp(32px, 5vw, 48px);
          color: var(--fg);
          margin-top: 12px;
          letter-spacing: -0.02em;
        }
        .overview-sub {
          font-family: var(--font-mono);
          font-weight: 300;
          font-size: 18px;
          color: var(--fg-3);
        }
        .overview-meta {
          margin-top: 12px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--fg-3);
          letter-spacing: 0.15em;
        }
        .stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          max-width: 720px;
        }
        @media (max-width: 860px) {
          .stat-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </PortalShell>
  );
}
