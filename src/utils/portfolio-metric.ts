interface PortfolioMetricDisplay {
  label: string
  value?: string
}

interface ProjectOutcomeDisplay extends PortfolioMetricDisplay {
  previous?: string
}

type MetricChange =
  | { kind: 'improvement', label: string, previous: string, value: string } |
  { kind: 'reduction', label: string, value: string }

const getMetricChange = (metric: string): MetricChange | undefined => {
  const improvement = /^(.+) improved from (\d+(?:\.\d+)?%?) to (\d+(?:\.\d+)?%?)$/u
  const [, improvedLabel, previous, current] = improvement.exec(metric) ?? []

  if (improvedLabel && previous && current) {
    return { kind: 'improvement', label: improvedLabel, previous, value: current }
  }

  const [, reducedLabel, amount] = (/^(.+) dropped by (\d+(?:\.\d+)?%)$/u.exec(metric)) ?? []

  if (reducedLabel && amount) return { kind: 'reduction', label: reducedLabel, value: amount }

  return undefined
}

export const getPortfolioMetricDisplay = (metric: string): PortfolioMetricDisplay => {
  const change = getMetricChange(metric)

  if (change?.kind === 'improvement') return { label: change.label, value: `${change.previous} → ${change.value}` }

  if (change?.kind === 'reduction') return { label: change.label, value: `${change.value} less` }

  return { label: metric }
}

export const getProjectOutcomeDisplay = (metric: string): ProjectOutcomeDisplay => {
  const change = getMetricChange(metric)

  if (change?.kind === 'improvement') return { label: `${change.label} improved`, previous: change.previous, value: change.value }

  if (change?.kind === 'reduction') return { label: `${change.label} dropped`, value: change.value }

  const [, improvedLabel, amount] = /^(.+) improved by (\d+(?:\.\d+)?%)$/u.exec(metric) ?? []

  if (improvedLabel && amount) return { label: `${improvedLabel} improved`, value: amount }

  // Only emphasize an unqualified leading percentage or count. Keep qualifiers,
  // units, and trailing context intact; dates and embedded numbers stay prose.
  const [, value, label] = /^(\d+(?:\.\d+)?(?:%\+?|\+)) (.+)$/u.exec(metric) ?? []

  if (value && label) return { label: label.charAt(0).toUpperCase() + label.slice(1), value }

  return { label: metric }
}
