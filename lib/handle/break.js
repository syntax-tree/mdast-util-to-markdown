module.exports = hardBreak
hardBreak.peek = hardBreakPeek

function hardBreak() {
  return '\\\n'
}

function hardBreakPeek() {
  return '\\'
}
