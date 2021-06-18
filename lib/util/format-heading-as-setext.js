import {toString} from 'mdast-util-to-string'

export function formatHeadingAsSetext(node, context) {
  return (
    context.options.setext && (!node.depth || node.depth < 3) && toString(node)
  )
}
