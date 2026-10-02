import { pt } from './pt';
import { en } from './en';
import { SupportedLocale } from '@/types/vtt';

export const dictionaries = {
  pt,
  en,
};

export type LocaleDictionary = typeof pt;

export function getDictionary(locale: SupportedLocale): LocaleDictionary {
  return dictionaries[locale] || dictionaries.pt;
}
