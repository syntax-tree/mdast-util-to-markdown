const eol = /\r?\n|\r/g

export function indentLines(value, map) {
  const result = []
  let start = 0
  let line = 0
  let match

  while ((match = eol.exec(value))) {
    one(value.slice(start, match.index))
    result.push(match[0])
    start = match.index + match[0].length
    line++
  }

  one(value.slice(start))

  return result.join('')

  function one(value) {
    result.push(map(value, line, !value))
  }
}
