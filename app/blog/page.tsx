import React from 'react';
import type { Metadata } from 'next';
import PostList from '../components/PostList';
import { getAllBlogPosts } from '@/app/lib/blogMockData';

export const metadata: Metadata = {
  title: 'Creator Blog & Tutorials | GenZee Video',
  description:
    'Explore articles, tutorials, and workflows on AI voice synthesis, multi-platform social media automation, and creator growth from GenZee (genzee.video).',
  alternates: {
    canonical: 'https://www.genzee.video/blog',
  },
};

export default function Blogs() {
  const posts = getAllBlogPosts().slice(0, 12);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          GenZee Creator Blog
        </h1>
        <p className="text-base text-slate-500 max-w-xl mx-auto">
          Explore the latest tutorials, audio AI updates, and multi-platform automation workflows for modern creators.
        </p>
      </div>

      <PostList posts={posts} />
    </div>
  );
}