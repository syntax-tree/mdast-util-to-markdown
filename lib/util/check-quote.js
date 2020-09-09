module.exports = checkQuote

function checkQuote(context) {
  var marker = context.options.quote || '"'

  if (marker !== '"' && marker !== "'") {
    throw new Error(
      'Cannot serialize title with `' + marker + '`, expected `"`, or `\'`'
    )
  }

  return marker
}
