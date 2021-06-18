import {containerFlow} from '../util/container-flow.js'

export function list(node, _, context) {
  var exit = context.enter('list')
  var value = containerFlow(node, context)
  exit()
  return value
}
