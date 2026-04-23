'use client';

// =====================================================================
// (home) / CTA - bg-warm-gray(和 Dashboard 一致,不再是 cream 白底)
// Rose + green caret 實心按鈕,深底 glow 更有戲。
// =====================================================================

import { useEffect, useState } from 'react';

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
      aria-label="ekkoee contact"
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-warm-gray px-6 py-20 text-center"
    >
      {/* rose radial glow — 深底上更明顯 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.12,
          background:
            'radial-gradient(circle at 50% 50%, #BF4E6B, transparent 60%)',
        }}
      />

      <div className="relative z-[1] mx-auto max-w-[820px]">
        {/* terminal label — rose 字 + 綠 live dot,跟其他 section 統一 */}
        <div
          className="mb-8 flex items-center justify-center gap-3"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#BF4E6B',
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
          <span>[ 05 / READY WHEN YOU ARE ]</span>
        </div>

        {/* headline — bone 主色 + rose 重音,Comfortaa 大字 */}
        <h2
          className="text-bone mb-8"
          style={{
            fontFamily:
              'var(--font-comfortaa), var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
          }}
        >
          stop reporting.
          <br />
          <span style={{ color: '#BF4E6B', textShadow: '0 0 28px rgba(191, 78, 107, 0.45)' }}>
            start predicting.
          </span>
        </h2>

        {/* supporting copy — bone-dim 在深底上可讀 */}
        <p
          className="text-bone-dim mx-auto mb-12 max-w-[560px]"
          style={{
            fontFamily:
              'var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
            fontSize: 15,
            lineHeight: 1.75,
          }}
        >
          第一次顧問面談免費。我們走進你的工廠、畫出流程地圖,
          具體說清楚:在你的脈絡下,智慧體會長成什麼樣子。
        </p>

        {/* rose 實底按鈕 + 打字 caret — 深底上 glow 更亮 */}
        <a
          href="mailto:hello@ekkoee.com"
          className="inline-block transition-all"
          style={{
            textDecoration: 'none',
            border: '1px solid #BF4E6B',
            padding: '18px 40px',
            color: '#EBE6D7',
            background: '#BF4E6B',
            fontFamily: 'var(--font-mono)',
            fontSize: 15,
            letterSpacing: '0.1em',
            boxShadow: '0 0 0 rgba(191, 78, 107, 0)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow =
              '0 0 48px rgba(191, 78, 107, 0.55)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow =
              '0 0 0 rgba(191, 78, 107, 0)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          $ {typed}
          <span
            style={{
              marginLeft: 2,
              animation: 'cpf-blink 0.8s step-end infinite',
            }}
          >
            █
          </span>
        </a>

        {/* email fallback */}
        <div
          className="mt-10"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.2em',
            color: 'rgba(162, 156, 135, 0.75)',
          }}
        >
          or email{' '}
          <a
            href="mailto:hello@ekkoee.com"
            style={{
              color: '#FFB938',
              textDecoration: 'none',
              borderBottom: '1px dashed rgba(255, 185, 56, 0.5)',
              paddingBottom: 2,
            }}
          >
            hello@ekkoee.com
          </a>{' '}
          directly
        </div>
      </div>
    </section>
  );
}
