---
title: "Hashing Inline Scripts into a CSP on a Static Astro Site"
description: "A post-build step that reads every built page, hashes its inline scripts, and adds a stricter Content-Security-Policy without 'unsafe-inline', with the limits that remain."
publishDate: "2027-02-09T15:00:00.000Z"
draft: true
coverImage:
  alt: "Placeholder cover: a graphite panel with a single violet band, pending final artwork"
  src: "./cover.webp"
tags: ["security", "astro", "cloudflare", "build-tools", "javascript"]
postType: "Deep Dive"
---

For a long time, the Content-Security-Policy on this site had `'unsafe-inline'` in `script-src`. It is the most common weakness in a CSP: the policy lists trusted origins and then allows any inline script anyway.

Removing it from a static site sounds simple. The site has a small number of inline scripts, and they are all mine.

It took a post-build step, an HTML parser, and one compromise I want to be clear about.

## Why not nonces

A nonce is a random value generated per response. The server puts it in the header and on each script tag.

A static site has no per-response server step. Every visitor receives the same HTML file from the CDN, so a nonce would be a constant, and a constant nonce protects nothing.

Hashes fit static output. The policy lists the SHA-256 hash of each allowed inline script, and the browser runs an inline script only when its content matches one.

Astro has a built-in CSP feature. When I did this work it was not compatible with the client-side router this site uses, so I wrote the step myself.

## Read the page the way a browser does

After `astro build`, a script walks every built HTML file and collects the inline scripts.

The first version of an idea like this is usually a regular expression. That breaks on a `<script>` mentioned inside a comment, inside a style block, or in malformed markup. So the script parses each document with `parse5`, which follows the HTML parsing rules, and inspects the resulting tree.

A few details decide whether the hashes match:

- **Newlines.** The browser hashes the script text after the parser normalizes line endings, so the build does the same.
- **Script types.** Classic scripts, modules, import maps, and speculation rules run and need a hash. JSON-LD and other data blocks do not.
- **External scripts.** A script with `src` is covered by the origin list.
- **Templates.** The contents of `<template>` are included, because a script can clone them into the page later.

```js
export const hashScript = source => {
  const digest = createHash('sha256').update(source.replace(/\r\n?/gu, '\n')).digest('base64')

  return `'sha256-${digest}'`
}
```

## Things no hash can allow

Inline event handlers such as `onclick="…"` and `javascript:` URLs cannot be allowed by hash without `'unsafe-hashes'`, which would reopen part of the hole.

So the build fails when it finds one. The check normalizes URLs the way a browser does, because `java&#9;script:` with an encoded tab still runs.

This turned a convention into a rule. "We do not use inline handlers" is easy to say, and now the build enforces it.

## The compromise: two policies

This site also serves four archived versions under `/v1/` to `/v4/`. Those older designs use inline event handlers, and I keep their markup as it was. They need `'unsafe-inline'`. The current site does not.

My first version left the response header alone, with `'unsafe-inline'` for everyone, and added the strict policy to current pages as a meta tag:

```html
<meta http-equiv="Content-Security-Policy"
  content="script-src 'self' 'wasm-unsafe-eval' https://giscus.app 'sha256-…' 'sha256-…'">
```

Browsers enforce every policy they receive, and a script must pass all of them. So on a current page only hashed inline scripts ran, even though the header alone would have allowed more.

It worked, and it had a weak point. The strict part depended on the meta tag being present in the page, and a meta policy cannot carry every directive a header can.

The second version moves the strict policy into the header too. The build takes the script origins from the source header, drops `'unsafe-inline'`, adds the hashes, and writes that `script-src` in two places: the meta tag and the header rule for every path. Each archive then gets a rule of its own that detaches the strict policy and restores the original one:

```text
/v4/*
  ! Content-Security-Policy
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' …
```

Two limits come with that. Cloudflare ignores a `_headers` line longer than 2,000 characters, and every hash adds about fifty. The build fails before the line gets that long, which is a better outcome than a deployment with no policy at all. And the archives still run under the looser policy. That is the price of keeping their markup untouched.

The meta tag stays, because the router uses it, as the next section explains.

## Client-side navigation changes the design

With Astro's client router, a navigation swaps the next page into the document that is already open. The policy from the first page stays in force for the rest of the session.

So every current page carries the same list: the hashes of all inline scripts across the build. A per-page list would block a script the moment you navigated to a page whose scripts the first page did not know about.

That raises a second question. What happens when the next page has a different policy, for example after a new deployment or when the link leads into an archive? The site compares the two before the swap, and when they differ it loads the destination as a full document.

One known side effect remains. After a swap, the router appends an empty `data:` module to wait for inline module scripts. Neither policy allows `data:` scripts, so the console reports one blocked load on some pages. The module is empty and the router treats the error like a load, so nothing breaks. It is noise, and I would rather document it than weaken the policy.

## Strict-Transport-Security, added carefully

The same change added `Strict-Transport-Security` with a one-year `max-age`.

I left out `includeSubDomains` and `preload` at first. Both are commitments for every subdomain, and preload is hard to undo.

They went in later, after I checked that every project host under the domain redirects HTTP to HTTPS. The header only makes the domain eligible for browser preload lists. Submitting it is a separate step, and from then on every new subdomain has to serve HTTPS from its first day.

## What is still open

- `style-src` still allows `'unsafe-inline'`.
- `img-src` allows any HTTPS origin.
- There is no violation reporting, so a blocked script in the wild is invisible to me.

A CSP is rarely finished. What changed is the default: an injected inline script no longer runs on current pages, and a new inline handler cannot reach production without failing the build.

If you maintain a static site, start by counting. List your inline scripts and inline handlers. If the count is small, hashing them at build time is a weekend of work, and most of that time goes into the parser details above.
