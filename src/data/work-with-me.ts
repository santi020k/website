import type { LumenIconName } from '@santi020k/lumen-core'

import { siteConfig } from '@/site.config'

export type WorkTopicId = 'ai' | 'other' | 'quality' | 'role' | 'talk' | 'team'

export interface WorkWithMeService {
  description: string
  examples: string[]
  icon: LumenIconName
  id: Exclude<WorkTopicId, 'other'>
  proof: { href: string, label: string }
  title: string
}

export interface WorkTopic {
  id: WorkTopicId

  /** Short label shown in the intake form. */
  label: string

  /** Sentence that opens the WhatsApp message for this topic. */
  opener: string
}

export interface FaqItem {
  answer: string
  question: string
}

export const workWithMeServices: WorkWithMeService[] = [
  {
    description: 'Talks and hands-on workshops for conferences, meetups, and internal engineering teams.',
    examples: ['Conference and meetup talks', 'Team workshops and live builds', 'Panels, Q&A, and fireside chats'],
    icon: 'presentation',
    id: 'talk',
    proof: { href: '/speaking/', label: 'Topics and past talks' },
    title: 'Tech talks and workshops'
  },
  {
    description: 'Tech lead, staff-level full-stack, and engineering leadership roles, remote or hybrid from Medellín.',
    examples: ['Tech lead and staff engineer roles', 'Engineering manager and head of engineering', 'Remote teams in the Americas'],
    icon: 'briefcase-business',
    id: 'role',
    proof: { href: siteConfig.contact.resume, label: 'Resume and career timeline' },
    title: 'Engineering roles'
  },
  {
    description: 'Hands-on leadership for companies that are growing: clearer standards, calmer releases, and stronger technical decisions.',
    examples: ['Technical direction and architecture', 'Hiring, onboarding, and mentoring', 'Delivery rhythm for growing teams'],
    icon: 'users',
    id: 'team',
    proof: { href: '/portfolio/void/#what-i-led', label: 'Leading a team of 14 at Void' },
    title: 'Growing teams and companies'
  },
  {
    description: 'Put AI coding tools to work without losing control of quality, review, and delivery.',
    examples: ['AI-assisted workflows with guardrails', 'Agent-ready repositories and docs', 'Faster, cheaper automation'],
    icon: 'sparkles',
    id: 'ai',
    proof: { href: '/blog/ai-coding-is-probabilistic-your-delivery-process-should-not-be/', label: 'Why AI needs a reliable process' },
    title: 'AI in everyday engineering'
  },
  {
    description: 'Linting, testing, CI/CD, and shared components that keep a codebase easy to change as it grows.',
    examples: ['Code standards teams actually adopt', 'Testing and accessibility checks', 'CI/CD and release automation'],
    icon: 'shield-check',
    id: 'quality',
    proof: { href: '/developer-experience/', label: 'Developer experience guide' },
    title: 'Code quality and developer experience'
  }
]

export const workTopics: WorkTopic[] = [
  { id: 'talk', label: 'A talk or workshop', opener: 'I’d like to invite you to give a talk or workshop.' },
  { id: 'role', label: 'An engineering role', opener: 'I’m hiring for an engineering role and think you could be a fit.' },
  { id: 'team', label: 'Growing our team', opener: 'I’d like help growing our engineering team.' },
  { id: 'ai', label: 'Using AI in engineering', opener: 'I’d like help using AI in our engineering work.' },
  { id: 'quality', label: 'Code quality and DX', opener: 'I’d like help improving our code quality and developer experience.' },
  { id: 'other', label: 'Something else', opener: 'I’d like to talk about a project.' }
]

export const workProcess = [
  {
    body: 'Pick a topic and add a line of context. The form writes the WhatsApp message for you.',
    title: 'Send a message'
  },
  {
    body: 'I reply on WhatsApp with questions or a time to talk. You can also book a call directly.',
    title: 'Have a short call'
  },
  {
    body: 'We agree on the format, scope, and timing that fit your team or event.',
    title: 'Agree on next steps'
  }
] as const

export const workWithMeFaq: FaqItem[] = [
  {
    question: 'What kind of work are you open to?',
    answer: 'Tech talks and workshops, full-time tech lead and engineering leadership roles, and hands-on work with growing teams on AI adoption, code quality, and developer experience.'
  },
  {
    question: 'Where are you based, and do you work remotely?',
    answer: 'I live in Medellín, Colombia (UTC−5), and work remotely with teams worldwide. My hours overlap fully with North and South American time zones.'
  },
  {
    question: 'Which languages do you work in?',
    answer: 'Spanish (native) and English (C1). Talks, workshops, and day-to-day work can happen in either.'
  },
  {
    question: 'Can you help us adopt AI tools without hurting code quality?',
    answer: 'Yes. I treat AI output as probabilistic and make the delivery process deterministic: clear standards, automated checks, focused review, and repositories that agents can understand.'
  },
  {
    question: 'How do we get started?',
    answer: 'Send a WhatsApp message with a line of context, or book a short call on my calendar. I’ll reply with questions or a proposed next step.'
  },
  {
    question: 'How is the work scoped?',
    answer: 'It depends on the goal: a single talk, a workshop, a focused improvement project, or a longer engagement. We agree on scope and timing after the first conversation.'
  }
]

/** FAQPage structured data for pages that render a visible FAQ. */
export const createFaqSchema = (items: FaqItem[], pageUrl: string) => ({
  '@type': 'FAQPage',
  '@id': `${pageUrl}#faq`,
  mainEntity: items.map(({ answer, question }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer }
  }))
})
