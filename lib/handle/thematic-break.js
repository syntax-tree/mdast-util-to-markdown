/**
 * @typedef {import('../types.js').Handle} Handle
 */

import {checkRuleRepeat} from '../util/check-rule-repeat.js'
import {checkRule} from '../util/check-rule.js'

/**
 * @type {Handle}
 */
export function thematicBreak(_, _1, context) {
  const value = (
    checkRule(context) + (context.options.ruleSpaces ? ' ' : '')
  ).repeat(checkRuleRepeat(context))

  return context.options.ruleSpaces ? value.slice(0, -1) : value
}
