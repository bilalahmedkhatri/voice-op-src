import {createTranslator} from 'next-intl';
import {getAllBlogPosts, type BlogPost} from '@/app/lib/blogMockData';
import {copyData, createCopy, type Copy} from './copy';
import type {Locale} from './routing';

export function translateBlogPosts(posts: BlogPost[], copy: Copy): BlogPost[] {
  return posts.map(post => {
    const localized = copyData(post, copy);
    return {
      ...localized,
      keywords: post.keywords.map(keyword => copy(keyword)),
      content: localized.sections.map(section => [section.heading, ...section.paragraphs, ...(section.bullets || []),
        ...(section.table ? [section.table.headers.join(' | '), ...section.table.rows.map(row => row.join(' | '))] : []),
      ].join('\n\n')).join('\n\n'),
    };
  });
}

export async function getLocalizedBlogPosts(locale: Locale) {
  const english = (await import('../messages/blog/en.json')).default;
  const translated = (await import(`../messages/blog/${locale}.json`)).default;
  const t = createTranslator({locale, messages: {copy: {...english.copy, ...translated.copy}}, namespace: 'copy'});
  // Publication membership and stable IDs always come from the original English definitions.
  return translateBlogPosts(getAllBlogPosts(), createCopy(t));
}
