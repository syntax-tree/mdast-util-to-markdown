/**
 * @typedef {import('mdast').List} List
 * @typedef {import('../types.js').Handle} Handle
 */

import {containerFlow} from '../util/container-flow.js'
import {checkBullet} from '../util/check-bullet.js'
import {checkOtherBullet} from '../util/check-other-bullet.js'
import {checkRule} from '../util/check-rule.js'

/**
 * @type {Handle}
 * @param {List} node
 */
export function list(node, _, context) {
  const exit = context.enter('list')
  const currentBullet = context.currentBullet
  /** @type {string} */
  let bullet = checkBullet(context)
  const otherBullet = checkOtherBullet(context)

  if (node.ordered) {
    bullet = '.'
  } else {
    const firstListItem = node.children ? node.children[0] : undefined
    let useDifferentMarker = false

    // If there’s an empty first list item, directly in two list items,
    // we have to use a different bullet:
    //
    // ```markdown
    // * - *
    // ```
    //
    // …because otherwise it would become one big thematic break.
    if (
      firstListItem &&
      // Empty list item:
      (!firstListItem.children || !firstListItem.children[0]) &&
      // Directly in two other list items:
      context.stack[context.stack.length - 2] === 'listItem' &&
      context.stack[context.stack.length - 4] === 'listItem'
    ) {
      // Note: this is only needed for first children of first children,
      // but the code checks for *children*, not *first*.
      // So this might generate different bullets where not really needed.
      useDifferentMarker = true
    }

    // If there’s a thematic break at the start of the first list item,
    // we have to use a different bullet:
    //
    // ```markdown
    // * ---
    // ```
    //
    // …because otherwise it would become one big thematic break.
    if (checkRule(context) === bullet && firstListItem) {
      let index = -1

      while (++index < node.children.length) {
        const item = node.children[index]
        if (
          item &&
          item.type === 'listItem' &&
          item.children &&
          item.children[0] &&
          item.children[0].type === 'thematicBreak'
        ) {
          useDifferentMarker = true
          break
        }
      }
    }

    if (useDifferentMarker) {
      bullet = otherBullet
    }
  }

  context.currentBullet = bullet
  const value = containerFlow(node, context)
  context.currentBullet = currentBullet
  exit()
  return value
}
