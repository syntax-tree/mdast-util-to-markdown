/**
 * @typedef {import('mdast').Break} Break
 * @typedef {import('../types.js').Parent} Parent
 * @typedef {import('../types.js').Context} Context
 * @typedef {import('../types.js').Info} Info
 */

import {patternInScope} from '../util/pattern-in-scope.js'

/**
 * @param {Break} _
 * @param {Parent | undefined} _1
 * @param {Context} context
 * @param {Info} info
 * @returns {string}
 */
export function hardBreak(_, _1, context, info) {
  let index = -1

  while (++index < context.unsafe.length) {
    // If we can’t put eols in this construct (setext headings, tables), use a
    // space instead.
    if (
      context.unsafe[index].character === '\n' &&
      patternInScope(context.stack, context.unsafe[index])
    ) {
      return /[ \t]/.test(info.before) ? '' : ' '
    }
  }

  return '\\\n'
}
