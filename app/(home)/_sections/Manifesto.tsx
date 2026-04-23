'use client';

// =====================================================================
// (home) / Manifesto - bg-void
// T6: 100vh 置中單句大字。文案從 i18n 字典來,預設繁中:
//     「所有的智慧,為了每個人每分每秒的自由。」
// Comfortaa 撐 latin / punctuation,中文 glyph fallback 到 Noto Sans TC。
// =====================================================================

import { useI18n } from '@/lib/i18n/I18nProvider';

export default function Manifesto() {
  const { t } = useI18n();
  return (
    <section
      id="manifesto"
      aria-label="ekkoee manifesto"
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-void px-6 py-20"
    >
      {/* section tag — terminal style (live green dot + bracket + mono) */}
      <div
        className="text-amber absolute left-10 top-14 flex items-center gap-3"
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
        <span>{t.manifesto.tag}</span>
      </div>

      {/* The line */}
      <h2
        className="text-bone text-center"
        style={{
          fontFamily:
            'var(--font-comfortaa), var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
          fontWeight: 700,
          fontSize: 'clamp(2rem, 5.2vw, 4.5rem)',
          letterSpacing: '-0.01em',
          lineHeight: 1.25,
          maxWidth: '18ch',
        }}
      >
        {t.manifesto.lineA}
        <br />
        {t.manifesto.lineB}
      </h2>
    </section>
  );
}
