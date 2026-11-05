---
title: "X Games"
description: "Built and scaled the official X Games digital platform — a high-traffic sports media site serving millions of fans — with real-time live streaming, geo-based access control, and a programmatic ad infrastructure powered by Google Ad Manager."
brand:
  primary: "#cd2b29"
  secondary: "#f8fafc"
  surface: "#241010"
role: "Senior Full Stack Engineer"
startingDate: "1 Jan 2025"
endingDate: "1 Jul 2025"
liveDemoUrl: "https://web.archive.org/web/20250827083904/https://www.xgames.com/"
typesId: "professional"
relevanceWeight: 94
impactMetrics: [
  "56+ pull requests merged across two codebases",
  "Real-time geo-based live stream access across global audiences",
  "Full Google Ad Manager programmatic infrastructure shipped from scratch"
  ]
technologies: [
  "Next.js", "React.js", "JavaScript", "SCSS", "Sanity CMS", "Sanity Studio", "Portable Text", "Firebase", "Google Ad Manager", "Google Tag Manager", "Embla Carousel", "Radix UI", "Vercel", "Node.js", "Jest", "Storybook", "ESLint", "Stylelint", "Git", "GitHub", "Scrum", "REST APIs", "Geo-location APIs"
  ]
coverImage:
  src: "./cover.webp"
  background: "./cover-background.webp"
  horizontal: "./cover-horizontal.webp"
  vertical: "./cover-vertical.webp"
  logo: "./logo.webp"
  logoAspect: "tall"
  logoSurface: "light"
  alt: "X Games vertical logo on a branded red, charcoal, and ivory geometric cover"
  ogImage: "./cover.webp"
---

## Building the official X Games digital platform

X Games is one of the most recognized extreme sports brands in the world — home to snowboarding, skateboarding, BMX, and FMX competitions broadcast globally on ESPN. I joined the team to help maintain and evolve the official digital platform during a period of active event seasons, tackling systems work that sits behind audiences of millions.

### Core challenge

The site had to work reliably under real broadcast pressure — time-sensitive live events, global audiences with geo-based access restrictions, and a growing advertising infrastructure that needed to integrate cleanly with Next.js without breaking the rendering pipeline. Timing issues, route changes, and ad slot conflicts had to be handled precisely so fans saw the right content at the right time.

### What I built and shipped

- **A full Google Ad Manager integration from scratch**, including a custom `useAdSlot` hook that solved one of the trickier frontend problems on the project: reliably loading `googletag` inside React's lifecycle. The hook uses retry logic with promise-based polling, handles route changes via Next.js router events, and cleans up ad slots on unmount to prevent memory leaks and iframe conflicts.
- **Geo-based live stream access control**, working across the `HappeningNow` and video player sections to redirect geoblocked users to appropriate external streams, controlled entirely through Sanity CMS flags without requiring code changes per region.
- **Responsive Ad Manager banner modules**, refactoring the initial implementation into a standalone component with size mapping support, responsive height handling, and clean separation between the Sanity schema definition and the runtime ad slot lifecycle.
- **Footer newsletter form variants** with blue and red themed instances, managed through structured Sanity content and rendered without layout regressions across device widths.
- **Code block script injection support**, allowing editors to embed third-party scripts through portable text content without touching the codebase.
- **Live event UX polish**, including animated "LIVE" badges, cursor interaction improvements on the video placeholder, and hover scaling on call-to-action buttons with fine-tuned timing.
- **Sanity Studio schema extensions** for geo-blocking fields, Ad Manager configuration, and global header ad settings — keeping content and runtime behavior in sync without hardcoding values.

### Key outcomes

- **56+ PRs merged** across the Next.js frontend and Sanity CMS backend over the engagement period.
- **A programmatic ad infrastructure** that could register, display, resize, and clean up Google Ad Manager slots across page navigations — a non-trivial integration in a React/Next.js context.
- **Geo-based content routing** that handled live stream access for international audiences through CMS-driven configuration, not conditional deployments.
- **Clean CMS-to-frontend parity** for ad configuration, live stream flags, and sponsor modules — editors could manage runtime behavior without developer intervention.

### Tech stack

- **Frontend:** `Next.js 13`, `React.js`, `JavaScript`, `SCSS`, `Embla Carousel`, `Radix UI`
- **CMS and content:** `Sanity v3`, `Sanity Studio`, `Portable Text`, `sanity-plugin-vercel-deploy`
- **Advertising and analytics:** `Google Ad Manager`, `Google Tag Manager`, `Firebase`
- **Infrastructure and quality:** `Vercel`, `Node.js`, `Jest`, `Storybook`, `ESLint`, `Stylelint`

### Platform snapshot

The cover image above shows the version of the platform I worked on — archived from August 27, 2025, before the later WordPress redesign. The live link points to that preserved capture.

### Why it mattered

X Games runs on tight broadcast windows. There is no "we'll fix it after the event." Working on a platform at that scale — where a broken ad slot or a geo-routing failure affects thousands of concurrent users — sharpened how I think about reliability, cleanup logic, and the operational difference between a feature that works in dev and one that holds under real broadcast traffic.
