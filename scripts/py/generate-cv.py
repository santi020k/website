#!/usr/bin/env python3
"""
Generate Santiago Molina Orozco's CV as a PDF.

Usage (from project root):
    python3 scripts/py/generate-cv.py

Output:
    public/pdf/cv.pdf

Requirements:
    pip install reportlab

Font setup:
    Uses Montserrat (same typeface as the website) in three weights:
      - Regular  (400) → public/fonts/Montserrat-Regular.ttf  (shipped with site)
      - Bold     (700) → public/fonts/Montserrat-Bold.ttf     (generated)
      - ExtraBold(800) → public/fonts/Montserrat-ExtraBold.ttf (generated)
    Run scripts/py/generate-fonts.py once to create the generated files.

ATS (Applicant Tracking System) notes:
    • Single-column content — no multi-column text blocks that scramble reading order.
    • All text is selectable (not rasterised images).
    • Standard section names — Experience, Projects, Skills & Interests.
    • PDF metadata (title, author, keywords) set for ATS metadata parsing.
    • No images, watermarks, headers, or footers that confuse parsers.
    • Simple bullet points using Unicode • character.
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.fonts import addMapping
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# ── Paths ─────────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
FONTS_DIR    = PROJECT_ROOT / "public" / "fonts"
OUTPUT_PATH  = PROJECT_ROOT / "public" / "pdf" / "cv.pdf"

# ── Register Montserrat weights ───────────────────────────────────────────────
pdfmetrics.registerFont(TTFont("Montserrat",          str(FONTS_DIR / "Montserrat-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Montserrat-Bold",     str(FONTS_DIR / "Montserrat-Bold.ttf")))
pdfmetrics.registerFont(TTFont("Montserrat-ExtraBold",str(FONTS_DIR / "Montserrat-ExtraBold.ttf")))
pdfmetrics.registerFont(TTFont("Montserrat-Italic",   str(FONTS_DIR / "montserrat-italic-variable-font-wght.ttf")))

# Wire up <b> / <i> XML tags inside Paragraph markup
addMapping("Montserrat", 0, 0, "Montserrat")
addMapping("Montserrat", 1, 0, "Montserrat-Bold")
addMapping("Montserrat", 0, 1, "Montserrat-Italic")
addMapping("Montserrat", 1, 1, "Montserrat-Bold")

# ── Page geometry ─────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
MARGIN    = 18 * mm
CONTENT_W = PAGE_W - 2 * MARGIN

# ── Palette ───────────────────────────────────────────────────────────────────
INK       = colors.HexColor("#111111")   # headings, company names, role names
INK_MID   = colors.HexColor("#3a3a3a")   # body text, bullets
INK_MUTED = colors.HexColor("#777777")   # location, dates, secondary info
RULE      = colors.HexColor("#222222")

# ── Inline-bold helper ────────────────────────────────────────────────────────
# Using explicit <font> tag is more reliable than <b> with custom TTF fonts,
# because it bypasses the addMapping lookup entirely.
def B(text: str, color: str = "#111111") -> str:
    """Wrap text in an explicit bold font tag for Paragraph XML."""
    return f'<font name="Montserrat-Bold" color="{color}">{text}</font>'


def EB(text: str, color: str = "#111111") -> str:
    """Wrap text in ExtraBold font tag."""
    return f'<font name="Montserrat-ExtraBold" color="{color}">{text}</font>'


# ── Font sizes ────────────────────────────────────────────────────────────────
SZ = dict(name=22, subtitle=11, contact=8.5, section=11, company=9.5, body=8.8)


# ── Style factory ─────────────────────────────────────────────────────────────
def _s(name: str, **kw) -> ParagraphStyle:
    return ParagraphStyle(name, **kw)


def build_styles() -> dict[str, ParagraphStyle]:
    return {
        # ── Header ────────────────────────────────────────────────────────────
        "name": _s("name",
            fontName="Montserrat-ExtraBold", fontSize=SZ["name"],
            leading=SZ["name"] * 1.15, alignment=TA_CENTER,
            textColor=INK, spaceAfter=3,
        ),
        "subtitle": _s("subtitle",
            fontName="Montserrat", fontSize=SZ["subtitle"],
            leading=SZ["subtitle"] * 1.3, alignment=TA_CENTER,
            textColor=INK_MID, spaceAfter=5,
        ),
        "contact": _s("contact",
            fontName="Montserrat", fontSize=SZ["contact"],
            leading=SZ["contact"] * 1.5, alignment=TA_CENTER,
            textColor=INK_MID, spaceAfter=1,
        ),
        # ── Section ───────────────────────────────────────────────────────────
        "section": _s("section",
            fontName="Montserrat-ExtraBold", fontSize=SZ["section"],
            leading=SZ["section"] * 1.3, alignment=TA_LEFT,
            textColor=INK, spaceBefore=8, spaceAfter=3,
        ),
        # ── Experience row: company / location ────────────────────────────────
        "co_name": _s("co_name",
            fontName="Montserrat-ExtraBold", fontSize=SZ["company"],
            leading=SZ["company"] * 1.35, alignment=TA_LEFT, textColor=INK,
        ),
        "co_loc": _s("co_loc",
            fontName="Montserrat", fontSize=SZ["company"],
            leading=SZ["company"] * 1.35, alignment=TA_RIGHT, textColor=INK_MUTED,
        ),
        # ── Experience row: role / dates ──────────────────────────────────────
        "role": _s("role",
            fontName="Montserrat-Bold", fontSize=SZ["body"],
            leading=SZ["body"] * 1.35, alignment=TA_LEFT, textColor=INK,
        ),
        "dates": _s("dates",
            fontName="Montserrat", fontSize=SZ["body"],
            leading=SZ["body"] * 1.35, alignment=TA_RIGHT, textColor=INK_MUTED,
        ),
        # ── Bullets ───────────────────────────────────────────────────────────
        "bullet": _s("bullet",
            fontName="Montserrat", fontSize=SZ["body"],
            leading=SZ["body"] * 1.45, alignment=TA_LEFT,
            leftIndent=10, firstLineIndent=-10,
            textColor=INK_MID, spaceAfter=2,
        ),
        # Tech-stack line — rendered in Bold directly, no XML tag needed
        "bullet_stack": _s("bullet_stack",
            fontName="Montserrat-Bold", fontSize=SZ["body"] - 0.2,
            leading=SZ["body"] * 1.45, alignment=TA_LEFT,
            leftIndent=10, firstLineIndent=-10,
            textColor=INK, spaceAfter=2,
        ),
        # ── Body (summary paragraphs) ─────────────────────────────────────────
        "body": _s("body",
            fontName="Montserrat", fontSize=SZ["body"],
            leading=SZ["body"] * 1.55, alignment=TA_LEFT,
            textColor=INK_MID, spaceAfter=5,
        ),
    }


# ── Layout helpers ────────────────────────────────────────────────────────────
_TS = TableStyle([
    ("VALIGN",        (0, 0), (-1, -1), "BOTTOM"),
    ("LEFTPADDING",   (0, 0), (-1, -1), 0),
    ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
    ("TOPPADDING",    (0, 0), (-1, -1), 0),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
])


def two_col(left: Paragraph, right: Paragraph, split: float = 0.68) -> Table:
    """Full-width 2-cell table — ATS reading order: left cell → right cell."""
    t = Table([[left, right]], colWidths=[CONTENT_W * split, CONTENT_W * (1 - split)])
    t.setStyle(_TS)
    return t


def rule() -> HRFlowable:
    return HRFlowable(width="100%", thickness=0.7, color=RULE, spaceAfter=5)


def stack_bullet(s: dict, tech: str) -> Paragraph:
    """Render a Tech Stack line using the bullet_stack style (no XML markup needed)."""
    return Paragraph(f"\u2022\u2002Tech Stack: {tech}", s["bullet_stack"])


def experience(
    s: dict,
    company: str,
    location: str,
    role: str,
    dates: str,
    bullets: list[str],
    tech: str | None = None,
) -> list:
    """Return flowables for one experience / project entry."""
    items: list = [
        two_col(Paragraph(company, s["co_name"]), Paragraph(location, s["co_loc"])),
        two_col(Paragraph(role, s["role"]),       Paragraph(dates, s["dates"])),
    ]
    for b in bullets:
        items.append(Paragraph(f"\u2022\u2002{b}", s["bullet"]))
    if tech:
        items.append(stack_bullet(s, tech))
    return items


# ── CV content ────────────────────────────────────────────────────────────────
def build() -> None:
    doc = SimpleDocTemplate(
        str(OUTPUT_PATH),
        pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN,  bottomMargin=MARGIN,
        # PDF metadata — parsed by ATS systems and search engines
        title    = "Santiago Molina Orozco — CV",
        author   = "Santiago Molina Orozco",
        subject  = "Tech Lead | Senior Front End Developer | React | TypeScript | Node.js",
        keywords = (
            "React, TypeScript, Node.js, Tech Lead, Full Stack Developer, "
            "Frontend, Next.js, React Native, NestJS, AWS, CI/CD, Agile, Scrum, "
            "JavaScript, Tailwind CSS, GraphQL, MongoDB, PostgreSQL, Vercel"
        ),
        creator  = "scripts/py/generate-cv.py",
    )

    s = build_styles()
    story: list = []

    # ── Header ────────────────────────────────────────────────────────────────
    story += [
        Paragraph("Santiago Molina Orozco", s["name"]),
        Paragraph("Tech Lead | Full Stack Developer", s["subtitle"]),
        Paragraph(
            "Medellin, Colombia\u2002|\u2002hi@santi020k.com\u2002|\u2002+57 350 799 01 36",
            s["contact"],
        ),
        Paragraph(
            "santi020k.com\u2002|\u2002linkedin.com/in/santi020k\u2002|\u2002github.com/santi020k",
            s["contact"],
        ),
        Spacer(1, 6),
    ]

    # ── Summary ───────────────────────────────────────────────────────────────
    story += [
        Paragraph("Summary", s["section"]),
        rule(),
        Paragraph(
            f"I\u2019m a Full Stack Developer and Tech Lead with over a decade of experience, "
            f"specializing in {B('React, React Native, TypeScript and Node.js')}, with a strong "
            f"focus on front-end architecture and user experience. Currently working as a "
            f"{B('Senior Front End Developer at Smith Commerce')}, I\u2019ve led high-impact, scalable "
            f"projects for companies like {B('Void.GG')}, aligning technical solutions with "
            f"business goals.",
            s["body"],
        ),
        Paragraph(
            f"As a {B('co-organizer of React JS Colombia Meetup')}, I actively contribute to the "
            f"tech community by fostering innovation, mentorship, and continuous learning. I\u2019m "
            f"passionate about building products that not only perform but also empower teams to "
            f"deliver with clarity and purpose.",
            s["body"],
        ),
    ]

    # ── Experience ────────────────────────────────────────────────────────────
    story += [Paragraph("Experience", s["section"]), rule()]

    # Smith Commerce ──────────────────────────────────────────────────────────
    story.append(KeepTogether(experience(s,
        "Smith Commerce", "USA (Remote)",
        "Senior Front End Developer", "May 2025 \u2013 Present",
        [
            "Drove the frontend rebuild of Marcone\u2019s headless storefront, improving Lighthouse "
            "score from 35 to 98 and reducing Time to Interactive by 75%",
            "Architected scalable frontend foundations using Next.js 15, React 19, TypeScript, "
            "and Turborepo in a monorepo setup, enabling parallel front-end and back-end delivery "
            "against OpenAPI contracts",
            "Delivered a 100% accessibility score on the rebuilt storefront through systematic "
            "WCAG implementation and component-level auditing",
            "Strengthened developer experience through linting automation, Storybook component "
            "library, and team coding standards, reducing review friction and accelerating delivery",
        ],
        tech=(
            "Next.js \u00b7 React \u00b7 TypeScript \u00b7 Turborepo \u00b7 Tailwind CSS \u00b7 "
            "Radix UI \u00b7 TanStack Query \u00b7 Zustand \u00b7 Apollo Client \u00b7 "
            "Storybook \u00b7 Jest \u00b7 Playwright \u00b7 CI/CD \u00b7 AWS"
        ),
    ) + [Spacer(1, 5)]))

    # X Games ─────────────────────────────────────────────────────────────────
    story.append(KeepTogether(experience(s,
        "X Games", "USA (Remote)",
        "Senior Full Stack Engineer", "Jan 2025 \u2013 Jul 2025",
        [
            "Built a full Google Ad Manager integration from scratch \u2014 a custom React hook "
            "with retry logic, route-change cleanup, and slot teardown that held under live "
            "broadcast traffic for millions of concurrent fans",
            "Implemented geo-based live stream access control via Sanity CMS flags, routing "
            "international audiences to correct streams without per-region code deployments",
            "Shipped responsive Ad Manager banner components, newsletter form variants, Sanity "
            "Studio schema extensions, and animated live event UX across two codebases",
            "Merged 56+ PRs across the Next.js frontend and Sanity CMS backend during active "
            "X Games broadcast event seasons",
        ],
        tech=(
            "Next.js \u00b7 React \u00b7 JavaScript \u00b7 SCSS \u00b7 Sanity CMS \u00b7 "
            "Firebase \u00b7 Google Ad Manager \u00b7 Google Tag Manager \u00b7 Vercel \u00b7 Jest"
        ),
    ) + [Spacer(1, 5)]))

    # Void.GG ─────────────────────────────────────────────────────────────────
    story.append(KeepTogether(experience(s,
        "Void.GG", "USA (Remote)",
        "Technical Lead", "Feb 2023 \u2013 May 2025",
        [
            "Directed the development of a scalable, high-performance esports platform, resulting "
            "in a 35% improvement in system response times",
            "Managed a cross-functional team of 14+ engineers and designers, delivering multiple "
            "product releases on time while maintaining over 95% sprint velocity across quarters",
            "Implemented CI/CD pipelines and modern DevOps practices, reducing deployment times "
            "by 60% and minimizing post-release incidents",
            "Established engineering standards and modular architecture, enabling a 40% reduction "
            "in tech debt and accelerating feature development cycles",
        ],
        tech=(
            "React \u00b7 React Native \u00b7 Node.js \u00b7 TypeScript \u00b7 GitHub Actions \u00b7 "
            "RTQ \u00b7 AWS \u00b7 Next.js \u00b7 NestJS \u00b7 Mantine"
        ),
    ) + [Spacer(1, 5)]))

    # Optic Power ─────────────────────────────────────────────────────────────
    story.append(KeepTogether(experience(s,
        "Optic Power", "USA (Remote)",
        "Senior Full Stack Engineer", "Jul 2021 \u2013 Feb 2023",
        [
            "Built and maintained robust web applications using React, Node.js, and TypeScript "
            "across multiple client projects",
            "Partnered with product managers and designers to deliver intuitive, user-friendly "
            "experiences, resulting in higher user satisfaction scores and reduced bounce rates",
            "Improved API performance by 40% by refactoring endpoints and optimizing queries, "
            "while enhancing front-end load times with lazy loading and efficient state management",
        ],
        tech=(
            "React \u00b7 Node.js \u00b7 TypeScript \u00b7 AWS \u00b7 GCP \u00b7 MongoDB \u00b7 "
            "Socket.io \u00b7 Docker \u00b7 Angular \u00b7 Express"
        ),
    ) + [Spacer(1, 5)]))

    # PADS ────────────────────────────────────────────────────────────────────
    story.append(KeepTogether(experience(s,
        "PADS", "COL (Remote)",
        "Technical Lead", "Jan 2020 \u2013 Jul 2021",
        [
            "Drove the technical vision and architecture of a modern real estate platform, "
            "delivering scalable property management tools that supported a 50% growth in "
            "monthly active users over 12 months",
            "Managed a cross-functional team of engineers and designers, launching key features "
            "such as advanced property search",
            "Implemented internationalization (i18n) and secure OAuth-based authentication to "
            "support multilingual users and improve platform security",
        ],
        tech=(
            "React \u00b7 React Native \u00b7 TypeScript \u00b7 Redux Sagas \u00b7 Next.js \u00b7 "
            "Styled Components \u00b7 I18N \u00b7 OAuth"
        ),
    ) + [Spacer(1, 5)]))

    # Datagran ────────────────────────────────────────────────────────────────
    story.append(KeepTogether(experience(s,
        "Datagran", "COL (Remote)",
        "Front End Lead", "Dec 2018 \u2013 Jan 2020",
        [
            "Directed the front-end development of enterprise-level, data-driven applications, "
            "ensuring adherence to high UI/UX standards and scalable design systems",
            "Led the migration of a legacy jQuery-based platform to a modern React + TypeScript "
            "architecture, improving maintainability and reducing bug incidence by over 30%",
            "Collaborated with data scientists and backend engineers to implement real-time "
            "visualizations and analytics dashboards, helping clients gain actionable insights",
            "Introduced D3.js and Atomic Design principles, enhancing usability and accessibility",
        ],
        tech=(
            "React \u00b7 TypeScript \u00b7 Redux Sagas \u00b7 Next.js \u00b7 D3.js \u00b7 "
            "SASS \u00b7 Atomic Design \u00b7 Big Data \u00b7 Unit Testing"
        ),
    ) + [Spacer(1, 5)]))

    # Justbit ─────────────────────────────────────────────────────────────────
    story.append(KeepTogether(experience(s,
        "Justbit", "COL (On site)",
        "CTO \u2013 Co-founder", "Apr 2017 \u2013 Dec 2018",
        [
            "Co-founded a tech startup and defined the company\u2019s technology roadmap and "
            "engineering processes from the ground up, resulting in the launch of 10+ client "
            "applications within the first year",
            "Oversaw a multidisciplinary engineering team, fostering a collaborative and "
            "innovation-driven culture that supported rapid iteration and continuous improvement",
            "Developed SEO-optimized WordPress and React-based solutions, helping clients "
            "increase organic traffic and visibility by up to 70%",
        ],
        tech=(
            "React \u00b7 React Native \u00b7 TypeScript \u00b7 PHP \u00b7 WordPress \u00b7 "
            "Cloudflare \u00b7 CI/CD \u00b7 Unit Testing \u00b7 AdWords \u00b7 SEO"
        ),
    ) + [Spacer(1, 5)]))

    # Nebular ─────────────────────────────────────────────────────────────────
    story.append(KeepTogether(experience(s,
        "Nebular", "COL (Hybrid)",
        "Full Stack Developer", "Jan 2014 \u2013 Apr 2017",
        [
            "Gained full-stack experience with Ruby on Rails, AngularJS, and native Android "
            "(Java) under the mentorship of experienced engineers",
            "Contributed to Android applications and web projects using PHP, WordPress, and "
            "Cordova, deploying to Heroku",
        ],
        tech=(
            "Angular \u00b7 Ruby on Rails \u00b7 PHP \u00b7 WordPress \u00b7 Java \u00b7 "
            "Android \u00b7 Cordova \u00b7 jQuery \u00b7 Heroku"
        ),
    ) + [Spacer(1, 3)]))

    # ── Projects ──────────────────────────────────────────────────────────────
    story += [Paragraph("Projects", s["section"]), rule()]

    story.append(KeepTogether(experience(s,
        "React JS Colombia", "",
        "Co-organizer", "Jul 2017 \u2013 Present",
        [
            "Co-founded and continue to lead one of Colombia\u2019s most active React communities, "
            "supporting developers at all levels since 2017",
            "Launched a free monthly workshop series consistently attracting 100+ participants per "
            "session \u2014 a dynamic hub for professional growth, collaboration, and networking",
            "Organize workshops, tech talks, and hands-on coding sessions on React and the "
            "broader JavaScript ecosystem",
        ],
    ) + [Spacer(1, 5)]))

    story.append(KeepTogether(experience(s,
        "@santi020k/eslint-config-basic", "",
        "Author", "Mar 2024 \u2013 Present",
        [
            "Built a composable ESLint toolkit for JavaScript, TypeScript, React, Next.js, Astro, "
            "and more \u2014 rebuilt from scratch around ESLint\u2019s flat config format with optional "
            "per-framework packages and a strict mode for CI/CD pipelines",
            "229+ weekly npm downloads; adopted across personal, client, and shared codebases as "
            "a reusable expression of engineering standards teams can extend",
        ],
    ) + [Spacer(1, 5)]))

    story.append(KeepTogether(experience(s,
        "@santi020k/eslint-config-santi020k", "",
        "Author", "Mar 2024 \u2013 Present",
        [
            "Developed a highly-opinionated ESLint configuration library for JavaScript, "
            "TypeScript, and React, enforcing best practices and consistent code quality",
            "Adopted by 30+ developers across multiple teams, reducing technical debt and "
            "improving code readability",
        ],
    ) + [Spacer(1, 3)]))

    # ── Skills & Interests ────────────────────────────────────────────────────
    story += [Paragraph("Skills & Interests", s["section"]), rule()]

    skill_lines = [
        ("Languages",    "Spanish (Native), English (C1 \u2013 Fluent), Japanese (Basic)"),
        ("Interests",    "Anime culture | Traveling the world | Animal lover | Continuous learning"),
        ("Front-End",    "React.js | Next.js | React Native | Vue | Angular | Astro | TypeScript | "
                         "JavaScript | Zustand | Redux | RTQ | TanStack Query | Tailwind CSS | Material UI | "
                         "Mantine | Shadcn | Ant Design | HTML5 | CSS3 | SASS | PostCSS | D3.js | jQuery | Zod"),
        ("Back-End",     "Node.js | Express.js | NestJS | RESTful APIs | GraphQL | MongoDB | "
                         "PostgreSQL | PHP | Ruby on Rails | Ruby | WordPress | Elixir"),
        ("Testing",      "Jest | Vitest | Cypress | Playwright | ESLint"),
        ("DevOps",       "CI/CD | GitHub Actions | Docker | AWS (EC2, S3, IAM) | Vercel | Heroku | Cloudflare"),
        ("Architecture", "System Design | Atomic Design | Microservices | Monorepo (Nx, Turborepo) | "
                         "Technical Leadership | Mentoring | Agile | Scrum"),
        ("Tools",        "Git | Storybook | Builder.io | WordPress"),
    ]

    for label, value in skill_lines:
        story.append(Paragraph(
            f"\u2022\u2002{B(label + ':')} {value}",
            s["bullet"],
        ))

    doc.build(story)
    print(f"CV written \u2192 {OUTPUT_PATH}")


if __name__ == "__main__":
    build()
