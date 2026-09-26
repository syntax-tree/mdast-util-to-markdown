/**
 * @import {Break, Parents} from 'mdast'
 * @import {Info, State} from 'mdast-util-to-markdown'
 */

import {patternInScope} from '../util/pattern-in-scope.js'

/**
 * Serialize a break node.
 *
 * @param {Break} _
 *   Node to serialize.
 * @param {Parents | undefined} _1
 *   Parent node.
 * @param {State} state
 *   Info passed around.
 * @param {Info} info
 *   Info on surrounding context.
 * @returns {string}
 *   Serialized markdown.
 */
export function hardBreak(_, _1, state, info) {
  let index = -1

  while (++index < state.unsafe.length) {
    // If we can’t put eols in this construct (setext headings, tables), use a
    // space instead.
    if (
      state.unsafe[index].character === '\n' &&
      patternInScope(state.stack, state.unsafe[index])
    ) {
      return /[\t ]/.test(info.before) ? '' : ' '
    }
  }

  return '\\\n'
}
