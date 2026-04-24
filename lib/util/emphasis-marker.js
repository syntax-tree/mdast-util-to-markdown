/**
 * @import {Emphasis, Parents} from 'mdast'
 * @import {State} from 'mdast-util-to-markdown'
 */

import {checkEmphasis} from './check-emphasis.js'

/**
 * Pick the marker to use for an emphasis node, flipping from the configured
 * marker to its opposite when the configured marker would fuse with an
 * adjacent attention delimiter and re-parse as a different construct.
 *
 * Only emphasis gets the flip. Strong already round-trips through the
 * spec's attention algorithm because a run of 4 asterisks pairs as two
 * strong delimiters, and a run of 6 as three, and so on. Nested emphasis
 * is the asymmetric case: a run of 2 asterisks pairs as one strong, not as
 * two nested emphases, so without a flip `emphasis > emphasis > text`
 * round-trips as `strong > text`.
 *
 * Two situations drive a flip, both narrowly scoped to avoid disturbing
 * shapes the serializer already handles via fusion:
 *
 * 1.  The emphasis is an only child of an attention parent (emphasis or
 *     strong), and both its opening and closing markers would be adjacent
 *     to the parent's primary marker. Using the opposite marker (for
 *     example, `*_a_*` for `emphasis > emphasis > text` with primary
 *     `*`) breaks the fusion.
 *
 * 2.  The emphasis sits at the top of a strict same-type chain of depth at
 *     least 2 (each link has exactly one emphasis child), with primary
 *     `*`. Three-deep emphasis collapses under rule 17 unless the
 *     outermost marker is `_`, because `_`'s flanking rules are stricter
 *     than `*`'s. The check is asymmetric by design: when the configured
 *     marker is already `_`, the adjacency flip in rule 1 alone is enough.
 *
 * @param {Emphasis} node
 * @param {Parents | undefined} parent
 * @param {State} state
 * @param {{before: string, after: string}} info
 *   Only the `before` and `after` fields are read.
 * @returns {'*' | '_'}
 */
export function emphasisMarker(node, parent, state, info) {
  const primary = checkEmphasis(state)
  const other = primary === '*' ? '_' : '*'

  if (
    parent &&
    (parent.type === 'emphasis' || parent.type === 'strong') &&
    'children' in parent &&
    parent.children.length === 1 &&
    info.before.charAt(info.before.length - 1) === primary &&
    info.after.charAt(0) === primary
  ) {
    return other
  }

  if (primary === '*' && strictChainDepth(node) >= 2) return other

  return primary
}

/**
 * Count the depth of a strict single-child emphasis chain descending from
 * `node`. A chain is strict when every link has exactly one child and that
 * child is also `emphasis`.
 *
 * @param {Emphasis} node
 * @returns {number}
 */
function strictChainDepth(node) {
  const children = node.children
  if (!children || children.length !== 1) return 0
  const only = children[0]
  if (only.type !== 'emphasis') return 0
  return 1 + strictChainDepth(only)
}
