/**
 * @typedef {import('mdast').Emphasis} Emphasis
 * @typedef {import('../types.js').Parent} Parent
 * @typedef {import('../types.js').Context} Context
 * @typedef {import('../types.js').Info} Info
 */

import {checkEmphasis} from '../util/check-emphasis.js'
import {containerPhrasing} from '../util/container-phrasing.js'
import {track} from '../util/track.js'

emphasis.peek = emphasisPeek

// To do: there are cases where emphasis cannot “form” depending on the
// previous or next character of sequences.
// There’s no way around that though, except for injecting zero-width stuff.
// Do we need to safeguard against that?
/**
 * @param {Emphasis} node
 * @param {Parent | undefined} _
 * @param {Context} context
 * @param {Info} info
 * @returns {string}
 */
export function emphasis(node, _, context, info) {
  const marker = checkEmphasis(context)
  const exit = context.enter('emphasis')
  const tracker = track(info)
  let value = tracker.move(marker)
  value += tracker.move(
    containerPhrasing(node, context, {
      before: value,
      after: marker,
      ...tracker.current()
    })
  )
  value += tracker.move(marker)
  exit()
  return value
}

/**
 * @param {Emphasis} _
 * @param {Parent | undefined} _1
 * @param {Context} context
 * @returns {string}
 */
function emphasisPeek(_, _1, context) {
  return context.options.emphasis || '*'
}
