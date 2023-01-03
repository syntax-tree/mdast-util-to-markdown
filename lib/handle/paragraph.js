/**
 * @typedef {import('mdast').Paragraph} Paragraph
 * @typedef {import('../types.js').Parent} Parent
 * @typedef {import('../types.js').Context} Context
 * @typedef {import('../types.js').Info} Info
 */

import {containerPhrasing} from '../util/container-phrasing.js'

/**
 * @param {Paragraph} node
 * @param {Parent | undefined} _
 * @param {Context} context
 * @param {Info} info
 * @returns {string}
 */
export function paragraph(node, _, context, info) {
  const exit = context.enter('paragraph')
  const subexit = context.enter('phrasing')
  const value = containerPhrasing(node, context, info)
  subexit()
  exit()
  return value
}
