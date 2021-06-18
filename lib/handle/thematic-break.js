import repeat from 'repeat-string'
import {checkRuleRepeat} from '../util/check-rule-repeat.js'
import {checkRule} from '../util/check-rule.js'

export function thematicBreak(node, parent, context) {
  const value = repeat(
    checkRule(context) + (context.options.ruleSpaces ? ' ' : ''),
    checkRuleRepeat(context)
  )

  return context.options.ruleSpaces ? value.slice(0, -1) : value
}
