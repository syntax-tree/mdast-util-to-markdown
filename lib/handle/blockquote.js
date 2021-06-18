import {containerFlow} from '../util/container-flow.js'
import {indentLines} from '../util/indent-lines.js'

export function blockquote(node, _, context) {
  const exit = context.enter('blockquote')
  const value = indentLines(containerFlow(node, context), map)
  exit()
  return value
}

function map(line, index, blank) {
  return '>' + (blank ? '' : ' ') + line
}
