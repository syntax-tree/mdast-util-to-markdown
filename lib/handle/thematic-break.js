module.exports = thematicBreak

var repeat = require('repeat-string')
var checkRepeat = require('../util/check-rule-repeat')
var checkRule = require('../util/check-rule')

function thematicBreak(node, parent, context) {
  var rule = checkRule(context)
  var repetition = checkRepeat(context)
  var spaces = context.options.ruleSpaces
  var value = repeat(rule + (spaces ? ' ' : ''), repetition)
  return spaces ? value.slice(0, -1) : value
}
