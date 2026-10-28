import type { Locale } from '@/i18n'
import { defaultLocale, localizePath } from '@/i18n'
import { pageTranslator } from '@/i18n/page-copy'
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
  source: { href: string, label: string }
  suffix?: string
  value: string
}

export interface SpeakingCardContent {
  description: string
  subtitle: string
  title: string
}

export interface SpeakingTopic extends SpeakingCardContent {
  source: { href: string, label: string }
}

export interface SpeakingFormat extends SpeakingCardContent {
  outcome: { fit: string, label: string }
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
  source: { href: string, label: string }
  title: string
}

export const getTestimonials = (locale: Locale = defaultLocale): Testimonial[] => {
  const t = pageTranslator(locale)

  return [
    {
      avatarInitials: 'RD',
      name: 'Raphael Drummond',
      quote: 'Santiago has excellent communication skills and is able to explain complex technical concepts in a clear and concise way. He is highly reliable, dedicated, and responsible — meeting deadlines and delivering high-quality projects.',
      relationship: t('page.managedSantiagoAtOpticPower'),
      role: t('page.aiProductAndEngineeringLeader')
    },
    {
      avatarInitials: 'CT',
      name: 'Carolina G. Torres',
      quote: 'Santi stands out due to his outstanding technical skills, leadership abilities, and collaborative spirit. He cultivates a positive and inclusive work environment, promoting open communication and idea exchange.',
      relationship: t('page.colleagueSameTeam'),
      role: t('page.leadProductDesigner')
    },
    {
      avatarInitials: 'DD',
      name: 'David Delgado',
      quote: 'He excels in good practices while coding and has solid leadership skills. He is great at sharing knowledge with fellow devs and organizing priorities to make things happen in a quality-oriented way.',
      relationship: t('page.reportedToSantiago'),
      role: t('page.softwareEngineer')
    },
    {
      avatarInitials: 'JM',
      name: 'Jorge Luis Madrid',
      quote: 'Santiago is a great engineer who is constantly learning and dedicated to his work — a good leader, responsible with his tasks. I recommend him to any company looking for a brilliant full-stack developer able to get results and inspire.',
      relationship: t('page.client'),
      role: t('page.seniorCloudAndDevopsEngineer')
    }
  ]
}

export const testimonials = getTestimonials()

export const getSelectedOrganizations = (locale: Locale = defaultLocale): SocialProofItem[] => {
  const t = pageTranslator(locale)

  return [
    {
      context: t('page.technicalLeadershipAcrossEsportsWebMobile'),
      label: 'Void',
      projectId: 'void'
    },
    {
      context: t('page.productEngineeringShippedAcrossTeamLiquid'),
      label: 'Optic Power',
      projectId: 'optic-power'
    },
    {
      context: t('page.aiMartechDashboardsAndCampaignWorkflows'),
      label: 'Datagran',
      projectId: 'datagran'
    },
    {
      context: t('page.highTrafficSportsMediaPlatformAnd'),
      label: 'X Games',
      projectId: 'xgames'
    },
    {
      context: t('page.aFasterMoreAccessibleHeadlessCommerce'),
      label: 'Smith Commerce',
      projectId: 'smith-commerce'
    },
    {
      context: t('page.luxuryRealEstateWebBackOffice'),
      label: 'PADS',
      projectId: 'pads'
    },
    {
      context: t('page.aBoutiqueSoftwareStudioBehind10'),
      label: 'Justbit',
      projectId: 'justbit'
    },
    {
      context: t('page.clientWebAndroidAndCommerceWork'),
      label: 'Nebular Technologies',
      projectId: 'nebular'
    },
    {
      context: t('page.communityTalksWorkshopsAndMentorshipThrough'),
      label: 'ReactJS Colombia',
      logoSurface: 'light',
      projectId: 'react-js-colombia'
    }
  ]
}

export const selectedOrganizations = getSelectedOrganizations()

export const getCollaborationLanes = (locale: Locale = defaultLocale): CollaborationLane[] => {
  const t = pageTranslator(locale)

  return [
    {
      description: t('page.bestFitWhenATeamIs'),
      fit: t('page.usefulForProductTeamsThatNeed'),
      source: { href: localizePath('/portfolio/void/#what-i-led', locale), label: t('page.voidGgWhatILed') },
      title: t('page.technicalLeadershipForTeamsInMotion')
    },
    {
      description: t('page.usefulWhenAPlatformNeedsTo'),
      fit: t('page.strongMatchForRebuildsMigrationsArchitecture'),
      source: { href: localizePath('/portfolio/smith-commerce/#marcone-rebuilding-for-a-headless-future', locale), label: t('page.smithCommerceMarconeRebuild') },
      title: t('page.modernizationWorkThatStillRespectsDelivery')
    },
    {
      description: t('page.iImproveLintingTestingCiCd'),
      fit: t('page.bestWhenTheTeamAlreadyFeels'),
      source: { href: localizePath('/portfolio/lumen-ui/#technical-highlights', locale), label: t('page.lumenUiTechnicalHighlights') },
      title: t('page.developerExperienceAndQualitySystemsThat')
    }
  ]
}

export const collaborationLanes = getCollaborationLanes()

export const getSpeakingHighlights = (locale: Locale = defaultLocale): ProfileHighlight[] => {
  const t = pageTranslator(locale)

  return [
    {
      description: t('page.aDecadePlusOfShippingAcross'),
      icon: 'briefcase-business',
      label: t('shared.experience'),
      source: { href: localizePath('/work/#experience-heading', locale), label: t('page.careerTimeline') },
      value: YEARS_OF_EXPERIENCE
    },
    {
      description: t('page.helpingCoOrganizeMeetupsWorkshopsAnd'),
      icon: 'users',
      label: t('shared.community'),
      prefix: t('page.since'),
      source: { href: localizePath('/portfolio/react-js-colombia/', locale), label: 'ReactJS Colombia' },
      value: '2017'
    },
    {
      description: t('page.publicArticlesOnDxToolingArchitecture'),
      icon: 'notebook-pen',
      label: t('page.publishedWriting'),
      source: { href: localizePath('/blog/', locale), label: t('page.readTheArticles') },
      suffix: t('page.posts'),
      value: '26'
    }
  ]
}

export const speakingHighlights = getSpeakingHighlights()

export const getSpeakingTopics = (locale: Locale = defaultLocale): SpeakingTopic[] => {
  const t = pageTranslator(locale)

  return [
    {
      description: t('page.howStandardsAutomationAndDeliverySystems'),
      source: {
        href: localizePath('/blog/code-standards-that-scale-with-a-team/', locale),
        label: t('page.standardsThatScale')
      },
      subtitle: t('page.forTeamsThatStillShip'),
      title: t('page.engineeringLeadership')
    },
    {
      description: t('page.practicalWaysToImproveToolingFeedback'),
      source: {
        href: localizePath('/blog/why-developer-experience-work-should-be-measured-like-product-work/', locale),
        label: t('page.measuringDeveloperExperience')
      },
      subtitle: t('page.thatCompounds'),
      title: t('page.developerExperience7')
    },
    {
      description: t('page.patternsForGrowingReactAndTypescript'),
      source: {
        href: localizePath('/blog/atomic-module-component-structure-for-react/', locale),
        label: t('page.structuringReactProjects')
      },
      subtitle: t('page.forRealTeams'),
      title: t('page.frontendArchitecture')
    },
    {
      description: t('page.testingLintingAndCiCdSystems'),
      source: {
        href: localizePath('/blog/development-workflow-with-husky-for-next-js-eslint-and-vitest-integration/', locale),
        label: t('page.automatingQualityChecks')
      },
      subtitle: t('page.thatFitTheWorkflow'),
      title: t('page.qualitySystems')
    },
    {
      description: t('page.choosingTheRightLevelOfAbstraction'),
      source: {
        href: localizePath('/blog/building-aaronmgz-as-a-family-platform/', locale),
        label: t('page.buildingAFamilyPlatform')
      },
      subtitle: t('page.withTechnicalRange'),
      title: t('page.fullStackDelivery')
    },
    {
      description: t('page.whatCommunityWorkHasTaughtMe'),
      source: {
        href: localizePath('/portfolio/react-js-colombia/', locale),
        label: t('speaking.communityGrowth')
      },
      subtitle: t('page.andFirstTimeSpeakers'),
      title: t('page.communityBuilding')
    }
  ]
}

export const speakingTopics = getSpeakingTopics()

export const getSpeakingFormats = (locale: Locale = defaultLocale): SpeakingFormat[] => {
  const t = pageTranslator(locale)

  return [
    {
      description: t('page.practicalSessionsForLocalCommunitiesAnd'),
      outcome: {
        fit: t('page.introduceAnIdeaAndOpenA'),
        label: t('page.planAMeetup')
      },
      subtitle: t('page.andCommunityTalks'),
      title: t('page.meetups')
    },
    {
      description: t('page.handsOnSessionsAroundReactTypescript'),
      outcome: {
        fit: t('page.practiceATechniqueWithYourTeam'),
        label: t('page.planAWorkshop')
      },
      subtitle: t('page.andLiveBuildSessions'),
      title: t('page.workshops')
    },
    {
      description: t('page.architectureDxAndDeliveryTalksTailored'),
      outcome: {
        fit: t('page.buildASharedApproachToAn'),
        label: t('page.planATeamSession')
      },
      subtitle: t('page.enablement'),
      title: t('page.internalEngineering')
    },
    {
      description: t('page.goodFitForPanelsAmasAnd'),
      outcome: {
        fit: t('page.explorePerspectivesAndQuestionsWithYour'),
        label: t('page.planAPanel')
      },
      subtitle: t('page.andLeadershipConversations'),
      title: t('page.panelsQAndA')
    }
  ]
}

export const speakingFormats = getSpeakingFormats()

export const getEngineeringPrinciples = (locale: Locale = defaultLocale): EngineeringPrinciple[] => {
  const t = pageTranslator(locale)

  return [
    {
      title: t('page.automateTheFrictionNotTheThinking'),
      source: {
        href: localizePath('/blog/development-workflow-with-husky-for-next-js-eslint-and-vitest-integration/', locale),
        label: t('page.automatingQualityChecks')
      },
      body: t('page.theBestAutomationRemovesToilRepetitive')
    },
    {
      title: t('page.dxIsUxForYourTeam'),
      source: {
        href: localizePath('/blog/why-developer-experience-work-should-be-measured-like-product-work/', locale),
        label: t('page.measuringDeveloperExperience')
      },
      body: t('page.theDeveloperExperienceOfACodebase')
    },
    {
      title: t('page.leadershipMeansFewerDecisionsUnderPressure'),
      source: {
        href: localizePath('/blog/code-standards-that-scale-with-a-team/', locale),
        label: t('page.standardsThatScale')
      },
      body: t('page.aGoodTechLeadReducesAmbiguity')
    },
    {
      title: t('page.performanceIsAProductDecision'),
      source: {
        href: localizePath('/blog/astro-and-alpine-patterns-for-fast-content-heavy-sites/', locale),
        label: t('page.fastContentHeavySites')
      },
      body: t('page.speedIsnTATechConcern')
    },
    {
      title: t('page.boringTechIsOftenTheRight'),
      source: {
        href: localizePath('/blog/building-aaronmgz-as-a-family-platform/', locale),
        label: t('page.choosingToolsForTheJob')
      },
      body: t('page.theGoalIsToSolveThe')
    },
    {
      title: t('page.consistencyBeatsPerfection'),
      source: {
        href: localizePath('/blog/responsive-design-standards-that-scale-across-components/', locale),
        label: t('page.sharedResponsiveStandards')
      },
      body: t('page.aConsistentCodebaseWithSomeImperfections')
    }
  ]
}

export const engineeringPrinciples = getEngineeringPrinciples()
