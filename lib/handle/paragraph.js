import {containerPhrasing} from '../util/container-phrasing.js'

export function paragraph(node, _, context) {
  const exit = context.enter('paragraph')
  const subexit = context.enter('phrasing')
  const value = containerPhrasing(node, context, {before: '\n', after: '\n'})
  subexit()
  exit()
  return value
}
