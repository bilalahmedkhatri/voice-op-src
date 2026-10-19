import type {Metadata} from 'next';
import {languageTags, localizePath, routing, type Locale} from './routing';
import {getCopy} from './server';
import readiness from '@/messages/readiness.json';

const base = 'https://www.genzee.video';
export async function localizedMetadata(source: Metadata, locale: Locale, path: string): Promise<Metadata> {
  const copy = await getCopy(locale);
  const title = typeof source.title === 'string' ? copy(source.title) : source.title && {
    ...source.title,
    ...('default' in source.title ? {default: copy(source.title.default)} : {}),
    ...('absolute' in source.title ? {absolute: copy(source.title.absolute)} : {}),
  };
  const url = base + localizePath(path, locale);
  const publicLocales = routing.locales.filter(value => readiness.completeLocales.includes(value));
  return {
    ...source,
    title,
    description: source.description ? copy(source.description) : source.description,
    ...(!readiness.completeLocales.includes(locale) ? {robots: {index: false, follow: true}} : {}),
    keywords: Array.isArray(source.keywords) ? source.keywords.map(value => copy(value)) : source.keywords,
    alternates: {canonical: url, languages: {
      ...Object.fromEntries(publicLocales.map(value => [languageTags[value], base + localizePath(path, value)])),
      'x-default': base + localizePath(path, 'en'),
    }},
    openGraph: {...source.openGraph, url,
      title: typeof source.openGraph?.title === 'string' ? copy(source.openGraph.title) : title ?? undefined,
      description: copy(source.openGraph?.description || source.description || ''),
      locale: languageTags[locale].replace('-', '_'),
      images: source.openGraph?.images && (Array.isArray(source.openGraph.images) ? source.openGraph.images : [source.openGraph.images]).map(image =>
        typeof image === 'object' && !(image instanceof URL) && 'alt' in image ? {...image, alt: image.alt ? copy(image.alt) : image.alt} : image),
    },
    twitter: {...source.twitter,
      title: typeof source.twitter?.title === 'string' ? copy(source.twitter.title) : title ?? undefined,
      description: copy(source.twitter?.description || source.description || ''),
    },
  };
}
