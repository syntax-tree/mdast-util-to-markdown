/**
 * @typedef {import('mdast').Strong} Strong
 * @typedef {import('../types.js').Parent} Parent
 * @typedef {import('../types.js').Context} Context
 * @typedef {import('../types.js').Info} Info
 */

import {checkStrong} from '../util/check-strong.js'
import {containerPhrasing} from '../util/container-phrasing.js'
import {track} from '../util/track.js'

strong.peek = strongPeek

// To do: there are cases where emphasis cannot “form” depending on the
// previous or next character of sequences.
// There’s no way around that though, except for injecting zero-width stuff.
// Do we need to safeguard against that?
/**
 * @param {Strong} node
 * @param {Parent | undefined} _
 * @param {Context} context
 * @param {Info} info
 * @returns {string}
 */
export function strong(node, _, context, info) {
  const marker = checkStrong(context)
  const exit = context.enter('strong')
  const tracker = track(info)
  let value = tracker.move(marker + marker)
  value += tracker.move(
    containerPhrasing(node, context, {
      before: value,
      after: marker,
      ...tracker.current()
    })
  )
  value += tracker.move(marker + marker)
  exit()
  return value
}

/**
 * @param {Strong} _
 * @param {Parent | undefined} _1
 * @param {Context} context
 * @returns {string}
 */
function strongPeek(_, _1, context) {
  return context.options.strong || '*'
}
