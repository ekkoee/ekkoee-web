'use client';

// =====================================================================
// (home) / DashboardPreview - bg-warm-gray
// T9: 假 live 終端 — 4 stats + log feed。復用舊 prototype 的
// .dash-frame / .dash-body / .stat / .feed / .log-* CSS。
// 綠色在這裡是合法的「live telemetry」語意(brief 例外條款)。
// =====================================================================

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';

type LogTag = 'ok' | 'info' | 'warn' | 'err';
type LogEntry = { ts: string; tag: LogTag; text: string };
type TabKey = 'overview' | 'agents' | 'alerts';

const MESSAGES: Array<{ tag: LogTag; text: string }> = [
  { tag: 'ok', text: 'vision_agent · batch B20260421-087 · pass 198/200' },
  { tag: 'info', text: 'scheduling_agent · reordered line_2 queue · -8min ETA' },
  { tag: 'ok', text: 'vision_agent · batch B20260421-088 · pass 200/200' },
  { tag: 'warn', text: 'temp_agent · line_3 sensor 2 trending high · watching' },
  { tag: 'ok', text: 'maintenance_agent · lubrication cycle · nominal' },
  { tag: 'info', text: 'alert_agent · daily summary dispatched to ops' },
  { tag: 'ok', text: 'vision_agent · batch B20260421-089 · pass 199/200' },
  { tag: 'info', text: 'model_sync · delta applied · no factory-side restart' },
  { tag: 'ok', text: 'temp_agent · line_3 back in nominal range' },
  { tag: 'ok', text: 'quality_agent · shift throughput · +3.2% vs avg' },
  { tag: 'info', text: 'maintenance_agent · bearing 4 due in 72h · scheduled' },
];

const TABS: TabKey[] = ['overview', 'agents', 'alerts'];

function nowStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

export default function DashboardPreview() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [det, setDet] = useState(2451);
  const [pass, setPass] = useState(98.7);
  // SSR hydration safety:lazy-init 用 deterministic placeholder
  // '--:--:--'(server 與 client first render 一致)。client-side useEffect
  // 進場後才用 nowStr() 替換成真時間,避免時鐘漂移造成 hydration mismatch。
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const seed: LogEntry[] = [];
    for (let i = 0; i < 5; i++) {
      const m = MESSAGES[i % MESSAGES.length];
      seed.unshift({ ts: '--:--:--', tag: m.tag, text: m.text });
    }
    return seed;
  });

  useEffect(() => {
    let idx = 5;

    // 補上 client-side 的真時間(覆蓋 placeholder),然後啟動 feed 更新
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLogs((prev) => prev.map((l) => ({ ...l, ts: nowStr() })));

    const logId = setInterval(() => {
      const m = MESSAGES[idx % MESSAGES.length];
      setLogs((prev) =>
        [{ ts: nowStr(), tag: m.tag, text: m.text }, ...prev].slice(0, 10),
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
    <section
      id="dashboard"
      aria-label="ekkoee live dashboard preview"
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-warm-gray px-6 py-20 md:px-10"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        {/* terminal label */}
        <div
          className="text-amber mb-10 flex items-center gap-3"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
          }}
        >
          <span
            aria-hidden
            className="inline-block h-[7px] w-[7px] rounded-full"
            style={{
              background: 'var(--color-terminal, #00ff88)',
              boxShadow: '0 0 10px rgba(0, 255, 136, 0.6)',
              animation: 'cpf-blink 2s ease-in-out infinite',
            }}
          />
          <span>{t.dashboard.tag}</span>
        </div>

        {/* headline */}
        <h2
          className="text-bone mb-10 max-w-[24ch]"
          style={{
            fontFamily:
              'var(--font-comfortaa), var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(1.75rem, 4.2vw, 3.5rem)',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {t.dashboard.headline}
        </h2>

        {/* Dashboard frame — reuse legacy .dash-frame */}
        <div className="dash-frame">
          <div className="dash-titlebar">
            <div className="dash-traffic">
              <span className="tl-dot r" />
              <span className="tl-dot y" />
              <span className="tl-dot g" />
            </div>
            <div className="dash-title">
              {t.dashboard.frameTitle}
            </div>
            <div>
              <span className="hud-grn">{t.dashboard.live}</span>
            </div>
          </div>

          <div className="dash-tabs">
            {TABS.map((key) => (
              <button
                key={key}
                type="button"
                className={`tab${activeTab === key ? ' active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {t.dashboard.tabs[key]}
              </button>
            ))}
          </div>

          <div className="dash-body">
            <div className="stats-col">
              <div className="stat">
                <div className="stat-label">{t.dashboard.passRate}</div>
                <div className="stat-value">
                  {pass.toFixed(1)}
                  <span className="unit">%</span>
                </div>
                <div className="stat-delta">{t.dashboard.passDelta}</div>
              </div>
              <div className="stat">
                <div className="stat-label">{t.dashboard.activeAgents}</div>
                <div className="stat-value">
                  6<span className="unit">/6</span>
                </div>
                <div className="stat-delta">{t.dashboard.activeAgentsSub}</div>
              </div>
              <div className="stat wide">
                <div className="stat-label">{t.dashboard.detectionsToday}</div>
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
                <div className="stat-label">{t.dashboard.uptime}</div>
                <div className="stat-value">
                  99.97<span className="unit">%</span>
                </div>
                <div className="stat-delta">{t.dashboard.uptimeSla}</div>
              </div>
            </div>

            <div className="feed">
              <div className="feed-head">{t.dashboard.agentLog}</div>
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
      </div>
    </section>
  );
}
