// Read-only HTTP smoke against a running local app. No synthesis/publishing/payment calls.
const assert = require('node:assert/strict');
require('tsx/cjs');
const {getAllBlogPosts} = require('../app/lib/blogMockData.ts');
const base = process.env.I18N_TEST_BASE_URL || 'http://localhost:3000';
const paths = ['', '/about-us', '/pricing', '/faq', '/contact-us', '/privacy-policy', '/terms-of-service', '/blog',
  ...getAllBlogPosts().map(post => `/blog/${post.slug}`), '/admin', '/audio-library', '/billing', '/templates', '/json-generator', '/settings',
  '/youtube/templates', '/youtube/content', '/youtube/content/detail', '/facebook/templates', '/facebook/content',
  '/facebook/content/detail', '/facebook/integration', '/content', '/content/detail'];
const locales = ['en', 'ru', 'pt', 'fr', 'es', 'nl'];
async function request(path) {
  const response = await fetch(base + path, {redirect: 'manual', signal: AbortSignal.timeout(60000)});
  return {response, html: await response.text()};
}
async function run() {
  for (const locale of locales) {
    for(const path of paths) {
      const {response, html} = await request('/' + locale + path);
      assert.equal(response.status, 200, locale + path);
      assert.ok(html.includes(`lang="${locale==='pt'?'pt-PT':locale}"`), locale + path + ': HTML language');
      if(path.startsWith('/admin')||path.startsWith('/billing'))assert.match(html,/noindex/,locale+path+': private indexing');
      if(path==='/about-us') {
        assert.ok(html.includes(`https://www.genzee.video/${locale}/about-us`),locale+path+': canonical');
        for(const language of locales) assert.ok(html.includes(`hrefLang="${language==='pt'?'pt-PT':language}"`), locale+': language alternate '+language);
      }
    }
    console.log(`${locale}: ${paths.length} page routes passed`);
  }
  const {response} = await request('/audio-library?filter=recent');
  assert.equal(response.status,307);
  assert.ok(response.headers.get('location').endsWith('/en/audio-library?filter=recent'));
  const missing = await request('/fr/this-page-does-not-exist');
  assert.equal(missing.response.status,404);
  const {response: sitemapResponse, html: sitemap} = await request('/sitemap.xml');
  assert.equal(sitemapResponse.status,200);
  for(const locale of locales) for(const path of ['/about-us', ...getAllBlogPosts().map(post=>`/blog/${post.slug}`)]) assert.ok(sitemap.includes(`https://www.genzee.video/${locale}${path}`), locale+path+': sitemap');
  assert.ok(!sitemap.includes('/admin'), 'Private workspace pages stay out of sitemap');
  console.log('Legacy URL/query redirect and localized 404 passed.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
