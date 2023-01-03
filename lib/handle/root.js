/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('../types.js').Parent} Parent
 * @typedef {import('../types.js').Context} Context
 * @typedef {import('../types.js').Info} Info
 */

import {containerFlow} from '../util/container-flow.js'

/**
 * @param {Root} node
 * @param {Parent | undefined} _
 * @param {Context} context
 * @param {Info} info
 * @returns {string}
 */
export function root(node, _, context, info) {
  return containerFlow(node, context, info)
}
