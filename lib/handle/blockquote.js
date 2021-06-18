import {containerFlow} from '../util/container-flow.js'
import {indentLines} from '../util/indent-lines.js'

export function blockquote(node, _, context) {
  var exit = context.enter('blockquote')
  var value = indentLines(containerFlow(node, context), map)
  exit()
  return value
}

function map(line, index, blank) {
  return '>' + (blank ? '' : ' ') + line
}
