import {localizedMetadata} from '@/i18n/metadata';
import {isLocale} from '@/i18n/routing';
import {notFound} from 'next/navigation';

import {getCopy} from '@/i18n/server';
import React from 'react';
import type { Metadata } from 'next';
import PostList from '../../components/PostList';
import {getLocalizedBlogPosts} from '@/i18n/blog';

const pageMetadata: Metadata = {
  title: 'Creator Blog & Tutorials | GenZee Video',
  description:
    'Explore articles, tutorials, and workflows on AI voice synthesis, multi-platform social media automation, and creator growth from GenZee (genzee.video).',
  alternates: {
    canonical: 'https://www.genzee.video/blog',
  },
};

export default async function Blogs({params}: {params: Promise<{locale: string}>}) {
  const copy = await getCopy();


  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const posts = (await getLocalizedBlogPosts(locale)).slice(0, 12);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          {copy("GenZee Creator Blog")}</h1>
        <p className="text-base text-slate-500 max-w-xl mx-auto">
          {copy("Explore the latest tutorials, audio AI updates, and multi-platform automation workflows for modern creators.")}</p>
      </div>

      <PostList posts={posts} />
    </div>
  );
}
export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  return localizedMetadata(pageMetadata, locale, "/blog");
}
