/**
 * @typedef {import('mdast').List} List
 * @typedef {import('../types.js').Handle} Handle
 */

import {containerFlow} from '../util/container-flow.js'

/**
 * @type {Handle}
 * @param {List} node
 */
export function list(node, _, context) {
  const exit = context.enter('list')
  const value = containerFlow(node, context)
  exit()
  return value
}
