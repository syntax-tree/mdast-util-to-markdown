/**
 * @typedef {import('mdast').Text} Text
 * @typedef {import('../types.js').Parent} Parent
 * @typedef {import('../types.js').Context} Context
 * @typedef {import('../types.js').Info} Info
 */

import {safe} from '../util/safe.js'

/**
 * @param {Text} node
 * @param {Parent | undefined} _
 * @param {Context} context
 * @param {Info} info
 * @returns {string}
 */
export function text(node, _, context, info) {
  return safe(context, node.value, info)
}
