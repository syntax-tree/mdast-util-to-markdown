/**
 * @typedef {import('mdast').Parents} Parents
 * @typedef {import('mdast').Root} Root
 * @typedef {import('../types.js').Info} Info
 * @typedef {import('../types.js').State} State
 */

import {phrasing} from 'mdast-util-phrasing'

/**
 * @param {Root} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
export function root(node, _, state, info) {
  // Note: `html` nodes are ambiguous.
  const hasPhrasing = node.children.some(function (d) {
    return phrasing(d)
  })

  const container = hasPhrasing ? state.containerPhrasing : state.containerFlow
  return container.call(state, node, info)
}
