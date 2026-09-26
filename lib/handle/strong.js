/**
 * @import {Info, State} from 'mdast-util-to-markdown'
 * @import {Parents, Strong} from 'mdast'
 */

import {checkStrong} from '../util/check-strong.js'
import {encodeCharacterReference} from '../util/encode-character-reference.js'
import {encodeInfo} from '../util/encode-info.js'

strong.peek = strongPeek

/**
 * Serialize a strong node.
 *
 * @param {Strong} node
 *   Node to serialize.
 * @param {Parents | undefined} _
 *   Parent node.
 * @param {State} state
 *   Info passed around.
 * @param {Info} info
 *   Info on surrounding context.
 * @returns {string}
 *   Serialized markdown.
 */
export function strong(node, _, state, info) {
  const marker = checkStrong(state)
  const exit = state.enter('strong')
  const tracker = state.createTracker(info)
  const before = tracker.move(marker + marker)

  let between = tracker.move(
    state.containerPhrasing(node, {
      after: marker,
      before,
      ...tracker.current()
    })
  )
  const betweenHead = between.charCodeAt(0)
  const open = encodeInfo(
    info.before.charCodeAt(info.before.length - 1),
    betweenHead,
    marker
  )

  if (open.inside) {
    between = encodeCharacterReference(betweenHead) + between.slice(1)
  }

  const betweenTail = between.charCodeAt(between.length - 1)
  const close = encodeInfo(info.after.charCodeAt(0), betweenTail, marker)

  if (close.inside) {
    between = between.slice(0, -1) + encodeCharacterReference(betweenTail)
  }

  const after = tracker.move(marker + marker)

  exit()

  state.attentionEncodeSurroundingInfo = {
    after: close.outside,
    before: open.outside
  }
  return before + between + after
}

/**
 * Peek at this node.
 *
 * @param {Strong} _
 *   Node to serialize.
 * @param {Parents | undefined} _1
 *   Parent node.
 * @param {State} state
 *   Info passed around.
 * @returns {string}
 *   Start of the serialized markdown.
 */
function strongPeek(_, _1, state) {
  return state.options.strong || '*'
}
