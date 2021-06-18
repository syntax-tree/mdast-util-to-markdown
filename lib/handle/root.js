import {containerFlow} from '../util/container-flow.js'

export function root(node, _, context) {
  return containerFlow(node, context)
}
