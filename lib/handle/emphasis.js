/**
 * @import {Info, State} from 'mdast-util-to-markdown'
 * @import {Emphasis, Parents} from 'mdast'
 */

import {checkEmphasis} from '../util/check-emphasis.js'

emphasis.peek = emphasisPeek

// To do: there are cases where emphasis cannot “form” depending on the
// previous or next character of sequences.
// There’s no way around that though, except for injecting zero-width stuff.
// Do we need to safeguard against that?
/**
 * @param {Emphasis} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
export function emphasis(node, _, state, info) {
  const marker = checkEmphasis(state)
  const exit = state.enter('emphasis')
  const tracker = state.createTracker(info)
  let value = tracker.move(marker)
  value += tracker.move(
    state.containerPhrasing(node, {
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
 * @param {Parents | undefined} _1
 * @param {State} state
 * @returns {string}
 */
function emphasisPeek(_, _1, state) {
  return state.options.emphasis || '*'
}
