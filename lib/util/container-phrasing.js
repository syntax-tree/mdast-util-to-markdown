/**
 * @import {Handle, Info, State} from 'mdast-util-to-markdown'
 * @import {PhrasingParents} from '../types.js'
 */

import {firstCharacter, lastCharacter} from './character.js'
import {encodeCharacterReference} from './encode-character-reference.js'
import {htmlKind} from './html-kind.js'

/**
 * Serialize the children of a parent that contains phrasing children.
 *
 * These children will be joined flush together.
 *
 * @param {PhrasingParents} parent
 *   Parent of phrasing nodes.
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
    // When we’d serialize that, it could be seen as html (flow): all its kinds
    // except 7 can interrupt a paragraph.
    // As we can’t escape or so to prevent it from happening, we take a somewhat
    // reasonable approach: replace that eol with a space.
    // See: <https://github.com/syntax-tree/mdast-util-to-markdown/issues/15>
    if (
      results.length > 0 &&
      (before === '\r' || before === '\n') &&
      child.type === 'html' &&
      htmlKind(child.value) !== 7
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
        encodeCharacterReference(encodeAfter.codePointAt(0)) +
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
        // Line endings are whitespace, which is fine for attention, and they
        // can be syntax (hard breaks).
        before !== '\n' &&
        before !== '\r' &&
        before === lastCharacter(results[results.length - 1])
      ) {
        const previous = results[results.length - 1]
        results[results.length - 1] =
          previous.slice(0, previous.length - before.length) +
          encodeCharacterReference(before.codePointAt(0))
      }

      if (encodingInfo.after) encodeAfter = after
    }

    // Ignore empty results, so that `before` is the character before.
    if (!value) {
      continue
    }

    tracker.move(value)
    results.push(value)
    before = lastCharacter(value)
  }

  indexStack.pop()

  return results.join('')
}
