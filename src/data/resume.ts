/** Projects the résumé shows, by section. Their role, description and metrics are localized through the page catalog. */
export const resumeProjectIds = {
  work: ['smith-commerce', 'xgames', 'void', 'optic-power'],
  earlier: ['pads', 'datagran', 'justbit', 'nebular'],
  community: ['react-js-colombia']
} as const

/**
 * Skills by group. Strings are technology names shown as written. `{ name, technology }`
 * shows `name` but links `technology`'s archive; `{ labelKey }` is translated copy.
 */
export const resumeSkillGroups = [
  { title: 'page.frontEnd', skills: ['React.js', 'Next.js', 'React Native', 'Astro', 'TypeScript', 'Tailwind CSS', 'Redux', 'TanStack Query', 'Radix UI'] },
  { title: 'page.backEnd', skills: ['Node.js', 'Express.js', 'NestJS', { name: 'REST', technology: 'REST APIs' }, 'GraphQL', 'PostgreSQL', 'MongoDB', 'PHP', 'Ruby on Rails'] },
  { title: 'page.devopsAndArchitecture', skills: ['AWS', 'Docker', 'CI/CD', 'GitHub Actions', { labelKey: 'page.systemDesign' }, 'Microservices', 'Turborepo'] }
] as const
