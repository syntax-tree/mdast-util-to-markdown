/**
 * @import {Handle, Info, State} from 'mdast-util-to-markdown'
 * @import {PhrasingParents} from '../types.js'
 */

import {encodeCharacterReference} from './encode-character-reference.js'

/**
 * Get the last character of `value`, as a full Unicode code point.
 *
 * Using `value.slice(-1)` would split a surrogate pair (an astral plane
 * character, such as most emoji) in half, keeping only the low surrogate.
 *
 * @param {string} value
 * @returns {string}
 */
function lastCharacter(value) {
  const code = value.charCodeAt(value.length - 1)

  if (code >= 0xdc_00 && code <= 0xdf_ff && value.length > 1) {
    const previousCode = value.charCodeAt(value.length - 2)

    if (previousCode >= 0xd8_00 && previousCode <= 0xdb_ff) {
      return value.slice(-2)
    }
  }

  return value.slice(-1)
}

/**
 * Get the first character of `value`, as a full Unicode code point.
 *
 * Using `value.charAt(0)` / `value.slice(0, 1)` would split a surrogate
 * pair (an astral plane character, such as most emoji) in half, keeping
 * only the high surrogate.
 *
 * @param {string} value
 * @returns {string}
 */
function firstCharacter(value) {
  const code = value.charCodeAt(0)

  if (code >= 0xd8_00 && code <= 0xdb_ff && value.length > 1) {
    const nextCode = value.charCodeAt(1)

    if (nextCode >= 0xdc_00 && nextCode <= 0xdf_ff) {
      return value.slice(0, 2)
    }
  }

  return value.slice(0, 1)
}

/**
 * Serialize the children of a parent that contains phrasing children.
 *
 * These children will be joined flush together.
 *
 * @param {PhrasingParents} parent
 *   Parent of flow nodes.
 * @param {State} state
 *   Info passed around about the current state.
 * @param {Info} info
 *   Info on where we are in the document we are generating.
 * @returns {string}
 *   Serialized children, joined together.
 */
export function containerPhrasing(parent, state, info) {
  const indexStack = state.indexStack
  const children = parent.children || []
  /** @type {Array<string>} */
  const results = []
  let index = -1
  let before = info.before
  /** @type {string | undefined} */
  let encodeAfter

  indexStack.push(-1)
  let tracker = state.createTracker(info)

  while (++index < children.length) {
    const child = children[index]
    /** @type {string} */
    let after

    indexStack[indexStack.length - 1] = index

    if (index + 1 < children.length) {
      /** @type {Handle} */
      // @ts-expect-error: hush, it’s actually a `zwitch`.
      let handle = state.handle.handlers[children[index + 1].type]
      /** @type {Handle} */
      // @ts-expect-error: hush, it’s actually a `zwitch`.
      if (handle && handle.peek) handle = handle.peek
      after = handle
        ? firstCharacter(
            handle(children[index + 1], parent, state, {
              before: '',
              after: '',
              ...tracker.current()
            })
          )
        : ''
    } else {
      after = info.after
    }

    // In some cases, html (text) can be found in phrasing right after an eol.
    // When we’d serialize that, in most cases that would be seen as html
    // (flow).
    // As we can’t escape or so to prevent it from happening, we take a somewhat
    // reasonable approach: replace that eol with a space.
    // See: <https://github.com/syntax-tree/mdast-util-to-markdown/issues/15>
    if (
      results.length > 0 &&
      (before === '\r' || before === '\n') &&
      child.type === 'html'
    ) {
      results[results.length - 1] = results[results.length - 1].replace(
        /(\r?\n|\r)$/,
        ' '
      )
      before = ' '

      // To do: does this work to reset tracker?
      tracker = state.createTracker(info)
      tracker.move(results.join(''))
    }

    let value = state.handle(child, parent, state, {
      ...tracker.current(),
      after,
      before
    })

    // If we had to encode the first character after the previous node and it’s
    // still the same character,
    // encode it.
    if (encodeAfter && encodeAfter === firstCharacter(value)) {
      value =
        encodeCharacterReference(encodeAfter.codePointAt(0) || 0) +
        value.slice(encodeAfter.length)
    }

    const encodingInfo = state.attentionEncodeSurroundingInfo
    state.attentionEncodeSurroundingInfo = undefined
    encodeAfter = undefined

    // If we have to encode the first character before the current node and
    // it’s still the same character,
    // encode it.
    if (encodingInfo) {
      if (
        results.length > 0 &&
        encodingInfo.before &&
        before === lastCharacter(results[results.length - 1])
      ) {
        const previous = results[results.length - 1]
        results[results.length - 1] =
          previous.slice(0, previous.length - before.length) +
          encodeCharacterReference(before.codePointAt(0) || 0)
      }

      if (encodingInfo.after) encodeAfter = after
    }

    tracker.move(value)
    results.push(value)
    before = lastCharacter(value)
  }

  indexStack.pop()

  return results.join('')
}
