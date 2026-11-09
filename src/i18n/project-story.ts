import type { MessageCatalog } from './messages.ts'
import { createTranslator } from './messages.ts'

export const projectStoryMessages = {
  'consumer.seeLumenInUse': { en: 'See Lumen in use', es: 'Ver Lumen en uso' },
  'client.projectSequence': { en: 'Client project {sequence}', es: 'Proyecto para cliente {sequence}' },
  'evidence.sources': { en: '{label} sources', es: 'Fuentes de {label}' },
  'comparison.beforeAndAfter': { en: '{label} before and after', es: '{label}: antes y después' },
  'comparison.before': { en: 'Before', es: 'Antes' },
  'comparison.after': { en: 'After', es: 'Después' },
  'replacement.superseded': { en: 'This library has been superseded.', es: 'Esta biblioteca ha sido reemplazada.' },
  'replacement.useForNewProjects': { en: 'Use for new projects', es: 'Úsala en proyectos nuevos' },
  'replacement.explore': { en: 'Explore the replacement', es: 'Explorar la alternativa' },
  'synthesis.carriesForward': { en: 'What carries forward', es: 'Lo que permanece' },
  'exhibit.conceptIllustration': { en: 'Concept illustration', es: 'Ilustración conceptual' },
  'technical.exploreProjects': { en: 'Explore the projects and case studies connected by these technologies.', es: 'Explora los proyectos y casos de estudio conectados por estas tecnologías.' },
  'technical.projectsUsing': { en: 'Projects using each technology', es: 'Proyectos que usan cada tecnología' }
} as const satisfies MessageCatalog

export const projectStoryTranslator = createTranslator(projectStoryMessages)
