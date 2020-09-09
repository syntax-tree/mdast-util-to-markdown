module.exports = checkBullet

function checkBullet(context) {
  var marker = context.options.bullet || '*'

  if (marker !== '*' && marker !== '+' && marker !== '-') {
    throw new Error(
      'Cannot serialize items with `' + marker + '`, expected `*`, `+`, or `-`'
    )
  }

  return marker
}
