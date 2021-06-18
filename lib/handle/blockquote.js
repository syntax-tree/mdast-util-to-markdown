module.exports = blockquote

var flow = require('../util/container-flow.js')
var indentLines = require('../util/indent-lines.js')

function blockquote(node, _, context) {
  var exit = context.enter('blockquote')
  var value = indentLines(flow(node, context), map)
  exit()
  return value
}

function map(line, index, blank) {
  return '>' + (blank ? '' : ' ') + line
}
