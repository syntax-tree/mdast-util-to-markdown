/**
 * @import {Info, State} from 'mdast-util-to-markdown'
 * @import {Emphasis, Parents} from 'mdast'
 */

import {emphasisMarker} from '../util/emphasis-marker.js'
import {encodeCharacterReference} from '../util/encode-character-reference.js'
import {encodeInfo} from '../util/encode-info.js'

emphasis.peek = emphasisPeek

/**
 * @param {Emphasis} node
 * @param {Parents | undefined} parent
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
export function emphasis(node, parent, state, info) {
  const marker = emphasisMarker(node, parent, state, info)
  const exit = state.enter('emphasis')
  const tracker = state.createTracker(info)
  const before = tracker.move(marker)

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

  const after = tracker.move(marker)

  exit()

  state.attentionEncodeSurroundingInfo = {
    after: close.outside,
    before: open.outside
  }
  return before + between + after
}

/**
 * @param {Emphasis} node
 * @param {Parents | undefined} parent
 * @param {State} state
 * @returns {string}
 */
function emphasisPeek(node, parent, state) {
  return emphasisMarker(node, parent, state, {before: '', after: ''})
}
