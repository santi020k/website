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
  // Wait for finite CSS animations to finish so axe-core measures final rendered
  // colors, not composited mid-animation values (e.g. opacity fade-ins blending
  // brand purple with the page background would report false contrast failures).
  // Two rAF calls ensure at least one paint has occurred so animations have
  // started before we wait. Infinite animations (decorative loops) are excluded
  // because their `finished` promise never resolves.
  await page.evaluate(async () => {
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve()
    })))
    const finiteAnimations = document.getAnimations().filter(
      a => a.effect?.getTiming().iterations !== Infinity
    )
    await Promise.all(finiteAnimations.map(a => a.finished.catch(() => undefined)))
  })

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
