import { getLumenIcon, type LumenIconNode } from '@santi020k/lumen-core'
import type { Element } from 'hast'

const iconNode = ([tagName, properties, children = []]: LumenIconNode): Element => ({
  children: children.map(iconNode), properties: { ...properties }, tagName, type: 'element'
})

/** Public Lumen scroll-cue markup for build-time Markdown rendering. */
export const createLumenScrollCue = (id: string, label: string): Element => ({
  children: [{
    children: getLumenIcon('move-horizontal')?.node.map(iconNode) ?? [],
    properties: {
      ariaHidden: 'true',
      fill: 'none',
      focusable: 'false',
      stroke: 'currentColor',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: '2',
      viewBox: '0 0 24 24'
    },
    tagName: 'svg',
    type: 'element'
  }, {
    children: [{ type: 'text', value: label }], properties: {}, tagName: 'span', type: 'element'
  }],
  properties: {
    className: ['ui-scroll-cue'], dataScrollCueMessage: '', dataSlot: 'scroll-cue', hidden: true, id
  },
  tagName: 'div',
  type: 'element'
})
