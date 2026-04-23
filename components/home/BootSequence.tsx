'use client';

// =====================================================================
// ekkoee homepage v2 — BootSequence
// Full-screen boot terminal that types lines then fades out. Calls
// onDone when fade completes. Inline styles + timing preserved from
// docs/ekkoee-homepage-v2.jsx. Animation keyframe renamed to
// `ekkoee-bootFadeOut` to avoid colliding with any v1 namespace.
// =====================================================================

import { useEffect, useMemo, useState } from 'react';

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

interface BootSequenceProps {
  onDone: () => void;
}

export default function BootSequence({ onDone }: BootSequenceProps) {
  const lines = useMemo(
    () => [
      '$ ekkoee --boot --target=camptec',
      '[ OK ] initializing kernel v4.7.2-ekko',
      '[ OK ] loading edge telemetry daemon',
      '[ OK ] establishing RAG knowledge graph',
      '[ OK ] mounting /factory/red /factory/yellow /factory/green',
      '[ OK ] binding agent.vision agent.scheduling agent.alert',
      '[ OK ] connecting supabase realtime channel ...',
      '[ OK ] handshake with edge.camptec-01 complete',
      '[ \u2713  ] system online. 4 agents running.',
    ],
    [],
  );
  const [shown, setShown] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (shown >= lines.length) {
      const t = setTimeout(() => setFading(true), 500);
      const t2 = setTimeout(onDone, 1200);
      return () => {
        clearTimeout(t);
        clearTimeout(t2);
      };
    }
    const delay = shown === 0 ? 300 : 140 + Math.random() * 80;
    const t = setTimeout(() => setShown((s) => s + 1), delay);
    return () => clearTimeout(t);
  }, [shown, lines.length, onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: C.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: fading ? 'ekkoee-bootFadeOut 0.7s forwards' : 'none',
      }}
    >
      <div style={{ width: 'min(560px, 90vw)', fontSize: 13, lineHeight: 1.7 }}>
        {lines.slice(0, shown).map((l, i) => {
          const isOk = l.includes('[ OK ]') || l.includes('[ \u2713');
          const isCmd = l.startsWith('$');
          return (
            <div
              key={i}
              style={{
                color: isCmd ? C.amber : isOk ? C.green : C.text,
                whiteSpace: 'pre',
                fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
              }}
            >
              {l}
            </div>
          );
        })}
        {shown < lines.length && (
          <span className="ekkoee-caret" style={{ color: C.green }}>
            █
          </span>
        )}
      </div>
    </div>
  );
}
