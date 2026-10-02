import { create } from 'zustand';
import { SupportedLocale } from '@/types/vtt';
import { getDictionary, LocaleDictionary } from '@/locales';

interface LocaleState {
  locale: SupportedLocale;
  dict: LocaleDictionary;
  setLocale: (locale: SupportedLocale) => void;
  toggleLocale: () => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: 'pt',
  dict: getDictionary('pt'),
  setLocale: (locale: SupportedLocale) =>
    set({
      locale,
      dict: getDictionary(locale),
    }),
  toggleLocale: () =>
    set((state) => {
      const nextLocale: SupportedLocale = state.locale === 'pt' ? 'en' : 'pt';
      return {
        locale: nextLocale,
        dict: getDictionary(nextLocale),
      };
    }),
}));
