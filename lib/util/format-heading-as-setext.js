module.exports = formatHeadingAsSetext

var toString = require('mdast-util-to-string')

function formatHeadingAsSetext(node, context) {
  return context.options.setext && (node.depth || 1) < 3 && toString(node)
}
