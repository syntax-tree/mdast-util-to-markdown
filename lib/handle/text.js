import {safe} from '../util/safe.js'

export function text(node, parent, context, safeOptions) {
  return safe(context, node.value, safeOptions)
}
