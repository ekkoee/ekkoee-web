'use client';

// =====================================================================
// LangSwitcher — HUD 上的三顆語言小按鈕(TC / EN / SC)
// ---------------------------------------------------------------------
//   - mono 字 + uppercase + 0.25em spacing,與 CyberpunkFrame HUD 同調
//   - 當前語言:terminal green,其餘:bone 半透
//   - hover 微微 glow,保持 cyberpunk 風
// =====================================================================

import { LOCALES, LOCALE_META } from '@/lib/i18n/locales';
import { useI18n } from '@/lib/i18n/I18nProvider';

export default function LangSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className="flex items-center gap-1"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.25em',
      }}
    >
      {LOCALES.map((code, i) => {
        const meta = LOCALE_META[code];
        const active = locale === code;
        return (
          <span key={code} className="flex items-center">
            {i > 0 && (
              <span
                aria-hidden
                style={{ color: 'rgba(235, 230, 215, 0.18)', padding: '0 6px' }}
              >
                /
              </span>
            )}
            <button
              type="button"
              onClick={() => setLocale(code)}
              aria-label={meta.label}
              aria-current={active ? 'true' : 'false'}
              className="transition-colors focus:outline-none"
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0 2px',
                cursor: 'pointer',
                color: active
                  ? 'rgba(0, 255, 136, 0.95)'
                  : 'rgba(235, 230, 215, 0.55)',
                textShadow: active
                  ? '0 0 8px rgba(0, 255, 136, 0.55)'
                  : 'none',
                fontWeight: active ? 500 : 400,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.color = 'rgba(235, 230, 215, 0.95)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.color = 'rgba(235, 230, 215, 0.55)';
                }
              }}
            >
              {meta.short}
            </button>
          </span>
        );
      })}
    </div>
  );
}
