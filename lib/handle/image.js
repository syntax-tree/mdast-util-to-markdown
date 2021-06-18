import {checkQuote} from '../util/check-quote.js'
import {safe} from '../util/safe.js'

image.peek = imagePeek

export function image(node, _, context) {
  var quote = checkQuote(context)
  var suffix = quote === '"' ? 'Quote' : 'Apostrophe'
  var exit = context.enter('image')
  var subexit = context.enter('label')
  var value = '![' + safe(context, node.alt, {before: '[', after: ']'}) + ']('

  subexit()

  if (
    // If there’s no url but there is a title…
    (!node.url && node.title) ||
    // Or if there’s markdown whitespace or an eol, enclose.
    /[ \t\r\n]/.test(node.url)
  ) {
    subexit = context.enter('destinationLiteral')
    value += '<' + safe(context, node.url, {before: '<', after: '>'}) + '>'
  } else {
    // No whitespace, raw is prettier.
    subexit = context.enter('destinationRaw')
    value += safe(context, node.url, {
      before: '(',
      after: node.title ? ' ' : ')'
    })
  }

  subexit()

  if (node.title) {
    subexit = context.enter('title' + suffix)
    value +=
      ' ' +
      quote +
      safe(context, node.title, {before: quote, after: quote}) +
      quote
    subexit()
  }

  value += ')'
  exit()

  return value
}

function imagePeek() {
  return '!'
}
