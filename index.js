/**
 * @typedef {import('./lib/types.js').Info} SafeOptions
 *   To do: remove next major: renamed because it doesn’t really reflect
 *   options, but instead info on the surrounding of the generated thing.
 * @typedef {import('./lib/types.js').State} Context
 *   To do: remove next major: renamed because the word state more clearly
 *   represents one thing that is passed down to everything and is changed.
 */

/**
 * @typedef {import('./lib/types.js').Handle} Handle
 * @typedef {import('./lib/types.js').Handlers} Handlers
 * @typedef {import('./lib/types.js').Info} Info
 * @typedef {import('./lib/types.js').Join} Join
 * @typedef {import('./lib/types.js').Options} Options
 * @typedef {import('./lib/types.js').State} State
 * @typedef {import('./lib/types.js').Unsafe} Unsafe
 * @typedef {import('./lib/util/indent-lines.js').Map} Map
 */

export {toMarkdown} from './lib/index.js'
