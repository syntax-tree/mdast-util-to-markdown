import {containerFlow} from '../util/container-flow.js'

export function list(node, _, context) {
  const exit = context.enter('list')
  const value = containerFlow(node, context)
  exit()
  return value
}
