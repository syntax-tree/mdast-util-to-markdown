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

  subexit()

  subexit = context.enter('reference')
  reference = safe(context, association(node), {before: '[', after: ']'})
  subexit()

  exit()

  if (type !== 'full' && alt && alt === reference) {
    return '![' + alt + ']' + (type === 'shortcut' ? '' : '[]')
  }

  return '![' + alt + '][' + reference + ']'
}

function imageReferencePeek() {
  return '!'
}
