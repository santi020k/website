export interface CollaborationTheme {
  body: string
  evidence: string
  title: string
}

export interface SocialProofItem {
  context: string
  label: string
}

export interface ProfileHighlight {
  description: string
  label: string
  value: string
}

export interface SpeakingTopic {
  description: string
  title: string
}

export interface UsesSectionItem {
  label: string
  value: string
}

export interface UsesSection {
  description: string
  items: UsesSectionItem[]
  title: string
}

export const collaborationThemes: CollaborationTheme[] = [
  {
    body: 'I stay close to architecture, code quality, and delivery systems so teams get the benefits of leadership without losing technical depth.',
    evidence: 'Led cross-functional teams of up to 14 people while continuing to shape architecture, CI/CD, and day-to-day engineering standards.',
    title: 'Hands-on technical leadership'
  },
  {
    body: 'A big part of the work is reducing avoidable decisions under pressure: better defaults, cleaner tooling, and release paths that are easier to trust.',
    evidence: 'Project work across Void, PADS, and Optic Power centers on release confidence, performance, and calmer execution under real product deadlines.',
    title: 'Systems that make shipping calmer'
  },
  {
    body: 'I care about developer experience because it compounds. Clear conventions, strong feedback loops, and better automation create real leverage for a team.',
    evidence: 'That shows up in the products I build, the ESLint tooling I publish, the workflows I write about, and the standards I introduce inside teams.',
    title: 'Developer experience that scales'
  },
  {
    body: 'My best work usually sits at the intersection of engineering, product, and communication. I like helping teams align earlier so execution gets simpler.',
    evidence: 'The portfolio spans commerce, SaaS, gaming, real estate, and community work, but the throughline is the same: practical systems with clear business value.',
    title: 'Clear communication across functions'
  }
]

export const selectedOrganizations: SocialProofItem[] = [
  {
    context: 'Technical leadership across esports web, mobile, backend, and real-time delivery at Void.',
    label: 'Void'
  },
  {
    context: 'Product engineering and fan-engagement systems shipped through Optic Power client work.',
    label: 'Team Liquid'
  },
  {
    context: 'AI martech dashboards and campaign workflows built during the Datagran modernization work.',
    label: 'Rappi'
  },
  {
    context: 'Analytics and customer-data product work supported through Datagran.',
    label: 'Subway'
  },
  {
    context: 'High-traffic sports media platform and programmatic ad infrastructure for one of the world’s most recognized extreme sports brands.',
    label: 'X Games'
  },
  {
    context: 'Community talks, workshops, and mentorship through one of Medellin’s most active React groups.',
    label: 'ReactJS Colombia'
  }
]

export const speakingHighlights: ProfileHighlight[] = [
  {
    description: 'A decade-plus of shipping across product engineering, architecture, and leadership roles.',
    label: 'Experience',
    value: '12+ years'
  },
  {
    description: 'Helping co-organize meetups, workshops, and speaker-friendly community events.',
    label: 'Community',
    value: 'Since 2017'
  },
  {
    description: 'Public articles on DX, tooling, architecture, and workflow topics that overlap with my talks.',
    label: 'Published writing',
    value: '6 articles'
  }
]

export const speakingTopics: SpeakingTopic[] = [
  {
    description: 'How standards, automation, and delivery systems reduce pressure and help teams make better decisions sooner.',
    title: 'Engineering leadership for teams that still ship'
  },
  {
    description: 'Practical ways to improve tooling, feedback loops, and everyday developer ergonomics without overengineering the process.',
    title: 'Developer experience that compounds'
  },
  {
    description: 'Patterns for growing React and TypeScript codebases without turning them into a maze of exceptions and accidental complexity.',
    title: 'Frontend architecture for real teams'
  },
  {
    description: 'Testing, linting, and CI/CD systems that teams actually keep because they improve confidence instead of slowing work down.',
    title: 'Quality systems that fit the workflow'
  },
  {
    description: 'Choosing the right level of abstraction across frontend, backend, and platform work when products need to move fast.',
    title: 'Full-stack delivery with technical range'
  },
  {
    description: 'What community work has taught me about mentoring, accessibility, and helping more people feel ready to share what they know.',
    title: 'Community building and first-time speakers'
  }
]

export const speakingFormats: SpeakingTopic[] = [
  {
    description: 'Practical sessions for local communities and engineering groups that want useful takeaways, not slideware.',
    title: 'Meetups and community talks'
  },
  {
    description: 'Hands-on sessions around React, TypeScript, testing, tooling, and workflow design for teams that want to level up together.',
    title: 'Workshops and live build sessions'
  },
  {
    description: 'Architecture, DX, and delivery talks tailored for product teams, onboarding programs, or internal engineering initiatives.',
    title: 'Internal engineering enablement'
  },
  {
    description: 'Good fit for panels, AMAs, and conversations about technical leadership, full-stack execution, and developer culture.',
    title: 'Panels, Q&A, and leadership conversations'
  }
]

export const usesHighlights: UsesSectionItem[] = [
  {
    label: 'Bias',
    value: 'Boring reliability over shiny setup churn'
  },
  {
    label: 'Default stack',
    value: 'TypeScript, React, Astro, Node.js, Tailwind, Vitest, Playwright'
  },
  {
    label: 'What I optimize for',
    value: 'Fast feedback loops, clear standards, and fewer context switches'
  }
]

export const usesSections: UsesSection[] = [
  {
    description: 'I keep the physical setup intentionally simple. The goal is long stretches of focused work, good pairing sessions, and less energy spent on gear decisions.',
    items: [
      {
        label: 'Workspace',
        value: 'Laptop-first, with extra screen space whenever I am working from a fixed desk'
      },
      {
        label: 'Calls and collaboration',
        value: 'Reliable audio, a clean video-call setup, and tools that make remote leadership feel less fragmented'
      },
      {
        label: 'Comfort',
        value: 'A keyboard, pointer, and desk setup that can survive long implementation sessions without becoming the problem'
      }
    ],
    title: 'Desk setup'
  },
  {
    description: 'Most of my work still starts with the same core stack: TypeScript, React-adjacent frameworks, and tooling that keeps quality visible from the beginning.',
    items: [
      {
        label: 'Frontend',
        value: 'React, Next.js, Astro, Tailwind CSS, Storybook, and design-system thinking when a product needs stronger UI structure'
      },
      {
        label: 'Backend',
        value: 'Node.js services, APIs, pragmatic data modeling, and whatever automation removes the most toil for the team'
      },
      {
        label: 'Testing',
        value: 'Vitest, Playwright, ESLint, and CI pipelines that catch issues early instead of making release day louder'
      }
    ],
    title: 'Build stack'
  },
  {
    description: 'The tools matter, but the workflow matters more. I am always looking for ways to make software delivery feel calmer, clearer, and easier to trust.',
    items: [
      {
        label: 'Writing',
        value: 'I use writing to clarify architecture, document decisions, and turn useful lessons into posts, docs, or internal standards'
      },
      {
        label: 'Delivery',
        value: 'Small feedback loops, measurable quality gates, and automation that supports judgment instead of replacing it'
      },
      {
        label: 'Leadership',
        value: 'Close enough to the code to stay credible, structured enough to help the team avoid unnecessary ambiguity'
      }
    ],
    title: 'Workflow principles'
  }
]
