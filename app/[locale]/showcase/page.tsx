import {redirect} from '@/i18n/navigation';
import {isLocale} from '@/i18n/routing';
import {notFound} from 'next/navigation';

export default async function ShowcasePage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  redirect({href: '/#live-studio', locale});
}
