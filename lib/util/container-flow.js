module.exports = flow

var formatCodeAsIndented = require('../util/format-code-as-indented')

function flow(parent, context) {
  var children = parent.children || []
  var length = children.length
  var index = -1
  var results = []
  var next = children[0]
  // Act as if we’re between eols, because we are.
  var safeOptions = {before: '\n', after: '\n'}
  var child
  var after

  while (++index < length) {
    child = next
    next = children[index + 1]

    results.push(context.handle(child, parent, context, safeOptions))

    if (next) {
      if (
        child.type === 'list' &&
        ((next.type === 'code' && formatCodeAsIndented(next, context)) ||
          (child.type === next.type &&
            Boolean(child.ordered) === Boolean(next.ordered)))
      ) {
        after = '\n\n<!---->\n\n'
      } else if (
        parent.spread === false ||
        (context.options.tightDefinitions &&
          child.type === 'definition' &&
          child.type === next.type)
      ) {
        after = '\n'
      } else {
        after = '\n\n'
      }

      results.push(after)
    }
  }

  return results.join('')
}
