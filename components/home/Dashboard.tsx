"use client";

import { useEffect, useState } from "react";

type LogTag = "ok" | "info" | "warn" | "err";
type LogEntry = { ts: string; tag: LogTag; text: string };
type TabKey = "overview" | "agents" | "alerts";

const MESSAGES: Array<{ tag: LogTag; text: string }> = [
  { tag: "ok", text: "vision_agent · batch B20260421-087 · pass 198/200" },
  { tag: "info", text: "scheduling_agent · reordered line_2 queue · -8min ETA" },
  { tag: "ok", text: "vision_agent · batch B20260421-088 · pass 200/200" },
  { tag: "warn", text: "temp_agent · line_3 sensor 2 trending high · watching" },
  { tag: "ok", text: "maintenance_agent · lubrication cycle · nominal" },
  { tag: "info", text: "alert_agent · daily summary dispatched to ops" },
  { tag: "ok", text: "vision_agent · batch B20260421-089 · pass 199/200" },
  { tag: "info", text: "model_sync · delta applied · no factory-side restart" },
  { tag: "ok", text: "temp_agent · line_3 back in nominal range" },
  { tag: "ok", text: "quality_agent · shift throughput · +3.2% vs avg" },
  { tag: "info", text: "maintenance_agent · bearing 4 due in 72h · scheduled" },
];

const TABS: TabKey[] = ["overview", "agents", "alerts"];

function nowStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [det, setDet] = useState(2451);
  const [pass, setPass] = useState(98.7);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    let idx = 0;

    // Seed 5 log lines (newest first, matching prototype's insertBefore loop)
    const seed: LogEntry[] = [];
    for (let i = 0; i < 5; i++) {
      const m = MESSAGES[idx % MESSAGES.length];
      seed.unshift({ ts: nowStr(), tag: m.tag, text: m.text });
      idx++;
    }
    setLogs(seed);

    const logId = setInterval(() => {
      const m = MESSAGES[idx % MESSAGES.length];
      setLogs((prev) =>
        [{ ts: nowStr(), tag: m.tag, text: m.text }, ...prev].slice(0, 10)
      );
      idx++;
    }, 2800);

    const statId = setInterval(() => {
      setDet((d) => d + Math.floor(Math.random() * 3) + 1);
      setPass((p) => {
        const jitter = (Math.random() - 0.5) * 0.3;
        return Math.min(99.9, Math.max(97.5, p + jitter));
      });
    }, 1800);

    return () => {
      clearInterval(logId);
      clearInterval(statId);
    };
  }, []);

  return (
    <section id="dashboard">
      <div className="sec-label">[06/07] LIVE SYSTEM</div>
      <div className="dash-frame">
        <div className="dash-titlebar">
          <div className="dash-traffic">
            <span className="tl-dot r" />
            <span className="tl-dot y" />
            <span className="tl-dot g" />
          </div>
          <div className="dash-title">
            portal.ekkoee.com / camptec &middot; production floor
          </div>
          <div>
            <span className="hud-grn">● LIVE</span>
          </div>
        </div>

        <div className="dash-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`tab${activeTab === t ? " active" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="dash-body">
          <div className="stats-col">
            <div className="stat">
              <div className="stat-label">PASS RATE</div>
              <div className="stat-value">
                {pass.toFixed(1)}
                <span className="unit">%</span>
              </div>
              <div className="stat-delta">▲ 2.1 vs last week</div>
            </div>
            <div className="stat">
              <div className="stat-label">ACTIVE AGENTS</div>
              <div className="stat-value">
                6<span className="unit">/6</span>
              </div>
              <div className="stat-delta">all systems nominal</div>
            </div>
            <div className="stat wide">
              <div className="stat-label">DETECTIONS TODAY</div>
              <div className="stat-value">{det.toLocaleString()}</div>
              <svg className="spark" viewBox="0 0 200 32" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#00FF88"
                  strokeWidth="1.5"
                  points="0,24 20,20 40,22 60,14 80,16 100,10 120,12 140,6 160,8 180,4 200,6"
                />
              </svg>
            </div>
            <div className="stat wide">
              <div className="stat-label">UPTIME &middot; 30d</div>
              <div className="stat-value">
                99.97<span className="unit">%</span>
              </div>
              <div className="stat-delta">SLA target: 99.5%</div>
            </div>
          </div>

          <div className="feed">
            <div className="feed-head">AGENT LOG &middot; STREAM</div>
            <div className="feed-log">
              {logs.map((l, i) => (
                <div key={`${l.ts}-${i}-${l.text}`} className="log-line">
                  <span className="log-ts">{l.ts}</span>
                  <span className={`log-tag ${l.tag}`}>
                    [{l.tag.toUpperCase()}]
                  </span>
                  <span className="log-msg">{l.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
