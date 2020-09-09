module.exports = checkRule

function checkRule(context) {
  var marker = context.options.rule || '*'

  if (marker !== '*' && marker !== '-' && marker !== '_') {
    throw new Error(
      'Cannot serialize rules with `' + marker + '`, expected `*`, `-`, or `_`'
    )
  }

  return marker
}
