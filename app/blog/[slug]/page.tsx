import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiArrowLeft, FiClock, FiCalendar, FiTag, FiShare2, FiMic } from 'react-icons/fi';
import { getAllBlogPosts, getBlogPostBySlug } from '@/app/lib/blogMockData';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Article Not Found | GenZee Video',
    };
  }

  const canonicalUrl = `https://www.genzee.video/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      authors: ['GenZee Editorial Team'],
      images: [
        {
          url: post.imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.imageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const allPosts = getAllBlogPosts();
  const relatedPosts = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  // Schema.org BlogPosting structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.imageUrl,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Organization',
      name: 'GenZee Editorial Team',
      url: 'https://www.genzee.video',
    },
    publisher: {
      '@type': 'Organization',
      name: 'GenZee Video Studio',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.genzee.video/icon-512.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.genzee.video/blog/${post.slug}`,
    },
  };

  // Parse markdown-style sections
  const rawSections = post.content.split('### ').filter(Boolean);
  const sections = rawSections.map((sec) => {
    const [heading, ...paragraphs] = sec.split('\n\n');
    return {
      heading: heading.trim(),
      body: paragraphs.join('\n\n').trim(),
    };
  });

  return (
    <article className="space-y-10 max-w-4xl mx-auto">
      {/* Schema.org BlogPosting Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#c83a2a] hover:underline transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to all creator guides
        </Link>
        <span className="text-xs text-slate-400 font-medium">
          GenZee Video Studio / Creator Resources
        </span>
      </div>

      {/* Article Header */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-orange-50 text-[#c83a2a] border border-orange-200/80">
            <FiTag className="w-3.5 h-3.5" />
            {post.tag}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
            <FiClock className="w-3.5 h-3.5" />
            {post.readTime}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
            <FiCalendar className="w-3.5 h-3.5" />
            {post.date}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.18]">
          {post.title}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          {post.description}
        </p>

        <div className="flex items-center gap-3 pt-2 text-xs text-slate-500">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
            GZ
          </div>
          <div>
            <p className="font-semibold text-slate-800">GenZee Editorial Team</p>
            <p className="text-[11px] text-slate-400">Audio Engineering & Video Automation</p>
          </div>
        </div>
      </header>

      {/* Featured Cover Image */}
      <div className="relative w-full aspect-video sm:aspect-21/9 rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs bg-slate-100">
        <Image
          src={post.imageUrl}
          alt={post.title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 896px"
        />
      </div>

      {/* Article Body */}
      <div className="space-y-8 text-slate-700 leading-relaxed text-base sm:text-lg">
        {sections.map((section, idx) => (
          <section key={idx} className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {section.heading}
            </h2>
            <p className="leading-relaxed font-normal text-slate-600">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      {/* In-Article CTA Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-700 shadow-md">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-[#ff9b8f] border border-[#ff7d6e]/30">
            <FiMic className="w-3 h-3" />
            AI Voice Synthesis
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight">
            Ready to bring your video scripts to life?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md">
            Synthesize broadcast voiceovers using ElevenLabs, Google Gemini, and Fish Audio with zero setup.
          </p>
        </div>
        <Link
          href="/"
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#ff7d6e] to-[#ff9b8f] text-slate-950 font-bold text-xs sm:text-sm hover:opacity-95 transition-opacity whitespace-nowrap shadow-xs"
        >
          Open Free Studio
        </Link>
      </div>

      {/* Related Articles Section */}
      <div className="pt-8 border-t border-slate-200/80 space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Related Creator Guides
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {relatedPosts.map((related) => (
            <Link
              key={related.slug}
              href={`/blog/${related.slug}`}
              className="group block p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[#c83a2a]">
                  {related.tag}
                </span>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#c83a2a] transition-colors line-clamp-2 leading-snug">
                  {related.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {related.description}
                </p>
              </div>
              <div className="pt-3 text-[11px] text-slate-400 font-medium">
                {related.readTime} • {related.date}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}
