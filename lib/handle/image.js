module.exports = image
image.peek = imagePeek

var checkQuote = require('../util/check-quote')
var safe = require('../util/safe')

function image(node, _, context) {
  var quote = checkQuote(context)
  var suffix = quote === '"' ? 'Quote' : 'Apostrophe'
  var url = node.url || ''
  var title = node.title || ''
  var exit = context.enter('image')
  var subexit = context.enter('label')
  var value = '![' + safe(context, node.alt, {before: '[', after: ']'}) + ']('

  subexit()

  if (
    // If there’s no url but there is a title…
    (!url && title) ||
    // Or if there’s markdown whitespace or an eol, enclose.
    /[ \t\r\n]/.test(url)
  ) {
    subexit = context.enter('destinationLiteral')
    value += '<' + safe(context, url, {before: '<', after: '>'}) + '>'
  } else {
    // No whitespace, raw is prettier.
    subexit = context.enter('destinationRaw')
    value += safe(context, url, {before: '(', after: title ? ' ' : ')'})
  }

  subexit()

  if (title) {
    subexit = context.enter('title' + suffix)
    value +=
      ' ' + quote + safe(context, title, {before: quote, after: quote}) + quote
    subexit()
  }

  value += ')'
  exit()

  return value
}

function imagePeek() {
  return '!'
}
