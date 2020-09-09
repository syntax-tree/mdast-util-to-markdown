module.exports = safe

var encode = require('stringify-entities')

var regexPunctuation = /[|\\{}()[\]^$+*?.-]/
var markdownPunctuation = /[!-/:-@[-`{-~]/

function safe(context, input, config) {
  var value = input || ''
  var patterns = context.unsafePatterns
  var length = patterns.length
  var index = -1
  var positions = []
  var result = []
  var position
  var character
  var pattern
  var expression
  var match
  var start
  var end

  if (config.before) {
    value = config.before + value
  }

  if (config.after) {
    value += config.after
  }

  while (++index < length) {
    pattern = patterns[index]

    if (!inScope(context.stack, pattern.inConstruct)) {
      continue
    }

    expression = toExpression(pattern)

    while ((match = expression.exec(value))) {
      positions.push(
        match.index + (pattern.before || pattern.atBreak ? match[1].length : 0)
      )
    }
  }

  positions.sort()

  start = config.before ? 1 : 0
  end = value.length - (config.after ? 1 : 0)
  index = -1
  length = positions.length

  while (++index < length) {
    position = positions[index]

    if (
      // Character before or after matched:
      position < start ||
      position >= end ||
      // Character matched multiple times:
      position === positions[index + 1]
    ) {
      continue
    }

    if (start !== position) {
      result.push(value.slice(start, position))
    }

    character = value.charAt(position)
    start = position

    if (
      markdownPunctuation.test(character) &&
      (!config.encode || config.encode.indexOf(character) === -1)
    ) {
      // Character escape.
      result.push('\\')
    } else {
      // Character reference.
      result.push(encode(character, {subset: [character]}))
      start++
    }
  }

  result.push(value.slice(start, end))

  return result.join('')
}

function inScope(stack, list) {
  var length
  var index

  if (!list) {
    return true
  }

  if (typeof list === 'string') {
    list = [list]
  }

  length = list.length
  index = -1

  while (++index < length) {
    if (stack.indexOf(list[index]) !== -1) {
      return true
    }
  }

  return false
}

function toExpression(pattern) {
  var before = pattern.before ? '(?:' + pattern.before + ')' : ''
  var after = pattern.after ? '(?:' + pattern.after + ')' : ''

  if (pattern.atBreak) {
    before = '[\\r\\n][\\t ]*' + before
  }

  return new RegExp(
    (before ? '(' + before + ')' : '') +
      (regexPunctuation.test(pattern.character) ? '\\' : '') +
      pattern.character +
      (after || ''),
    'g'
  )
}
