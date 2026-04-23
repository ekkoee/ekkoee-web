'use client';

// =====================================================================
// (home) / Trust - gradient bg-void → warm-gray
// T8: 三帶信任 — RED(永不離廠)/ YELLOW(匿名上傳)/ GREEN(公開可雲端)
// 復用舊 prototype 的 .trust-grid / .zone.* CSS(還在 globals.css 裡)。
// =====================================================================

import { useI18n } from '@/lib/i18n/I18nProvider';

function LockSvg() {
  return (
    <svg className="lock-svg" viewBox="0 0 60 70" aria-hidden="true">
      <path
        className="lock-shackle"
        d="M 15 32 L 15 22 Q 15 10 30 10 Q 45 10 45 22 L 45 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="10" y="30" width="40" height="32" rx="3" fill="currentColor" opacity="0.95" />
      <circle cx="30" cy="44" r="3" fill="#0A0A0C" />
      <rect x="28.5" y="44" width="3" height="8" fill="#0A0A0C" />
    </svg>
  );
}

export default function Trust() {
  const { t } = useI18n();
  return (
    <section
      id="trust"
      aria-label="ekkoee trust boundaries"
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-void to-warm-gray px-6 py-20 md:px-10"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        {/* terminal label */}
        <div
          className="text-amber mb-10 flex items-center gap-3"
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
          <span>{t.trust.tag}</span>
        </div>

        {/* headline */}
        <h2
          className="text-bone mb-12 max-w-[24ch]"
          style={{
            fontFamily:
              'var(--font-comfortaa), var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(1.75rem, 4.2vw, 3.5rem)',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {t.trust.headline}
        </h2>

        {/* three zones — reuse legacy .trust-grid / .zone.* styles */}
        <div className="trust-grid">
          <div className="zone red">
            <div className="zone-tag">
              <span className="zone-tag-dot" />
              {t.trust.zoneRed}
            </div>
            <div className="lock-viz">
              <LockSvg />
            </div>
            <div className="zone-body">
              <strong>{t.trust.red.strong}</strong>
              {t.trust.red.body}
            </div>
            <div className="zone-promise">{t.trust.red.promise}</div>
          </div>

          <div className="zone amb">
            <div className="zone-tag">
              <span className="zone-tag-dot" />
              {t.trust.zoneYellow}
            </div>
            <div className="lock-viz">
              <LockSvg />
            </div>
            <div className="zone-body">
              <strong>{t.trust.yellow.strong}</strong>
              {t.trust.yellow.body}
            </div>
            <div className="zone-promise">{t.trust.yellow.promise}</div>
          </div>

          <div className="zone grn">
            <div className="zone-tag">
              <span className="zone-tag-dot" />
              {t.trust.zoneGreen}
            </div>
            <div className="lock-viz">
              <LockSvg />
            </div>
            <div className="zone-body">
              <strong>{t.trust.green.strong}</strong>
              {t.trust.green.body}
            </div>
            <div className="zone-promise">{t.trust.green.promise}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
