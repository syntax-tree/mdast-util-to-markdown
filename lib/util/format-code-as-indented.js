module.exports = formatCodeAsIndented

function formatCodeAsIndented(node, context) {
  var value = node.value || ''

  return (
    !context.options.fences &&
    // If there’s no info…
    !node.lang &&
    // And there’s a non-whitespace character…
    /[^ \r\n]/.test(value) &&
    // And the value doesn’t start or end in a blank…
    !/^[\t ]*[\r\n]|[\r\n][\t ]*$/.test(value)
  )
}
