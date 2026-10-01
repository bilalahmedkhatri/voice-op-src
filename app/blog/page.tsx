import React from 'react';
import type { Metadata } from 'next';
import PostList from '../components/PostList';

export const metadata: Metadata = {
  title: 'Blog | Free AI Voice Generator',
  description: 'Explore articles, tutorials, and updates on text-to-speech technology, AI voice generation, and content creation best practices from our expert team.',
};

async function fetchPosts() {
  try {
    const res = await fetch(`http://localhost:3000/api/blog?limit=12`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return { items: [] as any[] };
    }

    return (await res.json()) as { items: any[] };
  } catch {
    return { items: [] as any[] };
  }
}

export default async function Blogs() {
  const data = await fetchPosts();

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Our Blog
        </h1>
        <p className="text-base text-slate-500 max-w-xl mx-auto">
          Explore the latest tutorials, audio AI updates, and content creator workflows with free text-to-speech synthesis.
        </p>
      </div>

      <PostList posts={data.items} />
    </div>
  );
}