/**
 * @import {Options, State} from 'mdast-util-to-markdown'
 */

/**
 * @param {State} state
 * @returns {Exclude<Options['quote'], null | undefined>}
 */
export function checkQuote(state) {
  const marker = state.options.quote || '"'

  if (marker !== '"' && marker !== "'") {
    throw new Error(
      'Cannot serialize title with `' +
        marker +
        '` for `options.quote`, expected `"`, or `\'`'
    )
  }

  return marker
}
