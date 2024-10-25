/**
 * @import {Info, State} from 'mdast-util-to-markdown'
 * @import {Parents, Strong} from 'mdast'
 */

import {checkStrong} from '../util/check-strong.js'

strong.peek = strongPeek

// To do: there are cases where emphasis cannot “form” depending on the
// previous or next character of sequences.
// There’s no way around that though, except for injecting zero-width stuff.
// Do we need to safeguard against that?
/**
 * @param {Strong} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
export function strong(node, _, state, info) {
  const marker = checkStrong(state)
  const exit = state.enter('strong')
  const tracker = state.createTracker(info)
  let value = tracker.move(marker + marker)
  value += tracker.move(
    state.containerPhrasing(node, {
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
 * @param {Parents | undefined} _1
 * @param {State} state
 * @returns {string}
 */
function strongPeek(_, _1, state) {
  return state.options.strong || '*'
}
