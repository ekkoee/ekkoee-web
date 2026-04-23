'use client';

// =====================================================================
// (home) / Architecture - bg-void
// Port 自 legacy components/home/Architecture.tsx:流程圖 with 三個
// trust zone 帶 + 節點 + 封包動畫。hover 節點會加速封包流。
// 加上 terminal label 統一視覺。
// =====================================================================

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';

const C = {
  bg: '#0A0A0C',
  bgSoft: '#111114',
  line: '#222228',
  green: '#00FF88',
  amber: '#FFB938',
  rose: '#BF4E6B',
  olive: '#A29C87',
  cream: '#E6E2D3',
  dim: '#5A5A64',
};

type Zone = 'red' | 'yellow' | 'green';
type NodeId = 'factory' | 'edge' | 'gateway' | 'cloud';

interface ArchNode {
  id: NodeId;
  label: string;
  sub: string;
  x: number;
  y: number;
  color: string;
  zone: Zone;
}

const EDGES: Array<{ from: NodeId; to: NodeId }> = [
  { from: 'factory', to: 'edge' },
  { from: 'edge', to: 'gateway' },
  { from: 'gateway', to: 'cloud' },
];

export default function Architecture() {
  const { t } = useI18n();
  const [hovered, setHovered] = useState<NodeId | null>(null);
  const NODES: ArchNode[] = [
    { id: 'factory', label: t.architecture.nodes.factory.label, sub: t.architecture.nodes.factory.sub, x: 15, y: 70, color: C.rose, zone: 'red' },
    { id: 'edge', label: t.architecture.nodes.edge.label, sub: t.architecture.nodes.edge.sub, x: 40, y: 70, color: C.amber, zone: 'yellow' },
    { id: 'gateway', label: t.architecture.nodes.gateway.label, sub: t.architecture.nodes.gateway.sub, x: 60, y: 40, color: C.olive, zone: 'yellow' },
    { id: 'cloud', label: t.architecture.nodes.cloud.label, sub: t.architecture.nodes.cloud.sub, x: 85, y: 40, color: C.green, zone: 'green' },
  ];
  const getNode = (id: NodeId) => NODES.find((n) => n.id === id) ?? NODES[0];

  return (
    <section
      id="architecture"
      aria-label="ekkoee architecture"
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-void px-6 py-20 md:px-10"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        <div
          className="text-amber mb-6 flex items-center gap-3"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
          }}
        >
          <span
            aria-hidden
            className="inline-block h-[7px] w-[7px] rounded-full"
            style={{
              background: 'var(--color-terminal, #00ff88)',
              boxShadow: '0 0 10px rgba(0, 255, 136, 0.6)',
              animation: 'cpf-blink 2s ease-in-out infinite',
            }}
          />
          <span>{t.architecture.tag}</span>
        </div>

        <h2
          className="ekkoee-brand mb-10"
          style={{
            fontSize: 'clamp(1.75rem, 4.2vw, 3rem)',
            color: C.cream,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {t.architecture.headlineA}
          <span style={{ color: C.green }}>{t.architecture.headlineB}</span>
        </h2>

        <div
          style={{
            position: 'relative',
            height: 420,
            border: `1px solid ${C.line}`,
            background: `
              linear-gradient(90deg, ${C.line} 1px, transparent 1px) 0 0 / 40px 40px,
              linear-gradient(0deg, ${C.line} 1px, transparent 1px) 0 0 / 40px 40px,
              ${C.bgSoft}`,
          }}
        >
          {/* zone bands */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', background: 'rgba(191,78,107,0.04)', borderRight: `1px dashed ${C.line}` }}>
            <div style={{ padding: 12, fontSize: 10, color: C.rose, letterSpacing: '0.2em' }}>{t.architecture.zoneRed}</div>
          </div>
          <div style={{ position: 'absolute', left: '30%', top: 0, bottom: 0, width: '40%', background: 'rgba(255,185,56,0.04)', borderRight: `1px dashed ${C.line}` }}>
            <div style={{ padding: 12, fontSize: 10, color: C.amber, letterSpacing: '0.2em' }}>{t.architecture.zoneYellow}</div>
          </div>
          <div style={{ position: 'absolute', left: '70%', top: 0, bottom: 0, width: '30%', background: 'rgba(0,255,136,0.04)' }}>
            <div style={{ padding: 12, fontSize: 10, color: C.green, letterSpacing: '0.2em' }}>{t.architecture.zoneGreen}</div>
          </div>

          {/* connections + packets */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {EDGES.map((e, i) => {
              const a = getNode(e.from);
              const b = getNode(e.to);
              const isHot = hovered === e.from || hovered === e.to;
              return (
                <g key={i}>
                  <line x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`} stroke={isHot ? C.green : C.dim} strokeWidth={isHot ? 2 : 1} strokeDasharray={isHot ? '0' : '4 4'} style={{ transition: 'all 0.3s' }} />
                  <circle r={4} fill={C.green}>
                    <animateMotion dur={isHot ? '1s' : '3s'} repeatCount="indefinite" path={`M ${a.x * 12} ${a.y * 4.2} L ${b.x * 12} ${b.y * 4.2}`} />
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
              style={{ position: 'absolute', left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.2s', pointerEvents: 'auto' }}
            >
              <div
                style={{
                  width: hovered === n.id ? 64 : 54,
                  height: hovered === n.id ? 64 : 54,
                  border: `2px solid ${n.color}`,
                  background: hovered === n.id ? n.color : C.bg,
                  boxShadow: hovered === n.id ? `0 0 40px ${n.color}` : 'none',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ width: 20, height: 20, background: hovered === n.id ? C.bg : n.color, transition: 'all 0.3s' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: C.cream, letterSpacing: '0.1em' }}>{n.label}</div>
                <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>{n.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, fontSize: 12, color: C.olive, textAlign: 'center' }}>
          {t.architecture.hoverHint}
        </div>
      </div>
    </section>
  );
}
