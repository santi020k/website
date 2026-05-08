import { YEARS_OF_EXPERIENCE } from '@/site.config'

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

export interface CollaborationLane {
  description: string
  fit: string
  title: string
}

export interface PastTalk {
  audience?: string
  description: string
  event: string
  links: {
    slides?: string
    video?: string
  }
  tags: string[]
  title: string
  year: number | string
}

export interface Testimonial {
  avatarInitials: string
  avatarUrl?: string
  name: string
  quote: string
  relationship: string
  role: string
}

export interface EngineeringPrinciple {
  body: string
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

export const testimonials: Testimonial[] = [
  {
    avatarInitials: 'RD',
    name: 'Raphael Drummond',
    quote: 'Santiago has excellent communication skills and is able to explain complex technical concepts in a clear and concise way. He is highly reliable, dedicated, and responsible — meeting deadlines and delivering high-quality projects.',
    relationship: 'Managed Santiago at Optic Power',
    role: 'AI Product & Engineering Leader'
  },
  {
    avatarInitials: 'CT',
    name: 'Carolina G. Torres',
    quote: 'Santi stands out due to his outstanding technical skills, leadership abilities, and collaborative spirit. He cultivates a positive and inclusive work environment, promoting open communication and idea exchange.',
    relationship: 'Colleague, same team',
    role: 'Lead Product Designer'
  },
  {
    avatarInitials: 'DD',
    name: 'David Delgado',
    quote: 'He excels in good practices while coding and has solid leadership skills. He is great at sharing knowledge with fellow devs and organizing priorities to make things happen in a quality-oriented way.',
    relationship: 'Reported to Santiago',
    role: 'Software Engineer'
  },
  {
    avatarInitials: 'JM',
    name: 'Jorge Luis Madrid',
    quote: 'Santiago is a great engineer who is constantly learning and dedicated to his work — a good leader, responsible with his tasks. I recommend him to any company looking for a brilliant full-stack developer able to get results and inspire.',
    relationship: 'Client',
    role: 'Senior Cloud & DevOps Engineer'
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

export const selectedSessions: PastTalk[] = [
  {
    title: 'Surviving Technical Interviews in React',
    event: 'ReactJS Medellín',
    year: 2024,
    audience: '~110 attendees',
    description: 'Common React interview questions decoded: what they really test, how to structure your thinking out loud, and the patterns worth knowing cold before any technical screen.',
    links: {
      slides: 'https://interviews.santi020k.com/1',
      video: 'https://www.youtube.com/watch?v=UtBZP93cOUs'
    },
    tags: ['React', 'Career', 'Interviews']
  },
  {
    title: 'How to Automate Front End Processes (and Not Die Trying)',
    event: 'ReactJS Medellín',
    year: 2024,
    audience: '~90 attendees',
    description: 'Practical automation patterns for frontend workflows — linting, testing pipelines, commit conventions, and the small systems changes that let teams ship with less daily friction.',
    links: {
      slides: 'https://www.figma.com/proto/sS34aM41Yzpb7yC8wGhsyJ/Untitled?node-id=1-22&t=PtbyUBw0QBWXI4sX-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=1%3A22'
    },
    tags: ['Frontend', 'Automation', 'DX']
  }
]

export const collaborationLanes: CollaborationLane[] = [
  {
    description: 'Best fit when a team is shipping, but needs clearer standards, calmer releases, and stronger technical decision-making across the stack.',
    fit: 'Useful for product teams that need leadership without losing hands-on depth.',
    title: 'Technical leadership for teams in motion'
  },
  {
    description: 'Useful when a platform needs to get faster, more accessible, and easier to evolve without freezing delivery for months.',
    fit: 'Strong match for rebuilds, migrations, architecture cleanup, and performance-heavy work.',
    title: 'Modernization work that still respects delivery pressure'
  },
  {
    description: 'A lot of the leverage comes from better linting, testing, CI/CD, documentation, and automation that reduce review noise and release stress.',
    fit: 'Best when the team already feels the friction every week and wants a calmer default.',
    title: 'Developer experience and quality systems that compound'
  }
]

export const speakingHighlights: ProfileHighlight[] = [
  {
    description: 'A decade-plus of shipping across product engineering, architecture, and leadership roles.',
    label: 'Experience',
    value: YEARS_OF_EXPERIENCE
  },
  {
    description: 'Helping co-organize meetups, workshops, and speaker-friendly community events.',
    label: 'Community',
    value: 'Since 2017'
  },
  {
    description: 'Public articles on DX, tooling, architecture, and workflow topics that overlap with my talks.',
    label: 'Published writing',
    value: '26 posts'
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

export const engineeringPrinciples: EngineeringPrinciple[] = [
  {
    title: 'Automate the friction, not the thinking',
    body: 'The best automation removes toil — repetitive, low-judgment work that slows teams down. It should never replace the thinking that makes products worth building.'
  },
  {
    title: 'DX is UX for your team',
    body: 'The developer experience of a codebase shapes how fast and confidently the team can move. Bad DX compounds. Good DX compounds too — invest early and measure it.'
  },
  {
    title: 'Leadership means fewer decisions under pressure',
    body: "A good tech lead reduces ambiguity before it becomes risk. Clear standards, good tooling, and systems that fail loudly are how you protect a team's velocity at scale."
  },
  {
    title: 'Performance is a product decision',
    body: "Speed isn't a tech concern, it's a user concern. Every kilobyte and every render-blocking resource is a choice that affects real people on real connections."
  },
  {
    title: 'Boring tech is often the right call',
    body: 'The goal is to solve the problem, not to use the newest tool. Stable, well-understood solutions let the team focus on the actual product.'
  },
  {
    title: 'Consistency beats perfection',
    body: 'A consistent codebase with some imperfections beats an inconsistent one with pockets of brilliance. Conventions compound. Exceptions cost.'
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
