# Article detail rebuild: requirements, analysis aur test plan

Tareekh: 2026-10-15 (Asia/Karachi)
Status: source review aur implementation plan; app implementation abhi shuru nahi hui.

## 1. Agreed scope aur boundaries

- Detail page ko existing resources se rebuild karna hai; generic, reusable UI components ko existing app/components mein rakhein. Blog/components ya blog-specific component directory na banayein.
- New UI component names mein Blog prefix/suffix na ho. Existing PostList/PostCard aur components/ui primitives reuse hon.
- Route file se presentation extract ho; metadata, routing, notFound aur data orchestration server par rahen. Sirf line count kam dikhane ke liye har span ka wrapper na banayein.
- Public marketing navbar/footer aur Coral palette preserve hon. Studio ownership, FastAPI gateway aur voice generation is rebuild ka hissa nahi hain.
- Cleanup se pehle repository-wide references, route conventions, public URLs aur tests recheck hon. Current article slugs/content silently delete ya rename na hon.
- ISO ka specific number user se poocha gaya hai. Jawab pending hai; formal ISO certification/compliance ka claim nahi hoga. Proposed quality baseline: semantic HTML, WCAG 2.2 AA checks, ISO 8601 machine dates aur Google Search guidance. Specific ISO standard milne par scope mapping alag hogi.

## 2. Verified current findings

| Area | Abhi kya hai | Plan ka asar |
|---|---|---|
| Detail route | app/blog/[slug]/page.tsx mein 323 lines; metadata aur tamam presentation saath | Server orchestration ko UI se separate karein |
| Listing | app/blog/page.tsx pehle 12 articles leta hai | URL-based server pagination add karein |
| Shared cards | app/components/PostList.tsx aur PostCard.tsx already hain | Reuse karein; unnecessary use client directives review karein |
| Content source | blogMockData.ts, blogPostsA.ts, blogPostsB.ts aur blogTypes.ts | Ek shared server data access path rakhein; CMS abhi required nahi |
| Existing pagination | components/ui/Pagination.tsx; callback/button-based; Audio Library aur Facebook content use karte hain | Isi component ka backward-compatible URL/link mode banayein |
| Loading | Listing/detail loading.tsx existing WorkspaceLoading reuse karte hain | Accessible public-content label aur appropriate in-layout loading reuse karein |
| Errors | Global app/not-found.tsx hai; blog-specific error/not-found boundary nahi mili | Blog route boundary files generic feedback UI reuse karein |
| Sitemap | app/sitemap.ts aur public/sitemap.xml dono maujood; dynamic sitemap sab lastModified ko current time deta hai | Ek authoritative sitemap route; actual significant update dates |
| Robots | public/robots.txt; /api/ blocked, /blog allowed | Canonical sitemap declaration aur route rules review karein; private access auth se enforce hota rahe |
| LLM context | public/llms.txt aur llms-full.txt; full file mein /blog/post-1 se post-12 stale links | Published canonical URLs aur accurate content summaries update hon |
| Documentation | app/blog/README.md missing PostHeader/PostBody aur API self-fetch describe karti hai | Final structure/data flow ke mutabiq rewrite |
| E2E | e2e/blog.spec.ts old Our Blog heading aur /blog/post-1 assert karta hai | Real published slugs aur reusable selectors se update |
| Dates/covers | Human-readable date strings; cover seed aur ID article index se bante hain | Stable article identifiers, covers aur explicit published/modified fields |
| Related articles | Current slug hata kar pehle 3 results | Same category ko priority; unique fallback results |

Yeh source-level findings hain. Is analysis turn mein hosted rendering, indexing ya performance scores measure nahi hue.

## 3. Minimal reusable component design

Existing app/components ko base directory rakhein; components/ui mein existing UI primitives hi extend karein.

| Generic component | Zimmedari | Reuse / extraction |
|---|---|---|
| ArticleHeader.tsx | Title, description, author, readable dates, tag, reading time aur featured image | Existing detail markup extract; next/image retain |
| ContentOverview.tsx | Summary/takeaways aur contents navigation | Existing sections data se derive; no independent duplicated section list |
| ArticleBody.tsx | Headings, paragraphs, lists, comparison tables aur topics | Existing structured sections renderer; props typed hon |
| CallToAction.tsx | Reusable heading, description aur destination/action | Existing Button/Link styling reuse; content props se aaye |
| RelatedContent.tsx | Related cards ka grid | PostCard reuse; compact variant sirf actual design need par |
| FeedbackState.tsx | Not-found/error/empty message aur relevant actions | Existing Button/Card patterns; duplicate full-page templates avoid |

Existing PostList aur PostCard ko initially move/rename na karein. Existing SectionHeader uppercase small h3 ke liye hai, article h1 ka direct replacement nahi. Existing Card useful jagah reuse ho, lekin nested bordered cards na banayein. Naya skeleton sirf tab jab LoadingSkeleton/WorkspaceLoading ko chhoti prop extension se reuse karna practical na ho.

Detail page mein data lookup, notFound, metadata/JSON-LD aur component composition rahegi. Exact line-count target implementation se pehle artificial limit nahi hoga; route materially chhota aur total duplicated markup kam hona acceptance hai.

## 4. Server/client data flow

Published data -> shared server data functions -> listing/detail/metadata/sitemap/API handlers.

- Server Components directly shared data helper call karein; apni hi /api/blog URL ko server se HTTP round-trip karna zaroori nahi.
- API endpoints render nahi hote: server par execute hokar JSON return karte hain. Pages server par data read karke article HTML render karte hain. Browser ko data/props chahiye hon to sirf public serializable fields bhejein.
- Blog listing, detail, cards, body, contents aur JSON-LD server-rendered rahen. Page/article content useEffect se browser mein fetch na ho.
- Public API routes retained rahen jab tak consumers ka reference/contract audit complete na ho. Pages ka direct helper use karna API ko unused prove nahi karta; external clients ho sakte hain.
- error.tsx Next.js ke mutabiq Client Component hoga, kyunke reset/retry interaction chahiye. Yeh public error text/digest use kare; stack, credentials aur internal details browser ko na bheje.
- Existing content ke liye static generation suitable hai. Listing searchParams server par parse hon; required dynamic page rendering ya caching/revalidation data source ke mutabiq choose ho.
- Future provider/database adapter server-only ho; us waqt shared helper ke peeche replace karein. Unrelated existing public client imports ko audit kiye baghair server-only marker na lagayein.

## 5. Pagination reuse aur crawlability

Existing Pagination mein link-mode add karein: baseHref jaisa serializable prop ya prepared page hrefs; onPageChange mode existing workspace clients ke liye preserve rahe.

- Public pagination anchors/Next Link ke rendered href use kare: /blog, /blog?page=2, /blog?page=3.
- Client boundary ko server callback/function prop pass na ho. Agar use client remove ho, dono import graphs aur event-handler branches verify karein; server link-mode mein onClick callbacks render na hon.
- Current page par aria-current=page; prev/next links ka clear accessible label; unavailable navigation inert ho.
- Har actual paginated page ka apna canonical ho; sab pages ko page 1 par canonical na karein.
- page=1 ko /blog par normalize karein. Repeated, decimal, nonnumeric, negative aur beyond-last values ka explicit validation policy test karein; malformed/out-of-range ko meaningful not-found dein, infinite empty URLs na banayein.
- Artificial fixture se multiple pages test karein; current published count kam hone ko pagination test skip karne ka reason na banayein.
- Agar search/sort filters add hon to unke indexing rules alag decide hon. noindex ko read karwane ke liye crawler access block na karein.

## 6. Metadata aur indexability

Har article ke server output mein unique, truthful metadata:

- Title, description, absolute canonical; root title template ke saath duplicate brand suffix na bane.
- Article-specific Open Graph aur Twitter metadata; stable image URL/alt/dimensions, site name, correct locale, real published/updated timestamps aur author.
- BlogPosting JSON-LD with headline, description, representative image, author, publisher identity, mainEntityOfPage, datePublished aur actual dateModified. Visible breadcrumbs hon to matching BreadcrumbList; nonexistent UI/data ka schema invent na ho.
- ISO 8601 dates stored explicitly; visible time element mein dateTime attribute aur human-readable label. Data missing ho to fake modification date na banayein.
- Safe JSON-LD serialization, including escaping less-than characters; schema visible article content se match kare.
- One article h1, meaningful h2/h3 sequence, unique deterministic contents anchors, descriptive links, representative alt text, responsive table overflow aur accessible keyboard focus.
- Existing 6000-character publishing filter ko SEO requirement na kahein. Yeh internal editorial rule hai; hidden/filtered articles ki policy audit aur document ho.
- Stable cover per article; article order badalne se cover/ID na badle. Critical cover ke image sizing/loading decisions verify hon.
- Article textual content, links aur metadata initial server response mein available hon; JavaScript-disabled check se verify karein.
- Missing content notFound() use kare. Streaming ke saath Next.js not-found response 200 bhi ho sakta hai; custom not-found file ko guaranteed HTTP 404 assume na karein. Production-mode test mein status aur noindex inspect hon; non-streamed path par 404 enforce/verify ho. Error/loading placeholder ko successful indexable article na banayein.

Search-engine eligibility improve ki ja sakti hai; Google ya doosre engine ka indexing/ranking decision guarantee nahi kiya ja sakta.

## 7. Sitemap, robots aur LLM files

- app/sitemap.ts ko existing canonical post source se maintain karein. public/sitemap.xml remove karne se pehle references aur served production route verify hon.
- Sitemap mein sirf intended indexable canonical public URLs; unknown slugs, errors, API aur private workspace routes na hon.
- lastModified actual significant update date ho; har request/build ki clock article update nahi hai. Page 1 listing ka update latest actual article update se derive ho sakta hai.
- public/robots.txt ko single authoritative robots file rakhein jab tak dynamic robots ki real need na ho. /blog aur required rendering assets accessible rahen; sitemap URL correct ho. Robots authentication ya private-resource protection ka replacement nahi.
- llms.txt aur llms-full.txt mein current article links/summaries; no secrets, user data, stale post-N links ya unsupported product claims. New generator sirf tab jab existing build process se sustainable sync mumkin na ho; unnecessary generation file na banayein.
- llms.txt supporting discovery document hai, sitemap/robots ka replacement nahi; Google AI features ke liye special AI text file required nahi.

## 8. Not-found, error aur loading boundaries

- app/blog/not-found.tsx: generic FeedbackState with article unavailable message aur useful canonical navigation.
- app/blog/error.tsx: minimal client boundary with reset action; failure ko empty successful article mein convert na karein. Apne segment layout errors boundary khud catch nahi karti; parent coverage verify ho.
- Existing app/blog/loading.tsx aur app/blog/[slug]/loading.tsx update/reuse, duplicated new loaders na banayein. Loading label public content ke liye munasib ho; reduced motion aur stable layout respect ho.
- Repeated parent/child boundary UI na likhein; ek boundary jahan coverage enough ho. Fault injection se actual scope prove ho.

## 9. Cleanup rules

- rg references + imports + route conventions + tests + public URL consumers check; deletion se pehle reason record.
- Old unused imports/types/helpers remove hon; unsupported/unused article metadata ko rename/delete karne se pehle API contract inspect ho.
- PostList/PostCard ki unnecessary client directives remove karte waqt browser/server behavior aur Next/Image/Link behavior prove hon.
- PostHeader/PostBody abhi files nahi, sirf outdated README references hain: nonexistent code ko deleted claim na karein.
- Existing blog/API routes retain karein jab tak removal approved scope/consumer evidence se justified na ho.
- App/blog/README.md, root README aur agents.md mein final architecture/call contracts update hon. Checklist file result log ban sakti hai; redundant extra documentation files na banayein.

## 10. Test matrix aur acceptance gates

| Layer | Cases | Expected evidence |
|---|---|---|
| Data | Unique slug/IDs, valid ISO dates, stable covers, related exclusion/ranking, headings collision | Focused assertions, no production writes |
| Pagination | 0,1,many posts; first/middle/last; malformed/out-of-range page; duplicate query | Correct server items, working hrefs/canonicals; no endless empty pages |
| Existing pagination clients | Audio Library and Facebook content prev/next, callbacks, selection stability | Backward compatibility after shared component change |
| Server output | Listing + each canonical detail with JS disabled; no browser content API dependency | Article body/links initial HTML mein readable |
| Metadata | All published articles, pagination, unknown slug, og/twitter fields | Unique canonical, correct title template, schema content/date consistency |
| Failure paths | Unknown slug, invalid data fixture, server failure + reset, deliberately slow fixture | Correct not-found/noindex/status behavior; helpful error/loading UI |
| API | Existing list/detail contract; invalid slug, search/tag/page limits | Expected 200/404/errors; no leaked server fields |
| Discovery | Sitemap parse + uniqueness + dates + canonical URLs; robots; both LLM files | No stale post-N links or duplicate sitemap ownership |
| Responsive | 320,390,768,1280px; long heading, wide table, TOC links, images, related cards | No page overflow; table scroll contained; consistent spacing |
| Accessibility | Keyboard-only, visible focus, landmark/headings, aria-current, image alt, reduced motion, contrast | Automated checks plus explicit manual keyboard review; no unsupported conformance claim |
| Technical | TypeScript, targeted ESLint, production build, diff check | Actual command outputs; baseline unrelated errors separated |
| Public browser regression | Listing -> article -> related; pagination back/forward/reload; empty/error/loading | Current e2e/blog.spec.ts assertions repaired; zero page errors |
| Hosted follow-up | Rich Results validation, canonical/noindex response, sitemap availability, Search Console inspection | Deployment/manual account evidence separately; local success hosted indexing nahi |

Performance ko before/after same route/device conditions par compare karein: layout shift, cover size/loading, transferred blog JS aur interaction. Source refactor ko measured performance improvement claim na karein. New tests implementation ko mirror karne ke bajaye user-visible behavior aur contracts verify karein.

No real TTS generation, payments ya production-data mutations tests mein required nahi.

## 11. Proposed implementation order

1. Current routes/content/contracts aur screenshots ka baseline; ISO answer record.
2. Existing article UI generic components mein extract; article content aur slugs preserve.
3. Server/client boundaries aur shared-pagination link mode; existing consumers regression.
4. Metadata/date/cover helpers + failure/loading boundaries; stale tests/docs fix.
5. Sitemap dedupe, robots aur LLM files sync.
6. Focused tests, production browser/HTML/accessibility checks; results aur remaining hosted steps report.

Done tab hoga jab page thin composition ho, generic existing-directory components reused hon, content server-rendered ho, pagination crawlable ho, failures correct hon, discovery files consistent hon aur verification evidence available ho. Abhi implementation pending hai; is document ko completed implementation na samjha jaye.

## 12. Primary reference links

- Google Article guidance: https://developers.google.com/search/docs/appearance/structured-data/article
- Google crawlable pagination/canonicals: https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading
- Google sitemap dates: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Google AI eligibility and no special AI file requirement: https://developers.google.com/search/docs/appearance/ai-features
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Next.js error boundary: https://nextjs.org/docs/app/api-reference/file-conventions/error
- Next.js streamed/non-streamed not-found behavior: https://nextjs.org/docs/app/api-reference/file-conventions/not-found
