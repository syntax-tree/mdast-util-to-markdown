/**
 * @typedef {import('mdast').Definition} Definition
 * @typedef {import('../types.js').Parent} Parent
 * @typedef {import('../types.js').Context} Context
 * @typedef {import('../types.js').Info} Info
 */

import {association} from '../util/association.js'
import {checkQuote} from '../util/check-quote.js'
import {safe} from '../util/safe.js'
import {track} from '../util/track.js'

/**
 * @param {Definition} node
 * @param {Parent | undefined} _
 * @param {Context} context
 * @param {Info} info
 * @returns {string}
 */
export function definition(node, _, context, info) {
  const quote = checkQuote(context)
  const suffix = quote === '"' ? 'Quote' : 'Apostrophe'
  const exit = context.enter('definition')
  let subexit = context.enter('label')
  const tracker = track(info)
  let value = tracker.move('[')
  value += tracker.move(
    safe(context, association(node), {
      before: value,
      after: ']',
      ...tracker.current()
    })
  )
  value += tracker.move(']: ')

  subexit()

  if (
    // If there’s no url, or…
    !node.url ||
    // If there are control characters or whitespace.
    /[\0- \u007F]/.test(node.url)
  ) {
    subexit = context.enter('destinationLiteral')
    value += tracker.move('<')
    value += tracker.move(
      safe(context, node.url, {before: value, after: '>', ...tracker.current()})
    )
    value += tracker.move('>')
  } else {
    // No whitespace, raw is prettier.
    subexit = context.enter('destinationRaw')
    value += tracker.move(
      safe(context, node.url, {
        before: value,
        after: node.title ? ' ' : '\n',
        ...tracker.current()
      })
    )
  }

  subexit()

  if (node.title) {
    subexit = context.enter('title' + suffix)
    value += tracker.move(' ' + quote)
    value += tracker.move(
      safe(context, node.title, {
        before: value,
        after: quote,
        ...tracker.current()
      })
    )
    value += tracker.move(quote)
    subexit()
  }

  exit()

  return value
}
