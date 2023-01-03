/**
 * @typedef {import('mdast').Heading} Heading
 * @typedef {import('../types.js').Parent} Parent
 * @typedef {import('../types.js').Context} Context
 * @typedef {import('../types.js').Info} Info
 */

import {formatHeadingAsSetext} from '../util/format-heading-as-setext.js'
import {containerPhrasing} from '../util/container-phrasing.js'
import {track} from '../util/track.js'

/**
 * @param {Heading} node
 * @param {Parent | undefined} _
 * @param {Context} context
 * @param {Info} info
 * @returns {string}
 */
export function heading(node, _, context, info) {
  const rank = Math.max(Math.min(6, node.depth || 1), 1)
  const tracker = track(info)

  if (formatHeadingAsSetext(node, context)) {
    const exit = context.enter('headingSetext')
    const subexit = context.enter('phrasing')
    const value = containerPhrasing(node, context, {
      ...tracker.current(),
      before: '\n',
      after: '\n'
    })
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
  const exit = context.enter('headingAtx')
  const subexit = context.enter('phrasing')

  // Note: for proper tracking, we should reset the output positions when there
  // is no content returned, because then the space is not output.
  // Practically, in that case, there is no content, so it doesn’t matter that
  // we’ve tracked one too many characters.
  tracker.move(sequence + ' ')

  let value = containerPhrasing(node, context, {
    before: '# ',
    after: '\n',
    ...tracker.current()
  })

  if (/^[\t ]/.test(value)) {
    // To do: what effect has the character reference on tracking?
    value =
      '&#x' +
      value.charCodeAt(0).toString(16).toUpperCase() +
      ';' +
      value.slice(1)
  }

  value = value ? sequence + ' ' + value : sequence

  if (context.options.closeAtx) {
    value += ' ' + sequence
  }

  subexit()
  exit()

  return value
}
