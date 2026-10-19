import {getTranslations} from 'next-intl/server';
import {createCopy} from './copy';

export async function getCopy(locale?: string) {
  const t = locale ? await getTranslations({locale, namespace: 'copy'}) : await getTranslations('copy');
  return createCopy(t);
}
