module.exports = linkReference
linkReference.peek = linkReferencePeek

var association = require('../util/association')
var safe = require('../util/safe')
var phrasing = require('../util/container-phrasing')

function linkReference(node, _, context) {
  var type = node.referenceType
  var exit = context.enter('linkReference')
  var subexit = context.enter('label')
  var text = phrasing(node, context, {before: '[', after: ']'})
  var reference

  subexit()

  subexit = context.enter('reference')
  reference = safe(context, association(node), {before: '[', after: ']'})
  subexit()

  exit()

  if (type !== 'full' && text && text === reference) {
    return '[' + text + ']' + (type === 'shortcut' ? '' : '[]')
  }

  return '[' + text + '][' + reference + ']'
}

function linkReferencePeek() {
  return '['
}
