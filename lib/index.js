/**
 * @typedef {import('./types.js').Node} Node
 * @typedef {import('./types.js').Options} Options
 * @typedef {import('./types.js').State} State
 * @typedef {import('./types.js').Join} Join
 * @typedef {import('./types.js').Enter} Enter
 */

import {zwitch} from 'zwitch'
import {configure} from './configure.js'
import {handle as handlers} from './handle/index.js'
import {join} from './join.js'
import {unsafe} from './unsafe.js'

/**
 * Turn an mdast syntax tree into markdown.
 *
 * @param {Node} tree
 *   Tree to serialize.
 * @param {Options} [options]
 *   Configuration (optional).
 * @returns {string}
 *   Serialized markdown representing `tree`.
 */
export function toMarkdown(tree, options = {}) {
  /** @type {State} */
  const state = {
    enter,
    stack: [],
    unsafe: [],
    join: [],
    // @ts-expect-error: we’ll fill it next.
    handlers: {},
    options: {},
    indexStack: [],
    // @ts-expect-error: we’ll add `handle` later.
    handle: undefined
  }

  configure(state, {unsafe, join, handlers})
  configure(state, options)

  if (state.options.tightDefinitions) {
    configure(state, {join: [joinDefinition]})
  }

  state.handle = zwitch('type', {
    invalid,
    unknown,
    handlers: state.handlers
  })

  let result = state.handle(tree, undefined, state, {
    before: '\n',
    after: '\n',
    now: {line: 1, column: 1},
    lineShift: 0
  })

  if (
    result &&
    result.charCodeAt(result.length - 1) !== 10 &&
    result.charCodeAt(result.length - 1) !== 13
  ) {
    result += '\n'
  }

  return result

  /** @type {Enter} */
  function enter(name) {
    state.stack.push(name)
    return exit

    function exit() {
      state.stack.pop()
    }
  }
}

/**
 * @param {unknown} value
 * @returns {never}
 */
function invalid(value) {
  throw new Error('Cannot handle value `' + value + '`, expected node')
}

/**
 * @param {unknown} node
 * @returns {never}
 */
function unknown(node) {
  // @ts-expect-error: fine.
  throw new Error('Cannot handle unknown node `' + node.type + '`')
}

/** @type {Join} */
function joinDefinition(left, right) {
  // No blank line between adjacent definitions.
  if (left.type === 'definition' && left.type === right.type) {
    return 0
  }
}
