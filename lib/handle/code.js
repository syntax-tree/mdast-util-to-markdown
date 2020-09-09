module.exports = code

var repeat = require('repeat-string')
var streak = require('longest-streak')
var indentLines = require('../util/indent-lines')
var safe = require('../util/safe')
var formatCodeAsIndented = require('../util/format-code-as-indented')

function code(node, _, context) {
  var marker = context.options.fence || '`'
  var raw = node.value || ''
  var suffix = marker === '`' ? 'GraveAccent' : 'Tilde'
  var value
  var fence
  var exit
  var exitInfo

  if (formatCodeAsIndented(node, context)) {
    exit = context.enter('codeIndented')
    value = indentLines(raw, map)
  } else {
    fence = repeat(marker, Math.max(streak(raw, marker) + 1, 3))
    exit = context.enter('codeFenced')
    value = fence

    if (node.lang) {
      exitInfo = context.enter('codeFencedLang' + suffix)
      value += safe(context, node.lang, {
        before: '`',
        after: ' ',
        encode: ['`']
      })
      exitInfo()
    }

    if (node.lang && node.meta) {
      exitInfo = context.enter('codeFencedMeta' + suffix)
      value +=
        ' ' +
        safe(context, node.meta, {
          before: ' ',
          after: '\n',
          encode: ['`']
        })
      exitInfo()
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
