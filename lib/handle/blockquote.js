/**
 * @typedef {import('mdast').Blockquote} Blockquote
 * @typedef {import('../types.js').Parent} Parent
 * @typedef {import('../types.js').Context} Context
 * @typedef {import('../types.js').Info} Info
 * @typedef {import('../util/indent-lines.js').Map} Map
 */

import {containerFlow} from '../util/container-flow.js'
import {indentLines} from '../util/indent-lines.js'
import {track} from '../util/track.js'

/**
 * @param {Blockquote} node
 * @param {Parent | undefined} _
 * @param {Context} context
 * @param {Info} info
 * @returns {string}
 */
export function blockquote(node, _, context, info) {
  const exit = context.enter('blockquote')
  const tracker = track(info)
  tracker.move('> ')
  tracker.shift(2)
  const value = indentLines(
    containerFlow(node, context, tracker.current()),
    map
  )
  exit()
  return value
}

/** @type {Map} */
function map(line, _, blank) {
  return '>' + (blank ? '' : ' ') + line
}
