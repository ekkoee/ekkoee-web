'use client';

// =====================================================================
// ekkoee homepage v2 — LiveSystem section
// "Live simulation" of camptec's production floor: KPIs jitter, a
// sparkline animates, and an agent log feed appends synthetic entries.
//
// IMPORTANT: This is DEMO-only mock data (for the pitch narrative
// "this is real, right now"). Phase 2 will swap all three state
// loops to Supabase Realtime subscriptions against the ingest table.
// Until then, the timers below stand in for that stream.
//
// Hydration safety: timestamps + log list start empty and populate
// client-side to avoid server/client mismatch.
// =====================================================================

import { useEffect, useRef, useState } from 'react';

const C = {
  bg: '#0A0A0C',
  bgSoft: '#111114',
  bgCard: '#15151A',
  line: '#222228',
  lineHot: '#2d2d35',
  green: '#00FF88',
  amber: '#FFB938',
  rose: '#BF4E6B',
  olive: '#A29C87',
  cream: '#E6E2D3',
  dim: '#5A5A64',
  text: '#D4D4D8',
};

interface Kpis {
  pass: number;
  throughput: number;
  alerts: number;
  uptime: number;
}

interface LogEntry {
  id: number;
  time: string;
  c: string;
  t: string;
  m: string;
}

export default function LiveSystem() {
  const [kpis, setKpis] = useState<Kpis>({
    pass: 98.7,
    throughput: 1420,
    alerts: 2,
    uptime: 99.97,
  });
  const [sparks, setSparks] = useState<number[]>(() =>
    // deterministic server-side initial fill so SSR matches first client paint
    Array.from({ length: 40 }, () => 80),
  );
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logId = useRef(0);

  useEffect(() => {
    // seed sparks with real variance once we're on the client
    setSparks(Array.from({ length: 40 }, () => 60 + Math.random() * 40));

    const t1 = setInterval(() => {
      setKpis((k) => ({
        pass: Math.max(
          96,
          Math.min(99.9, k.pass + (Math.random() - 0.5) * 0.2),
        ),
        throughput: Math.max(
          1200,
          Math.min(
            1600,
            k.throughput + Math.round((Math.random() - 0.5) * 40),
          ),
        ),
        alerts: Math.max(
          0,
          k.alerts +
            (Math.random() > 0.92 ? 1 : Math.random() < 0.05 ? -1 : 0),
        ),
        uptime: k.uptime,
      }));
      setSparks((s) => [...s.slice(1), 60 + Math.random() * 40]);
    }, 800);

    const templates: { c: string; t: string; m: string }[] = [
      { c: C.green, t: 'vision_agent', m: 'batch completed · pass_rate 98.9%' },
      { c: C.green, t: 'vision_agent', m: 'detection batch B20260422-' },
      { c: C.amber, t: 'scheduling', m: 'rescheduling queue · 3 jobs shifted' },
      { c: C.green, t: 'alert_agent', m: 'Line B temperature normalized' },
      { c: C.rose, t: 'maintenance', m: 'predictive flag · motor.04 bearings' },
      { c: C.green, t: 'rag_engine', m: '14 new embeddings indexed' },
      { c: C.amber, t: 'alert_agent', m: 'Line A vibration above threshold' },
      { c: C.green, t: 'edge_server', m: 'heartbeat · gpu 67% · mem 12.4GB' },
    ];
    const t2 = setInterval(() => {
      const tmpl = templates[Math.floor(Math.random() * templates.length)];
      setLogs((L) => {
        const next: LogEntry[] = [
          ...L,
          {
            id: logId.current++,
            time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
            c: tmpl.c,
            t: tmpl.t,
            m:
              tmpl.m +
              (tmpl.m.endsWith('-')
                ? String(Math.floor(Math.random() * 999)).padStart(3, '0')
                : ''),
          },
        ];
        return next.slice(-12);
      });
    }, 1400);

    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  const maxS = Math.max(...sparks);
  const minS = Math.min(...sparks);
  const sparkPath = sparks
    .map((v, i) => {
      const x = (i / (sparks.length - 1)) * 100;
      const y = 100 - ((v - minS) / (maxS - minS || 1)) * 100;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  return (
    <section
      id="live"
      style={{
        padding: '120px 40px',
        position: 'relative',
        borderTop: `1px solid ${C.line}`,
        background: `linear-gradient(180deg, ${C.bg}, ${C.bgSoft})`,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            fontSize: 11,
            color: C.green,
            letterSpacing: '0.3em',
            marginBottom: 16,
          }}
        >
          // 01_LIVE_SYSTEM
        </div>
        <div
          className="ekkoee-brand"
          style={{
            fontSize: 'clamp(32px, 4vw, 48px)',
            color: C.cream,
            marginBottom: 8,
          }}
        >
          this is real. <span style={{ color: C.green }}>right now.</span>
        </div>
        <div
          style={{
            fontSize: 14,
            color: C.olive,
            marginBottom: 40,
            maxWidth: 600,
          }}
        >
          below is a live simulation of camptec&apos;s production floor
          running on ekkoee. data streams in every few seconds. no
          screenshots. no mockups.
        </div>

        {/* Terminal window */}
        <div
          style={{
            border: `1px solid ${C.line}`,
            background: C.bg,
            boxShadow: `0 0 60px rgba(0,255,136,0.05)`,
          }}
        >
          {/* window chrome */}
          <div
            style={{
              padding: '10px 16px',
              borderBottom: `1px solid ${C.line}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 11,
              color: C.dim,
              background: C.bgSoft,
            }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
              <span style={{ marginLeft: 16 }}>
                portal.ekkoee.com/camptec/overview
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ color: C.green }}>● LIVE</span>
              <span>camptec · 大昌帆布</span>
            </div>
          </div>

          {/* body */}
          <div
            style={{
              padding: 24,
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: 24,
            }}
          >
            {/* Left: KPIs + spark */}
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 12,
                }}
              >
                {[
                  { l: 'PASS RATE', v: kpis.pass.toFixed(2) + '%', c: C.green },
                  {
                    l: 'THROUGHPUT / HR',
                    v: kpis.throughput.toLocaleString(),
                    c: C.amber,
                  },
                  {
                    l: 'ACTIVE ALERTS',
                    v: kpis.alerts,
                    c: kpis.alerts > 3 ? C.rose : C.green,
                  },
                  {
                    l: 'SYSTEM UPTIME',
                    v: kpis.uptime.toFixed(2) + '%',
                    c: C.green,
                  },
                ].map((k) => (
                  <div
                    key={k.l}
                    style={{
                      border: `1px solid ${C.line}`,
                      padding: 16,
                      background: C.bgSoft,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: C.dim,
                        letterSpacing: '0.2em',
                      }}
                    >
                      {k.l}
                    </div>
                    <div
                      className="ekkoee-brand"
                      style={{
                        fontSize: 28,
                        color: k.c,
                        marginTop: 8,
                        fontFamily:
                          'var(--font-mono), "JetBrains Mono", monospace',
                      }}
                    >
                      {k.v}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 16,
                  border: `1px solid ${C.line}`,
                  padding: 16,
                  background: C.bgSoft,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: C.dim,
                      letterSpacing: '0.2em',
                    }}
                  >
                    THROUGHPUT · LAST 40s
                  </span>
                  <span style={{ fontSize: 10, color: C.green }}>
                    ● streaming
                  </span>
                </div>
                <svg
                  viewBox="0 0 100 40"
                  preserveAspectRatio="none"
                  style={{ width: '100%', height: 80 }}
                >
                  <path
                    d={sparkPath}
                    stroke={C.green}
                    strokeWidth={0.5}
                    fill="none"
                    transform="scale(1, 0.4)"
                  />
                  <path
                    d={sparkPath + ' L100,40 L0,40 Z'}
                    fill={C.green}
                    opacity={0.15}
                    transform="scale(1, 0.4)"
                  />
                </svg>
              </div>
            </div>

            {/* Right: log feed */}
            <div
              style={{
                border: `1px solid ${C.line}`,
                background: C.bgSoft,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  borderBottom: `1px solid ${C.line}`,
                  fontSize: 10,
                  color: C.dim,
                  letterSpacing: '0.2em',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>LIVE AGENT FEED</span>
                <span className="ekkoee-pulse" style={{ color: C.green }}>
                  ●
                </span>
              </div>
              <div
                style={{
                  padding: 10,
                  fontSize: 11,
                  lineHeight: 1.7,
                  height: 320,
                  overflow: 'hidden',
                }}
              >
                {logs.map((l) => (
                  <div
                    key={l.id}
                    style={{ display: 'flex', gap: 10, marginBottom: 4 }}
                  >
                    <span
                      style={{ color: C.dim, flexShrink: 0, width: 62 }}
                    >
                      {l.time}
                    </span>
                    <span style={{ color: l.c, flexShrink: 0, width: 96 }}>
                      {l.t}
                    </span>
                    <span style={{ color: C.text }}>{l.m}</span>
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
