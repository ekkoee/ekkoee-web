'use client';

// =====================================================================
// ekkoee homepage v2 — Hero section
// Full-viewport hero with 3D gear-molecule (ThreeHero), giant brand
// wordmark, corner brackets, and bottom status marquee. Inline styles
// preserved from docs/ekkoee-homepage-v2.jsx. Marquee keyframe
// renamed to `ekkoee-marquee` to avoid v1 namespace collisions.
// =====================================================================

import ThreeHero from './ThreeHero';

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

type BracketPos = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

const BRACKETS: BracketPos[] = [
  { top: 80, left: 30 },
  { top: 80, right: 30 },
  { bottom: 30, left: 30 },
  { bottom: 30, right: 30 },
];

export default function Hero() {
  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ThreeHero />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          padding: 20,
          mixBlendMode: 'normal',
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: C.amber,
            letterSpacing: '0.4em',
            marginBottom: 24,
            opacity: 0.9,
          }}
        >
          [ MINI-AGI FOR MANUFACTURING ]
        </div>

        <h1
          className="ekkoee-brand"
          style={{
            fontSize: 'clamp(64px, 14vw, 200px)',
            margin: 0,
            lineHeight: 0.9,
            color: C.cream,
            textShadow: '0 0 40px rgba(191,78,107,0.3)',
          }}
        >
          ekkoee
        </h1>

        <div
          style={{
            marginTop: 28,
            fontSize: 14,
            color: C.olive,
            letterSpacing: '0.08em',
            maxWidth: 640,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          we don&apos;t sell you software.
          <br />
          <span style={{ color: C.green }}>
            we install intelligence into your factory.
          </span>
        </div>

        <div
          style={{
            marginTop: 60,
            fontSize: 10,
            color: C.dim,
            letterSpacing: '0.3em',
          }}
        >
          ↓ SCROLL TO ENTER
        </div>
      </div>

      {/* corner brackets */}
      {BRACKETS.map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            ...pos,
            width: 24,
            height: 24,
            borderColor: C.green,
            zIndex: 3,
            borderStyle: 'solid',
            borderWidth: 0,
            ...(pos.top !== undefined
              ? { borderTopWidth: 1 }
              : { borderBottomWidth: 1 }),
            ...(pos.left !== undefined
              ? { borderLeftWidth: 1 }
              : { borderRightWidth: 1 }),
          }}
        />
      ))}

      {/* status ticker */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 32,
          background: C.bgCard,
          borderTop: `1px solid ${C.line}`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 50,
            whiteSpace: 'nowrap',
            fontSize: 11,
            animation: 'ekkoee-marquee 40s linear infinite',
            color: C.olive,
          }}
        >
          {Array(2)
            .fill(null)
            .map((_, copy) => (
              <div key={copy} style={{ display: 'flex', gap: 50 }}>
                <span>
                  ▸ <span style={{ color: C.green }}>CAMPTEC.01</span>{' '}
                  vision_agent · pass_rate 98.7%
                </span>
                <span>▸ scheduling_agent · 142 jobs queued</span>
                <span>
                  ▸ <span style={{ color: C.amber }}>ALERT</span> Line A temp
                  78°C → nominal
                </span>
                <span>▸ knowledge graph updated · 14 new embeddings</span>
                <span>
                  ▸ edge.camptec-01 heartbeat{' '}
                  <span style={{ color: C.green }}>OK</span>
                </span>
                <span>▸ daily rollup complete · 8,432 detections</span>
                <span>
                  ▸ <span style={{ color: C.rose }}>agent.maintenance</span>{' '}
                  scheduled 03:00
                </span>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
