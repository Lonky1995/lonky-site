export type Locale = "en" | "zh";
export const defaultLocale: Locale = "zh";
export const locales: Locale[] = ["en", "zh"];
export const LOCALE_COOKIE = "locale";

/** Bilingual text helper */
export type L = { en: string; zh: string };
