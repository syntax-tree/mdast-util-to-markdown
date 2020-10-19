module.exports = safe

var regexPunctuation = /[|\\{}()[\]^$+*?.-]/
var markdownPunctuation = /[!-/:-@[-`{-~]/

function safe(context, input, config) {
  var value = input || ''
  var patterns = context.unsafePatterns
  var length = patterns.length
  var index = -1
  var positions = []
  var result = []
  var infos = {}
  var info
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

    if (
      !inScope(context.stack, pattern.inConstruct, true) ||
      inScope(context.stack, pattern.notInConstruct)
    ) {
      continue
    }

    expression =
      pattern._compiled || (pattern._compiled = toExpression(pattern))

    while ((match = expression.exec(value))) {
      position =
        match.index + (pattern.before || pattern.atBreak ? match[1].length : 0)

      info = {
        before: pattern.atBreak || 'before' in pattern,
        after: 'after' in pattern
      }

      if (positions.indexOf(position) === -1) {
        positions.push(position)
        infos[position] = info
      } else {
        if (infos[position].before && !info.before) {
          infos[position].before = false
        }

        if (infos[position].after && !info.after) {
          infos[position].after = false
        }
      }
    }
  }

  positions.sort(numerical)

  start = config.before ? config.before.length : 0
  end = value.length - (config.after ? config.after.length : 0)
  index = -1
  length = positions.length

  while (++index < length) {
    position = positions[index]
    info = infos[position]

    if (
      // Character before or after matched:
      position < start ||
      position >= end
    ) {
      continue
    }

    // If this character is supposed to be escaped, but only because it has a
    // condition on the next character, and the next character is definitly
    // being escaped), then skip this escape.
    if (
      info.after &&
      position + 1 < end &&
      positions[index + 1] === position + 1 &&
      !infos[position + 1].before &&
      !infos[position + 1].after
    ) {
      continue
    }

    character = value.charAt(position)

    if (start !== position) {
      result.push(value.slice(start, position))
    }

    start = position

    if (
      markdownPunctuation.test(character) &&
      (!config.encode || config.encode.indexOf(character) === -1)
    ) {
      // Character escape.
      result.push('\\')
    } else {
      // Character reference.
      result.push(
        '&#x' + value.charCodeAt(position).toString(16).toUpperCase() + ';'
      )
      start++
    }
  }

  result.push(value.slice(start, end))

  return result.join('')
}

function inScope(stack, list, none) {
  var length
  var index

  if (!list) {
    return none
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

function numerical(a, b) {
  return a - b
}
