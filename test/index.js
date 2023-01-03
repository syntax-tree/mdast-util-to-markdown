/**
 * @typedef {import('mdast').BlockContent} BlockContent
 * @typedef {import('mdast').List} List
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {removePosition} from 'unist-util-remove-position'
import {fromMarkdown as from} from 'mdast-util-from-markdown'
import {toMarkdown as to} from '../index.js'

test('core', () => {
  assert.equal(
    to({
      type: 'root',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
        {type: 'thematicBreak'},
        {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
      ]
    }),
    'a\n\n***\n\nb\n',
    'should support a `root`'
  )

  assert.equal(
    to({
      type: 'root',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
        // @ts-expect-error: `identifier`, `url` missing.
        {type: 'definition', label: 'b'},
        // @ts-expect-error: `identifier`, `url` missing.
        {type: 'definition', label: 'c'},
        {type: 'paragraph', children: [{type: 'text', value: 'd'}]}
      ]
    }),
    'a\n\n[b]: <>\n\n[c]: <>\n\nd\n',
    'should support adjacent definitions'
  )

  assert.equal(
    to(
      {
        type: 'root',
        children: [
          {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
          // @ts-expect-error: `identifier`, `url` missing.
          {type: 'definition', label: 'b'},
          // @ts-expect-error: `identifier`, `url` missing.
          {type: 'definition', label: 'c'},
          {type: 'paragraph', children: [{type: 'text', value: 'd'}]}
        ]
      },
      {tightDefinitions: true}
    ),
    'a\n\n[b]: <>\n[c]: <>\n\nd\n',
    'should support tight adjacent definitions when `tightDefinitions: true`'
  )

  assert.equal(
    to({
      type: 'root',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
        // @ts-expect-error: `children` missing.
        {type: 'list', children: [{type: 'listItem'}]},
        // @ts-expect-error: `children` missing.
        {type: 'list', children: [{type: 'listItem'}]},
        // @ts-expect-error: `children` missing.
        {type: 'list', ordered: true, children: [{type: 'listItem'}]},
        // @ts-expect-error: `children` missing.
        {type: 'list', ordered: true, children: [{type: 'listItem'}]},
        {type: 'paragraph', children: [{type: 'text', value: 'd'}]}
      ]
    }),
    'a\n\n*\n\n<!---->\n\n*\n\n1.\n\n<!---->\n\n1.\n\nd\n',
    'should inject HTML comments between lists w/ the same marker'
  )

  assert.equal(
    to({
      type: 'root',
      children: [
        {type: 'code', value: 'a'},
        // @ts-expect-error: `children` missing.
        {type: 'list', children: [{type: 'listItem'}]},
        {type: 'code', value: 'b'}
      ]
    }),
    '    a\n\n*\n\n<!---->\n\n    b\n',
    'should inject HTML comments between lists and an indented code'
  )

  assert.equal(
    to({
      type: 'root',
      children: [
        {type: 'code', value: 'a'},
        {type: 'code', value: 'b'}
      ]
    }),
    '    a\n\n<!---->\n\n    b\n',
    'should inject HTML comments between adjacent indented code'
  )

  assert.equal(
    to({
      type: 'listItem',
      spread: false,
      children: [
        {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
        {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
      ]
    }),
    '*   a\n\n    b\n',
    'should not honour `spread: false` for two paragraphs'
  )

  assert.equal(
    to({
      type: 'listItem',
      spread: false,
      children: [
        {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
        // @ts-expect-error: `definition` in `listItem` is fine.
        {type: 'definition', label: 'b', url: 'c'}
      ]
    }),
    '*   a\n\n    [b]: c\n',
    'should not honour `spread: false` for a paragraph and a definition'
  )

  assert.equal(
    to({
      type: 'listItem',
      spread: false,
      children: [
        {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
        {type: 'heading', depth: 1, children: [{type: 'text', value: 'b'}]}
      ]
    }),
    '*   a\n    # b\n',
    'should honour `spread: false` for a paragraph and a heading'
  )

  assert.equal(
    to(
      {
        type: 'listItem',
        spread: false,
        children: [
          {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
          {type: 'heading', depth: 1, children: [{type: 'text', value: 'b'}]}
        ]
      },
      {setext: true}
    ),
    '*   a\n\n    b\n    =\n',
    'should not honour `spread: false` for a paragraph and a setext heading'
  )

  assert.throws(
    () => {
      // @ts-expect-error: runtime.
      to(false)
    },
    /Cannot handle value `false`, expected node/,
    'should throw on a non-node'
  )

  assert.throws(
    () => {
      // @ts-expect-error: custom node.
      to({type: 'unknown'})
    },
    /Cannot handle unknown node `unknown`/,
    'should throw on an unknown node'
  )

  assert.throws(
    () => {
      to({
        type: 'paragraph',
        // @ts-expect-error: custom node.
        children: [{type: 'text', value: 'a'}, {type: 'unknown'}]
      })
    },
    /Cannot handle unknown node `unknown`/,
    'should throw on an unknown node in a tree'
  )
})

test('blockquote', () => {
  // @ts-expect-error: `children` missing.
  assert.equal(to({type: 'blockquote'}), '>\n', 'should support a block quote')

  assert.equal(
    to({
      type: 'blockquote',
      children: [{type: 'paragraph', children: [{type: 'text', value: 'a'}]}]
    }),
    '> a\n',
    'should support a block quote w/ a child'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
        {type: 'thematicBreak'},
        {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
      ]
    }),
    '> a\n>\n> ***\n>\n> b\n',
    'should support a block quote w/ children'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [{type: 'paragraph', children: [{type: 'text', value: 'a\nb'}]}]
    }),
    '> a\n> b\n',
    'should support text w/ a line ending in a block quote'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a'},
            {type: 'text', value: 'b'}
          ]
        }
      ]
    }),
    '> ab\n',
    'should support adjacent texts in a block quote'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [{type: 'text', value: 'a\nb'}]
        },
        {
          type: 'blockquote',
          children: [
            {
              type: 'paragraph',
              children: [
                {type: 'text', value: 'a\n'},
                {type: 'inlineCode', value: 'b\nc'},
                {type: 'text', value: '\nd'}
              ]
            },
            {
              type: 'heading',
              depth: 1,
              children: [{type: 'text', value: 'a b'}]
            }
          ]
        }
      ]
    }),
    '> a\n> b\n>\n> > a\n> > `b\n> > c`\n> > d\n> >\n> > # a b\n',
    'should support a block quote in a block quote'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a'},
            {type: 'break'},
            {type: 'text', value: 'b'}
          ]
        }
      ]
    }),
    '> a\\\n> b\n',
    'should support a break in a block quote'
  )

  assert.equal(
    to({type: 'blockquote', children: [{type: 'code', value: 'a\nb\n\nc'}]}),
    '>     a\n>     b\n>\n>     c\n',
    'should support code (flow, indented) in a block quote'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [{type: 'code', lang: 'a\nb', value: 'c\nd\n\ne'}]
    }),
    '> ```a&#xA;b\n> c\n> d\n>\n> e\n> ```\n',
    'should support code (flow, fenced) in a block quote'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a\n'},
            {type: 'inlineCode', value: 'b\nc'},
            {type: 'text', value: '\nd'}
          ]
        }
      ]
    }),
    '> a\n> `b\n> c`\n> d\n',
    'should support code (text) in a block quote'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a\n'},
            {type: 'inlineCode', value: ' b\nc '},
            {type: 'text', value: '\nd'}
          ]
        }
      ]
    }),
    '> a\n> `  b\n> c  `\n> d\n',
    'should support padded code (text) in a block quote'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [
        // @ts-expect-error: `definition` is fine in `blockquote`.
        {type: 'definition', label: 'a\nb', url: 'c\nd', title: 'e\nf'},
        {
          type: 'paragraph',
          children: [{type: 'text', value: 'a\nb'}]
        }
      ]
    }),
    '> [a\n> b]: <c&#xA;d> "e\n> f"\n>\n> a\n> b\n',
    'should support a definition in a block quote'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a\n'},
            {type: 'emphasis', children: [{type: 'text', value: 'c\nd'}]},
            {type: 'text', value: '\nd'}
          ]
        }
      ]
    }),
    '> a\n> *c\n> d*\n> d\n',
    'should support an emphasis in a block quote'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [
        {
          type: 'heading',
          depth: 3,
          children: [{type: 'text', value: 'a\nb'}]
        }
      ]
    }),
    '> ### a&#xA;b\n',
    'should support a heading (atx) in a block quote'
  )

  assert.equal(
    to(
      {
        type: 'blockquote',
        children: [
          {
            type: 'heading',
            depth: 1,
            children: [{type: 'text', value: 'a\nb'}]
          }
        ]
      },
      {setext: true}
    ),
    '> a\n> b\n> =\n',
    'should support a heading (setext) in a block quote'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [{type: 'html', value: '<div\nhidden>'}]
    }),
    '> <div\n> hidden>\n',
    'should support html (flow) in a block quote'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a '},
            {type: 'html', value: '<span\nhidden>'},
            {type: 'text', value: '\nb'}
          ]
        }
      ]
    }),
    '> a <span\n> hidden>\n> b\n',
    'should support html (text) in a block quote'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a\n'},
            {type: 'image', url: 'b\nc', alt: 'd\ne', title: 'f\ng'},
            {type: 'text', value: '\nh'}
          ]
        }
      ]
    }),
    '> a\n> ![d\n> e](<b&#xA;c> "f\n> g")\n> h\n',
    'should support an image (resource) in a block quote'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a\n'},
            {
              type: 'imageReference',
              alt: 'b\nc',
              label: 'd\ne',
              identifier: 'f',
              referenceType: 'collapsed'
            },
            {type: 'text', value: '\ng'}
          ]
        }
      ]
    }),
    '> a\n> ![b\n> c][d\n> e]\n> g\n',
    'should support an image (reference) in a block quote'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a\n'},
            {
              type: 'link',
              url: 'b\nc',
              children: [{type: 'text', value: 'd\ne'}],
              title: 'f\ng'
            },
            {type: 'text', value: '\nh'}
          ]
        }
      ]
    }),
    '> a\n> [d\n> e](<b&#xA;c> "f\n> g")\n> h\n',
    'should support a link (resource) in a block quote'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a\n'},
            {
              type: 'linkReference',
              children: [{type: 'text', value: 'b\nc'}],
              label: 'd\ne',
              identifier: 'f',
              referenceType: 'collapsed'
            },
            {type: 'text', value: '\ng'}
          ]
        }
      ]
    }),
    '> a\n> [b\n> c][d\n> e]\n> g\n',
    'should support a link (reference) in a block quote'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [{type: 'text', value: 'a\nb'}]
        },
        {
          type: 'list',
          children: [
            {
              type: 'listItem',
              children: [
                {type: 'paragraph', children: [{type: 'text', value: 'c\nd'}]}
              ]
            },
            {
              type: 'listItem',
              children: [{type: 'thematicBreak'}]
            },
            {
              type: 'listItem',
              children: [
                {type: 'paragraph', children: [{type: 'text', value: 'e\nf'}]}
              ]
            }
          ]
        }
      ]
    }),
    '> a\n> b\n>\n> -   c\n>     d\n>\n> -   ***\n>\n> -   e\n>     f\n',
    'should support a list in a block quote'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a\n'},
            {type: 'strong', children: [{type: 'text', value: 'c\nd'}]},
            {type: 'text', value: '\nd'}
          ]
        }
      ]
    }),
    '> a\n> **c\n> d**\n> d\n',
    'should support a strong in a block quote'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [{type: 'thematicBreak'}, {type: 'thematicBreak'}]
    }),
    '> ***\n>\n> ***\n',
    'should support a thematic break in a block quote'
  )
})

test('break', () => {
  assert.equal(to({type: 'break'}), '\\\n', 'should support a break')

  assert.equal(
    to({
      type: 'heading',
      depth: 3,
      children: [
        {type: 'text', value: 'a'},
        {type: 'break'},
        {type: 'text', value: 'b'}
      ]
    }),
    '### a b\n',
    'should serialize breaks in heading (atx) as a space'
  )

  assert.equal(
    to({
      type: 'heading',
      depth: 3,
      children: [
        {type: 'text', value: 'a '},
        {type: 'break'},
        {type: 'text', value: 'b'}
      ]
    }),
    '### a b\n',
    'should serialize breaks in heading (atx) as a space'
  )

  assert.equal(
    to(from('a  \nb\n=\n'), {setext: true}),
    'a\\\nb\n=\n',
    'should serialize breaks in heading (setext)'
  )
})

test('code (flow)', () => {
  // @ts-expect-error: `value` missing.
  assert.equal(to({type: 'code'}), '```\n```\n', 'should support empty code')

  assert.throws(
    () => {
      // @ts-expect-error: runtime.
      to({type: 'code', value: ''}, {fence: '+'})
    },
    /Cannot serialize code with `\+` for `options\.fence`, expected `` ` `` or `~`/,
    'should throw on when given an incorrect `fence`'
  )

  assert.equal(
    to({type: 'code', value: 'a'}),
    '    a\n',
    'should support code w/ a value (indent)'
  )

  assert.equal(
    to({type: 'code', value: 'a'}, {fences: true}),
    '```\na\n```\n',
    'should support code w/ a value (fences)'
  )

  assert.equal(
    to({type: 'code', lang: 'a', value: ''}),
    '```a\n```\n',
    'should support code w/ a lang'
  )

  assert.equal(
    to({type: 'code', meta: 'a', value: ''}),
    '```\n```\n',
    'should support (ignore) code w/ only a meta'
  )

  assert.equal(
    to({type: 'code', lang: 'a', meta: 'b', value: ''}),
    '```a b\n```\n',
    'should support code w/ lang and meta'
  )

  assert.equal(
    to({type: 'code', lang: 'a b', value: ''}),
    '```a&#x20;b\n```\n',
    'should encode a space in `lang`'
  )

  assert.equal(
    to({type: 'code', lang: 'a\nb', value: ''}),
    '```a&#xA;b\n```\n',
    'should encode a line ending in `lang`'
  )

  assert.equal(
    to({type: 'code', lang: 'a`b', value: ''}),
    '```a&#x60;b\n```\n',
    'should encode a grave accent in `lang`'
  )

  assert.equal(
    to({type: 'code', lang: 'a\\-b', value: ''}),
    '```a\\\\-b\n```\n',
    'should escape a backslash in `lang`'
  )

  assert.equal(
    to({type: 'code', lang: 'x', meta: 'a b', value: ''}),
    '```x a b\n```\n',
    'should not encode a space in `meta`'
  )

  assert.equal(
    to({type: 'code', lang: 'x', meta: 'a\nb', value: ''}),
    '```x a&#xA;b\n```\n',
    'should encode a line ending in `meta`'
  )

  assert.equal(
    to({type: 'code', lang: 'x', meta: 'a`b', value: ''}),
    '```x a&#x60;b\n```\n',
    'should encode a grave accent in `meta`'
  )

  assert.equal(
    to({type: 'code', lang: 'x', meta: 'a\\-b', value: ''}),
    '```x a\\\\-b\n```\n',
    'should escape a backslash in `meta`'
  )

  assert.equal(
    to({type: 'code', value: ''}, {fence: '~'}),
    '~~~\n~~~\n',
    'should support fenced code w/ tildes when `fence: "~"`'
  )

  assert.equal(
    to({type: 'code', lang: 'a`b', value: ''}, {fence: '~'}),
    '~~~a`b\n~~~\n',
    'should not encode a grave accent when using tildes for fences'
  )

  assert.equal(
    to({type: 'code', value: '```\nasd\n```'}, {fences: true}),
    '````\n```\nasd\n```\n````\n',
    'should use more grave accents for fences if there are streaks of grave accents in the value (fences)'
  )

  assert.equal(
    to({type: 'code', value: '~~~\nasd\n~~~'}, {fence: '~', fences: true}),
    '~~~~\n~~~\nasd\n~~~\n~~~~\n',
    'should use more tildes for fences if there are streaks of tildes in the value (fences)'
  )

  assert.equal(
    to({type: 'code', lang: 'a', value: 'b'}),
    '```a\nb\n```\n',
    'should use a fence if there is an info'
  )

  assert.equal(
    to({type: 'code', value: ' '}),
    '```\n \n```\n',
    'should use a fence if there is only whitespace'
  )

  assert.equal(
    to({type: 'code', value: '\na'}),
    '```\n\na\n```\n',
    'should use a fence if there first line is blank (void)'
  )

  assert.equal(
    to({type: 'code', value: ' \na'}),
    '```\n \na\n```\n',
    'should use a fence if there first line is blank (filled)'
  )

  assert.equal(
    to({type: 'code', value: 'a\n'}),
    '```\na\n\n```\n',
    'should use a fence if there last line is blank (void)'
  )

  assert.equal(
    to({type: 'code', value: 'a\n '}),
    '```\na\n \n```\n',
    'should use a fence if there last line is blank (filled)'
  )

  assert.equal(
    to({type: 'code', value: '  a\n\n b'}),
    '      a\n\n     b\n',
    'should use an indent if the value is indented'
  )
})

test('definition', () => {
  assert.equal(
    // @ts-expect-error: `identifier`, `url` missing.
    to({type: 'definition'}),
    '[]: <>\n',
    'should support a definition w/o label'
  )

  assert.equal(
    // @ts-expect-error: `identifier`, `url` missing.
    to({type: 'definition', label: 'a'}),
    '[a]: <>\n',
    'should support a definition w/ label'
  )

  assert.equal(
    // @ts-expect-error: `identifier`, `url` missing.
    to({type: 'definition', label: '\\'}),
    '[\\\\]: <>\n',
    'should escape a backslash in `label`'
  )

  assert.equal(
    // @ts-expect-error: `identifier`, `url` missing.
    to({type: 'definition', label: '['}),
    '[\\[]: <>\n',
    'should escape an opening bracket in `label`'
  )

  assert.equal(
    // @ts-expect-error: `identifier`, `url` missing.
    to({type: 'definition', label: ']'}),
    '[\\]]: <>\n',
    'should escape a closing bracket in `label`'
  )

  assert.equal(
    // @ts-expect-error: `url` missing.
    to({type: 'definition', identifier: 'a'}),
    '[a]: <>\n',
    'should support a definition w/ identifier'
  )

  assert.equal(
    // @ts-expect-error: `url` missing.
    to({type: 'definition', identifier: '\\'}),
    '[\\\\]: <>\n',
    'should escape a backslash in `identifier`'
  )

  assert.equal(
    // @ts-expect-error: `url` missing.
    to({type: 'definition', identifier: '['}),
    '[\\[]: <>\n',
    'should escape an opening bracket in `identifier`'
  )

  assert.equal(
    // @ts-expect-error: `url` missing.
    to({type: 'definition', identifier: ']'}),
    '[\\]]: <>\n',
    'should escape a closing bracket in `identifier`'
  )

  assert.equal(
    to({type: 'definition', identifier: 'a', url: 'b'}),
    '[a]: b\n',
    'should support a definition w/ url'
  )

  assert.equal(
    to({type: 'definition', identifier: 'a', url: 'b c'}),
    '[a]: <b c>\n',
    'should support a definition w/ enclosed url w/ whitespace in url'
  )

  assert.equal(
    to({type: 'definition', identifier: 'a', url: 'b <c'}),
    '[a]: <b \\<c>\n',
    'should escape an opening angle bracket in `url` in an enclosed url'
  )

  assert.equal(
    to({type: 'definition', identifier: 'a', url: 'b >c'}),
    '[a]: <b \\>c>\n',
    'should escape a closing angle bracket in `url` in an enclosed url'
  )

  assert.equal(
    to({type: 'definition', identifier: 'a', url: 'b \\.c'}),
    '[a]: <b \\\\.c>\n',
    'should escape a backslash in `url` in an enclosed url'
  )

  assert.equal(
    to({type: 'definition', identifier: 'a', url: 'b\nc'}),
    '[a]: <b&#xA;c>\n',
    'should encode a line ending in `url` in an enclosed url'
  )

  assert.equal(
    to({type: 'definition', identifier: 'a', url: '\f'}),
    '[a]: <\f>\n',
    'should encode a line ending in `url` in an enclosed url'
  )

  assert.equal(
    to({type: 'definition', identifier: 'a', url: 'b(c'}),
    '[a]: b\\(c\n',
    'should escape an opening paren in `url` in a raw url'
  )

  assert.equal(
    to({type: 'definition', identifier: 'a', url: 'b)c'}),
    '[a]: b\\)c\n',
    'should escape a closing paren in `url` in a raw url'
  )

  assert.equal(
    to({type: 'definition', identifier: 'a', url: 'b\\?c'}),
    '[a]: b\\\\?c\n',
    'should escape a backslash in `url` in a raw url'
  )

  assert.equal(
    to({type: 'definition', identifier: 'a', url: '', title: 'b'}),
    '[a]: <> "b"\n',
    'should support a definition w/ title'
  )

  assert.equal(
    to({type: 'definition', identifier: 'a', url: 'b', title: 'c'}),
    '[a]: b "c"\n',
    'should support a definition w/ url & title'
  )

  assert.equal(
    to({type: 'definition', identifier: 'a', url: '', title: '"'}),
    '[a]: <> "\\""\n',
    'should escape a quote in `title` in a title'
  )

  assert.equal(
    to({type: 'definition', identifier: 'a', url: '', title: '\\'}),
    '[a]: <> "\\\\"\n',
    'should escape a backslash in `title` in a title'
  )

  assert.equal(
    to(
      {type: 'definition', identifier: 'a', url: '', title: 'b'},
      {quote: "'"}
    ),
    "[a]: <> 'b'\n",
    'should support a definition w/ title when `quote: "\'"`'
  )

  assert.equal(
    to(
      {type: 'definition', identifier: 'a', url: '', title: "'"},
      {quote: "'"}
    ),
    "[a]: <> '\\''\n",
    'should escape a quote in `title` in a title when `quote: "\'"`'
  )

  assert.throws(
    () => {
      to(
        {type: 'definition', identifier: 'a', url: '', title: 'b'},
        // @ts-expect-error: runtime.
        {quote: '.'}
      )
    },
    /Cannot serialize title with `\.` for `options\.quote`, expected `"`, or `'`/,
    'should throw on when given an incorrect `quote`'
  )
})

test('emphasis', () => {
  assert.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'emphasis'}),
    '**\n',
    'should support an empty emphasis'
  )

  assert.throws(
    () => {
      // @ts-expect-error: runtime.
      to({type: 'emphasis'}, {emphasis: '?'})
    },
    /Cannot serialize emphasis with `\?` for `options\.emphasis`, expected `\*`, or `_`/,
    'should throw on when given an incorrect `emphasis`'
  )

  assert.equal(
    to({type: 'emphasis', children: [{type: 'text', value: 'a'}]}),
    '*a*\n',
    'should support an emphasis w/ children'
  )

  assert.equal(
    to(
      {type: 'emphasis', children: [{type: 'text', value: 'a'}]},
      {emphasis: '_'}
    ),
    '_a_\n',
    'should support an emphasis w/ underscores when `emphasis: "_"`'
  )
})

test('heading', () => {
  assert.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'heading'}),
    '#\n',
    'should serialize a heading w/o rank as a heading of rank 1'
  )

  assert.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'heading', depth: 1}),
    '#\n',
    'should serialize a heading w/ rank 1'
  )

  assert.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'heading', depth: 6}),
    '######\n',
    'should serialize a heading w/ rank 6'
  )

  assert.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'heading', depth: 7}),
    '######\n',
    'should serialize a heading w/ rank 7 as 6'
  )

  assert.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'heading', depth: 0}),
    '#\n',
    'should serialize a heading w/ rank 0 as 1'
  )

  assert.equal(
    to({type: 'heading', depth: 1, children: [{type: 'text', value: 'a'}]}),
    '# a\n',
    'should serialize a heading w/ content'
  )

  assert.equal(
    to(
      {type: 'heading', depth: 1, children: [{type: 'text', value: 'a'}]},
      {setext: true}
    ),
    'a\n=\n',
    'should serialize a heading w/ rank 1 as setext when `setext: true`'
  )

  assert.equal(
    to(
      {type: 'heading', depth: 2, children: [{type: 'text', value: 'a'}]},
      {setext: true}
    ),
    'a\n-\n',
    'should serialize a heading w/ rank 2 as setext when `setext: true`'
  )

  assert.equal(
    to(
      {type: 'heading', depth: 3, children: [{type: 'text', value: 'a'}]},
      {setext: true}
    ),
    '### a\n',
    'should serialize a heading w/ rank 3 as atx when `setext: true`'
  )

  assert.equal(
    to(
      {type: 'heading', depth: 2, children: [{type: 'text', value: 'aa\rb'}]},
      {setext: true}
    ),
    'aa\rb\n-\n',
    'should serialize a setext underline as long as the last line (1)'
  )

  assert.equal(
    to(
      {
        type: 'heading',
        depth: 1,
        children: [{type: 'text', value: 'a\r\nbbb'}]
      },
      {setext: true}
    ),
    'a\r\nbbb\n===\n',
    'should serialize a setext underline as long as the last line (2)'
  )

  assert.equal(
    to({type: 'heading', depth: 1, children: []}, {setext: true}),
    '#\n',
    'should serialize an empty heading w/ rank 1 as atx when `setext: true`'
  )

  assert.equal(
    to({type: 'heading', depth: 2, children: []}, {setext: true}),
    '##\n',
    'should serialize an empty heading w/ rank 2 as atx when `setext: true`'
  )

  assert.equal(
    to({
      type: 'heading',
      depth: 1,
      children: [{type: 'inlineCode', value: '\n'}]
    }),
    '`\n`\n=\n',
    'should serialize an heading w/ rank 1 and code w/ a line ending as setext'
  )

  assert.equal(
    to({
      type: 'heading',
      depth: 1,
      children: [{type: 'html', value: '<a\n/>'}]
    }),
    '<a\n/>\n==\n',
    'should serialize an heading w/ rank 1 and html w/ a line ending as setext'
  )

  assert.equal(
    to({
      type: 'heading',
      depth: 1,
      children: [{type: 'text', value: 'a\nb'}]
    }),
    'a\nb\n=\n',
    'should serialize an heading w/ rank 1 and text w/ a line ending as setext'
  )

  assert.equal(
    to({
      type: 'heading',
      depth: 1,
      children: [
        {type: 'text', value: 'a'},
        {type: 'break'},
        {type: 'text', value: 'b'}
      ]
    }),
    'a\\\nb\n=\n',
    'should serialize an heading w/ rank 1 and a break as setext'
  )

  assert.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'heading'}, {closeAtx: true}),
    '# #\n',
    'should serialize a heading with a closing sequence when `closeAtx` (empty)'
  )

  assert.equal(
    to(
      {type: 'heading', depth: 3, children: [{type: 'text', value: 'a'}]},
      {closeAtx: true}
    ),
    '### a ###\n',
    'should serialize a with a closing sequence when `closeAtx` (content)'
  )

  assert.equal(
    to({type: 'heading', depth: 2, children: [{type: 'text', value: '# a'}]}),
    '## # a\n',
    'should not escape a `#` at the start of phrasing in a heading'
  )

  assert.equal(
    to({type: 'heading', depth: 2, children: [{type: 'text', value: '1) a'}]}),
    '## 1) a\n',
    'should not escape a `1)` at the start of phrasing in a heading'
  )

  assert.equal(
    to({type: 'heading', depth: 2, children: [{type: 'text', value: '+ a'}]}),
    '## + a\n',
    'should not escape a `+` at the start of phrasing in a heading'
  )

  assert.equal(
    to({type: 'heading', depth: 2, children: [{type: 'text', value: '- a'}]}),
    '## - a\n',
    'should not escape a `-` at the start of phrasing in a heading'
  )

  assert.equal(
    to({type: 'heading', depth: 2, children: [{type: 'text', value: '= a'}]}),
    '## = a\n',
    'should not escape a `=` at the start of phrasing in a heading'
  )

  assert.equal(
    to({type: 'heading', depth: 2, children: [{type: 'text', value: '> a'}]}),
    '## > a\n',
    'should not escape a `>` at the start of phrasing in a heading'
  )

  assert.equal(
    to({type: 'heading', depth: 1, children: [{type: 'text', value: 'a #'}]}),
    '# a \\#\n',
    'should escape a `#` at the end of a heading (1)'
  )

  assert.equal(
    to({type: 'heading', depth: 1, children: [{type: 'text', value: 'a ##'}]}),
    '# a #\\#\n',
    'should escape a `#` at the end of a heading (2)'
  )

  assert.equal(
    to({type: 'heading', depth: 1, children: [{type: 'text', value: 'a # b'}]}),
    '# a # b\n',
    'should not escape a `#` in a heading (2)'
  )

  assert.equal(
    to({type: 'heading', depth: 1, children: [{type: 'text', value: '  a'}]}),
    '# &#x20; a\n',
    'should encode a space at the start of an atx heading'
  )

  assert.equal(
    to({type: 'heading', depth: 1, children: [{type: 'text', value: '\t\ta'}]}),
    '# &#x9;\ta\n',
    'should encode a tab at the start of an atx heading'
  )

  assert.equal(
    to({type: 'heading', depth: 1, children: [{type: 'text', value: 'a  '}]}),
    '# a &#x20;\n',
    'should encode a space at the end of an atx heading'
  )

  assert.equal(
    to({type: 'heading', depth: 1, children: [{type: 'text', value: 'a\t\t'}]}),
    '# a\t&#x9;\n',
    'should encode a tab at the end of an atx heading'
  )

  assert.equal(
    to({
      type: 'heading',
      depth: 1,
      children: [{type: 'text', value: 'a \n b'}]
    }),
    'a&#x20;\n&#x20;b\n=======\n',
    'should encode spaces around a line ending in a setext heading'
  )

  assert.equal(
    to({
      type: 'heading',
      depth: 3,
      children: [{type: 'text', value: 'a \n b'}]
    }),
    '### a &#xA; b\n',
    'should not need to encode spaces around a line ending in an atx heading (because the line ending is encoded)'
  )
})

test('html', () => {
  // @ts-expect-error: `value` missing
  assert.equal(to({type: 'html'}), '', 'should support a void html')
  assert.equal(
    to({type: 'html', value: ''}),
    '',
    'should support an empty html'
  )
  assert.equal(
    to({type: 'html', value: 'a\nb'}),
    'a\nb\n',
    'should support html'
  )

  assert.equal(
    to({
      type: 'paragraph',
      children: [
        {type: 'text', value: 'a\n'},
        {type: 'html', value: '<div>'}
      ]
    }),
    'a <div>\n',
    'should prevent html (text) from becoming html (flow) (1)'
  )

  assert.equal(
    to({
      type: 'paragraph',
      children: [
        {type: 'text', value: 'a\r'},
        {type: 'html', value: '<div>'}
      ]
    }),
    'a <div>\n',
    'should prevent html (text) from becoming html (flow) (2)'
  )

  assert.equal(
    to({
      type: 'paragraph',
      children: [
        {type: 'text', value: 'a\r\n'},
        {type: 'html', value: '<div>'}
      ]
    }),
    'a <div>\n',
    'should prevent html (text) from becoming html (flow) (3)'
  )

  assert.equal(
    to({
      type: 'paragraph',
      children: [
        {type: 'html', value: '<x>'},
        {type: 'text', value: 'a'}
      ]
    }),
    '<x>a\n',
    'should serialize html (text)'
  )
})

test('image', () => {
  // @ts-expect-error: `url` missing
  assert.equal(to({type: 'image'}), '![]()\n', 'should support an image')

  assert.equal(
    // @ts-expect-error: `url` missing
    to({type: 'image', alt: 'a'}),
    '![a]()\n',
    'should support `alt`'
  )

  assert.equal(
    to({type: 'image', url: 'a'}),
    '![](a)\n',
    'should support a url'
  )

  assert.equal(
    to({type: 'image', url: '', title: 'a'}),
    '![](<> "a")\n',
    'should support a title'
  )

  assert.equal(
    to({type: 'image', url: 'a', title: 'b'}),
    '![](a "b")\n',
    'should support a url and title'
  )

  assert.equal(
    to({type: 'image', url: 'b c'}),
    '![](<b c>)\n',
    'should support an image w/ enclosed url w/ whitespace in url'
  )

  assert.equal(
    to({type: 'image', url: 'b <c'}),
    '![](<b \\<c>)\n',
    'should escape an opening angle bracket in `url` in an enclosed url'
  )

  assert.equal(
    to({type: 'image', url: 'b >c'}),
    '![](<b \\>c>)\n',
    'should escape a closing angle bracket in `url` in an enclosed url'
  )

  assert.equal(
    to({type: 'image', url: 'b \\+c'}),
    '![](<b \\\\+c>)\n',
    'should escape a backslash in `url` in an enclosed url'
  )

  assert.equal(
    to({type: 'image', url: 'b\nc'}),
    '![](<b&#xA;c>)\n',
    'should encode a line ending in `url` in an enclosed url'
  )

  assert.equal(
    to({type: 'image', url: 'b(c'}),
    '![](b\\(c)\n',
    'should escape an opening paren in `url` in a raw url'
  )

  assert.equal(
    to({type: 'image', url: 'b)c'}),
    '![](b\\)c)\n',
    'should escape a closing paren in `url` in a raw url'
  )

  assert.equal(
    to({type: 'image', url: 'b\\+c'}),
    '![](b\\\\+c)\n',
    'should escape a backslash in `url` in a raw url'
  )

  assert.equal(
    to({type: 'image', url: '\f'}),
    '![](<\f>)\n',
    'should support control characters in images'
  )

  assert.equal(
    to({type: 'image', url: '', title: 'b"c'}),
    '![](<> "b\\"c")\n',
    'should escape a double quote in `title`'
  )

  assert.equal(
    to({type: 'image', url: '', title: 'b\\.c'}),
    '![](<> "b\\\\.c")\n',
    'should escape a backslash in `title`'
  )

  assert.equal(
    to({type: 'image', url: '', title: 'b'}, {quote: "'"}),
    "![](<> 'b')\n",
    'should support an image w/ title when `quote: "\'"`'
  )

  assert.equal(
    to({type: 'image', url: '', title: "'"}, {quote: "'"}),
    "![](<> '\\'')\n",
    'should escape a quote in `title` in a title when `quote: "\'"`'
  )

  assert.throws(
    () => {
      // @ts-expect-error: runtime.
      to({type: 'image', title: 'a'}, {quote: '.'})
    },
    /Cannot serialize title with `\.` for `options\.quote`, expected `"`, or `'`/,
    'should throw on when given an incorrect `quote`'
  )
})

test('imageReference', () => {
  assert.equal(
    // @ts-expect-error: `referenceType`, `identifier` missing.
    to({type: 'imageReference'}),
    '![][]\n',
    'should support a link reference (nonsensical)'
  )

  assert.equal(
    // @ts-expect-error: `referenceType`, `identifier` missing.
    to({type: 'imageReference', alt: 'a'}),
    '![a][]\n',
    'should support `alt`'
  )

  assert.equal(
    // @ts-expect-error: `referenceType` missing.
    to({type: 'imageReference', identifier: 'a'}),
    '![][a]\n',
    'should support an `identifier` (nonsensical)'
  )

  assert.equal(
    // @ts-expect-error: `referenceType`, `identifier` missing.
    to({type: 'imageReference', label: 'a'}),
    '![][a]\n',
    'should support a `label` (nonsensical)'
  )

  assert.equal(
    // @ts-expect-error: `identifier` missing.
    to({
      type: 'imageReference',
      alt: 'A',
      label: 'A',
      referenceType: 'shortcut'
    }),
    '![A]\n',
    'should support `referenceType: "shortcut"`'
  )

  assert.equal(
    // @ts-expect-error: `identifier` missing.
    to({
      type: 'imageReference',
      alt: 'A',
      label: 'A',
      referenceType: 'collapsed'
    }),
    '![A][]\n',
    'should support `referenceType: "collapsed"`'
  )

  assert.equal(
    // @ts-expect-error: `identifier` missing.
    to({
      type: 'imageReference',
      alt: 'A',
      label: 'A',
      referenceType: 'full'
    }),
    '![A][A]\n',
    'should support `referenceType: "full"` (default)'
  )

  assert.equal(
    to({
      type: 'imageReference',
      alt: '&',
      label: '&',
      identifier: '&amp;',
      referenceType: 'full'
    }),
    '![&][&]\n',
    'should prefer label over identifier'
  )

  assert.equal(
    to({
      type: 'imageReference',
      alt: '&',
      identifier: '&amp;',
      referenceType: 'full'
    }),
    '![&][&]\n',
    'should decode `identifier` if w/o `label`'
  )

  assert.equal(
    to({
      type: 'paragraph',
      children: [
        {
          type: 'imageReference',
          alt: '&a;',
          identifier: '&b;',
          referenceType: 'full'
        }
      ]
    }),
    '![\\&a;][&b;]\n',
    'should support incorrect character references'
  )

  assert.equal(
    to({
      type: 'imageReference',
      alt: '+',
      identifier: '\\+',
      referenceType: 'full'
    }),
    '![+][+]\n',
    'should unescape `identifier` if w/o `label`'
  )

  assert.equal(
    // @ts-expect-error: `referenceType`, `identifier` missing.
    to({type: 'imageReference', alt: 'a', label: 'a'}),
    '![a][]\n',
    'should use a collapsed reference if w/o `referenceType` and the label matches the reference'
  )

  assert.equal(
    // @ts-expect-error: `referenceType`, `identifier` missing.
    to({type: 'imageReference', alt: 'a', label: 'b'}),
    '![a][b]\n',
    'should use a full reference if w/o `referenceType` and the label does not match the reference'
  )
})

test('code (text)', () => {
  assert.equal(
    // @ts-expect-error: `value` missing.
    to({type: 'inlineCode'}),
    '``\n',
    'should support an empty code text'
  )

  assert.equal(
    to({type: 'inlineCode', value: 'a'}),
    '`a`\n',
    'should support a code text'
  )

  assert.equal(
    to({type: 'inlineCode', value: ' '}),
    '` `\n',
    'should support a space'
  )

  assert.equal(
    to({type: 'inlineCode', value: '\n'}),
    '`\n`\n',
    'should support an eol'
  )

  assert.equal(
    to({type: 'inlineCode', value: '  '}),
    '`  `\n',
    'should support several spaces'
  )

  assert.equal(
    to({type: 'inlineCode', value: 'a`b'}),
    '``a`b``\n',
    'should use a fence of two grave accents if the value contains one'
  )

  assert.equal(
    to({type: 'inlineCode', value: 'a``b'}),
    '`a``b`\n',
    'should use a fence of one grave accent if the value contains two'
  )

  assert.equal(
    to({type: 'inlineCode', value: 'a``b`c'}),
    '```a``b`c```\n',
    'should use a fence of three grave accents if the value contains two and one'
  )

  assert.equal(
    to({type: 'inlineCode', value: '`a'}),
    '`` `a ``\n',
    'should pad w/ a space if the value starts w/ a grave accent'
  )

  assert.equal(
    to({type: 'inlineCode', value: 'a`'}),
    '`` a` ``\n',
    'should pad w/ a space if the value ends w/ a grave accent'
  )

  assert.equal(
    to({type: 'inlineCode', value: ' a '}),
    '`  a  `\n',
    'should pad w/ a space if the value starts and ends w/ a space'
  )

  assert.equal(
    to({type: 'inlineCode', value: ' a'}),
    '` a`\n',
    'should not pad w/ spaces if the value ends w/ a non-space'
  )

  assert.equal(
    to({type: 'inlineCode', value: 'a '}),
    '`a `\n',
    'should not pad w/ spaces if the value starts w/ a non-space'
  )

  assert.equal(
    to({type: 'inlineCode', value: 'a\n- b'}),
    '`a - b`\n',
    'should prevent breaking out of code (-)'
  )

  assert.equal(
    to({type: 'inlineCode', value: 'a\n#'}),
    '`a #`\n',
    'should prevent breaking out of code (#)'
  )

  assert.equal(
    to({type: 'inlineCode', value: 'a\n1. '}),
    '`a 1. `\n',
    'should prevent breaking out of code (\\d\\.)'
  )

  assert.equal(
    to({type: 'inlineCode', value: 'a\r- b'}),
    '`a - b`\n',
    'should prevent breaking out of code (cr)'
  )

  assert.equal(
    to({type: 'inlineCode', value: 'a\r\n- b'}),
    '`a - b`\n',
    'should prevent breaking out of code (crlf)'
  )
})

test('link', () => {
  // @ts-expect-error: `children`, `url` missing.
  assert.equal(to({type: 'link'}), '[]()\n', 'should support a link')

  assert.equal(
    // @ts-expect-error: `url` missing.
    to({type: 'link', children: [{type: 'text', value: 'a'}]}),
    '[a]()\n',
    'should support children'
  )

  assert.equal(
    to({type: 'link', url: 'a', children: []}),
    '[](a)\n',
    'should support a url'
  )

  assert.equal(
    to({type: 'link', url: '', title: 'a', children: []}),
    '[](<> "a")\n',
    'should support a title'
  )

  assert.equal(
    to({type: 'link', url: 'a', title: 'b', children: []}),
    '[](a "b")\n',
    'should support a url and title'
  )

  assert.equal(
    to({type: 'link', url: 'b c', children: []}),
    '[](<b c>)\n',
    'should support a link w/ enclosed url w/ whitespace in url'
  )

  assert.equal(
    to({type: 'link', url: 'b <c', children: []}),
    '[](<b \\<c>)\n',
    'should escape an opening angle bracket in `url` in an enclosed url'
  )

  assert.equal(
    to({type: 'link', url: 'b >c', children: []}),
    '[](<b \\>c>)\n',
    'should escape a closing angle bracket in `url` in an enclosed url'
  )

  assert.equal(
    to({type: 'link', url: 'b \\+c', children: []}),
    '[](<b \\\\+c>)\n',
    'should escape a backslash in `url` in an enclosed url'
  )

  assert.equal(
    to({type: 'link', url: 'b\nc', children: []}),
    '[](<b&#xA;c>)\n',
    'should encode a line ending in `url` in an enclosed url'
  )

  assert.equal(
    to({type: 'link', url: 'b(c', children: []}),
    '[](b\\(c)\n',
    'should escape an opening paren in `url` in a raw url'
  )

  assert.equal(
    to({type: 'link', url: 'b)c', children: []}),
    '[](b\\)c)\n',
    'should escape a closing paren in `url` in a raw url'
  )

  assert.equal(
    to({type: 'link', url: 'b\\.c', children: []}),
    '[](b\\\\.c)\n',
    'should escape a backslash in `url` in a raw url'
  )

  assert.equal(
    to({type: 'link', url: '\f', children: []}),
    '[](<\f>)\n',
    'should support control characters in links'
  )

  assert.equal(
    to({type: 'link', url: '', title: 'b"c', children: []}),
    '[](<> "b\\"c")\n',
    'should escape a double quote in `title`'
  )

  assert.equal(
    to({type: 'link', url: '', title: 'b\\-c', children: []}),
    '[](<> "b\\\\-c")\n',
    'should escape a backslash in `title`'
  )

  assert.equal(
    to({
      type: 'link',
      url: 'tel:123',
      children: [{type: 'text', value: 'tel:123'}]
    }),
    '<tel:123>\n',
    'should use an autolink for nodes w/ a value similar to the url and a protocol'
  )

  assert.equal(
    to(
      {
        type: 'link',
        url: 'tel:123',
        children: [{type: 'text', value: 'tel:123'}]
      },
      {resourceLink: true}
    ),
    '[tel:123](tel:123)\n',
    'should use a resource link (`resourceLink: true`)'
  )

  assert.equal(
    to({
      type: 'link',
      url: 'a',
      children: [{type: 'text', value: 'a'}]
    }),
    '[a](a)\n',
    'should use a normal link for nodes w/ a value similar to the url w/o a protocol'
  )

  assert.equal(
    to({
      type: 'link',
      url: 'tel:123',
      children: [{type: 'text', value: 'tel:123'}]
    }),
    '<tel:123>\n',
    'should use an autolink for nodes w/ a value similar to the url and a protocol'
  )

  assert.equal(
    to({
      type: 'link',
      url: 'tel:123',
      title: 'a',
      children: [{type: 'text', value: 'tel:123'}]
    }),
    '[tel:123](tel:123 "a")\n',
    'should use a normal link for nodes w/ a value similar to the url w/ a title'
  )

  assert.equal(
    to({
      type: 'link',
      url: 'mailto:a@b.c',
      children: [{type: 'text', value: 'a@b.c'}]
    }),
    '<a@b.c>\n',
    'should use an autolink for nodes w/ a value similar to the url and a protocol (email)'
  )

  assert.deepEqual(
    to({
      type: 'paragraph',
      children: [
        {
          type: 'link',
          url: 'mailto:a.b-c_d@a.b',
          children: [{type: 'text', value: 'a.b-c_d@a.b'}]
        }
      ]
    }),
    '<a.b-c_d@a.b>\n',
    'should not escape in autolinks'
  )

  assert.equal(
    to({type: 'link', url: '', title: 'b', children: []}, {quote: "'"}),
    "[](<> 'b')\n",
    'should support a link w/ title when `quote: "\'"`'
  )

  assert.equal(
    to({type: 'link', url: '', title: "'", children: []}, {quote: "'"}),
    "[](<> '\\'')\n",
    'should escape a quote in `title` in a title when `quote: "\'"`'
  )

  assert.equal(
    to({type: 'link', url: 'a b![c](d*e_f[g_h`i', children: []}),
    '[](<a b![c](d*e_f[g_h`i>)\n',
    'should not escape unneeded characters in a `destinationLiteral`'
  )

  assert.equal(
    to({type: 'link', url: 'a![b](c*d_e[f_g`h<i</j', children: []}),
    '[](a![b]\\(c*d_e[f_g`h<i</j)\n',
    'should not escape unneeded characters in a `destinationRaw`'
  )

  assert.equal(
    to({type: 'link', url: '#', title: 'a![b](c*d_e[f_g`h<i</j', children: []}),
    '[](# "a![b](c*d_e[f_g`h<i</j")\n',
    'should not escape unneeded characters in a `title` (double quotes)'
  )

  assert.equal(
    to(
      {type: 'link', url: '#', title: 'a![b](c*d_e[f_g`h<i</j', children: []},
      {quote: "'"}
    ),
    "[](# 'a![b](c*d_e[f_g`h<i</j')\n",
    'should not escape unneeded characters in a `title` (single quotes)'
  )

  assert.throws(
    () => {
      // @ts-expect-error: runtime.
      to({type: 'link', title: 'b'}, {quote: '.'})
    },
    /Cannot serialize title with `\.` for `options\.quote`, expected `"`, or `'`/,
    'should throw on when given an incorrect `quote`'
  )
})

test('linkReference', () => {
  assert.equal(
    // @ts-expect-error: `children`, `referenceType`, `identifier` missing.
    to({type: 'linkReference'}),
    '[][]\n',
    'should support a link reference (nonsensical)'
  )

  assert.equal(
    // @ts-expect-error: `referenceType`, `identifier` missing.
    to({type: 'linkReference', children: [{type: 'text', value: 'a'}]}),
    '[a][]\n',
    'should support `children`'
  )

  assert.equal(
    // @ts-expect-error: `identifier` missing.
    to({type: 'linkReference', identifier: 'a'}),
    '[][a]\n',
    'should support an `identifier` (nonsensical)'
  )

  assert.equal(
    // @ts-expect-error: `children`, `referenceType`, `identifier` missing.
    to({type: 'linkReference', label: 'a'}),
    '[][a]\n',
    'should support a `label` (nonsensical)'
  )

  assert.equal(
    // @ts-expect-error: `identifier` missing.
    to({
      type: 'linkReference',
      children: [{type: 'text', value: 'A'}],
      label: 'A',
      referenceType: 'shortcut'
    }),
    '[A]\n',
    'should support `referenceType: "shortcut"`'
  )

  assert.equal(
    to({
      type: 'linkReference',
      children: [{type: 'text', value: 'A'}],
      label: 'A',
      identifier: 'a',
      referenceType: 'collapsed'
    }),
    '[A][]\n',
    'should support `referenceType: "collapsed"`'
  )

  assert.equal(
    to({
      type: 'linkReference',
      children: [{type: 'text', value: 'A'}],
      label: 'A',
      identifier: 'a',
      referenceType: 'full'
    }),
    '[A][A]\n',
    'should support `referenceType: "full"` (default)'
  )

  assert.equal(
    to({
      type: 'linkReference',
      children: [{type: 'text', value: '&'}],
      label: '&',
      identifier: '&amp;',
      referenceType: 'full'
    }),
    '[&][&]\n',
    'should prefer label over identifier'
  )

  assert.equal(
    to({
      type: 'linkReference',
      children: [{type: 'text', value: '&'}],
      identifier: '&amp;',
      referenceType: 'full'
    }),
    '[&][&]\n',
    'should decode `identifier` if w/o `label`'
  )

  assert.equal(
    to({
      type: 'paragraph',
      children: [
        {
          type: 'linkReference',
          children: [{type: 'text', value: '&a;'}],
          identifier: '&b;',
          referenceType: 'full'
        }
      ]
    }),
    '[\\&a;][&b;]\n',
    'should support incorrect character references'
  )

  assert.equal(
    to({
      type: 'linkReference',
      identifier: 'a![b](c*d_e[f_g`h<i</j',
      referenceType: 'full',
      children: []
    }),
    '[][a!\\[b\\](c*d_e\\[f_g`h<i</j]\n',
    'should not escape unneeded characters in a `reference`'
  )

  assert.equal(
    to({
      type: 'linkReference',
      children: [{type: 'text', value: '+'}],
      identifier: '\\+',
      referenceType: 'full'
    }),
    '[+][+]\n',
    'should unescape `identifier` if w/o `label`'
  )

  assert.equal(
    // @ts-expect-error: `referenceType` missing.
    to({
      type: 'linkReference',
      children: [{type: 'text', value: 'a'}],
      label: 'a',
      identifier: 'a'
    }),
    '[a][]\n',
    'should use a collapsed reference if w/o `referenceType` and the label matches the reference'
  )

  assert.equal(
    // @ts-expect-error: `referenceType` missing.
    to({
      type: 'linkReference',
      children: [{type: 'text', value: 'a'}],
      label: 'b',
      identifier: 'b'
    }),
    '[a][b]\n',
    'should use a full reference if w/o `referenceType` and the label does not match the reference'
  )

  assert.equal(
    to({
      type: 'paragraph',
      children: [
        // @ts-expect-error: `referenceType`, `identifier` missing.
        {type: 'linkReference', children: [{type: 'text', value: 'a'}]},
        {type: 'text', value: '(b)'}
      ]
    }),
    '[a][]\\(b)\n',
    'should use a full reference if w/o `referenceType` and the label does not match the reference'
  )
})

test('list', () => {
  // @ts-expect-error: `children` missing.
  assert.equal(to({type: 'list'}), '', 'should support an empty list')

  assert.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'list', children: [{type: 'listItem'}]}),
    '*\n',
    'should support a list w/ an item'
  )

  assert.equal(
    to({
      type: 'list',
      children: [
        {
          type: 'listItem',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a'}]}
          ]
        },
        {
          type: 'listItem',
          children: [{type: 'thematicBreak'}]
        },
        {
          type: 'listItem',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
          ]
        }
      ]
    }),
    '-   a\n\n-   ***\n\n-   b\n',
    'should support a list w/ items'
  )

  assert.equal(
    to({
      type: 'list',
      spread: false,
      children: [
        {
          type: 'listItem',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a'}]}
          ]
        },
        {
          type: 'listItem',
          children: [{type: 'thematicBreak'}]
        }
      ]
    }),
    '-   a\n-   ***\n',
    'should not use blank lines between items for lists w/ `spread: false`'
  )

  assert.equal(
    to({
      type: 'list',
      spread: false,
      children: [
        {
          type: 'listItem',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
            {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
          ]
        },
        {
          type: 'listItem',
          children: [{type: 'thematicBreak'}]
        }
      ]
    }),
    '-   a\n\n    b\n-   ***\n',
    'should support a list w/ `spread: false`, w/ a spread item'
  )

  assert.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'list', ordered: true, children: [{type: 'listItem'}]}),
    '1.\n',
    'should support a list w/ `ordered` and an empty item'
  )

  assert.equal(
    to({
      type: 'list',
      ordered: true,
      children: [
        {
          type: 'listItem',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a'}]}
          ]
        },
        {
          type: 'listItem',
          children: [{type: 'thematicBreak'}]
        },
        {
          type: 'listItem',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
          ]
        }
      ]
    }),
    '1.  a\n\n2.  ***\n\n3.  b\n',
    'should support a list w/ `ordered`'
  )

  assert.equal(
    to({
      type: 'list',
      ordered: true,
      spread: false,
      children: [
        {
          type: 'listItem',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a'}]}
          ]
        },
        {
          type: 'listItem',
          children: [{type: 'thematicBreak'}]
        },
        {
          type: 'listItem',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
          ]
        }
      ]
    }),
    '1.  a\n2.  ***\n3.  b\n',
    'should support a list w/ `ordered` and `spread: false`'
  )

  assert.equal(
    to(
      {
        type: 'list',
        ordered: true,
        spread: false,
        children: [
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'a'}]}
            ]
          },
          {
            type: 'listItem',
            children: [{type: 'thematicBreak'}]
          },
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
            ]
          }
        ]
      },
      {incrementListMarker: false}
    ),
    '1.  a\n1.  ***\n1.  b\n',
    'should support a list w/ `ordered` when `incrementListMarker: false`'
  )

  assert.equal(
    to(
      {
        type: 'list',
        ordered: true,
        start: 0,
        children: [
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'a'}]}
            ]
          },
          {
            type: 'listItem',
            children: [{type: 'thematicBreak'}]
          }
        ]
      },
      {listItemIndent: 'one'}
    ),
    '0. a\n\n1. ***\n',
    'should support a list w/ `ordered` and `start`'
  )

  assert.equal(
    to(
      {
        type: 'list',
        spread: false,
        children: [
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'a\nb'}]}
            ]
          },
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'c\nd'}]}
            ]
          }
        ]
      },
      {listItemIndent: 'mixed'}
    ),
    '* a\n  b\n* c\n  d\n',
    'should support a correct prefix and indent `listItemIndent: "mixed"` and a tight list'
  )

  assert.equal(
    to(
      {
        type: 'list',
        spread: true,
        children: [
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'a\nb'}]}
            ]
          },
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'c\nd'}]}
            ]
          }
        ]
      },
      {listItemIndent: 'mixed'}
    ),
    '*   a\n    b\n\n*   c\n    d\n',
    'should support a correct prefix and indent `listItemIndent: "mixed"` and a tight list'
  )

  assert.equal(
    to(
      {
        type: 'list',
        ordered: true,
        spread: false,
        start: 9,
        children: [
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'a\nb'}]}
            ]
          },
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'c\nd'}]}
            ]
          }
        ]
      },
      {listItemIndent: 'one'}
    ),
    '9. a\n   b\n10. c\n    d\n',
    'should support a correct prefix and indent for items 9 and 10 when `listItemIndent: "one"`'
  )

  assert.equal(
    to(
      {
        type: 'list',
        ordered: true,
        spread: false,
        start: 99,
        children: [
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'a\nb'}]}
            ]
          },
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'c\nd'}]}
            ]
          }
        ]
      },
      {listItemIndent: 'one'}
    ),
    '99. a\n    b\n100. c\n     d\n',
    'should support a correct prefix and indent for items 99 and 100 when `listItemIndent: "one"`'
  )

  assert.equal(
    to(
      {
        type: 'list',
        ordered: true,
        spread: false,
        start: 999,
        children: [
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'a\nb'}]}
            ]
          },
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'c\nd'}]}
            ]
          }
        ]
      },
      {listItemIndent: 'one'}
    ),
    '999. a\n     b\n1000. c\n      d\n',
    'should support a correct prefix and indent for items 999 and 1000 when `listItemIndent: "one"`'
  )

  assert.equal(
    to(
      {
        type: 'list',
        ordered: true,
        spread: false,
        start: 9,
        children: [
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'a\nb'}]}
            ]
          },
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'c\nd'}]}
            ]
          }
        ]
      },
      {listItemIndent: 'tab'}
    ),
    '9.  a\n    b\n10. c\n    d\n',
    'should support a correct prefix and indent for items 9 and 10 when `listItemIndent: "tab"`'
  )

  assert.equal(
    to(
      {
        type: 'list',
        ordered: true,
        spread: false,
        start: 99,
        children: [
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'a\nb'}]}
            ]
          },
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'c\nd'}]}
            ]
          }
        ]
      },
      {listItemIndent: 'tab'}
    ),
    '99. a\n    b\n100.    c\n        d\n',
    'should support a correct prefix and indent for items 99 and 100 when `listItemIndent: "tab"`'
  )

  assert.equal(
    to(
      {
        type: 'list',
        ordered: true,
        spread: false,
        start: 999,
        children: [
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'a\nb'}]}
            ]
          },
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'c\nd'}]}
            ]
          }
        ]
      },
      {listItemIndent: 'tab'}
    ),
    '999.    a\n        b\n1000.   c\n        d\n',
    'should support a correct prefix and indent for items 999 and 1000 when `listItemIndent: "tab"`'
  )
})

test('listItem', () => {
  // @ts-expect-error: `children` missing.
  assert.equal(to({type: 'listItem'}), '*\n', 'should support a list item')

  assert.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'listItem'}, {bullet: '+'}),
    '+\n',
    'should serialize an item w/ a plus as bullet when `bullet: "+"`'
  )

  assert.throws(
    () => {
      // @ts-expect-error: runtime.
      to({type: 'listItem'}, {bullet: '.'})
    },
    /Cannot serialize items with `\.` for `options\.bullet`, expected `\*`, `\+`, or `-`/,
    'should throw on an incorrect bullet'
  )

  assert.equal(
    to({
      type: 'listItem',
      children: [{type: 'paragraph', children: [{type: 'text', value: 'a'}]}]
    }),
    '*   a\n',
    'should support a list item w/ a child'
  )

  assert.equal(
    to({
      type: 'listItem',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
        {type: 'thematicBreak'},
        {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
      ]
    }),
    '*   a\n\n    ***\n\n    b\n',
    'should support a list item w/ children'
  )

  assert.equal(
    to(
      {
        type: 'listItem',
        children: [
          {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
          {type: 'thematicBreak'}
        ]
      },
      {listItemIndent: 'one'}
    ),
    '* a\n\n  ***\n',
    'should use one space after the bullet for `listItemIndent: "one"`'
  )

  assert.equal(
    to(
      {
        type: 'listItem',
        children: [
          {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
          {type: 'thematicBreak'}
        ]
      },
      // @ts-expect-error: runtime.
      {listItemIndent: '1'}
    ),
    '* a\n\n  ***\n',
    'should use one space after the bullet for `listItemIndent: "1"` (deprecated)'
  )

  assert.equal(
    to(
      {
        type: 'listItem',
        children: [{type: 'paragraph', children: [{type: 'text', value: 'a'}]}]
      },
      {listItemIndent: 'mixed'}
    ),
    '* a\n',
    'should use one space after the bullet for `listItemIndent: "mixed"`, when the item is not spread'
  )

  assert.equal(
    to(
      {
        type: 'listItem',
        spread: true,
        children: [
          {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
          {type: 'thematicBreak'}
        ]
      },
      {listItemIndent: 'mixed'}
    ),
    '*   a\n\n    ***\n',
    'should use a tab stop of spaces after the bullet for `listItemIndent: "mixed"`, when the item is spread'
  )

  assert.throws(
    () => {
      // @ts-expect-error: runtime.
      to({type: 'listItem'}, {listItemIndent: 'x'})
    },
    /Cannot serialize items with `x` for `options\.listItemIndent`, expected `tab`, `one`, or `mixed`/,
    'should throw on an incorrect `listItemIndent`'
  )

  assert.equal(
    to({
      type: 'listItem',
      spread: false,
      children: [
        {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
        {type: 'thematicBreak'}
      ]
    }),
    '*   a\n    ***\n',
    'should not use blank lines between child blocks for items w/ `spread: false`'
  )

  /**
   * @param {BlockContent|Array<BlockContent>} [d]
   * @returns {List}
   */
  function createList(d) {
    return {
      type: 'list',
      children: [
        {type: 'listItem', children: Array.isArray(d) ? d : d ? [d] : []}
      ]
    }
  }

  assert.equal(
    to(createList(createList(createList())), {bulletOther: '+'}),
    '*   *   +\n',
    'should support `bulletOther`'
  )

  assert.equal(
    to(createList(createList(createList())), {bullet: '-'}),
    '-   -   *\n',
    'should default to an `bulletOther` different from `bullet` (1)'
  )

  assert.equal(
    to(createList(createList(createList())), {bullet: '*'}),
    '*   *   -\n',
    'should default to an `bulletOther` different from `bullet` (2)'
  )

  assert.throws(
    () => {
      // @ts-expect-error: runtime.
      to(createList(createList(createList())), {bulletOther: '?'})
    },
    /Cannot serialize items with `\?` for `options\.bulletOther`, expected/,
    'should throw when given an incorrect `bulletOther`'
  )

  assert.throws(
    () => {
      to(createList(createList(createList())), {bullet: '-', bulletOther: '-'})
    },
    /Expected `bullet` \(`-`\) and `bulletOther` \(`-`\) to be different/,
    'should throw when an `bulletOther` is given equal to `bullet`'
  )

  assert.equal(
    to({
      type: 'list',
      children: [{type: 'listItem', children: [{type: 'thematicBreak'}]}]
    }),
    '-   ***\n',
    'should use a different bullet than a thematic rule marker, if the first child of a list item is a thematic break (1)'
  )

  assert.equal(
    to({
      type: 'list',
      children: [
        {
          type: 'listItem',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a'}]}
          ]
        },
        {type: 'listItem', children: [{type: 'thematicBreak'}]}
      ]
    }),
    '-   a\n\n-   ***\n',
    'should use a different bullet than a thematic rule marker, if the first child of a list item is a thematic break (2)'
  )

  assert.equal(
    to(createList(createList())),
    '*   *\n',
    'should *not* use a different bullet for an empty list item in two lists'
  )

  assert.equal(
    to(createList(createList(createList()))),
    '*   *   -\n',
    'should use a different bullet for an empty list item in three lists (1)'
  )

  assert.equal(
    to({
      type: 'list',
      children: [
        {type: 'listItem', children: []},
        {type: 'listItem', children: [createList(createList())]}
      ]
    }),
    '*\n\n*   *   -\n',
    'should use a different bullet for an empty list item in three lists (2)'
  )

  assert.equal(
    to(createList(createList(createList())), {bullet: '+'}),
    '+   +   +\n',
    'should not use a different bullet for an empty list item in three lists if `bullet` isn’t a thematic rule marker'
  )

  assert.equal(
    to(createList(createList(createList(createList())))),
    '*   *   *   -\n',
    'should use a different bullet for an empty list item in four lists'
  )

  assert.equal(
    to(createList(createList(createList(createList(createList()))))),
    '*   *   *   *   -\n',
    'should use a different bullet for an empty list item in five lists'
  )

  assert.equal(
    to(
      createList(
        createList([
          createList({
            type: 'paragraph',
            children: [{type: 'text', value: 'a'}]
          }),
          createList()
        ])
      )
    ),
    '*   *   *   a\n\n        <!---->\n\n        *\n',
    'should not use a different bullet for an empty list item at non-head in two lists'
  )

  assert.equal(
    to(
      {
        type: 'list',
        ordered: true,
        children: [{type: 'listItem', children: []}]
      },
      {bulletOrdered: ')'}
    ),
    '1)\n',
    'should support `bulletOrdered`'
  )

  assert.throws(
    () => {
      to(
        {
          type: 'list',
          ordered: true,
          children: [{type: 'listItem', children: []}]
        },
        // @ts-expect-error: runtime.
        {bulletOrdered: '~'}
      )
    },
    /Cannot serialize items with `~` for `options.bulletOrdered`/,
    'should throw on a `bulletOrdered` that is invalid'
  )

  assert.equal(
    to(
      {
        type: 'root',
        children: [
          {
            type: 'list',
            ordered: true,
            children: [{type: 'listItem', children: []}]
          },
          {
            type: 'list',
            ordered: true,
            children: [{type: 'listItem', children: []}]
          }
        ]
      },
      {bulletOrdered: '.', bulletOrderedOther: ')'}
    ),
    '1.\n\n1)\n',
    'should support `bulletOrderedOther`'
  )

  assert.throws(
    () => {
      to(
        {
          type: 'list',
          ordered: true,
          children: [{type: 'listItem', children: []}]
        },
        // @ts-expect-error: runtime.
        {bulletOrderedOther: '~'}
      )
    },
    /Cannot serialize items with `~` for `options.bulletOrderedOther`/,
    'should throw on a `bulletOrderedOther` that is invalid'
  )

  assert.throws(
    () => {
      to(
        {
          type: 'root',
          children: [
            {
              type: 'list',
              ordered: true,
              children: [{type: 'listItem', children: []}]
            },
            {
              type: 'list',
              ordered: true,
              children: [{type: 'listItem', children: []}]
            }
          ]
        },
        {bulletOrdered: '.', bulletOrderedOther: '.'}
      )
    },
    /Expected `bulletOrdered` \(`.`\) and `bulletOrderedOther` \(`.`\) to be different/,
    'should throw on a `bulletOrderedOther` that matches `bulletOrdered`'
  )
})

test('paragraph', () => {
  // @ts-expect-error: `children` missing.
  assert.equal(to({type: 'paragraph'}), '', 'should support an empty paragraph')

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a\nb'}]}),
    'a\nb\n',
    'should support a paragraph'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '  a'}]}),
    '&#x20; a\n',
    'should encode spaces at the start of paragraphs'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a  '}]}),
    'a &#x20;\n',
    'should encode spaces at the end of paragraphs'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '\t\ta'}]}),
    '&#x9;\ta\n',
    'should encode tabs at the start of paragraphs'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a\t\t'}]}),
    'a\t&#x9;\n',
    'should encode tabs at the end of paragraphs'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a  \n  b'}]}),
    'a &#x20;\n&#x20; b\n',
    'should encode spaces around line endings in paragraphs'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a\t\t\n\t\tb'}]}),
    'a\t&#x9;\n&#x9;\tb\n',
    'should encode spaces around line endings in paragraphs'
  )
})

test('strong', () => {
  // @ts-expect-error: `children` missing.
  assert.equal(to({type: 'strong'}), '****\n', 'should support an empty strong')

  assert.throws(
    () => {
      // @ts-expect-error: runtime.
      to({type: 'strong'}, {strong: '?'})
    },
    /Cannot serialize strong with `\?` for `options\.strong`, expected `\*`, or `_`/,
    'should throw on when given an incorrect `strong`'
  )

  assert.equal(
    to({type: 'strong', children: [{type: 'text', value: 'a'}]}),
    '**a**\n',
    'should support a strong w/ children'
  )

  assert.equal(
    to({type: 'strong', children: [{type: 'text', value: 'a'}]}, {strong: '_'}),
    '__a__\n',
    'should support a strong w/ underscores when `emphasis: "_"`'
  )
})

test('text', () => {
  // @ts-expect-error: `value` missing.
  assert.equal(to({type: 'text'}), '', 'should support a void text')
  assert.equal(
    to({type: 'text', value: ''}),
    '',
    'should support an empty text'
  )
  assert.equal(
    to({type: 'text', value: 'a\nb'}),
    'a\nb\n',
    'should support text'
  )
})

test('thematic break', () => {
  assert.equal(
    to({type: 'thematicBreak'}),
    '***\n',
    'should support a thematic break'
  )

  assert.equal(
    to({type: 'thematicBreak'}, {rule: '-'}),
    '---\n',
    'should support a thematic break w/ dashes when `rule: "-"`'
  )

  assert.equal(
    to({type: 'thematicBreak'}, {rule: '_'}),
    '___\n',
    'should support a thematic break w/ underscores when `rule: "_"`'
  )

  assert.throws(
    () => {
      // @ts-expect-error: runtime.
      to({type: 'thematicBreak'}, {rule: '.'})
    },
    /Cannot serialize rules with `.` for `options\.rule`, expected `\*`, `-`, or `_`/,
    'should throw on when given an incorrect `rule`'
  )

  assert.equal(
    to({type: 'thematicBreak'}, {ruleRepetition: 5}),
    '*****\n',
    'should support a thematic break w/ more repetitions w/ `ruleRepetition`'
  )

  assert.throws(
    () => {
      to({type: 'thematicBreak'}, {ruleRepetition: 2})
    },
    /Cannot serialize rules with repetition `2` for `options\.ruleRepetition`, expected `3` or more/,
    'should throw on when given an incorrect `ruleRepetition`'
  )

  assert.equal(
    to({type: 'thematicBreak'}, {ruleSpaces: true}),
    '* * *\n',
    'should support a thematic break w/ spaces w/ `ruleSpaces`'
  )
})

test('escape', () => {
  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '> a\n> b\nc >'}]}),
    '\\> a\n\\> b\nc >\n',
    'should escape what would otherwise be a block quote in a paragraph'
  )

  assert.equal(
    to({
      type: 'listItem',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: '> a\n> b'}]}
      ]
    }),
    '*   \\> a\n    \\> b\n',
    'should escape what would otherwise be a block quote in a list item'
  )

  assert.equal(
    to({
      type: 'blockquote',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: '> a\n> b'}]}
      ]
    }),
    '> \\> a\n> \\> b\n',
    'should escape what would otherwise be a block quote in a block quote'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a\\\nb'}]}),
    'a\\\\\nb\n',
    'should escape what would otherwise be a break'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '&amp'}]}),
    '\\&amp\n',
    'should escape what would otherwise be a named character reference'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '&#9;'}]}),
    '\\&#9;\n',
    'should escape what would otherwise be a numeric character reference'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a\\+b'}]}),
    'a\\\\+b\n',
    'should escape what would otherwise be a character escape'
  )

  assert.equal(
    to({
      type: 'paragraph',
      children: [
        {type: 'text', value: 'a\\'},
        {
          type: 'link',
          children: [{type: 'text', value: 'https://a.b'}],
          url: 'https://a.b'
        }
      ]
    }),
    'a\\\\<https://a.b>\n',
    'should escape what would otherwise be a character escape of an autolink'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '```js\n```'}]}),
    '\\`\\`\\`js\n\\`\\`\\`\n',
    'should escape what would otherwise be code (flow)'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '[a]: b'}]}),
    '\\[a]: b\n',
    'should escape what would otherwise be a definition'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '*a*'}]}),
    '\\*a\\*\n',
    'should escape what would otherwise be emphasis (asterisk)'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '_a_'}]}),
    '\\_a\\_\n',
    'should escape what would otherwise be emphasis (underscore)'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '# a'}]}),
    '\\# a\n',
    'should escape what would otherwise be a heading (atx)'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a\n='}]}),
    'a\n\\=\n',
    'should escape what would otherwise be a heading (setext, equals)'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a\n-'}]}),
    'a\n\\-\n',
    'should escape what would otherwise be a heading (setext, dash)'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '<a\nb>'}]}),
    '\\<a\nb>\n',
    'should escape what would otherwise be html'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a `b`\n`c` d'}]}),
    'a \\`b\\`\n\\`c\\` d\n',
    'should escape what would otherwise be code (text)'
  )

  assert.equal(
    to({
      type: 'paragraph',
      children: [
        {type: 'text', value: '!'},
        {
          type: 'link',
          children: [{type: 'text', value: 'a'}],
          url: 'b'
        }
      ]
    }),
    '\\![a](b)\n',
    'should escape what would otherwise turn a link into an image'
  )

  assert.equal(
    to({
      type: 'paragraph',
      children: [
        {type: 'text', value: '!'},
        {
          type: 'linkReference',
          children: [{type: 'text', value: 'a'}],
          label: 'b',
          identifier: 'b',
          referenceType: 'shortcut'
        }
      ]
    }),
    '\\![a][b]\n',
    'should escape what would otherwise turn a link reference into an image reference'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '![a][b]'}]}),
    '!\\[a]\\[b]\n',
    'should escape what would otherwise be an image (reference)'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '![](a.jpg)'}]}),
    '!\\[]\\(a.jpg)\n',
    'should escape what would otherwise be an image (resource)'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '[a][b]'}]}),
    '\\[a]\\[b]\n',
    'should escape what would otherwise be a link (reference)'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '[](a.jpg)'}]}),
    '\\[]\\(a.jpg)\n',
    'should escape what would otherwise be a link (resource)'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '+ a\n+ b'}]}),
    '\\+ a\n\\+ b\n',
    'should escape what would otherwise be a list item (plus)'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '+a'}]}),
    '+a\n',
    'should not escape `+` when not followed by whitespace'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '- a\n- b'}]}),
    '\\- a\n\\- b\n',
    'should escape what would otherwise be a list item (dash)'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '-a'}]}),
    '-a\n',
    'should not escape `-` when not followed by whitespace'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '--a'}]}),
    '\\--a\n',
    'should escape `-` when followed by another `-` (as it looks like a thematic break, setext underline)'
  )

  // Note: these are in titles, because the `*` case here is about flow nodes,
  // not phrasing (emphasis).
  assert.equal(
    to({type: 'definition', identifier: 'x', url: 'y', title: 'a\n* b\n* c'}),
    '[x]: y "a\n\\* b\n\\* c"\n',
    'should escape what would otherwise be a list item (asterisk)'
  )

  assert.equal(
    to({type: 'definition', identifier: 'x', url: 'y', title: 'a\n*b'}),
    '[x]: y "a\n*b"\n',
    'should not escape `*` when not followed by whitespace'
  )

  assert.equal(
    to({type: 'definition', identifier: 'x', url: 'y', title: 'a\n**b'}),
    '[x]: y "a\n\\**b"\n',
    'should escape `*` when followed by another `*` (as it looks like a thematic break)'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '1. a\n2. b'}]}),
    '1\\. a\n2\\. b\n',
    'should escape what would otherwise be a list item (dot)'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '1) a\n2) b'}]}),
    '1\\) a\n2\\) b\n',
    'should escape what would otherwise be a list item (paren)'
  )

  assert.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '1.2.3. asd'}]}),
    '1.2.3. asd\n',
    'should not escape what can’t be a list (dot)'
  )

  assert.equal(
    to(
      {
        type: 'root',
        children: [
          {type: 'definition', url: '', label: 'a', identifier: 'a'},
          {type: 'definition', url: '', label: 'b', identifier: 'b'}
        ]
      },
      {extensions: [{tightDefinitions: true}]}
    ),
    '[a]: <>\n[b]: <>\n',
    'should support options in extensions'
  )

  assert.equal(
    to(
      {
        type: 'root',
        children: [{type: 'strong', children: [{type: 'text', value: 'a'}]}]
      },
      {
        extensions: [
          {
            strong: '_',
            join: undefined,
            handlers: undefined,
            extensions: undefined
          }
        ]
      }
    ),
    '__a__\n',
    'should support empty `join`, `handlers`, `extensions` in an extension (coverage)'
  )

  assert.equal(
    to(
      {
        type: 'root',
        children: [
          {
            type: 'list',
            ordered: true,
            start: 1,
            spread: false,
            children: [
              {
                type: 'listItem',
                spread: true,
                checked: null,
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        value: 'foo'
                      }
                    ]
                  },
                  {
                    type: 'list',
                    ordered: false,
                    start: null,
                    spread: false,
                    children: [
                      {
                        type: 'listItem',
                        spread: false,
                        checked: null,
                        children: [
                          {
                            type: 'paragraph',
                            children: [{type: 'text', value: 'bar'}]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        join: [() => 0]
      }
    ),
    '1.  foo\n    *   bar\n',
    'should make `join` from options highest priority'
  )

  assert.equal(
    to(
      {
        type: 'root',
        children: [{type: 'strong', children: [{type: 'text', value: 'a'}]}]
      },
      {strong: '*', extensions: [{strong: '_'}]}
    ),
    '**a**\n',
    'should prefer main options over extension options'
  )

  assert.equal(
    to(
      {
        type: 'root',
        children: [{type: 'strong', children: [{type: 'text', value: 'a'}]}]
      },
      {extensions: [{strong: '*', extensions: [{strong: '_'}]}]}
    ),
    '**a**\n',
    'should prefer extension options over subextension options'
  )

  assert.equal(
    to({
      type: 'paragraph',
      children: [
        {type: 'text', value: '\\'},
        {type: 'emphasis', children: [{type: 'text', value: 'a'}]}
      ]
    }),
    '\\\\*a*\n',
    'should handle literal backslashes properly when before constructs (1)'
  )

  assert.equal(
    to({
      type: 'paragraph',
      children: [
        {type: 'text', value: '\\\\'},
        {type: 'emphasis', children: [{type: 'text', value: 'a'}]}
      ]
    }),
    '\\\\\\\\*a*\n',
    'should handle literal backslashes properly when before constructs (2)'
  )
})

test('roundtrip', () => {
  let doc = [
    '> *   Lorem ipsum dolor sit amet',
    '>',
    '> *   consectetur adipisicing elit',
    ''
  ].join('\n')

  assert.equal(
    to(from(doc)),
    doc,
    'should roundtrip spread items in block quotes'
  )

  doc = [
    '*   Lorem ipsum dolor sit amet',
    '',
    '    1.  consectetur adipisicing elit',
    '',
    '    2.  sed do eiusmod tempor incididunt',
    ''
  ].join('\n')

  assert.equal(
    to(from(doc)),
    doc,
    'should roundtrip spread items in sublists (1)'
  )

  doc = [
    '*   1.  Lorem ipsum dolor sit amet',
    '',
    '    2.  consectetur adipisicing elit',
    ''
  ].join('\n')

  assert.equal(
    to(from(doc)),
    doc,
    'should roundtrip spread items in sublists (2)'
  )

  doc = [
    '*   hello',
    '    *   world',
    '        how',
    '',
    '        are',
    '        you',
    '',
    '    *   today',
    '*   hi',
    ''
  ].join('\n')

  assert.equal(
    to(from(doc)),
    doc,
    'should roundtrip spread items in sublists (3)'
  )

  doc = 'An autolink: <http://example.com/?foo=1&bar=2>.\n'

  assert.equal(
    to(from(doc)),
    doc,
    'should roundtrip autolinks w/ potentially escapable characters'
  )

  doc = [
    'A [primary][toString], [secondary][constructor], and [tertiary][__proto__] link.',
    '',
    '[toString]: http://primary.com',
    '',
    '[__proto__]: http://tertiary.com',
    '',
    '[constructor]: http://secondary.com',
    ''
  ].join('\n')

  assert.equal(
    to(from(doc)),
    doc,
    'should roundtrip potential prototype injections'
  )

  doc = [
    '*   foo',
    '*',
    '*   bar',
    '',
    '*   baz',
    '*',
    '*   qux quux',
    ''
  ].join('\n')

  doc = [
    '*   foo',
    '',
    '*',
    '',
    '*   bar',
    '',
    '*   baz',
    '',
    '*',
    '',
    '*   qux quux',
    ''
  ].join('\n')

  assert.equal(to(from(doc)), doc, 'should roundtrip empty lists')

  doc = '*   a\n\n<!---->\n\n*   b\n'

  assert.equal(to(from(doc)), doc, 'should roundtrip lists with break comments')

  // The first one could have (up to) four spaces, but it doesn’t add anything,
  // so we don’t roundtrip it.
  doc = [
    '    <h3>Header 3</h3>',
    '',
    '    <blockquote>',
    '        <p>This is a blockquote.</p>',
    '        ',
    '        <p>This is the second paragraph in the blockquote.</p>',
    '        ',
    '        <h2>This is an H2 in a blockquote</h2>',
    '    </blockquote>',
    ''
  ].join('\n')

  assert.equal(
    to(from(doc)),
    doc,
    'should roundtrip indented blank lines in code'
  )

  doc = '> a\n\n> b\n'

  assert.equal(to(from(doc)), doc, 'should roundtrip adjacent block quotes')

  doc = '[**https://unifiedjs.com/**](https://unifiedjs.com/)\n'

  assert.equal(to(from(doc)), doc, 'should roundtrip formatted URLs')

  const step1 = '\\ \\\\ \\\\\\ \\\\\\\\'
  const step2 = '\\ \\ \\\\\\ \\\\\\\\\n'

  assert.equal(to(from(step1)), step2, 'should roundtrip backslashes (1)')
  assert.equal(to(from(step2)), step2, 'should roundtrip backslashes (2)')

  doc = '\\\\\\*a\n'

  assert.equal(to(from(doc)), doc, 'should not collapse escapes (1)')

  doc = '\\\\*a\\\\\\*'

  assert.deepEqual(
    removePosition(from(doc)),
    removePosition(from(to(from(doc)))),
    'should not collapse escapes (2)'
  )

  doc = '```\n	\n```\n'

  assert.equal(
    to(from(doc)),
    doc,
    'should roundtrip a sole blank line in fenced code'
  )

  doc = '*   *   -\n'

  assert.equal(
    to(from(doc)),
    doc,
    'should roundtrip an empty list item in two more lists'
  )

  doc = '-   ***\n'

  assert.equal(
    to(from(doc)),
    doc,
    'should roundtrip a thematic break at the start of a list item'
  )

  let tree = from('* a\n- b')

  assert.deepEqual(
    removePosition(tree, true),
    removePosition(from(to(tree, {bullet: '*', bulletOther: '-'})), true),
    'should roundtrip different lists w/ `bulletOther`'
  )

  tree = from('* ---\n- - +\n+ b')

  assert.deepEqual(
    removePosition(tree, true),
    removePosition(from(to(tree, {bullet: '*', bulletOther: '-'})), true),
    'should roundtrip different lists w/ `bulletOther` and lists that could turn into thematic breaks (1)'
  )

  tree = from('- - +\n* ---\n+ b')

  assert.deepEqual(
    removePosition(tree, true),
    removePosition(from(to(tree, {bullet: '*', bulletOther: '-'})), true),
    'should roundtrip different lists w/ `bulletOther` and lists that could turn into thematic breaks (2)'
  )

  tree = from('- - +\n- -')

  assert.deepEqual(
    removePosition(tree, true),
    removePosition(from(to(tree, {bullet: '*', bulletOther: '-'})), true),
    'should roundtrip different lists w/ `bulletOther` and lists that could turn into thematic breaks (3)'
  )

  tree = from('* - +\n    *\n    -\n    +')

  assert.deepEqual(
    removePosition(tree, true),
    removePosition(from(to(tree, {bullet: '*', bulletOther: '-'})), true),
    'should roundtrip different lists w/ `bulletOther` and lists that could turn into thematic breaks (4)'
  )

  tree = from('* - +\n  - *\n    -\n    +')

  assert.deepEqual(
    removePosition(tree, true),
    removePosition(from(to(tree, {bullet: '*', bulletOther: '-'})), true),
    'should roundtrip different lists w/ `bulletOther` and lists that could turn into thematic breaks (5)'
  )

  tree = from('- +\n- *\n  -\n  +')

  assert.deepEqual(
    removePosition(tree, true),
    removePosition(from(to(tree, {bullet: '*', bulletOther: '-'})), true),
    'should roundtrip different lists w/ `bulletOther` and lists that could turn into thematic breaks (6)'
  )

  tree = from('1. a\n1) b')

  assert.deepEqual(
    removePosition(tree, true),
    removePosition(
      from(to(tree, {bulletOrdered: '.', bulletOrderedOther: ')'})),
      true
    ),
    'should roundtrip different lists w/ `bulletOrderedOther`'
  )

  tree = from('1. ---\n1) 1. 1)\n1. b')

  assert.deepEqual(
    removePosition(tree, true),
    removePosition(
      from(to(tree, {bulletOrdered: '.', bulletOrderedOther: ')'})),
      true
    ),
    'should roundtrip different lists w/ `bulletOrderedOther` and lists that could turn into thematic breaks (1)'
  )

  tree = from('1. 1. 1)\n1) ---\n1. b')

  assert.deepEqual(
    removePosition(tree, true),
    removePosition(
      from(to(tree, {bulletOrdered: '.', bulletOrderedOther: ')'})),
      true
    ),
    'should roundtrip different lists w/ `bulletOrderedOther` and lists that could turn into thematic breaks (2)'
  )

  tree = from('1. 1. 1)\n1. 1.')

  assert.deepEqual(
    removePosition(tree, true),
    removePosition(
      from(to(tree, {bulletOrdered: '.', bulletOrderedOther: ')'})),
      true
    ),
    'should roundtrip different lists w/ `bulletOrderedOther` and lists that could turn into thematic breaks (3)'
  )

  tree = from('1. 1) 1.\n      1.\n      1)\n    1.')

  assert.deepEqual(
    removePosition(tree, true),
    removePosition(
      from(to(tree, {bulletOrdered: '.', bulletOrderedOther: ')'})),
      true
    ),
    'should roundtrip different lists w/ `bulletOrderedOther` and lists that could turn into thematic breaks (4)'
  )

  tree = from('1. 1) 1.\n   1) 1.\n     1)\n     1.')

  assert.deepEqual(
    removePosition(tree, true),
    removePosition(
      from(to(tree, {bulletOrdered: '.', bulletOrderedOther: ')'})),
      true
    ),
    'should roundtrip different lists w/ `bulletOrderedOther` and lists that could turn into thematic breaks (5)'
  )

  tree = from('1. 1)\n1. 1.\n   1)\n   1.')

  assert.deepEqual(
    removePosition(tree, true),
    removePosition(
      from(to(tree, {bulletOrdered: '.', bulletOrderedOther: ')'})),
      true
    ),
    'should roundtrip different lists w/ `bulletOrderedOther` and lists that could turn into thematic breaks (6)'
  )

  doc = '&#x20;\n'

  assert.equal(to(from(doc)), doc, 'should roundtrip a single encoded space')

  doc = '&#x9;\n'

  assert.equal(to(from(doc)), doc, 'should roundtrip a single encoded tab')

  doc = '&#x20; a &#x20;\n&#x9;\tb\t&#x9;\n'

  assert.equal(
    to(from(doc)),
    doc,
    'should roundtrip encoded spaces and tabs where needed'
  )

  doc = `Separate paragraphs:

a * is this emphasis? *

a ** is this emphasis? **

a *** is this emphasis? ***

a *\\* is this emphasis? *\\*

a \\** is this emphasis? \\**

a **\\* is this emphasis? **\\*

a *\\** is this emphasis? *\\**

One paragraph:

a * is this emphasis? *
a ** is this emphasis? **
a *** is this emphasis? ***
a *\\* is this emphasis? *\\*
a \\** is this emphasis? \\**
a **\\* is this emphasis? **\\*
a *\\** is this emphasis? *\\**`
  tree = from(doc)

  assert.deepEqual(
    removePosition(from(to(tree)), true),
    removePosition(tree, true),
    'should roundtrip asterisks (tree)'
  )

  doc = `Separate paragraphs:

a _ is this emphasis? _

a __ is this emphasis? __

a ___ is this emphasis? ___

a _\\_ is this emphasis? _\\_

a \\__ is this emphasis? \\__

a __\\_ is this emphasis? __\\_

a _\\__ is this emphasis? _\\__

One paragraph:

a _ is this emphasis? _
a __ is this emphasis? __
a ___ is this emphasis? ___
a _\\_ is this emphasis? _\\_
a \\__ is this emphasis? \\__
a __\\_ is this emphasis? __\\_
a _\\__ is this emphasis? _\\__`
  tree = from(doc)

  assert.deepEqual(
    removePosition(from(to(tree)), true),
    removePosition(tree, true),
    'should roundtrip underscores (tree)'
  )

  doc = to(from(`(____`))

  assert.equal(to(from(doc)), doc, 'should roundtrip attention-like plain text')

  doc = to(
    from('Once activated, a service worker ______, then transitions to idle…')
  )

  assert.equal(
    to(from(doc)),
    doc,
    'should roundtrip faux “fill in the blank” spans'
  )
})

test('position (output)', function () {
  assert.equal(
    to(
      {
        type: 'blockquote',
        children: [
          {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
          // @ts-expect-error
          {type: 'unknown'}
        ]
      },
      {
        handlers: {
          /** @param {unknown} _ */
          unknown(_, _2, _3, info) {
            const {now, lineShift} = info
            assert.deepEqual(
              {now, lineShift},
              {now: {line: 3, column: 3}, lineShift: 2},
              'should track output positions (1)'
            )
            return 'x'
          }
        }
      }
    ),
    '> a\n>\n> x\n',
    'should track output positions (2)'
  )

  assert.equal(
    to(
      {
        type: 'blockquote',
        children: [
          {
            type: 'paragraph',
            children: [
              {type: 'text', value: 'a\n'},
              {
                type: 'emphasis',
                children: [
                  // @ts-expect-error
                  {type: 'unknown'}
                ]
              }
            ]
          }
        ]
      },
      {
        handlers: {
          /** @param {unknown} _ */
          unknown(_, _2, _3, info) {
            const {now, lineShift} = info
            assert.deepEqual(
              {now, lineShift},
              {now: {line: 2, column: 4}, lineShift: 2},
              'should track output positions (3)'
            )
            return 'b'
          }
        }
      }
    ),
    '> a\n> *b*\n',
    'should track output positions (4)'
  )
})
