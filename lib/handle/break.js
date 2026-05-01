/**
 * @import {Break, Parents} from 'mdast'
 * @import {Info, State} from 'mdast-util-to-markdown'
 */

import {patternInScope} from '../util/pattern-in-scope.js'

/**
 * @param {Break} _
 * @param {Parents | undefined} _1
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
export function hardBreak(_, _1, state, info) {
  let index = -1

  while (++index < state.unsafe.length) {
    // If we can't put eols in this construct (setext headings, tables), use a
    // space instead.
    if (
      state.unsafe[index].character === '\n' &&
      patternInScope(state.stack, state.unsafe[index])
    ) {
      return /[ \t]/.test(info.before) ? '' : ' '
    }
  }

  // A trailing `\` at the end of a paragraph is not a hard break — CommonMark
  // treats it as a literal backslash.  Skip the break to avoid roundtrip loss.
  if (
    _1 &&
    'children' in _1 &&
    _1.children[_1.children.length - 1] === _
  ) {
    return ''
  }

  return '\\\n'
}
