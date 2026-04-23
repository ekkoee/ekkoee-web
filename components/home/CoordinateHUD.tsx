'use client';

// =====================================================================
// ekkoee homepage v2 — CoordinateHUD
// Fixed top bar with live UTC timestamp. Inline styles preserved.
// Initial render uses an empty timestamp string to avoid hydration
// mismatch between server and client (date resolves on mount).
// =====================================================================

import { useEffect, useState } from 'react';

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

export default function CoordinateHUD() {
  const [stamp, setStamp] = useState('');

  useEffect(() => {
    const tick = () => {
      setStamp(new Date().toISOString().replace('T', ' ').slice(0, 19));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '10px 20px',
        fontSize: 11,
        letterSpacing: '0.08em',
        background: `linear-gradient(180deg, ${C.bg} 0%, transparent 100%)`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: C.dim,
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', gap: 20 }}>
        <span style={{ color: C.green }}>● ekkoee.sys</span>
        <span>v4.7.2</span>
        <span>node: edge.camptec-01</span>
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <span>{stamp ? `${stamp} UTC` : '\u00a0'}</span>
        <span style={{ color: C.amber }}>UPTIME 99.97%</span>
        <span style={{ color: C.green }}>● LIVE</span>
      </div>
    </div>
  );
}
