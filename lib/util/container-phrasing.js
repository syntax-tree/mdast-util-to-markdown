module.exports = phrasing

function phrasing(parent, context, safeOptions) {
  var children = parent.children || []
  var length = children.length
  var index = -1
  var results = []
  var current = ''
  var next = children[0]
  var before = safeOptions.before
  var after
  var handleNext
  var child

  while (++index < length) {
    child = next
    next = children[index + 1]

    if (next) {
      handleNext = context.handle.handlers[next.type]
      if (handleNext && handleNext.peek) handleNext = handleNext.peek
      after = handleNext
        ? handleNext(next, parent, context, {before: '', after: ''}).charAt(0)
        : ''
    } else {
      after = safeOptions.after
    }

    current = context.handle(child, parent, context, {
      before: before,
      after: after
    })
    results.push(current)
    before = current.charAt(current.length - 1)
  }

  return results.join('')
}
