'use client';

import {useLocale} from 'next-intl';
import {usePathname, useRouter} from "@/i18n/navigation";
import {routing, type Locale} from "@/i18n/routing";
import {useCopy} from '@/i18n/copy';

const names: Record<Locale, string> = {
  en: 'English', ru: 'Русский', pt: 'Português', fr: 'Français', es: 'Español', nl: 'Nederlands',
};

export default function LanguageSelector() {
  const copy = useCopy();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  return (
    <select aria-label={copy('Language')} value={locale}
      className="max-w-28 shrink-0 rounded-full border border-[#ff9b8f]/50 bg-white px-2 py-1.5 text-xs text-[#c83a2a] focus-visible:outline-[#ff7d6e]"
      onChange={event => {
        router.replace(`${pathname}${window.location.search}${window.location.hash}`, {locale: event.target.value as Locale, scroll: false});
      }}>
      {routing.locales.map(value => <option key={value} value={value} lang={value === 'pt' ? 'pt-PT' : value}>{names[value]}</option>)}
    </select>
  );
}
