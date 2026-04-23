'use client';

// =====================================================================
// ekkoee homepage v2 — ProgressRail
// Right-side section progress indicator. Highlights the currently
// in-view section and scrolls to its #id on click. Inline styles +
// widths preserved from prototype.
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

export interface RailSection {
  id: string;
  label: string;
}

interface ProgressRailProps {
  sections: RailSection[];
  active: number;
}

export default function ProgressRail({ sections, active }: ProgressRailProps) {
  return (
    <div
      style={{
        position: 'fixed',
        right: 20,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'flex-end',
      }}
    >
      {sections.map((s, i) => (
        <a key={s.id} href={`#${s.id}`} style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 10,
                color: active === i ? C.green : C.dim,
                fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
                letterSpacing: '0.1em',
                opacity: active === i ? 1 : 0.5,
                transition: 'all 0.3s',
              }}
            >
              {String(i).padStart(2, '0')} {s.label}
            </span>
            <span
              style={{
                width: active === i ? 32 : 16,
                height: 1,
                background: active === i ? C.green : C.dim,
                transition: 'all 0.3s',
              }}
            />
          </div>
        </a>
      ))}
    </div>
  );
}
