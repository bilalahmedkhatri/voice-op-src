import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ru', 'pt', 'fr', 'es', 'nl'],
  defaultLocale: 'en',
  localePrefix: 'always',
  localeDetection: false,
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];
export const languageTags: Record<Locale, string> = {
  en: 'en', ru: 'ru', pt: 'pt-PT', fr: 'fr', es: 'es', nl: 'nl',
};

export function isLocale(value: string): value is Locale {
  return routing.locales.some(locale => locale === value);
}

export function localizePath(path: string, locale: Locale): string {
  if (!path.startsWith('/') || path.startsWith('//') || /^\/(api|_next|_vercel)(\/|$)/.test(path)) return path;
  const withoutLocale = path.replace(/^\/(en|ru|pt|fr|es|nl)(?=\/|[?#]|$)/, '');
  return `/${locale}${withoutLocale === '/' ? '' : withoutLocale}`;
}
