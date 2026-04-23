'use client';

// =====================================================================
// ekkoee homepage v2 — Manifesto section
// "00_MANIFESTO" — big statement + three pillar cards.
// Inline styles + copy preserved from docs/ekkoee-homepage-v2.jsx.
// =====================================================================

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

const BLOCKS = [
  {
    n: '01',
    t: 'not an ERP',
    d: "ERP systems report what happened. we predict what's about to, and act on it first.",
  },
  {
    n: '02',
    t: 'air-gapped by default',
    d: 'local GPU in your factory. your data never leaves the building unless you say so.',
  },
  {
    n: '03',
    t: 'RAG, not fine-tuning',
    d: "your knowledge stays yours. the model reads it, it doesn't swallow it.",
  },
];

export default function Manifesto() {
  return (
    <section
      id="manifesto"
      style={{
        padding: '160px 40px',
        position: 'relative',
        borderTop: `1px solid ${C.line}`,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            fontSize: 11,
            color: C.green,
            letterSpacing: '0.3em',
            marginBottom: 40,
          }}
        >
          // 00_MANIFESTO
        </div>

        <div
          className="ekkoee-reveal"
          style={{
            fontSize: 'clamp(32px, 5vw, 64px)',
            lineHeight: 1.2,
            color: C.cream,
            fontWeight: 300,
            letterSpacing: '-0.02em',
            maxWidth: 1000,
          }}
        >
          every factory already has
          <br />
          a{' '}
          <span style={{ color: C.dim, textDecoration: 'line-through' }}>
            mind
          </span>{' '}
          a nervous system.
          <br />
          <span style={{ color: C.green }}>we build it a brain.</span>
        </div>

        <div
          style={{
            marginTop: 80,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 32,
          }}
        >
          {BLOCKS.map((b) => (
            <div
              key={b.n}
              style={{
                border: `1px solid ${C.line}`,
                padding: 24,
                background: C.bgSoft,
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: C.amber,
                  letterSpacing: '0.2em',
                  marginBottom: 12,
                }}
              >
                {b.n}
              </div>
              <div
                className="ekkoee-brand"
                style={{ fontSize: 22, color: C.cream, marginBottom: 12 }}
              >
                {b.t}
              </div>
              <div style={{ fontSize: 13, color: C.olive, lineHeight: 1.6 }}>
                {b.d}
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 8,
                  height: 8,
                  background: C.green,
                  boxShadow: `0 0 8px ${C.green}`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
