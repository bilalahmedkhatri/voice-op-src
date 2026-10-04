export type BlogTag = 'Technology' | 'AI' | 'Tutorials' | 'Comparisons';

export type BlogSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
};

export type BlogPostDefinition = {
  slug: string;
  title: string;
  description: string;
  tag: BlogTag;
  date: string;
  readTime: string;
  keywords: string[];
  takeaways: string[];
  sections: BlogSection[];
};

/** Plain text length of a post, used to enforce the minimum article length. */
export function getPostTextLength(post: BlogPostDefinition): number {
  let total = 0;
  for (const s of post.sections) {
    total += s.heading.length;
    total += s.paragraphs.join('').length;
    if (s.bullets) total += s.bullets.join('').length;
    if (s.table) {
      total += s.table.headers.join('').length;
      total += s.table.rows.map((r) => r.join('')).join('').length;
    }
  }
  return total;
}

export const MIN_POST_LENGTH = 6000;
