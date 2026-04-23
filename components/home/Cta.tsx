'use client';

// =====================================================================
// ekkoee homepage v2 — CTA section
// Final call-to-action with typing-caret button that loops
// "initiate consultation_". Inline styles preserved from prototype.
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

const FULL = 'initiate consultation_';

export default function CTA() {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i <= FULL.length) {
        setTyped(FULL.slice(0, i));
        i++;
      } else {
        i = 0;
      }
    }, 200);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      id="cta"
      style={{
        padding: '180px 40px',
        borderTop: `1px solid ${C.line}`,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          background: `radial-gradient(circle at 50% 50%, ${C.green}, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: C.amber,
            letterSpacing: '0.3em',
            marginBottom: 24,
          }}
        >
          [ READY WHEN YOU ARE ]
        </div>
        <div
          className="ekkoee-brand"
          style={{
            fontSize: 'clamp(40px, 7vw, 80px)',
            color: C.cream,
            lineHeight: 1,
            marginBottom: 32,
            letterSpacing: '-0.02em',
          }}
        >
          stop reporting.
          <br />
          <span style={{ color: C.green }}>start predicting.</span>
        </div>
        <div
          style={{
            fontSize: 15,
            color: C.olive,
            marginBottom: 48,
            lineHeight: 1.7,
          }}
        >
          first consultation is free. we&apos;ll visit your factory, map your
          operations,
          <br />
          and show you exactly what intelligence would look like in your
          context.
        </div>

        <a
          href="mailto:hello@ekkoee.com"
          style={{
            display: 'inline-block',
            textDecoration: 'none',
            border: `1px solid ${C.green}`,
            padding: '18px 40px',
            color: C.green,
            fontSize: 16,
            fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
            letterSpacing: '0.1em',
            transition: 'all 0.2s',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = C.green;
            e.currentTarget.style.color = C.bg;
            e.currentTarget.style.boxShadow = `0 0 40px ${C.green}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = C.green;
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          $ {typed}
          <span className="ekkoee-caret">█</span>
        </a>

        <div style={{ marginTop: 32, fontSize: 11, color: C.dim }}>
          or email{' '}
          <span style={{ color: C.olive }}>hello@ekkoee.com</span> directly
        </div>
      </div>
    </section>
  );
}
