import { AxeBuilder } from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

interface AllowedViolation {
  htmlIncludes?: string
  id: string
  targetIncludes?: string
}

const matchesAllowedNode = (
  node: { html: string, target: readonly unknown[] },
  allowedViolation: AllowedViolation
) => {
  const matchesHtml = allowedViolation.htmlIncludes ?
    node.html.includes(allowedViolation.htmlIncludes) :
    true

  const { targetIncludes } = allowedViolation

  const matchesTarget = targetIncludes ?
    node.target.some(target => String(target).includes(targetIncludes)) :
    true

  return matchesHtml && matchesTarget
}

export const expectNoUnexpectedAccessibilityViolations = async (
  page: Page,
  allowedViolations: AllowedViolation[] = []
) => {
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

  const unexpectedViolations = accessibilityScanResults.violations.flatMap(violation => {
    const unexpectedNodes = violation.nodes.filter(
      node => !allowedViolations.some(
        allowedViolation => violation.id === allowedViolation.id && matchesAllowedNode(node, allowedViolation)
      )
    )

    if (unexpectedNodes.length === 0) {
      return []
    }

    return [{ ...violation, nodes: unexpectedNodes }]
  })

  expect(unexpectedViolations).toEqual([])
}
