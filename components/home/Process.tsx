'use client';

// =====================================================================
// ekkoee homepage v2 — Process section
// Three-step process: DIAGNOSE / DEPLOY / EVOLVE with bilingual labels.
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

const STEPS = [
  {
    n: '01',
    t: 'DIAGNOSE',
    zh: '企業健檢',
    d: 'we spend a week walking your floor. we interview your foreman. we map every data source, every friction point, every tribal knowledge island.',
  },
  {
    n: '02',
    t: 'DEPLOY',
    zh: '地端部署',
    d: 'local GPU server in your factory. custom agents trained on your data, never leaving your premises. dashboard at ekkoee.com/[your-company].',
  },
  {
    n: '03',
    t: 'EVOLVE',
    zh: '持續進化',
    d: "every new batch makes it smarter. every alert makes it sharper. your factory's intelligence compounds, not depreciates.",
  },
];

const DURATIONS = ['1 week', '4-6 weeks', 'ongoing'];

export default function Process() {
  return (
    <section
      id="process"
      style={{
        padding: '120px 40px',
        borderTop: `1px solid ${C.line}`,
        background: `linear-gradient(180deg, ${C.bgSoft}, ${C.bg})`,
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
          // 03_PROCESS
        </div>
        <div
          className="ekkoee-brand"
          style={{
            fontSize: 'clamp(32px, 4vw, 48px)',
            color: C.cream,
            marginBottom: 60,
          }}
        >
          three steps. <span style={{ color: C.amber }}>no fluff.</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 2,
            background: C.line,
          }}
        >
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              style={{
                background: C.bg,
                padding: 40,
                minHeight: 320,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 80,
                    color: C.lineHot,
                    fontFamily:
                      'var(--font-mono), "JetBrains Mono", monospace',
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: '-0.05em',
                    position: 'absolute',
                    top: 20,
                    right: 20,
                  }}
                >
                  {s.n}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: C.green,
                    letterSpacing: '0.3em',
                    marginBottom: 8,
                  }}
                >
                  STEP {s.n}
                </div>
                <div
                  className="ekkoee-brand"
                  style={{ fontSize: 32, color: C.cream, marginBottom: 4 }}
                >
                  {s.t}
                </div>
                <div
                  style={{ fontSize: 14, color: C.rose, marginBottom: 20 }}
                >
                  {s.zh}
                </div>
                <div
                  style={{ fontSize: 13, color: C.olive, lineHeight: 1.7 }}
                >
                  {s.d}
                </div>
              </div>
              <div
                style={{
                  marginTop: 24,
                  fontSize: 11,
                  color: C.dim,
                  letterSpacing: '0.2em',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>~ {DURATIONS[i]}</span>
                <span style={{ color: C.green }}>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
