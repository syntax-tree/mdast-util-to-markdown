/**
 * @typedef {import('mdast').Heading} Heading
 * @typedef {import('../types.js').Context} Context
 */

import {toString} from 'mdast-util-to-string'

/**
 * @param {Heading} node
 * @param {Context} context
 * @returns {boolean}
 */
export function formatHeadingAsSetext(node, context) {
  return Boolean(
    context.options.setext && (!node.depth || node.depth < 3) && toString(node)
  )
}
