/**
 * @import {Join} from 'mdast-util-to-markdown'
 */

import {formatCodeAsIndented} from './util/format-code-as-indented.js'
import {formatHeadingAsSetext} from './util/format-heading-as-setext.js'
import {htmlKind} from './util/html-kind.js'

/** @type {Array<Join>} */
export const join = [joinDefaults]

/**
 * Default join function.
 *
 * @type {Join}
 */
function joinDefaults(left, right, parent, state) {
  // Indented code after list or another indented code.
  if (
    right.type === 'code' &&
    formatCodeAsIndented(right, state) &&
    (left.type === 'list' ||
      (left.type === right.type && formatCodeAsIndented(left, state)))
  ) {
    return false
  }

  // Join children of a list or an item.
  // In which case, `parent` has a `spread` field.
  if ('spread' in parent && typeof parent.spread === 'boolean') {
    if (
      left.type === 'paragraph' &&
      // Two paragraphs.
      (left.type === right.type ||
        right.type === 'definition' ||
        // Paragraph followed by a setext heading.
        (right.type === 'heading' && formatHeadingAsSetext(right, state)))
    ) {
      return
    }

    // HTML that only ends at a blank line followed by something.
    if (left.type === 'html') {
      const kind = htmlKind(left.value)
      if (kind === undefined || kind === 6 || kind === 7) return 1
    }

    // HTML that cannot interrupt a paragraph (kind 7) after one.
    if (left.type === 'paragraph' && right.type === 'html') {
      const kind = htmlKind(right.value)
      if (kind === undefined || kind === 7) return 1
    }

    return parent.spread ? 1 : 0
  }
}
