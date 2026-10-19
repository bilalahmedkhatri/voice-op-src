import {useMessages, useTranslations} from 'next-intl';
import {isValidElement, useMemo} from 'react';
import {messageKey} from './messageKey';
import fields from './displayFields.json';

type Translator = ReturnType<typeof useTranslations>;
export type Copy = ((source: string, values?: Record<string, string | number>) => string) & {
  has: (source: string) => boolean;
  recognizes: (text: string) => boolean;
};

export function createCopy(t: Translator, messages: Record<string, string> = {}): Copy {
  const literals = new Set<string>();
  const templates: RegExp[] = [];
  for (const value of Object.values(messages)) {
    if (typeof value !== 'string' || value.startsWith('{v0, plural,')) continue;
    const text = value.replace(/''/g, "'").replace(/'([{}<])'/g, '$1');
    if (/\{v\d+\}/.test(text)) {
      // Punctuation-only templates must not recognize arbitrary provider diagnostics.
      if ((text.replace(/\{v\d+\}/g, '').match(/\p{L}/gu) ?? []).length < 3) continue;
      const pattern = text.split(/\{v\d+\}/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\S]*');
      templates.push(new RegExp(`^${pattern}$`));
    } else literals.add(text);
  }
  const copy: Copy = (source, values) => {
    const key = messageKey(source);
    return t.has(key) ? t(key, values) : source;
  };
  copy.has = source => t.has(messageKey(source));
  copy.recognizes = text => literals.has(text) || templates.some(pattern => pattern.test(text));
  return copy;
}

/** next-intl also supports this hook in synchronous Server Components. */
export function useCopy(): Copy {
  const t = useTranslations('copy');
  const messages = useMessages();
  return useMemo(() => createCopy(t, messages.copy as Record<string, string>), [t, messages]);
}

const displayFields = new Set(fields);

/** Only use for source-owned presentation constants, never user or provider records. */
export function copyData<T>(data: T, copy: Copy, field = 'items'): T {
  if (isValidElement(data)) return data;
  if (typeof data === 'string') return (displayFields.has(field) ? copy(data) : data) as T;
  if (Array.isArray(data)) return data.map(value => copyData(value, copy, field)) as T;
  if (data && typeof data === 'object') return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, copyData(value, copy, key)]),
  ) as T;
  return data;
}
