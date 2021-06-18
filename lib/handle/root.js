module.exports = root

var flow = require('../util/container-flow.js')

function root(node, _, context) {
  return flow(node, context)
}
