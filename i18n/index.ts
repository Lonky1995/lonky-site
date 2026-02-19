import type { Locale } from "./config";
import en from "./dictionaries/en";
import zh from "./dictionaries/zh";

const dictionaries = { en, zh };

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
