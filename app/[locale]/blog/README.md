# Blog (UI + Mock API)

This app’s blog is implemented in the Next.js **App Router** (`app/`) with **mock-backed API endpoints** so the UI can be built now and later switched to a real backend without changing the pages/components.

## Directory & file structure

```
app/
  api/
    blog/
      route.ts               # GET /api/blog (list endpoint)
      [slug]/
        route.ts             # GET /api/blog/:slug (detail endpoint)
  blog/
    layout.tsx               # Shared layout wrapper for /blog and /blog/[slug]
    page.tsx                 # Blog list page (fetches from /api/blog)
    [slug]/
      page.tsx               # Blog detail page (fetches from /api/blog/:slug)
      loading.tsx            # Loading UI for slug route
  components/
    PostList.tsx             # Grid layout for blog cards
    PostCard.tsx             # Card UI linking to /blog/[slug]
    PostHeader.tsx           # Blog detail header (title, tag, date)
    PostBody.tsx             # Simple content rendering (paragraph split)
  lib/
    blogMockData.ts          # Central mock blog data + types used by API
```

## What’s inside each file

### Pages & layouts

- **`app/blog/layout.tsx`**
  - Wraps blog pages with the blog-specific background, adds `BackButton`, and includes `Footer`.
  - Applies to both `/blog` and `/blog/[slug]`.

- **`app/blog/page.tsx`**
  - Server component page that fetches blog posts from `GET /api/blog?limit=12`.
  - Renders the list via `PostList`.
  - Uses request-derived host/protocol (`next/headers`) so it works in dev and behind proxies (Vercel).

- **`app/blog/[slug]/page.tsx`**
  - Server component page that fetches a single post from `GET /api/blog/:slug`.
  - Uses `notFound()` when the API returns 404.
  - `generateMetadata()` also pulls from the same API-backed data so titles/descriptions stay in sync.

- **`app/blog/[slug]/loading.tsx`**
  - Loading UI for the blog detail route while the server component is fetching.

### Components

- **`app/components/PostList.tsx`**
  - Client component rendering a responsive grid of cards using `PostCard`.

- **`app/components/PostCard.tsx`**
  - Client component rendering a clickable card linking to `/blog/[slug]`.
  - Receives `slug`, `title`, `description`, `imageUrl`, `tag` (currently only `title`, `imageUrl`, `tag` are rendered).

- **`app/components/PostHeader.tsx`**
  - Renders the blog post header section (tag pill, title, published date).

- **`app/components/PostBody.tsx`**
  - Renders `content` by splitting paragraphs on `\\n\\n`.
  - Note: for real markdown/MDX later you’ll likely replace this with a markdown renderer.

### Mock data

- **`app/lib/blogMockData.ts`**
  - Defines the shared `BlogPost` type (used by the API).
  - Implements:
    - `getAllBlogPosts()`: deterministic list of 12 posts.
    - `getBlogPostBySlug(slug)`: lookup by slug.

## API endpoints (mock now, backend-ready later)

### 1) List posts

- **Endpoint**: `GET /api/blog`
- **Supported query parameters (future-proof)**:
  - `tag`: filter by tag (case-insensitive)
  - `search`: substring match across title/description/content
  - `page`: 1-based page index
  - `limit`: page size (1..50)
- **Response**:
  - JSON object with:
    - `items`: `BlogPost[]`
    - `page`: number
    - `limit`: number
    - `total`: number

### 2) Get post by slug

- **Endpoint**: `GET /api/blog/:slug`
- **Response**:
  - `200`: `BlogPost`
  - `404`: `{ "error": "Post not found" }`

### BlogPost shape (current mock contract)

```ts
type BlogPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  imageUrl: string;
  tag: 'Technology' | 'AI' | 'Tutorials';
  date: string;
};
```

## Test cases (E2E, Playwright)

### Files

- **`e2e/blog.spec.ts`**
  - Blog list renders and shows at least one `/blog/post-*` link
  - Clicking `/blog/post-1` navigates to detail and shows expected header text
  - Unknown slug returns HTTP 404

### Running tests

1) Install dependencies (first time):

```bash
pnpm install
pnpm exec playwright install
```

2) Run E2E tests:

```bash
pnpm test:e2e
```

Optional:

```bash
pnpm test:e2e:ui
```

## How to connect a real backend later

- Replace mock data access in:
  - `app/api/blog/route.ts`
  - `app/api/blog/[slug]/route.ts`
- Keep the response shape stable (especially the fields used by `PostList` and `[slug]/page.tsx`).
- Once the backend exists, implement real filtering/pagination using the query parameters already accepted by the list endpoint.

