'use client';

// =====================================================================
// ekkoee homepage v2 — Footer
// HERMES cyberpunk terminal footer strip. Inline styles preserved from
// the prototype (colors locked). Ported from docs/ekkoee-homepage-v2.jsx.
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

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: `1px solid ${C.line}`,
        padding: '40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 11,
        color: C.dim,
        flexWrap: 'wrap',
        gap: 20,
      }}
    >
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <span className="ekkoee-brand" style={{ color: C.rose, fontSize: 16 }}>
          ekkoee
        </span>
        <span>© 2026</span>
        <span>taipei · 台北</span>
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <span style={{ color: C.green }}>● all systems nominal</span>
        <span>v4.7.2</span>
      </div>
    </footer>
  );
}
