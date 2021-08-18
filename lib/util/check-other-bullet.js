/**
 * @typedef {import('../types.js').Context} Context
 * @typedef {import('../types.js').Options} Options
 */

import {checkBullet} from './check-bullet.js'

/**
 * @param {Context} context
 * @returns {Exclude<Options['bullet'], undefined>}
 */
export function checkOtherBullet(context) {
  const bullet = checkBullet(context)
  const otherBullet = context.options.otherBullet

  if (!otherBullet) {
    return bullet === '*' ? '-' : '*'
  }

  if (otherBullet !== '*' && otherBullet !== '+' && otherBullet !== '-') {
    throw new Error(
      'Cannot serialize items with `' +
        otherBullet +
        '` for `options.otherBullet`, expected `*`, `+`, or `-`'
    )
  }

  if (otherBullet === bullet) {
    throw new Error(
      'Expected `bullet` (`' +
        bullet +
        '`) and `otherBullet` (`' +
        otherBullet +
        '`) to be different'
    )
  }

  return otherBullet
}
