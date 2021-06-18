import {association} from '../util/association.js'
import {containerPhrasing} from '../util/container-phrasing.js'
import {safe} from '../util/safe.js'

linkReference.peek = linkReferencePeek

export function linkReference(node, _, context) {
  var type = node.referenceType
  var exit = context.enter('linkReference')
  var subexit = context.enter('label')
  var text = containerPhrasing(node, context, {before: '[', after: ']'})
  var value = '[' + text + ']'
  var reference
  var stack

  subexit()
  // Hide the fact that we’re in phrasing, because escapes don’t work.
  stack = context.stack
  context.stack = []
  subexit = context.enter('reference')
  reference = safe(context, association(node), {before: '[', after: ']'})
  subexit()
  context.stack = stack
  exit()

  if (type === 'full' || !text || text !== reference) {
    value += '[' + reference + ']'
  } else if (type !== 'shortcut') {
    value += '[]'
  }

  return value
}

function linkReferencePeek() {
  return '['
}
