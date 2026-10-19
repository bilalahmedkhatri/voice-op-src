import type {MetadataRoute} from 'next';
import {getAllBlogPosts} from '@/app/lib/blogMockData';
import {routing, languageTags, localizePath} from '@/i18n/routing';
import readiness from '@/messages/readiness.json';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.genzee.video';
  const paths = ['/', '/pricing', '/blog', '/about-us', '/faq', '/contact-us', '/privacy-policy', '/terms-of-service',
    ...getAllBlogPosts().map(post => `/blog/${post.slug}`)];
  const locales = routing.locales.filter(locale => readiness.completeLocales.includes(locale));
  return paths.flatMap(path => locales.map(locale => ({
    url: base + localizePath(path, locale),
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.7,
    alternates: {languages: {
      ...Object.fromEntries(locales.map(value => [languageTags[value], base + localizePath(path, value)])),
      'x-default': base + localizePath(path, 'en'),
    }},
  })));
}
