// =====================================================================
// lib/i18n/locales — supported language set
// ---------------------------------------------------------------------
// 首波 3 語:繁中(預設)/ 英文 / 簡中。之後要加越南文 / 印地語就
// 把 LOCALES 陣列加進來、補字典即可。
// =====================================================================

export const LOCALES = ['zh-Hant', 'en', 'zh-Hans'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'zh-Hant';

export const LOCALE_META: Record<
  Locale,
  { code: Locale; short: string; label: string; htmlLang: string }
> = {
  'zh-Hant': { code: 'zh-Hant', short: 'TC', label: '繁體中文', htmlLang: 'zh-Hant' },
  en: { code: 'en', short: 'EN', label: 'English', htmlLang: 'en' },
  'zh-Hans': { code: 'zh-Hans', short: 'SC', label: '简体中文', htmlLang: 'zh-Hans' },
};

export function isLocale(x: unknown): x is Locale {
  return typeof x === 'string' && (LOCALES as readonly string[]).includes(x);
}
