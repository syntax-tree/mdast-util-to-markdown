import {containerPhrasing} from '../util/container-phrasing.js'

export function paragraph(node, _, context) {
  var exit = context.enter('paragraph')
  var subexit = context.enter('phrasing')
  var value = containerPhrasing(node, context, {before: '\n', after: '\n'})
  subexit()
  exit()
  return value
}
