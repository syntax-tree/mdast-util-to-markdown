/**
 * @typedef {import('../types.js').Options} Options
 * @typedef {import('../types.js').State} State
 */

/**
 * @param {State} state
 * @returns {Exclude<Options['bullet'], null | undefined>}
 */
export function checkBullet(state) {
  const marker = state.options.bullet || '*'

  if (marker !== '*' && marker !== '+' && marker !== '-') {
    throw new Error(
      'Cannot serialize items with `' +
        marker +
        '` for `options.bullet`, expected `*`, `+`, or `-`'
    )
  }

  return marker
}
