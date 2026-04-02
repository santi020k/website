---
name: marketing
description: Marketing copy, content strategy, and growth for this Astro personal/portfolio website. Use this skill for writing landing page copy, blog post headlines, CTAs, project descriptions, about page content, social media posts, email newsletter content, and any task aimed at attracting visitors, communicating value, or converting readers. Trigger on mentions of copy, landing page, headline, CTA, call to action, newsletter, social media, marketing, brand voice, about page, or converting visitors.
---

# Marketing Skill — santi020k Website

This is a personal/portfolio website for a developer (santi020k). The brand voice is professional but approachable — knowledgeable without being arrogant, and human without being casual. Think "senior developer sharing what they know," not "corporate marketing speak."

---

## Brand Voice Guidelines

- **Tone**: Direct, confident, helpful. Avoid filler phrases like "In today's fast-paced world..." or "Are you tired of...".
- **Person**: Write in first person for personal pages (About, homepage hero). Use second person ("you") when addressing readers in blog posts.
- **Technical depth**: Assume the reader is a developer or technically literate. Don't over-explain basics, but do give context for niche decisions.
- **Length**: Be concise. Cut adverbs. Cut adjectives that don't earn their place. A short punchy sentence beats a long winding one.

---

## Page-Specific Copy Patterns

### Homepage Hero
The hero should answer three questions in under 5 seconds:
1. Who is this person?
2. What do they do?
3. Why should I keep reading?

**Structure:**
```
[Role/Identity] — one line, bold, large
[Value proposition] — 1–2 sentences expanding on the identity
[Primary CTA] — one action, verb-first (e.g., "Read my work", "See projects")
```

**Good example:**
> **Frontend Engineer & Open Source Contributor**
> I build fast, accessible web experiences and share what I learn along the way.
> [Read the blog →]

**Avoid:**
- "Welcome to my website"
- Listing every technology you know upfront
- Weak CTAs like "Click here" or "Learn more"

### About Page
Structure the About page as a narrative, not a resume. Cover:
1. **What you do now** — current role/focus
2. **Why you do it** — motivation, origin story (brief)
3. **What you believe** — opinions on craft, engineering philosophy
4. **What's next** — projects, goals, what excites you
5. **Human details** — hobbies, interests — makes you memorable

Keep it under 400 words. Link to the blog and projects from within the copy.

### Project Descriptions
Each project description should answer: **What does it do, why does it matter, and what was interesting to build?**

**Template:**
```
[One-line summary — what it is]
[The problem it solves or the goal it achieves]
[One interesting technical detail or challenge]
[Link / CTA if applicable]
```

### Blog Post Headlines
Strong headlines are either:
- **Specific** ("How I reduced my Astro build time by 40%")
- **Useful** ("The Tailwind class ordering guide I wish I had")
- **Surprising** ("Alpine.js doesn't need a bundler — and that's the point")

Avoid vague headlines like "Thoughts on React" or "Some useful CSS tricks."

**Headline formula options:**
- How I [achieved result] with [tool/method]
- Why I switched from [X] to [Y]
- [Number] things I learned from [project/experience]
- The [topic] guide for [specific audience]
- [Common belief] is wrong — here's why

---

## CTAs (Calls to Action)

Every page should have at most **one primary CTA**. Make it verb-first and specific.

| Instead of... | Use... |
|---|---|
| Learn more | Read the full post |
| Click here | See the source code |
| Contact me | Send me a message |
| Check it out | Try the live demo |
| Subscribe | Get new posts by email |

### Newsletter / RSS opt-in copy
Since this site has an RSS feed (`@astrojs/rss`), promote it to developer readers who use RSS:

> "I publish irregularly — follow via [RSS](/feed.xml) so you don't miss it."

If adding email capture, keep the ask minimal: just an email field, one sentence of benefit, no popups.

---

## Social Media (Sharing & Promotion)

When writing social copy to promote a new blog post or project, use this format:

**Twitter/X thread opener:**
```
[Hook — surprising claim or question]

[2–3 sentence setup]

🧵 Thread:
```

**LinkedIn post:**
```
[Personal insight or lesson learned — 1-2 sentences]

[The context / story behind it — 2–3 sentences]

[Practical takeaway for other developers]

[Link to the full post]
```

**Post timing**: Tuesday–Thursday mornings (9–11am local) get the most developer audience engagement.

---

## Content Strategy for Blog

**Content pillars** (what to write about):
1. **Tutorials & how-tos** — step-by-step guides using the site's actual tech stack (Astro, Alpine.js, Tailwind)
2. **Case studies** — what was built, why, and what was learned
3. **Opinions & takes** — considered positions on tooling, patterns, or industry topics
4. **Project updates** — what's being built and what's interesting about it

**Publishing cadence**: Consistency beats frequency. One quality post per month is better than four rushed ones.

**SEO + marketing combined**: Each post should target one primary search term. Write the SEO meta description first — it forces clarity about what the post actually delivers. See the `seo` skill for meta tag implementation.

---

## Measuring Success

Given the site uses `@vercel/analytics`, track:
- **Engagement**: Time on page, scroll depth (via custom events if needed)
- **Top entry pages**: Which posts/pages bring in new visitors
- **Referrers**: Where traffic comes from (search, social, direct)

For a personal site, "success" is usually: readers sharing your posts, getting job/consulting inquiries, or growing your network. Optimize copy toward those outcomes.
