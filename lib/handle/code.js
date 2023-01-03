/**
 * @typedef {import('mdast').Code} Code
 * @typedef {import('../types.js').Parent} Parent
 * @typedef {import('../types.js').Context} Context
 * @typedef {import('../types.js').Info} Info
 * @typedef {import('../util/indent-lines.js').Map} Map
 */

import {longestStreak} from 'longest-streak'
import {formatCodeAsIndented} from '../util/format-code-as-indented.js'
import {checkFence} from '../util/check-fence.js'
import {indentLines} from '../util/indent-lines.js'
import {safe} from '../util/safe.js'
import {track} from '../util/track.js'

/**
 * @param {Code} node
 * @param {Parent | undefined} _
 * @param {Context} context
 * @param {Info} info
 * @returns {string}
 */
export function code(node, _, context, info) {
  const marker = checkFence(context)
  const raw = node.value || ''
  const suffix = marker === '`' ? 'GraveAccent' : 'Tilde'

  if (formatCodeAsIndented(node, context)) {
    const exit = context.enter('codeIndented')
    const value = indentLines(raw, map)
    exit()
    return value
  }

  const tracker = track(info)
  const sequence = marker.repeat(Math.max(longestStreak(raw, marker) + 1, 3))
  const exit = context.enter('codeFenced')
  let value = tracker.move(sequence)

  if (node.lang) {
    const subexit = context.enter('codeFencedLang' + suffix)
    value += tracker.move(
      safe(context, node.lang, {
        before: value,
        after: ' ',
        encode: ['`'],
        ...tracker.current()
      })
    )
    subexit()
  }

  if (node.lang && node.meta) {
    const subexit = context.enter('codeFencedMeta' + suffix)
    value += tracker.move(' ')
    value += tracker.move(
      safe(context, node.meta, {
        before: value,
        after: '\n',
        encode: ['`'],
        ...tracker.current()
      })
    )
    subexit()
  }

  value += tracker.move('\n')

  if (raw) {
    value += tracker.move(raw + '\n')
  }

  value += tracker.move(sequence)
  exit()
  return value
}

/** @type {Map} */
function map(line, _, blank) {
  return (blank ? '' : '    ') + line
}
