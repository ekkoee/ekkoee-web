'use client';

// =====================================================================
// I18nProvider — client-only 語言切換 context
// ---------------------------------------------------------------------
//   - 預設 zh-Hant,與 <html lang="zh-Hant"> 對齊,SSR hydration 不會失配
//   - 使用者切語言 → 寫進 localStorage('ekkoee.locale'),下次自動套用
//   - 同步更新 document.documentElement.lang 給瀏覽器 / SEO
//   - 不綁任何 i18n framework,保持輕量
// =====================================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  DICTIONARIES,
  type Dictionary,
} from './dictionaries';
import {
  DEFAULT_LOCALE,
  LOCALE_META,
  isLocale,
  type Locale,
} from './locales';

const STORAGE_KEY = 'ekkoee.locale';

type I18nContextShape = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  dict: Dictionary;
};

const I18nContext = createContext<I18nContextShape | null>(null);

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  // 第一次 render 必須用 initialLocale(SSR 與 client first paint 一致),
  // 掛載後再讀 localStorage 決定要不要切換。
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Hydration 後讀 localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw && isLocale(raw) && raw !== locale) {
        setLocaleState(raw);
      }
    } catch {
      // localStorage 被擋(incognito 等)就算了
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // locale 變動 → 寫 storage + 更新 <html lang>
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore
    }
    const htmlLang = LOCALE_META[locale]?.htmlLang ?? locale;
    if (typeof document !== 'undefined') {
      document.documentElement.lang = htmlLang;
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const value = useMemo<I18nContextShape>(
    () => ({
      locale,
      setLocale,
      dict: DICTIONARIES[locale],
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * 在 client component 裡用:
 *   const { t, locale, setLocale } = useI18n();
 *   <h1>{t.manifesto.lineA}</h1>
 */
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Server-side 或沒包 Provider 時 fallback 回預設字典,避免爆炸。
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: DICTIONARIES[DEFAULT_LOCALE],
    };
  }
  return {
    locale: ctx.locale,
    setLocale: ctx.setLocale,
    t: ctx.dict,
  };
}
