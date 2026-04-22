import type { Agent } from "@/types/database";

export default function AgentStatusList({ agents }: { agents: Agent[] }) {
  return (
    <div className="agent-list">
      <div className="sec-label" style={{ marginBottom: "16px" }}>
        [AGENTS] DEPLOYED &middot; {agents.length}
      </div>
      <div className="agent-grid">
        {agents.map((a) => (
          <div key={a.id} className={`agent-row agent-${a.status}`}>
            <div className="agent-dot-s" />
            <div className="agent-meta">
              <div className="agent-name">{a.name}</div>
              <div className="agent-desc">{a.description ?? a.type}</div>
            </div>
            <div className="agent-status-tag">{a.status.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <style>{`
        .agent-list { margin-top: 40px; }
        .agent-grid { display: flex; flex-direction: column; gap: 8px; }
        .agent-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: var(--bg-2);
          border: 1px solid var(--fg-5);
          border-left-width: 3px;
          font-family: var(--font-mono);
        }
        .agent-running { border-left-color: var(--green); }
        .agent-standby { border-left-color: var(--fg-3); }
        .agent-error   { border-left-color: var(--danger); }
        .agent-training { border-left-color: var(--amber); }
        .agent-dot-s {
          width: 8px; height: 8px; border-radius: 50%;
          background: currentColor;
          color: var(--fg-3);
        }
        .agent-running .agent-dot-s { color: var(--green); box-shadow: 0 0 8px var(--green); }
        .agent-error .agent-dot-s { color: var(--danger); box-shadow: 0 0 8px var(--danger); }
        .agent-training .agent-dot-s { color: var(--amber); box-shadow: 0 0 8px var(--amber); }
        .agent-meta { flex: 1; }
        .agent-name { font-size: 13px; color: var(--fg); font-weight: 500; }
        .agent-desc { font-size: 11px; color: var(--fg-3); margin-top: 2px; }
        .agent-status-tag {
          font-size: 10px;
          letter-spacing: 0.25em;
          color: var(--fg-3);
          padding: 4px 10px;
          background: var(--bg-3);
          border: 1px solid var(--fg-5);
        }
        .agent-running .agent-status-tag { color: var(--green); border-color: var(--green-3); }
      `}</style>
    </div>
  );
}
