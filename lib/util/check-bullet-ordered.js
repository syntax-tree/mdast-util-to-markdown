/**
 * @typedef {import('../types.js').Options} Options
 * @typedef {import('../types.js').State} State
 */

/**
 * @param {State} state
 * @returns {Exclude<Options['bulletOrdered'], null | undefined>}
 */
export function checkBulletOrdered(state) {
  const marker = state.options.bulletOrdered || '.'

  if (marker !== '.' && marker !== ')') {
    throw new Error(
      'Cannot serialize items with `' +
        marker +
        '` for `options.bulletOrdered`, expected `.` or `)`'
    )
  }

  return marker
}
