'use client';

// =====================================================================
// CyberpunkFrame — 全站 CRT chrome
// ---------------------------------------------------------------------
//   - scanlines / grain / vignette / sweep
//   - 頂 HUD 含 [CLIENT LOGIN →] link 到 /login(工廠/客戶端入口)
//   - 底 HUD 顯示系統狀態
//   - 全域 keyframes:cpf-blink / cpf-sweep / ekkoee-glitch-r / ekkoee-glitch-g
// =====================================================================

import Link from 'next/link';

export default function CyberpunkFrame() {
  return (
    <>
      {/* scan sweep */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 z-[52] h-32"
        style={{
          background:
            'linear-gradient(180deg, transparent, rgba(0, 255, 136, 0.05) 50%, transparent)',
          animation: 'cpf-sweep 10s linear infinite',
        }}
      />
      {/* vignette */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[54]"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 45%, rgba(0, 0, 0, 0.55) 100%)',
        }}
      />
      {/* scanlines */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[55]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0, 255, 136, 0.025) 0 1px, transparent 1px 3px)',
          mixBlendMode: 'overlay',
        }}
      />
      {/* grain */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[56]"
        style={{
          opacity: 0.04,
          mixBlendMode: 'overlay',
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* HUD top — 左側 wordmark + live dot,右側 LOGIN 入口 */}
      <div
        className="fixed left-0 right-0 top-0 z-[57] flex h-7 items-center justify-between border-b px-4"
        style={{
          borderColor: 'rgba(235, 230, 215, 0.08)',
          background:
            'linear-gradient(to bottom, rgba(4, 4, 16, 0.92), rgba(4, 4, 16, 0.72))',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(235, 230, 215, 0.55)',
        }}
      >
        <div className="pointer-events-none flex items-center gap-3">
          <span
            aria-hidden
            className="inline-block h-[6px] w-[6px] rounded-full"
            style={{
              background: 'var(--color-terminal, #00ff88)',
              boxShadow: '0 0 8px rgba(0, 255, 136, 0.6)',
              animation: 'cpf-blink 2s ease-in-out infinite',
            }}
          />
          <span>EKKOEE.COM</span>
          <span style={{ color: 'rgba(235, 230, 215, 0.25)' }}>{'//'}</span>
          <span style={{ color: 'rgba(255, 185, 56, 0.75)' }}>
            MINI-AGI FOR MANUFACTURING
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="pointer-events-none">NODE::23.4.168</span>
          <span className="pointer-events-none" style={{ color: 'rgba(235, 230, 215, 0.25)' }}>
            {'//'}
          </span>
          <Link
            href="/login"
            className="transition-colors hover:text-terminal focus:text-terminal focus:outline-none"
            style={{
              color: 'rgba(0, 255, 136, 0.85)',
              textDecoration: 'none',
              letterSpacing: '0.25em',
            }}
          >
            ▸ CLIENT LOGIN
          </Link>
        </div>
      </div>

      {/* HUD bottom — 狀態列 */}
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-[57] flex h-7 items-center justify-between border-t px-4"
        style={{
          borderColor: 'rgba(235, 230, 215, 0.08)',
          background:
            'linear-gradient(to top, rgba(4, 4, 16, 0.92), rgba(4, 4, 16, 0.72))',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(235, 230, 215, 0.55)',
        }}
      >
        <div className="flex items-center gap-3">
          <span style={{ color: 'rgba(0, 255, 136, 0.75)' }}>SYS::LIVE</span>
          <span style={{ color: 'rgba(235, 230, 215, 0.25)' }}>{'//'}</span>
          <span>AGENTS::05/07</span>
          <span style={{ color: 'rgba(235, 230, 215, 0.25)' }}>{'//'}</span>
          <span style={{ color: 'rgba(255, 185, 56, 0.75)' }}>02 WARN</span>
        </div>
        <div>
          <span>▼ SCROLL · DRAG · ZOOM</span>
        </div>
      </div>

      {/* Keyframes — 全站共用 */}
      <style jsx global>{`
        @keyframes cpf-sweep {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(110vh); }
        }
        @keyframes cpf-blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.35; }
        }
        /* Glitch RGB split — rose 層 */
        @keyframes ekkoee-glitch-r {
          0%, 100% { transform: translate(0, 0); }
          12% { transform: translate(2px, -1px); }
          24% { transform: translate(-2px, 1px); }
          38% { transform: translate(1px, 2px); }
          52% { transform: translate(-1px, -2px); }
          65% { transform: translate(3px, 0); }
          80% { transform: translate(-1px, 1px); }
        }
        /* Glitch RGB split — green 層(錯相) */
        @keyframes ekkoee-glitch-g {
          0%, 100% { transform: translate(0, 0); }
          15% { transform: translate(-2px, 1px); }
          30% { transform: translate(2px, -1px); }
          45% { transform: translate(-1px, -2px); }
          60% { transform: translate(1px, 2px); }
          75% { transform: translate(-3px, 0); }
          90% { transform: translate(1px, -1px); }
        }
      `}</style>
    </>
  );
}
