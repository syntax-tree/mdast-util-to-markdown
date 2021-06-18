html.peek = htmlPeek

export function html(node) {
  return node.value || ''
}

function htmlPeek() {
  return '<'
}
