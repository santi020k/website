# Cross-site sitemap

The production build creates `https://santi020k.com/sitemap.xml` after Astro
finishes its normal sitemap generation. This is the single sitemap to submit in
Google Search Console.

The generated URL set combines:

- every canonical URL in this site's generated `sitemap-index.xml`;
- every canonical URL exposed by each deployed `*.santi020k.com` project
  sitemap; and
- optional project sites as soon as their production domains and sitemaps
  become reachable.

The child sites keep their own sitemap and `robots.txt` declarations. Those
files are useful for independent diagnostics and other crawlers, while the
cross-site sitemap provides one Google submission point.

## Google Search Console setup

1. Add and DNS-verify the Domain property `santi020k.com`. A Domain property
   covers the root domain, all subdomains, and both HTTP and HTTPS.
2. Open the Sitemaps report for that Domain property.
3. Submit `https://santi020k.com/sitemap.xml`.
4. Review the Page indexing report after Google processes the submission.

Google accepts URLs from multiple sites in one sitemap only when ownership of
all included sites is verified. The Domain property satisfies that requirement
for subdomains of `santi020k.com`. A sitemap helps discovery but does not
guarantee that Google will index every submitted URL.

## Adding another project

Add its production origin and sitemap path to `sitemapSources` in
`scripts/js/generate-cross-site-sitemap.mjs`.

Use `required: false` while the domain is not deployed. The build will report
the unavailable source and continue; after the domain is live, the next build
will include it automatically. Remove `required: false` once the production
site is expected to remain available.

Every child project must still:

- serve canonical, indexable pages over HTTPS;
- publish a valid sitemap containing only URLs from its own origin; and
- reference its own sitemap from its `robots.txt`.

Run `pnpm run build` to regenerate and validate the cross-site sitemap locally.
