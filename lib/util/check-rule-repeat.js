module.exports = checkRule

function checkRule(context) {
  var repetition = context.options.ruleRepetition || 3

  if (repetition < 3) {
    throw new Error(
      'Cannot serialize rules with repetition `' +
        repetition +
        '`, expected `3` or more'
    )
  }

  return repetition
}
