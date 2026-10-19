import {getRequestConfig} from 'next-intl/server';
import {isLocale} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : 'en';
  const english = (await import('../messages/en.json')).default;
  const translated = (await import(`../messages/${locale}.json`)).default;
  return {
    locale,
    messages: {copy: {...english.copy, ...translated.copy}},
    timeZone: 'UTC',
  };
});
