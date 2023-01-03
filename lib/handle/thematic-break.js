/**
 * @typedef {import('mdast').ThematicBreak} ThematicBreak
 * @typedef {import('../types.js').Parent} Parent
 * @typedef {import('../types.js').Context} Context
 */

import {checkRuleRepetition} from '../util/check-rule-repetition.js'
import {checkRule} from '../util/check-rule.js'

/**
 * @param {ThematicBreak} _
 * @param {Parent | undefined} _1
 * @param {Context} context
 * @returns {string}
 */
export function thematicBreak(_, _1, context) {
  const value = (
    checkRule(context) + (context.options.ruleSpaces ? ' ' : '')
  ).repeat(checkRuleRepetition(context))

  return context.options.ruleSpaces ? value.slice(0, -1) : value
}
