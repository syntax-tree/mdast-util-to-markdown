module.exports = flow

var repeat = require('repeat-string')

function flow(parent, context) {
  var children = parent.children || []
  var length = children.length
  var next = children[0]
  var results = []
  var index = -1
  var child

  while (++index < length) {
    child = next
    next = children[index + 1]

    results.push(
      context.handle(child, parent, context, {before: '\n', after: '\n'})
    )

    if (next) {
      results.push(between(child, next))
    }
  }

  return results.join('')

  function between(left, right) {
    var index = -1
    var result

    while (++index < context.join.length) {
      result = context.join[index](left, right, parent, context)

      if (result === true || result === 1) {
        break
      }

      if (typeof result === 'number') {
        return repeat('\n', 1 + Number(result))
      }

      if (result === false) {
        return '\n\n<!---->\n\n'
      }
    }

    return '\n\n'
  }
}
