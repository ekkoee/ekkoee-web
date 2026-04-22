"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AgentLog } from "@/types/database";

type LogTag = "ok" | "info" | "warn" | "err";

function severityToTag(sev: AgentLog["severity"]): LogTag {
  switch (sev) {
    case "warning":
      return "warn";
    case "error":
    case "critical":
      return "err";
    case "info":
      return "info";
    default:
      return "ok";
  }
}

function fmtTs(ts: string) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export default function LiveLogFeed({
  companyId,
  initialLogs,
}: {
  companyId: string;
  initialLogs: AgentLog[];
}) {
  const [logs, setLogs] = useState<AgentLog[]>(initialLogs);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`logs-${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_logs",
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          setLogs((prev) =>
            [payload.new as AgentLog, ...prev].slice(0, 30)
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [companyId]);

  return (
    <div className="live-feed">
      <div className="sec-label" style={{ marginBottom: "16px" }}>
        [LIVE] AGENT_LOG_STREAM
      </div>
      <div className="feed-box">
        {logs.length === 0 ? (
          <div className="feed-empty">// no events yet</div>
        ) : (
          logs.map((l) => {
            const tag = severityToTag(l.severity);
            return (
              <div key={l.id} className="log-line">
                <span className="log-ts">{fmtTs(l.created_at)}</span>
                <span className={`log-tag ${tag}`}>
                  [{l.severity.toUpperCase()}]
                </span>
                <span className="log-msg">{l.message ?? l.event_type}</span>
              </div>
            );
          })
        )}
      </div>
      <style jsx>{`
        .live-feed {
          margin-top: 40px;
        }
        .feed-box {
          background: var(--bg-2);
          border: 1px solid var(--fg-5);
          padding: 20px;
          max-height: 420px;
          overflow: hidden;
          font-family: var(--font-mono);
          font-size: 11px;
          line-height: 1.8;
        }
        .feed-empty {
          color: var(--fg-3);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
