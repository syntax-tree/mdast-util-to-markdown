module.exports = code

var repeat = require('repeat-string')
var streak = require('longest-streak')
var formatCodeAsIndented = require('../util/format-code-as-indented')
var checkFence = require('../util/check-fence')
var indentLines = require('../util/indent-lines')
var safe = require('../util/safe')

function code(node, _, context) {
  var marker = checkFence(context)
  var raw = node.value || ''
  var suffix = marker === '`' ? 'GraveAccent' : 'Tilde'
  var value
  var fence
  var exit
  var subexit

  if (formatCodeAsIndented(node, context)) {
    exit = context.enter('codeIndented')
    value = indentLines(raw, map)
  } else {
    fence = repeat(marker, Math.max(streak(raw, marker) + 1, 3))
    exit = context.enter('codeFenced')
    value = fence

    if (node.lang) {
      subexit = context.enter('codeFencedLang' + suffix)
      value += safe(context, node.lang, {
        before: '`',
        after: ' ',
        encode: ['`']
      })
      subexit()
    }

    if (node.lang && node.meta) {
      subexit = context.enter('codeFencedMeta' + suffix)
      value +=
        ' ' +
        safe(context, node.meta, {
          before: ' ',
          after: '\n',
          encode: ['`']
        })
      subexit()
    }

    value += '\n'

    if (raw) {
      value += raw + '\n'
    }

    value += fence
  }

  exit()
  return value
}

function map(line, _, blank) {
  return (blank ? '' : '    ') + line
}
