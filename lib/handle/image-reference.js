module.exports = imageReference
imageReference.peek = imageReferencePeek

var association = require('../util/association')
var safe = require('../util/safe')

function imageReference(node, _, context) {
  var type = node.referenceType
  var exit = context.enter('imageReference')
  var subexit = context.enter('label')
  var alt = safe(context, node.alt, {before: '[', after: ']'})
  var reference
  var currentStack

  subexit()
  // Hide the fact that we’re in phrasing, because escapes don’t work.
  currentStack = context.stack
  context.stack = []
  subexit = context.enter('reference')
  reference = safe(context, association(node), {before: '[', after: ']'})
  subexit()
  context.stack = currentStack
  exit()

  if (type !== 'full' && alt && alt === reference) {
    return '![' + alt + ']' + (type === 'shortcut' ? '' : '[]')
  }

  return '![' + alt + '][' + reference + ']'
}

function imageReferencePeek() {
  return '!'
}
