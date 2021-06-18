module.exports = list

var flow = require('../util/container-flow.js')

function list(node, _, context) {
  var exit = context.enter('list')
  var value = flow(node, context)
  exit()
  return value
}
