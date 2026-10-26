import { YEARS_OF_EXPERIENCE } from '@/site.config'

export interface SocialProofItem {
  context: string
  label: string
  logoSurface?: 'dark' | 'light'
  projectId: 'datagran' | 'justbit' | 'nebular' | 'optic-power' | 'pads' | 'react-js-colombia' | 'smith-commerce' | 'void' | 'xgames'
}

export interface ProfileHighlight {
  description: string
  icon: string
  label: string
  prefix?: string
  suffix?: string
  value: string
}

export interface SpeakingCardContent {
  description: string
  subtitle: string
  title: string
}

export interface CollaborationLane {
  description: string
  fit: string
  source: { href: string, label: string }
  title: string
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
    label: 'Void',
    projectId: 'void'
  },
  {
    context: 'Product engineering shipped across Team Liquid, NurtureBoss, and Stardust.gg client work.',
    label: 'Optic Power',
    projectId: 'optic-power'
  },
  {
    context: 'AI martech dashboards and campaign workflows supporting brands including Rappi and Subway.',
    label: 'Datagran',
    projectId: 'datagran'
  },
  {
    context: 'High-traffic sports media platform and programmatic ad infrastructure for one of the world’s most recognized extreme sports brands.',
    label: 'X Games',
    projectId: 'xgames'
  },
  {
    context: 'A faster, more accessible headless commerce experience for Marcone and its product teams.',
    label: 'Smith Commerce',
    projectId: 'smith-commerce'
  },
  {
    context: 'Luxury real estate web, back-office, and mobile experiences that improved broker workflows.',
    label: 'PADS',
    projectId: 'pads'
  },
  {
    context: 'A boutique software studio behind 10+ client launches and measurable organic growth.',
    label: 'Justbit',
    projectId: 'justbit'
  },
  {
    context: 'Client web, Android, and commerce work across Rails, AngularJS, Java, and WordPress.',
    label: 'Nebular Technologies',
    projectId: 'nebular'
  },
  {
    context: 'Community talks, workshops, and mentorship through one of Medellin’s most active React groups.',
    label: 'ReactJS Colombia',
    logoSurface: 'light',
    projectId: 'react-js-colombia'
  }
]

export const collaborationLanes: CollaborationLane[] = [
  {
    description: 'Best fit when a team is shipping, but needs clearer standards, calmer releases, and stronger technical decision-making across the stack.',
    fit: 'Useful for product teams that need leadership without losing hands-on depth.',
    source: { href: '/portfolio/void/#what-i-led', label: 'Void.GG · What I led' },
    title: 'Technical leadership for teams in motion'
  },
  {
    description: 'Useful when a platform needs to get faster, more accessible, and easier to evolve without freezing delivery for months.',
    fit: 'Strong match for rebuilds, migrations, architecture cleanup, and performance-heavy work.',
    source: { href: '/portfolio/smith-commerce/#marcone-rebuilding-for-a-headless-future', label: 'Smith Commerce · Marcone rebuild' },
    title: 'Modernization work that still respects delivery pressure'
  },
  {
    description: 'I improve linting, testing, CI/CD, and documentation so teams spend less time on repeated fixes and release friction.',
    fit: 'Best when the team already feels the friction every week and wants a calmer default.',
    source: { href: '/portfolio/lumen-ui/#technical-highlights', label: 'Lumen UI · Technical highlights' },
    title: 'Developer experience and quality systems that compound'
  }
]

export const speakingHighlights: ProfileHighlight[] = [
  {
    description: 'A decade-plus of shipping across product engineering, architecture, and leadership roles.',
    icon: 'briefcase-business',
    label: 'Experience',
    value: YEARS_OF_EXPERIENCE
  },
  {
    description: 'Helping co-organize meetups, workshops, and speaker-friendly community events.',
    icon: 'users',
    label: 'Community',
    prefix: 'Since',
    value: '2017'
  },
  {
    description: 'Public articles on DX, tooling, architecture, and workflow topics that overlap with my talks.',
    icon: 'notebook-pen',
    label: 'Published writing',
    suffix: 'posts',
    value: '26'
  }
]

export const speakingTopics: SpeakingCardContent[] = [
  {
    description: 'How standards, automation, and delivery systems reduce pressure and help teams make better decisions sooner.',
    subtitle: 'for teams that still ship',
    title: 'Engineering leadership'
  },
  {
    description: 'Practical ways to improve tooling, feedback loops, and everyday developer ergonomics without overengineering the process.',
    subtitle: 'that compounds',
    title: 'Developer experience'
  },
  {
    description: 'Patterns for growing React and TypeScript codebases without turning them into a maze of exceptions and accidental complexity.',
    subtitle: 'for real teams',
    title: 'Frontend architecture'
  },
  {
    description: 'Testing, linting, and CI/CD systems that teams actually keep because they improve confidence instead of slowing work down.',
    subtitle: 'that fit the workflow',
    title: 'Quality systems'
  },
  {
    description: 'Choosing the right level of abstraction across frontend, backend, and platform work when products need to move fast.',
    subtitle: 'with technical range',
    title: 'Full-stack delivery'
  },
  {
    description: 'What community work has taught me about mentoring, accessibility, and helping more people feel ready to share what they know.',
    subtitle: 'and first-time speakers',
    title: 'Community building'
  }
]

export const speakingFormats: SpeakingCardContent[] = [
  {
    description: 'Practical sessions for local communities and engineering groups that want useful takeaways, not slideware.',
    subtitle: 'and community talks',
    title: 'Meetups'
  },
  {
    description: 'Hands-on sessions around React, TypeScript, testing, tooling, and workflow design for teams that want to level up together.',
    subtitle: 'and live build sessions',
    title: 'Workshops'
  },
  {
    description: 'Architecture, DX, and delivery talks tailored for product teams, onboarding programs, or internal engineering initiatives.',
    subtitle: 'enablement',
    title: 'Internal engineering'
  },
  {
    description: 'Good fit for panels, AMAs, and conversations about technical leadership, full-stack execution, and developer culture.',
    subtitle: 'and leadership conversations',
    title: 'Panels, Q&A,'
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
    body: 'A good tech lead reduces ambiguity before it becomes risk. Clear standards, good tooling, and systems that fail loudly are how you protect a team\'s velocity at scale.'
  },
  {
    title: 'Performance is a product decision',
    body: 'Speed isn\'t a tech concern, it\'s a user concern. Every kilobyte and every render-blocking resource is a choice that affects real people on real connections.'
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
