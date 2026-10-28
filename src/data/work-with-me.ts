import type { LumenIconName } from '@santi020k/lumen-core'

import type { Locale } from '@/i18n'
import { defaultLocale, localizePath } from '@/i18n'
import { pageTranslator } from '@/i18n/page-copy'
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

export const getWorkWithMeServices = (locale: Locale = defaultLocale): WorkWithMeService[] => {
  const t = pageTranslator(locale)

  return [
    {
      description: t('page.talksAndHandsOnWorkshopsFor'),
      examples: [t('page.conferenceAndMeetupTalks'), t('page.teamWorkshopsAndLiveBuilds'), t('page.panelsQAndAAndFireside')],
      icon: 'presentation',
      id: 'talk',
      proof: { href: localizePath('/speaking/', locale), label: t('page.topicsAndPastTalks') },
      title: t('page.techTalksAndWorkshops')
    },
    {
      description: t('page.techLeadStaffLevelFullStack'),
      examples: [t('page.techLeadAndStaffEngineerRoles'), t('page.engineeringManagerAndHeadOfEngineering'), t('page.remoteTeamsInTheAmericas')],
      icon: 'briefcase-business',
      id: 'role',
      proof: { href: localizePath(siteConfig.contact.resume, locale), label: t('page.resumeAndCareerTimeline') },
      title: t('page.engineeringRoles')
    },
    {
      description: t('page.handsOnLeadershipForCompaniesThat'),
      examples: [t('page.technicalDirectionAndArchitecture'), t('page.hiringOnboardingAndMentoring'), t('page.deliveryRhythmForGrowingTeams')],
      icon: 'users',
      id: 'team',
      proof: { href: localizePath('/portfolio/void/#what-i-led', locale), label: t('page.leadingATeamOf14At') },
      title: t('page.growingTeamsAndCompanies')
    },
    {
      description: t('page.putAiCodingToolsToWork'),
      examples: [t('page.aiAssistedWorkflowsWithGuardrails'), t('page.agentReadyRepositoriesAndDocs'), t('page.fasterCheaperAutomation')],
      icon: 'sparkles',
      id: 'ai',
      proof: { href: localizePath('/blog/ai-coding-is-probabilistic-your-delivery-process-should-not-be/', locale), label: t('page.whyAiNeedsAReliableProcess') },
      title: t('page.aiInEverydayEngineering')
    },
    {
      description: t('page.lintingTestingCiCdAndShared'),
      examples: [t('page.codeStandardsTeamsActuallyAdopt'), t('page.testingAndAccessibilityChecks'), t('page.ciCdAndReleaseAutomation')],
      icon: 'shield-check',
      id: 'quality',
      proof: { href: localizePath('/developer-experience/', locale), label: t('page.developerExperienceGuide') },
      title: t('page.codeQualityAndDeveloperExperience')
    }
  ]
}

export const workWithMeServices = getWorkWithMeServices()

export const getWorkTopics = (locale: Locale = defaultLocale): WorkTopic[] => {
  const t = pageTranslator(locale)

  return [
    { id: 'talk', label: t('page.aTalkOrWorkshop'), opener: t('page.iDLikeToInviteYou') },
    { id: 'role', label: t('page.anEngineeringRole'), opener: t('page.iMHiringForAnEngineering') },
    { id: 'team', label: t('page.growingOurTeam'), opener: t('page.iDLikeHelpGrowingOur') },
    { id: 'ai', label: t('page.usingAiInEngineering'), opener: t('page.iDLikeHelpUsingAi') },
    { id: 'quality', label: t('page.codeQualityAndDx'), opener: t('page.iDLikeHelpImprovingOur') },
    { id: 'other', label: t('page.somethingElse'), opener: t('page.iDLikeToTalkAbout') }
  ]
}

export const workTopics = getWorkTopics()

export const getWorkProcess = (locale: Locale = defaultLocale) => {
  const t = pageTranslator(locale)

  return [
    {
      body: t('page.pickATopicAndAddALine'),
      title: t('page.sendAMessage')
    },
    {
      body: t('page.iReplyOnWhatsappWithQuestions'),
      title: t('page.haveAShortCall')
    },
    {
      body: t('page.weAgreeOnTheFormatScope'),
      title: t('page.agreeOnNextSteps')
    }
  ] as const
}

export const workProcess = getWorkProcess()

export const getWorkWithMeFaq = (locale: Locale = defaultLocale): FaqItem[] => {
  const t = pageTranslator(locale)

  return [
    {
      question: t('page.whatKindOfWorkAreYou'),
      answer: t('page.techTalksAndWorkshopsFullTime')
    },
    {
      question: t('page.whereAreYouBasedAndDo'),
      answer: t('contact.locationAnswer')
    },
    {
      question: t('page.whichLanguagesDoYouWorkIn'),
      answer: t('page.spanishNativeAndEnglishC1Talks')
    },
    {
      question: t('page.canYouHelpUsAdoptAi'),
      answer: t('page.yesITreatAiOutputAs')
    },
    {
      question: t('page.howDoWeGetStarted'),
      answer: t('page.sendAWhatsappMessageWithA')
    },
    {
      question: t('page.howIsTheWorkScoped'),
      answer: t('page.itDependsOnTheGoalA')
    }
  ]
}

export const workWithMeFaq = getWorkWithMeFaq()

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
