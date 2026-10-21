interface PortfolioMetricDisplay {
  label: string
  value?: string
}

export const getPortfolioMetricDisplay = (metric: string): PortfolioMetricDisplay => {
  const improvement = /^(.+) improved from (\d+(?:\.\d+)?%?) to (\d+(?:\.\d+)?%?)$/u
  const [, improvedLabel, previous, current] = improvement.exec(metric) ?? []

  if (improvedLabel && previous && current) {
    return { label: improvedLabel, value: `${previous} → ${current}` }
  }

  const [, reducedLabel, amount] = (/^(.+) dropped by (\d+(?:\.\d+)?%)$/u.exec(metric)) ?? []

  if (reducedLabel && amount) return { label: reducedLabel, value: `${amount} less` }

  return { label: metric }
}
