/**
 * Encode a code point as a character reference.
 *
 * @param {number | undefined} code
 *   Code point to encode.
 * @returns {string}
 *   Encoded character reference; or empty string if `code` is `undefined`.
 */
export function encodeCharacterReference(code) {
  if (code === undefined) return ''
  return '&#x' + code.toString(16).toUpperCase() + ';'
}
