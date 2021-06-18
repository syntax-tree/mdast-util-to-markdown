/**
 * @typedef {import('mdast').Heading} Heading
 * @typedef {import('../types.js').Handle} Handle
 * @typedef {import('../types.js').Exit} Exit
 */

import {formatHeadingAsSetext} from '../util/format-heading-as-setext.js'
import {containerPhrasing} from '../util/container-phrasing.js'

/**
 * @type {Handle}
 * @param {Heading} node
 */
export function heading(node, _, context) {
  const rank = Math.max(Math.min(6, node.depth || 1), 1)
  /** @type {Exit} */
  let exit
  /** @type {Exit} */
  let subexit
  /** @type {string} */
  let value

  if (formatHeadingAsSetext(node, context)) {
    exit = context.enter('headingSetext')
    subexit = context.enter('phrasing')
    value = containerPhrasing(node, context, {before: '\n', after: '\n'})
    subexit()
    exit()

    return (
      value +
      '\n' +
      (rank === 1 ? '=' : '-').repeat(
        // The whole size…
        value.length -
          // Minus the position of the character after the last EOL (or
          // 0 if there is none)…
          (Math.max(value.lastIndexOf('\r'), value.lastIndexOf('\n')) + 1)
      )
    )
  }

  const sequence = '#'.repeat(rank)
  exit = context.enter('headingAtx')
  subexit = context.enter('phrasing')
  value = containerPhrasing(node, context, {before: '# ', after: '\n'})
  value = value ? sequence + ' ' + value : sequence
  if (context.options.closeAtx) {
    value += ' ' + sequence
  }

  subexit()
  exit()

  return value
}
