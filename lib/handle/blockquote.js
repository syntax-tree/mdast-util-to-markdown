/**
 * @typedef {import('mdast').Blockquote} Blockquote
 * @typedef {import('../types.js').Parent} Parent
 * @typedef {import('../types.js').State} State
 * @typedef {import('../types.js').Info} Info
 * @typedef {import('../types.js').Map} Map
 */

import {containerFlow} from '../util/container-flow.js'
import {track} from '../util/track.js'

/**
 * @param {Blockquote} node
 * @param {Parent | undefined} _
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
export function blockquote(node, _, state, info) {
  const exit = state.enter('blockquote')
  const tracker = track(info)
  tracker.move('> ')
  tracker.shift(2)
  const value = state.indentLines(
    containerFlow(node, state, tracker.current()),
    map
  )
  exit()
  return value
}

/** @type {Map} */
function map(line, _, blank) {
  return '>' + (blank ? '' : ' ') + line
}
