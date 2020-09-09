module.exports = definition

var association = require('../util/association')
var checkQuote = require('../util/check-quote')
var safe = require('../util/safe')

function definition(node, _, context) {
  var quote = checkQuote(context)
  var suffix = quote === '"' ? 'Quote' : 'Apostrophe'
  var url = node.url || ''
  var title = node.title || ''
  var exit = context.enter('definition')
  var subexit = context.enter('label')
  var value =
    '[' + safe(context, association(node), {before: '[', after: ']'}) + ']: '

  subexit()

  if (
    // If there’s no url, or…
    !url ||
    // If there’s whitespace, enclosed is prettier.
    /[ \t\r\n]/.test(url)
  ) {
    subexit = context.enter('destinationLiteral')
    value += '<' + safe(context, url, {before: '<', after: '>'}) + '>'
  } else {
    // No whitespace, raw is prettier.
    subexit = context.enter('destinationRaw')
    value += safe(context, url, {before: ' ', after: ' '})
  }

  subexit()

  if (title) {
    subexit = context.enter('title' + suffix)
    value +=
      ' ' + quote + safe(context, title, {before: quote, after: quote}) + quote
    subexit()
  }

  exit()

  return value
}
