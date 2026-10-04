import {
  MIN_POST_LENGTH,
  getPostTextLength,
  type BlogPostDefinition,
  type BlogSection,
  type BlogTag,
} from './blogTypes';
import { POSTS_A } from './blogPostsA';
import { POSTS_B } from './blogPostsB';

export type { BlogTag, BlogSection };

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  imageUrl: string;
  tag: BlogTag;
  date: string;
  readTime: string;
  keywords: string[];
  takeaways: string[];
  sections: BlogSection[];
};

/** Only articles that reach the minimum length are ever published. */
const POST_DEFINITIONS: BlogPostDefinition[] = [...POSTS_A, ...POSTS_B].filter(
  (post) => getPostTextLength(post) >= MIN_POST_LENGTH,
);

function sectionToText(s: BlogSection): string {
  const parts = [s.heading, ...s.paragraphs];
  if (s.bullets) parts.push(...s.bullets);
  if (s.table) {
    parts.push(s.table.headers.join(' | '));
    parts.push(...s.table.rows.map((r) => r.join(' | ')));
  }
  return parts.join('\n\n');
}

export function getAllBlogPosts(): BlogPost[] {
  return POST_DEFINITIONS.map((post, i) => ({
    id: `blog_${i + 1}`,
    slug: post.slug,
    title: post.title,
    description: post.description,
    content: post.sections.map(sectionToText).join('\n\n'),
    imageUrl: `https://picsum.photos/seed/${i + 101}/1200/630`,
    tag: post.tag,
    date: post.date,
    readTime: post.readTime,
    keywords: post.keywords,
    takeaways: post.takeaways,
    sections: post.sections,
  }));
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  return getAllBlogPosts().find((p) => p.slug === slug) ?? null;
}
