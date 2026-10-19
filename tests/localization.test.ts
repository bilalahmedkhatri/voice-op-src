import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTranslator} from 'next-intl';
import {createElement} from 'react';
import {messageKey} from '../i18n/messageKey';
import {createCopy, copyData} from '../i18n/copy';
import {errorCopy} from '../i18n/errors';
import {isLocale, languageTags, localizePath, routing} from '../i18n/routing';
import {translateBlogPosts} from '../i18n/blog';
import {getAllBlogPosts} from '../app/lib/blogMockData';

function catalog(locale: string, blog = false) {
  return JSON.parse(readFileSync(new URL(`../messages/${blog ? 'blog/' : ''}${locale}.json`, import.meta.url), 'utf8')).copy as Record<string, string>;
}

test('locale URLs preserve query/hash and never prefix API or external URLs', () => {
  assert.equal(localizePath('/admin?resumeJob=job%2F1#status', 'fr'), '/fr/admin?resumeJob=job%2F1#status');
  assert.equal(localizePath('/pt/admin?x=1#status', 'nl'), '/nl/admin?x=1#status');
  assert.equal(localizePath('/', 'en'), '/en');
  for (const path of ['/api/auth/google', '/_next/a.js', 'https://example.test', '//example.test']) assert.equal(localizePath(path, 'ru'), path);
  assert.equal(isLocale('de'), false);
  assert.equal(languageTags.pt, 'pt-PT');
  assert.equal(routing.localeDetection, false);
});

test('all compiled messages format without ICU errors; English copy is preserved', () => {
  for (const locale of routing.locales) for (const blog of [false, true]) {
    const messages = catalog(locale, blog);
    const errors: unknown[] = [];
    const t = createTranslator({locale, messages: {copy: messages}, namespace: 'copy', onError: error => errors.push(error)});
    for (const key of Object.keys(messages)) {
      const value = t(key, {v0: 2, v1: 3, v2: 4, v3: 5, v4: 6, v5: 7});
      assert.ok(typeof value === 'string' && value.length, `${locale}/${key}`);
    }
    assert.deepEqual(errors, [], `${locale} ${blog ? 'blog' : 'UI'} ICU errors`);
  }
  const sources = JSON.parse(readFileSync(new URL('../messages/sources.json', import.meta.url), 'utf8')) as Record<string, string>;
  const english = {...catalog('en'), ...catalog('en', true)};
  const t = createTranslator({locale: 'en', messages: {copy: english}, namespace: 'copy'});
  for (const [key, source] of Object.entries(sources)) if (!source.includes('{v')) assert.equal(t(key), source, key);
});

test('source-only data translation leaves IDs, routes and original records untouched', () => {
  const t = createTranslator({locale: 'fr', messages: {copy: {...catalog('en'), ...catalog('fr')}}, namespace: 'copy'});
  const copy = createCopy(t);
  const raw = [{id: 'voice', label: 'Voice Generator', href: '/admin', value: 'Voice Generator'}];
  const localized = copyData(raw, copy);
  assert.equal(localized[0].label, 'Générateur de voix');
  assert.equal(localized[0].value, raw[0].value);
  assert.equal(localized[0].id, raw[0].id);
  assert.equal(localized[0].href, raw[0].href);
  assert.equal(raw[0].label, 'Voice Generator');
  const element = createElement('strong', null, 'Original content');
  assert.equal(copyData({body: element}, copy).body, element);
});

test('English fallback, unknown errors and Russian plural forms are bounded', () => {
  const t = createTranslator({locale: 'ru', messages: {copy: {...catalog('en'), ...catalog('ru')}}, namespace: 'copy'});
  const copy = createCopy(t);
  assert.equal(copy('A user script not in the source catalog'), 'A user script not in the source catalog');
  assert.equal(errorCopy(null, copy), '');
  assert.equal(errorCopy('upstream secret diagnostic', copy), 'Что-то пошло не так. Попробуйте ещё раз.');
  const plural = '{v0, plural, one {# word} other {# words}}';
  assert.equal(copy(plural, {v0: 1}), '1 слово');
  assert.equal(copy(plural, {v0: 2}), '2 слова');
  assert.equal(copy(plural, {v0: 5}), '5 слов');
  const otherComponent = createCopy(t, {...catalog('en'), ...catalog('ru')});
  assert.equal(errorCopy('upstream secret diagnostic...', otherComponent), copy('Something went wrong. Please try again.'));
  const localized = copy('Something went wrong. Please try again.');
  assert.equal(errorCopy(localized, otherComponent), localized);
});

test('blog publication membership, slugs and English source data survive localization', () => {
  const posts = getAllBlogPosts();
  const firstTitle = posts[0].title;
  const source = catalog('en', true);
  const t = createTranslator({locale: 'fr', messages: {copy: {...source, [messageKey(firstTitle)]: 'Titre traduit'}}, namespace: 'copy'});
  const localized = translateBlogPosts(posts, createCopy(t));
  assert.equal(localized[0].title, 'Titre traduit');
  assert.equal(posts[0].title, firstTitle);
  assert.deepEqual(localized.map(post => post.slug), posts.map(post => post.slug));
  assert.deepEqual(localized.map(post => post.id), posts.map(post => post.id));
  assert.ok(localized.every(post => post.content.includes(post.sections[0].heading)));
});
