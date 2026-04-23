'use client';

// =====================================================================
// ekkoee homepage v2 — Architecture section
// Interactive trust-zone diagram: hover any node to "accelerate" the
// packet flow along the edges. SVG connections + HTML-positioned
// nodes over a grid background. Inline styles preserved from prototype.
// =====================================================================

import { useState } from 'react';

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

type Zone = 'red' | 'yellow' | 'green';

interface ArchNode {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  color: string;
  zone: Zone;
}

interface ArchEdge {
  from: string;
  to: string;
}

const NODES: ArchNode[] = [
  {
    id: 'factory',
    label: 'YOUR FACTORY',
    sub: 'air-gapped · local GPU',
    x: 15,
    y: 70,
    color: C.rose,
    zone: 'red',
  },
  {
    id: 'edge',
    label: 'EDGE.AGENT',
    sub: 'vision · scheduling · alert',
    x: 40,
    y: 70,
    color: C.amber,
    zone: 'yellow',
  },
  {
    id: 'gateway',
    label: 'SECURE GATEWAY',
    sub: 'HTTPS · API key · masked',
    x: 60,
    y: 40,
    color: C.olive,
    zone: 'yellow',
  },
  {
    id: 'cloud',
    label: 'EKKOEE.CLOUD',
    sub: 'portal · realtime · admin',
    x: 85,
    y: 40,
    color: C.green,
    zone: 'green',
  },
];

const EDGES: ArchEdge[] = [
  { from: 'factory', to: 'edge' },
  { from: 'edge', to: 'gateway' },
  { from: 'gateway', to: 'cloud' },
];

export default function Architecture() {
  const [hovered, setHovered] = useState<string | null>(null);

  const getNode = (id: string) => NODES.find((n) => n.id === id)!;

  return (
    <section
      id="architecture"
      style={{
        padding: '120px 40px',
        borderTop: `1px solid ${C.line}`,
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
          // 02_ARCHITECTURE
        </div>
        <div
          className="ekkoee-brand"
          style={{
            fontSize: 'clamp(32px, 4vw, 48px)',
            color: C.cream,
            marginBottom: 40,
          }}
        >
          hybrid. <span style={{ color: C.green }}>trust-first.</span>
        </div>

        <div
          style={{
            position: 'relative',
            height: 460,
            border: `1px solid ${C.line}`,
            background: `
              linear-gradient(90deg, ${C.line} 1px, transparent 1px) 0 0 / 40px 40px,
              linear-gradient(0deg, ${C.line} 1px, transparent 1px) 0 0 / 40px 40px,
              ${C.bgSoft}`,
          }}
        >
          {/* zone bands */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '30%',
              background: 'rgba(191,78,107,0.04)',
              borderRight: `1px dashed ${C.line}`,
            }}
          >
            <div
              style={{
                padding: 12,
                fontSize: 10,
                color: C.rose,
                letterSpacing: '0.2em',
              }}
            >
              🔴 RED ZONE
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              left: '30%',
              top: 0,
              bottom: 0,
              width: '40%',
              background: 'rgba(255,185,56,0.04)',
              borderRight: `1px dashed ${C.line}`,
            }}
          >
            <div
              style={{
                padding: 12,
                fontSize: 10,
                color: C.amber,
                letterSpacing: '0.2em',
              }}
            >
              🟡 YELLOW ZONE
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              left: '70%',
              top: 0,
              bottom: 0,
              width: '30%',
              background: 'rgba(0,255,136,0.04)',
            }}
          >
            <div
              style={{
                padding: 12,
                fontSize: 10,
                color: C.green,
                letterSpacing: '0.2em',
              }}
            >
              🟢 GREEN ZONE
            </div>
          </div>

          {/* connections */}
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {EDGES.map((e, i) => {
              const a = getNode(e.from);
              const b = getNode(e.to);
              const isHot = hovered === e.from || hovered === e.to;
              return (
                <g key={i}>
                  <line
                    x1={`${a.x}%`}
                    y1={`${a.y}%`}
                    x2={`${b.x}%`}
                    y2={`${b.y}%`}
                    stroke={isHot ? C.green : C.dim}
                    strokeWidth={isHot ? 2 : 1}
                    strokeDasharray={isHot ? '0' : '4 4'}
                    style={{ transition: 'all 0.3s' }}
                  />
                  {/* moving packet */}
                  <circle r={4} fill={C.green}>
                    <animateMotion
                      dur={isHot ? '1s' : '3s'}
                      repeatCount="indefinite"
                      path={`M ${a.x * 12} ${a.y * 4.6} L ${b.x * 12} ${b.y * 4.6}`}
                    />
                  </circle>
                </g>
              );
            })}
          </svg>

          {/* nodes */}
          {NODES.map((n) => (
            <div
              key={n.id}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'absolute',
                left: `${n.x}%`,
                top: `${n.y}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  width: hovered === n.id ? 64 : 54,
                  height: hovered === n.id ? 64 : 54,
                  border: `2px solid ${n.color}`,
                  background: hovered === n.id ? n.color : `${C.bg}`,
                  boxShadow: hovered === n.id ? `0 0 40px ${n.color}` : 'none',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    background: hovered === n.id ? C.bg : n.color,
                    transition: 'all 0.3s',
                  }}
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 11,
                    color: C.cream,
                    letterSpacing: '0.1em',
                  }}
                >
                  {n.label}
                </div>
                <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>
                  {n.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 24,
            fontSize: 12,
            color: C.olive,
            textAlign: 'center',
          }}
        >
          hover any node to see the data flow accelerate →
        </div>
      </div>
    </section>
  );
}
