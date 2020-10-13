// This file is for https://github.com/microsoft/dtslint .
// Tests are type-checked, but not run.

import * as toMarkdown from 'mdast-util-to-markdown'

function main() {
  const node = {type: 'root'}
  const handleOk = () => '\\\n'
  const handleNok = () => 1
  const joinOk = () => {}
  const joinNok = () => {
    return 1
  }

  joinOk.peek = () => '\\'

  // $ExpectType string
  toMarkdown(node)

  // $ExpectError
  toMarkdown(node, {unknown: '1'})

  // $ExpectType string
  toMarkdown(node, {bullet: '+'})
  // $ExpectError
  toMarkdown(node, {bullet: '?'})

  // $ExpectType string
  toMarkdown(node, {
    unsafe: [
      {atBreak: true, character: '_'},
      {atBreak: true, before: '\\d+', character: '.', after: '(?:[ \t\r\n]|$)'}
    ]
  })
  // $ExpectError
  toMarkdown(node, {unsafe: [{unknown: true}]})

  // $ExpectType string
  toMarkdown(node, {join: [joinOk]})
  // $ExpectError
  toMarkdown(node, {join: [joinNok]})

  // $ExpectType string
  toMarkdown(node, {handlers: {break: handleOk}})
  // $ExpectError
  toMarkdown(node, {handlers: {break: handleNok}})
}

main()
