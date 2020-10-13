// This file is for https://github.com/microsoft/dtslint .
// Tests are type-checked, but not run.

import * as toMarkdown from 'mdast-util-to-markdown'

function main() {
  const node = {type: 'root'}

  // $ExpectType string
  toMarkdown(node)

  // $ExpectType string
  toMarkdown(node, {bullet: '+'})

  // $ExpectError
  toMarkdown(node, {bullet: '?'})

  // $ExpectError
  toMarkdown(node, {unknown: '1'})
}

main()
