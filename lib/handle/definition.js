module.exports = definition

var association = require('../util/association.js')
var checkQuote = require('../util/check-quote.js')
var safe = require('../util/safe.js')

function definition(node, _, context) {
  var marker = checkQuote(context)
  var suffix = marker === '"' ? 'Quote' : 'Apostrophe'
  var exit = context.enter('definition')
  var subexit = context.enter('label')
  var value =
    '[' + safe(context, association(node), {before: '[', after: ']'}) + ']: '

  subexit()

  if (
    // If there’s no url, or…
    !node.url ||
    // If there’s whitespace, enclosed is prettier.
    /[ \t\r\n]/.test(node.url)
  ) {
    subexit = context.enter('destinationLiteral')
    value += '<' + safe(context, node.url, {before: '<', after: '>'}) + '>'
  } else {
    // No whitespace, raw is prettier.
    subexit = context.enter('destinationRaw')
    value += safe(context, node.url, {before: ' ', after: ' '})
  }

  subexit()

  if (node.title) {
    subexit = context.enter('title' + suffix)
    value +=
      ' ' +
      marker +
      safe(context, node.title, {before: marker, after: marker}) +
      marker
    subexit()
  }

  exit()

  return value
}
