import {checkEmphasis} from '../util/check-emphasis.js'
import {containerPhrasing} from '../util/container-phrasing.js'

emphasis.peek = emphasisPeek

// To do: there are cases where emphasis cannot “form” depending on the
// previous or next character of sequences.
// There’s no way around that though, except for injecting zero-width stuff.
// Do we need to safeguard against that?
export function emphasis(node, _, context) {
  var marker = checkEmphasis(context)
  var exit = context.enter('emphasis')
  var value = containerPhrasing(node, context, {before: marker, after: marker})
  exit()
  return marker + value + marker
}

function emphasisPeek(node, _, context) {
  return context.options.emphasis || '*'
}
