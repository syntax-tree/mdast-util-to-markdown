import test from 'tape'
import {removePosition} from 'unist-util-remove-position'
import {fromMarkdown as from} from 'mdast-util-from-markdown'
import {toMarkdown as to} from '../index.js'

test('core', (t) => {
  t.equal(
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

  t.equal(
    // @ts-expect-error: `identifier`, `url` missing.
    to({
      type: 'root',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
        {type: 'definition', label: 'b'},
        {type: 'definition', label: 'c'},
        {type: 'paragraph', children: [{type: 'text', value: 'd'}]}
      ]
    }),
    'a\n\n[b]: <>\n\n[c]: <>\n\nd\n',
    'should support adjacent definitions'
  )

  t.equal(
    to(
      // @ts-expect-error: `identifier`, `url` missing.
      {
        type: 'root',
        children: [
          {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
          {type: 'definition', label: 'b'},
          {type: 'definition', label: 'c'},
          {type: 'paragraph', children: [{type: 'text', value: 'd'}]}
        ]
      },
      {tightDefinitions: true}
    ),
    'a\n\n[b]: <>\n[c]: <>\n\nd\n',
    'should support tight adjacent definitions when `tightDefinitions: true`'
  )

  t.equal(
    // @ts-expect-error: `children` missing.
    to({
      type: 'root',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
        {type: 'list', children: [{type: 'listItem'}]},
        {type: 'list', children: [{type: 'listItem'}]},
        {type: 'list', ordered: true, children: [{type: 'listItem'}]},
        {type: 'list', ordered: true, children: [{type: 'listItem'}]},
        {type: 'paragraph', children: [{type: 'text', value: 'd'}]}
      ]
    }),
    'a\n\n*\n\n<!---->\n\n*\n\n1.\n\n<!---->\n\n1.\n\nd\n',
    'should inject HTML comments between lists w/ the same marker'
  )

  t.equal(
    // @ts-expect-error: `children` missing.
    to({
      type: 'root',
      children: [
        {type: 'code', value: 'a'},
        {type: 'list', children: [{type: 'listItem'}]},
        {type: 'code', value: 'b'}
      ]
    }),
    '    a\n\n*\n\n<!---->\n\n    b\n',
    'should inject HTML comments between lists and an indented code'
  )

  t.equal(
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

  t.equal(
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

  t.equal(
    // @ts-expect-error: `definition` in `listItem` is fine.
    to({
      type: 'listItem',
      spread: false,
      children: [
        {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
        {type: 'definition', label: 'b', url: 'c'}
      ]
    }),
    '*   a\n\n    [b]: c\n',
    'should not honour `spread: false` for a paragraph and a definition'
  )

  t.equal(
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

  t.equal(
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

  t.throws(
    () => {
      // @ts-expect-error: runtime.
      to(false)
    },
    /Cannot handle value `false`, expected node/,
    'should throw on a non-node'
  )

  t.throws(
    () => {
      // @ts-expect-error: custom node.
      to({type: 'unknown'})
    },
    /Cannot handle unknown node `unknown`/,
    'should throw on an unknown node'
  )

  t.throws(
    () => {
      // @ts-expect-error: custom node.
      to({
        type: 'paragraph',
        children: [{type: 'text', value: 'a'}, {type: 'unknown'}]
      })
    },
    /Cannot handle unknown node `unknown`/,
    'should throw on an unknown node in a tree'
  )

  t.end()
})

test('blockquote', (t) => {
  // @ts-expect-error: `children` missing.
  t.equal(to({type: 'blockquote'}), '>\n', 'should support a block quote')

  t.equal(
    to({
      type: 'blockquote',
      children: [{type: 'paragraph', children: [{type: 'text', value: 'a'}]}]
    }),
    '> a\n',
    'should support a block quote w/ a child'
  )

  t.equal(
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

  t.equal(
    to({
      type: 'blockquote',
      children: [{type: 'paragraph', children: [{type: 'text', value: 'a\nb'}]}]
    }),
    '> a\n> b\n',
    'should support text w/ a line ending in a block quote'
  )

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
    to({type: 'blockquote', children: [{type: 'code', value: 'a\nb\n\nc'}]}),
    '>     a\n>     b\n>\n>     c\n',
    'should support code (flow, indented) in a block quote'
  )

  t.equal(
    to({
      type: 'blockquote',
      children: [{type: 'code', lang: 'a\nb', value: 'c\nd\n\ne'}]
    }),
    '> ```a&#xA;b\n> c\n> d\n>\n> e\n> ```\n',
    'should support code (flow, fenced) in a block quote'
  )

  t.equal(
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

  t.equal(
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

  t.equal(
    // @ts-expect-error: `definition` is fine in `blockquote`.
    to({
      type: 'blockquote',
      children: [
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

  t.equal(
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

  t.equal(
    to({
      type: 'blockquote',
      children: [
        {
          type: 'heading',
          depth: 1,
          children: [{type: 'text', value: 'a\nb'}]
        }
      ]
    }),
    '> # a&#xA;b\n',
    'should support a heading (atx) in a block quote'
  )

  t.equal(
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

  t.equal(
    to({
      type: 'blockquote',
      children: [{type: 'html', value: '<div\nhidden>'}]
    }),
    '> <div\n> hidden>\n',
    'should support html (flow) in a block quote'
  )

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
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
    '> a\n> b\n>\n> *   c\n>     d\n>\n> *   ***\n>\n> *   e\n>     f\n',
    'should support a list in a block quote'
  )

  t.equal(
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

  t.equal(
    to({
      type: 'blockquote',
      children: [{type: 'thematicBreak'}, {type: 'thematicBreak'}]
    }),
    '> ***\n>\n> ***\n',
    'should support a thematic break in a block quote'
  )

  t.end()
})

test('break', (t) => {
  t.equal(to({type: 'break'}), '\\\n', 'should support a break')

  t.equal(
    to(from('a  \nb\n=\n')),
    '# a b\n',
    'should serialize breaks in heading (atx) as a space'
  )

  t.equal(
    to(from('a \\\nb\n=\n')),
    '# a b\n',
    'should serialize breaks in heading (atx) as nothing when preceded by a space'
  )

  t.equal(
    to(from('a  \nb\n=\n'), {setext: true}),
    'a\\\nb\n=\n',
    'should serialize breaks in heading (setext)'
  )

  t.end()
})

test('code (flow)', (t) => {
  // @ts-expect-error: `value` missing.
  t.equal(to({type: 'code'}), '```\n```\n', 'should support empty code')

  t.throws(
    () => {
      // @ts-expect-error: runtime.
      to({type: 'code', value: ''}, {fence: '+'})
    },
    /Cannot serialize code with `\+` for `options\.fence`, expected `` ` `` or `~`/,
    'should throw on when given an incorrect `fence`'
  )

  t.equal(
    to({type: 'code', value: 'a'}),
    '    a\n',
    'should support code w/ a value (indent)'
  )

  t.equal(
    to({type: 'code', value: 'a'}, {fences: true}),
    '```\na\n```\n',
    'should support code w/ a value (fences)'
  )

  t.equal(
    to({type: 'code', lang: 'a', value: ''}),
    '```a\n```\n',
    'should support code w/ a lang'
  )

  t.equal(
    to({type: 'code', meta: 'a', value: ''}),
    '```\n```\n',
    'should support (ignore) code w/ only a meta'
  )

  t.equal(
    to({type: 'code', lang: 'a', meta: 'b', value: ''}),
    '```a b\n```\n',
    'should support code w/ lang and meta'
  )

  t.equal(
    to({type: 'code', lang: 'a b', value: ''}),
    '```a&#x20;b\n```\n',
    'should encode a space in `lang`'
  )

  t.equal(
    to({type: 'code', lang: 'a\nb', value: ''}),
    '```a&#xA;b\n```\n',
    'should encode a line ending in `lang`'
  )

  t.equal(
    to({type: 'code', lang: 'a`b', value: ''}),
    '```a&#x60;b\n```\n',
    'should encode a grave accent in `lang`'
  )

  t.equal(
    to({type: 'code', lang: 'a\\-b', value: ''}),
    '```a\\\\-b\n```\n',
    'should escape a backslash in `lang`'
  )

  t.equal(
    to({type: 'code', lang: 'x', meta: 'a b', value: ''}),
    '```x a b\n```\n',
    'should not encode a space in `meta`'
  )

  t.equal(
    to({type: 'code', lang: 'x', meta: 'a\nb', value: ''}),
    '```x a&#xA;b\n```\n',
    'should encode a line ending in `meta`'
  )

  t.equal(
    to({type: 'code', lang: 'x', meta: 'a`b', value: ''}),
    '```x a&#x60;b\n```\n',
    'should encode a grave accent in `meta`'
  )

  t.equal(
    to({type: 'code', lang: 'x', meta: 'a\\-b', value: ''}),
    '```x a\\\\-b\n```\n',
    'should escape a backslash in `meta`'
  )

  t.equal(
    to({type: 'code', value: ''}, {fence: '~'}),
    '~~~\n~~~\n',
    'should support fenced code w/ tildes when `fence: "~"`'
  )

  t.equal(
    to({type: 'code', lang: 'a`b', value: ''}, {fence: '~'}),
    '~~~a`b\n~~~\n',
    'should not encode a grave accent when using tildes for fences'
  )

  t.equal(
    to({type: 'code', value: '```\nasd\n```'}, {fences: true}),
    '````\n```\nasd\n```\n````\n',
    'should use more grave accents for fences if there are streaks of grave accents in the value (fences)'
  )

  t.equal(
    to({type: 'code', value: '~~~\nasd\n~~~'}, {fence: '~', fences: true}),
    '~~~~\n~~~\nasd\n~~~\n~~~~\n',
    'should use more tildes for fences if there are streaks of tildes in the value (fences)'
  )

  t.equal(
    to({type: 'code', lang: 'a', value: 'b'}),
    '```a\nb\n```\n',
    'should use a fence if there is an info'
  )

  t.equal(
    to({type: 'code', value: ' '}),
    '```\n \n```\n',
    'should use a fence if there is only whitespace'
  )

  t.equal(
    to({type: 'code', value: '\na'}),
    '```\n\na\n```\n',
    'should use a fence if there first line is blank (void)'
  )

  t.equal(
    to({type: 'code', value: ' \na'}),
    '```\n \na\n```\n',
    'should use a fence if there first line is blank (filled)'
  )

  t.equal(
    to({type: 'code', value: 'a\n'}),
    '```\na\n\n```\n',
    'should use a fence if there last line is blank (void)'
  )

  t.equal(
    to({type: 'code', value: 'a\n '}),
    '```\na\n \n```\n',
    'should use a fence if there last line is blank (filled)'
  )

  t.equal(
    to({type: 'code', value: '  a\n\n b'}),
    '      a\n\n     b\n',
    'should use an indent if the value is indented'
  )

  t.end()
})

test('definition', (t) => {
  t.equal(
    // @ts-expect-error: `identifier`, `url` missing.
    to({type: 'definition'}),
    '[]: <>\n',
    'should support a definition w/o label'
  )

  t.equal(
    // @ts-expect-error: `identifier`, `url` missing.
    to({type: 'definition', label: 'a'}),
    '[a]: <>\n',
    'should support a definition w/ label'
  )

  t.equal(
    // @ts-expect-error: `identifier`, `url` missing.
    to({type: 'definition', label: '\\'}),
    '[\\\\]: <>\n',
    'should escape a backslash in `label`'
  )

  t.equal(
    // @ts-expect-error: `identifier`, `url` missing.
    to({type: 'definition', label: '['}),
    '[\\[]: <>\n',
    'should escape an opening bracket in `label`'
  )

  t.equal(
    // @ts-expect-error: `identifier`, `url` missing.
    to({type: 'definition', label: ']'}),
    '[\\]]: <>\n',
    'should escape a closing bracket in `label`'
  )

  t.equal(
    // @ts-expect-error: `url` missing.
    to({type: 'definition', identifier: 'a'}),
    '[a]: <>\n',
    'should support a definition w/ identifier'
  )

  t.equal(
    // @ts-expect-error: `url` missing.
    to({type: 'definition', identifier: '\\'}),
    '[\\\\]: <>\n',
    'should escape a backslash in `identifier`'
  )

  t.equal(
    // @ts-expect-error: `url` missing.
    to({type: 'definition', identifier: '['}),
    '[\\[]: <>\n',
    'should escape an opening bracket in `identifier`'
  )

  t.equal(
    // @ts-expect-error: `url` missing.
    to({type: 'definition', identifier: ']'}),
    '[\\]]: <>\n',
    'should escape a closing bracket in `identifier`'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: 'b'}),
    '[a]: b\n',
    'should support a definition w/ url'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: 'b c'}),
    '[a]: <b c>\n',
    'should support a definition w/ enclosed url w/ whitespace in url'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: 'b <c'}),
    '[a]: <b \\<c>\n',
    'should escape an opening angle bracket in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: 'b >c'}),
    '[a]: <b \\>c>\n',
    'should escape a closing angle bracket in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: 'b \\.c'}),
    '[a]: <b \\\\.c>\n',
    'should escape a backslash in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: 'b\nc'}),
    '[a]: <b&#xA;c>\n',
    'should encode a line ending in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: 'b(c'}),
    '[a]: b\\(c\n',
    'should escape an opening paren in `url` in a raw url'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: 'b)c'}),
    '[a]: b\\)c\n',
    'should escape a closing paren in `url` in a raw url'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: 'b\\?c'}),
    '[a]: b\\\\?c\n',
    'should escape a backslash in `url` in a raw url'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: '', title: 'b'}),
    '[a]: <> "b"\n',
    'should support a definition w/ title'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: '', title: '"'}),
    '[a]: <> "\\""\n',
    'should escape a quote in `title` in a title'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: '', title: '\\'}),
    '[a]: <> "\\\\"\n',
    'should escape a backslash in `title` in a title'
  )

  t.equal(
    to(
      {type: 'definition', identifier: 'a', url: '', title: 'b'},
      {quote: "'"}
    ),
    "[a]: <> 'b'\n",
    'should support a definition w/ title when `quote: "\'"`'
  )

  t.equal(
    to(
      {type: 'definition', identifier: 'a', url: '', title: "'"},
      {quote: "'"}
    ),
    "[a]: <> '\\''\n",
    'should escape a quote in `title` in a title when `quote: "\'"`'
  )

  t.throws(
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

  t.end()
})

test('emphasis', (t) => {
  // @ts-expect-error: `children` missing.
  t.equal(to({type: 'emphasis'}), '**\n', 'should support an empty emphasis')

  t.throws(
    () => {
      // @ts-expect-error: runtime.
      to({type: 'emphasis'}, {emphasis: '?'})
    },
    /Cannot serialize emphasis with `\?` for `options\.emphasis`, expected `\*`, or `_`/,
    'should throw on when given an incorrect `emphasis`'
  )

  t.equal(
    to({type: 'emphasis', children: [{type: 'text', value: 'a'}]}),
    '*a*\n',
    'should support an emphasis w/ children'
  )

  t.equal(
    to(
      {type: 'emphasis', children: [{type: 'text', value: 'a'}]},
      {emphasis: '_'}
    ),
    '_a_\n',
    'should support an emphasis w/ underscores when `emphasis: "_"`'
  )

  t.end()
})

test('heading', (t) => {
  t.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'heading'}),
    '#\n',
    'should serialize a heading w/o rank as a heading of rank 1'
  )

  t.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'heading', depth: 1}),
    '#\n',
    'should serialize a heading w/ rank 1'
  )

  t.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'heading', depth: 6}),
    '######\n',
    'should serialize a heading w/ rank 6'
  )

  t.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'heading', depth: 7}),
    '######\n',
    'should serialize a heading w/ rank 7 as 6'
  )

  t.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'heading', depth: 0}),
    '#\n',
    'should serialize a heading w/ rank 0 as 1'
  )

  t.equal(
    to({type: 'heading', depth: 1, children: [{type: 'text', value: 'a'}]}),
    '# a\n',
    'should serialize a heading w/ content'
  )

  t.equal(
    to(
      {type: 'heading', depth: 1, children: [{type: 'text', value: 'a'}]},
      {setext: true}
    ),
    'a\n=\n',
    'should serialize a heading w/ rank 1 as setext when `setext: true`'
  )

  t.equal(
    to(
      {type: 'heading', depth: 2, children: [{type: 'text', value: 'a'}]},
      {setext: true}
    ),
    'a\n-\n',
    'should serialize a heading w/ rank 2 as setext when `setext: true`'
  )

  t.equal(
    to(
      {type: 'heading', depth: 3, children: [{type: 'text', value: 'a'}]},
      {setext: true}
    ),
    '### a\n',
    'should serialize a heading w/ rank 3 as atx when `setext: true`'
  )

  t.equal(
    to(
      {type: 'heading', depth: 2, children: [{type: 'text', value: 'aa\rb'}]},
      {setext: true}
    ),
    'aa\rb\n-\n',
    'should serialize a setext underline as long as the last line (1)'
  )

  t.equal(
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

  t.equal(
    to({type: 'heading', depth: 1, children: []}, {setext: true}),
    '#\n',
    'should serialize an empty heading w/ rank 1 as atx when `setext: true`'
  )

  t.equal(
    to({type: 'heading', depth: 2, children: []}, {setext: true}),
    '##\n',
    'should serialize an empty heading w/ rank 2 as atx when `setext: true`'
  )

  t.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'heading'}, {closeAtx: true}),
    '# #\n',
    'should serialize a heading with a closing sequence when `closeAtx` (empty)'
  )

  t.equal(
    to(
      {type: 'heading', depth: 3, children: [{type: 'text', value: 'a'}]},
      {closeAtx: true}
    ),
    '### a ###\n',
    'should serialize a with a closing sequence when `closeAtx` (content)'
  )

  t.equal(
    to({type: 'heading', depth: 2, children: [{type: 'text', value: '# a'}]}),
    '## # a\n',
    'should not escape a `#` at the start of phrasing in a heading'
  )

  t.equal(
    to({type: 'heading', depth: 2, children: [{type: 'text', value: '1) a'}]}),
    '## 1) a\n',
    'should not escape a `1)` at the start of phrasing in a heading'
  )

  t.equal(
    to({type: 'heading', depth: 2, children: [{type: 'text', value: '+ a'}]}),
    '## + a\n',
    'should not escape a `+` at the start of phrasing in a heading'
  )

  t.equal(
    to({type: 'heading', depth: 2, children: [{type: 'text', value: '- a'}]}),
    '## - a\n',
    'should not escape a `-` at the start of phrasing in a heading'
  )

  t.equal(
    to({type: 'heading', depth: 2, children: [{type: 'text', value: '= a'}]}),
    '## = a\n',
    'should not escape a `=` at the start of phrasing in a heading'
  )

  t.equal(
    to({type: 'heading', depth: 2, children: [{type: 'text', value: '> a'}]}),
    '## > a\n',
    'should not escape a `>` at the start of phrasing in a heading'
  )

  t.equal(
    to({type: 'heading', depth: 1, children: [{type: 'text', value: 'a #'}]}),
    '# a \\#\n',
    'should escape a `#` at the end of a heading (1)'
  )

  t.equal(
    to({type: 'heading', depth: 1, children: [{type: 'text', value: 'a ##'}]}),
    '# a #\\#\n',
    'should escape a `#` at the end of a heading (2)'
  )

  t.equal(
    to({type: 'heading', depth: 1, children: [{type: 'text', value: 'a # b'}]}),
    '# a # b\n',
    'should not escape a `#` in a heading (2)'
  )

  t.end()
})

test('html', (t) => {
  // @ts-expect-error: `value` missing
  t.equal(to({type: 'html'}), '', 'should support a void html')
  t.equal(to({type: 'html', value: ''}), '', 'should support an empty html')
  t.equal(to({type: 'html', value: 'a\nb'}), 'a\nb\n', 'should support html')

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.end()
})

test('image', (t) => {
  // @ts-expect-error: `url` missing
  t.equal(to({type: 'image'}), '![]()\n', 'should support an image')

  // @ts-expect-error: `url` missing
  t.equal(to({type: 'image', alt: 'a'}), '![a]()\n', 'should support `alt`')

  t.equal(to({type: 'image', url: 'a'}), '![](a)\n', 'should support a url')

  t.equal(
    to({type: 'image', url: '', title: 'a'}),
    '![](<> "a")\n',
    'should support a title'
  )

  t.equal(
    to({type: 'image', url: 'a', title: 'b'}),
    '![](a "b")\n',
    'should support a url and title'
  )

  t.equal(
    to({type: 'image', url: 'b c'}),
    '![](<b c>)\n',
    'should support an image w/ enclosed url w/ whitespace in url'
  )

  t.equal(
    to({type: 'image', url: 'b <c'}),
    '![](<b \\<c>)\n',
    'should escape an opening angle bracket in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'image', url: 'b >c'}),
    '![](<b \\>c>)\n',
    'should escape a closing angle bracket in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'image', url: 'b \\+c'}),
    '![](<b \\\\+c>)\n',
    'should escape a backslash in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'image', url: 'b\nc'}),
    '![](<b&#xA;c>)\n',
    'should encode a line ending in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'image', url: 'b(c'}),
    '![](b\\(c)\n',
    'should escape an opening paren in `url` in a raw url'
  )

  t.equal(
    to({type: 'image', url: 'b)c'}),
    '![](b\\)c)\n',
    'should escape a closing paren in `url` in a raw url'
  )

  t.equal(
    to({type: 'image', url: 'b\\+c'}),
    '![](b\\\\+c)\n',
    'should escape a backslash in `url` in a raw url'
  )

  t.equal(
    to({type: 'image', url: '', title: 'b"c'}),
    '![](<> "b\\"c")\n',
    'should escape a double quote in `title`'
  )

  t.equal(
    to({type: 'image', url: '', title: 'b\\.c'}),
    '![](<> "b\\\\.c")\n',
    'should escape a backslash in `title`'
  )

  t.equal(
    to({type: 'image', url: '', title: 'b'}, {quote: "'"}),
    "![](<> 'b')\n",
    'should support an image w/ title when `quote: "\'"`'
  )

  t.equal(
    to({type: 'image', url: '', title: "'"}, {quote: "'"}),
    "![](<> '\\'')\n",
    'should escape a quote in `title` in a title when `quote: "\'"`'
  )

  t.throws(
    () => {
      // @ts-expect-error: runtime.
      to({type: 'image', title: 'a'}, {quote: '.'})
    },
    /Cannot serialize title with `\.` for `options\.quote`, expected `"`, or `'`/,
    'should throw on when given an incorrect `quote`'
  )

  t.end()
})

test('imageReference', (t) => {
  t.equal(
    // @ts-expect-error: `referenceType`, `identifier` missing.
    to({type: 'imageReference'}),
    '![][]\n',
    'should support a link reference (nonsensical)'
  )

  t.equal(
    // @ts-expect-error: `referenceType`, `identifier` missing.
    to({type: 'imageReference', alt: 'a'}),
    '![a][]\n',
    'should support `alt`'
  )

  t.equal(
    // @ts-expect-error: `referenceType` missing.
    to({type: 'imageReference', identifier: 'a'}),
    '![][a]\n',
    'should support an `identifier` (nonsensical)'
  )

  t.equal(
    // @ts-expect-error: `referenceType`, `identifier` missing.
    to({type: 'imageReference', label: 'a'}),
    '![][a]\n',
    'should support a `label` (nonsensical)'
  )

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
    to({
      type: 'imageReference',
      alt: '&',
      identifier: '&amp;',
      referenceType: 'full'
    }),
    '![&][&]\n',
    'should decode `identifier` if w/o `label`'
  )

  t.equal(
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

  t.equal(
    to({
      type: 'imageReference',
      alt: '+',
      identifier: '\\+',
      referenceType: 'full'
    }),
    '![+][+]\n',
    'should unescape `identifier` if w/o `label`'
  )

  t.equal(
    // @ts-expect-error: `referenceType`, `identifier` missing.
    to({type: 'imageReference', alt: 'a', label: 'a'}),
    '![a][]\n',
    'should use a collapsed reference if w/o `referenceType` and the label matches the reference'
  )

  t.equal(
    // @ts-expect-error: `referenceType`, `identifier` missing.
    to({type: 'imageReference', alt: 'a', label: 'b'}),
    '![a][b]\n',
    'should use a full reference if w/o `referenceType` and the label does not match the reference'
  )

  t.end()
})

test('Code text', (t) => {
  // @ts-expect-error: `value` missing.
  t.equal(to({type: 'inlineCode'}), '``\n', 'should support an empty code text')

  t.equal(
    to({type: 'inlineCode', value: 'a'}),
    '`a`\n',
    'should support a code text'
  )

  t.equal(
    to({type: 'inlineCode', value: ' '}),
    '` `\n',
    'should support a space'
  )

  t.equal(
    to({type: 'inlineCode', value: '\n'}),
    '`\n`\n',
    'should support an eol'
  )

  t.equal(
    to({type: 'inlineCode', value: '  '}),
    '`  `\n',
    'should support several spaces'
  )

  t.equal(
    to({type: 'inlineCode', value: 'a`b'}),
    '``a`b``\n',
    'should use a fence of two grave accents if the value contains one'
  )

  t.equal(
    to({type: 'inlineCode', value: 'a``b'}),
    '`a``b`\n',
    'should use a fence of one grave accent if the value contains two'
  )

  t.equal(
    to({type: 'inlineCode', value: 'a``b`c'}),
    '```a``b`c```\n',
    'should use a fence of three grave accents if the value contains two and one'
  )

  t.equal(
    to({type: 'inlineCode', value: '`a'}),
    '`` `a ``\n',
    'should pad w/ a space if the value starts w/ a grave accent'
  )

  t.equal(
    to({type: 'inlineCode', value: 'a`'}),
    '`` a` ``\n',
    'should pad w/ a space if the value ends w/ a grave accent'
  )

  t.equal(
    to({type: 'inlineCode', value: ' a '}),
    '`  a  `\n',
    'should pad w/ a space if the value starts and ends w/ a space'
  )

  t.equal(
    to({type: 'inlineCode', value: ' a'}),
    '` a`\n',
    'should not pad w/ spaces if the value ends w/ a non-space'
  )

  t.equal(
    to({type: 'inlineCode', value: 'a '}),
    '`a `\n',
    'should not pad w/ spaces if the value starts w/ a non-space'
  )

  t.equal(
    to({type: 'inlineCode', value: 'a\n-'}),
    '`a -`\n',
    'should prevent breaking out of code (-)'
  )

  t.equal(
    to({type: 'inlineCode', value: 'a\n#'}),
    '`a #`\n',
    'should prevent breaking out of code (#)'
  )

  t.equal(
    to({type: 'inlineCode', value: 'a\n1. '}),
    '`a 1. `\n',
    'should prevent breaking out of code (\\d\\.)'
  )

  t.equal(
    to({type: 'inlineCode', value: 'a\r-'}),
    '`a -`\n',
    'should prevent breaking out of code (cr)'
  )

  t.equal(
    to({type: 'inlineCode', value: 'a\r\n-'}),
    '`a -`\n',
    'should prevent breaking out of code (crlf)'
  )

  t.end()
})

test('link', (t) => {
  // @ts-expect-error: `children`, `url` missing.
  t.equal(to({type: 'link'}), '[]()\n', 'should support a link')

  t.equal(
    // @ts-expect-error: `url` missing.
    to({type: 'link', children: [{type: 'text', value: 'a'}]}),
    '[a]()\n',
    'should support children'
  )

  t.equal(
    to({type: 'link', url: 'a', children: []}),
    '[](a)\n',
    'should support a url'
  )

  t.equal(
    to({type: 'link', url: '', title: 'a', children: []}),
    '[](<> "a")\n',
    'should support a title'
  )

  t.equal(
    to({type: 'link', url: 'a', title: 'b', children: []}),
    '[](a "b")\n',
    'should support a url and title'
  )

  t.equal(
    to({type: 'link', url: 'b c', children: []}),
    '[](<b c>)\n',
    'should support a link w/ enclosed url w/ whitespace in url'
  )

  t.equal(
    to({type: 'link', url: 'b <c', children: []}),
    '[](<b \\<c>)\n',
    'should escape an opening angle bracket in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'link', url: 'b >c', children: []}),
    '[](<b \\>c>)\n',
    'should escape a closing angle bracket in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'link', url: 'b \\+c', children: []}),
    '[](<b \\\\+c>)\n',
    'should escape a backslash in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'link', url: 'b\nc', children: []}),
    '[](<b&#xA;c>)\n',
    'should encode a line ending in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'link', url: 'b(c', children: []}),
    '[](b\\(c)\n',
    'should escape an opening paren in `url` in a raw url'
  )

  t.equal(
    to({type: 'link', url: 'b)c', children: []}),
    '[](b\\)c)\n',
    'should escape a closing paren in `url` in a raw url'
  )

  t.equal(
    to({type: 'link', url: 'b\\.c', children: []}),
    '[](b\\\\.c)\n',
    'should escape a backslash in `url` in a raw url'
  )

  t.equal(
    to({type: 'link', url: '', title: 'b"c', children: []}),
    '[](<> "b\\"c")\n',
    'should escape a double quote in `title`'
  )

  t.equal(
    to({type: 'link', url: '', title: 'b\\-c', children: []}),
    '[](<> "b\\\\-c")\n',
    'should escape a backslash in `title`'
  )

  t.equal(
    to({
      type: 'link',
      url: 'tel:123',
      children: [{type: 'text', value: 'tel:123'}]
    }),
    '<tel:123>\n',
    'should use an autolink for nodes w/ a value similar to the url and a protocol'
  )

  t.equal(
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

  t.equal(
    to({
      type: 'link',
      url: 'a',
      children: [{type: 'text', value: 'a'}]
    }),
    '[a](a)\n',
    'should use a normal link for nodes w/ a value similar to the url w/o a protocol'
  )

  t.equal(
    to({
      type: 'link',
      url: 'tel:123',
      children: [{type: 'text', value: 'tel:123'}]
    }),
    '<tel:123>\n',
    'should use an autolink for nodes w/ a value similar to the url and a protocol'
  )

  t.equal(
    to({
      type: 'link',
      url: 'tel:123',
      title: 'a',
      children: [{type: 'text', value: 'tel:123'}]
    }),
    '[tel:123](tel:123 "a")\n',
    'should use a normal link for nodes w/ a value similar to the url w/ a title'
  )

  t.equal(
    to({
      type: 'link',
      url: 'mailto:a@b.c',
      children: [{type: 'text', value: 'a@b.c'}]
    }),
    '<a@b.c>\n',
    'should use an autolink for nodes w/ a value similar to the url and a protocol (email)'
  )

  t.deepEqual(
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

  t.equal(
    to({type: 'link', url: '', title: 'b', children: []}, {quote: "'"}),
    "[](<> 'b')\n",
    'should support a link w/ title when `quote: "\'"`'
  )

  t.equal(
    to({type: 'link', url: '', title: "'", children: []}, {quote: "'"}),
    "[](<> '\\'')\n",
    'should escape a quote in `title` in a title when `quote: "\'"`'
  )

  t.throws(
    () => {
      // @ts-expect-error: runtime.
      to({type: 'link', title: 'b'}, {quote: '.'})
    },
    /Cannot serialize title with `\.` for `options\.quote`, expected `"`, or `'`/,
    'should throw on when given an incorrect `quote`'
  )

  t.end()
})

test('linkReference', (t) => {
  t.equal(
    // @ts-expect-error: `children`, `referenceType`, `identifier` missing.
    to({type: 'linkReference'}),
    '[][]\n',
    'should support a link reference (nonsensical)'
  )

  t.equal(
    // @ts-expect-error: `referenceType`, `identifier` missing.
    to({type: 'linkReference', children: [{type: 'text', value: 'a'}]}),
    '[a][]\n',
    'should support `children`'
  )

  t.equal(
    // @ts-expect-error: `identifier` missing.
    to({type: 'linkReference', identifier: 'a'}),
    '[][a]\n',
    'should support an `identifier` (nonsensical)'
  )

  t.equal(
    // @ts-expect-error: `children`, `referenceType`, `identifier` missing.
    to({type: 'linkReference', label: 'a'}),
    '[][a]\n',
    'should support a `label` (nonsensical)'
  )

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
    to({
      type: 'linkReference',
      children: [{type: 'text', value: '&'}],
      identifier: '&amp;',
      referenceType: 'full'
    }),
    '[&][&]\n',
    'should decode `identifier` if w/o `label`'
  )

  t.equal(
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

  t.equal(
    to({
      type: 'linkReference',
      children: [{type: 'text', value: '+'}],
      identifier: '\\+',
      referenceType: 'full'
    }),
    '[+][+]\n',
    'should unescape `identifier` if w/o `label`'
  )

  t.equal(
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

  t.equal(
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

  t.equal(
    // @ts-expect-error: `referenceType`, `identifier` missing.
    to({
      type: 'paragraph',
      children: [
        {type: 'linkReference', children: [{type: 'text', value: 'a'}]},
        {type: 'text', value: '(b)'}
      ]
    }),
    '[a][]\\(b)\n',
    'should use a full reference if w/o `referenceType` and the label does not match the reference'
  )

  t.end()
})

test('list', (t) => {
  // @ts-expect-error: `children` missing.
  t.equal(to({type: 'list'}), '', 'should support an empty list')

  t.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'list', children: [{type: 'listItem'}]}),
    '*\n',
    'should support a list w/ an item'
  )

  t.equal(
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
    '*   a\n\n*   ***\n\n*   b\n',
    'should support a list w/ items'
  )

  t.equal(
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
    '*   a\n*   ***\n',
    'should not use blank lines between items for lists w/ `spread: false`'
  )

  t.equal(
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
    '*   a\n\n    b\n*   ***\n',
    'should support a list w/ `spread: false`, w/ a spread item'
  )

  t.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'list', ordered: true, children: [{type: 'listItem'}]}),
    '1.\n',
    'should support a list w/ `ordered` and an empty item'
  )

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.end()
})

test('listItem', (t) => {
  // @ts-expect-error: `children` missing.
  t.equal(to({type: 'listItem'}), '*\n', 'should support a list item')

  t.equal(
    // @ts-expect-error: `children` missing.
    to({type: 'listItem'}, {bullet: '+'}),
    '+\n',
    'should serialize an item w/ a plus as bullet when `bullet: "+"`'
  )

  t.throws(
    () => {
      // @ts-expect-error: runtime.
      to({type: 'listItem'}, {bullet: '.'})
    },
    /Cannot serialize items with `\.` for `options\.bullet`, expected `\*`, `\+`, or `-`/,
    'should throw on an incorrect bullet'
  )

  t.equal(
    to({
      type: 'listItem',
      children: [{type: 'paragraph', children: [{type: 'text', value: 'a'}]}]
    }),
    '*   a\n',
    'should support a list item w/ a child'
  )

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.throws(
    () => {
      // @ts-expect-error: runtime.
      to({type: 'listItem'}, {listItemIndent: 'x'})
    },
    /Cannot serialize items with `x` for `options\.listItemIndent`, expected `tab`, `one`, or `mixed`/,
    'should throw on an incorrect `listItemIndent`'
  )

  t.equal(
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

  t.end()
})

test('paragraph', (t) => {
  // @ts-expect-error: `children` missing.
  t.equal(to({type: 'paragraph'}), '', 'should support an empty paragraph')

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a\nb'}]}),
    'a\nb\n',
    'should support a paragraph'
  )

  t.end()
})

test('strong', (t) => {
  // @ts-expect-error: `children` missing.
  t.equal(to({type: 'strong'}), '****\n', 'should support an empty strong')

  t.throws(
    () => {
      // @ts-expect-error: runtime.
      to({type: 'strong'}, {strong: '?'})
    },
    /Cannot serialize strong with `\?` for `options\.strong`, expected `\*`, or `_`/,
    'should throw on when given an incorrect `strong`'
  )

  t.equal(
    to({type: 'strong', children: [{type: 'text', value: 'a'}]}),
    '**a**\n',
    'should support a strong w/ children'
  )

  t.equal(
    to({type: 'strong', children: [{type: 'text', value: 'a'}]}, {strong: '_'}),
    '__a__\n',
    'should support a strong w/ underscores when `emphasis: "_"`'
  )

  t.end()
})

test('text', (t) => {
  // @ts-expect-error: `value` missing.
  t.equal(to({type: 'text'}), '', 'should support a void text')
  t.equal(to({type: 'text', value: ''}), '', 'should support an empty text')
  t.equal(to({type: 'text', value: 'a\nb'}), 'a\nb\n', 'should support text')
  t.end()
})

test('thematic break', (t) => {
  t.equal(
    to({type: 'thematicBreak'}),
    '***\n',
    'should support a thematic break'
  )

  t.equal(
    to({type: 'thematicBreak'}, {rule: '-'}),
    '---\n',
    'should support a thematic break w/ dashes when `rule: "-"`'
  )

  t.equal(
    to({type: 'thematicBreak'}, {rule: '_'}),
    '___\n',
    'should support a thematic break w/ underscores when `rule: "_"`'
  )

  t.throws(
    () => {
      // @ts-expect-error: runtime.
      to({type: 'thematicBreak'}, {rule: '.'})
    },
    /Cannot serialize rules with `.` for `options\.rule`, expected `\*`, `-`, or `_`/,
    'should throw on when given an incorrect `rule`'
  )

  t.equal(
    to({type: 'thematicBreak'}, {ruleRepetition: 5}),
    '*****\n',
    'should support a thematic break w/ more repetitions w/ `ruleRepetition`'
  )

  t.throws(
    () => {
      to({type: 'thematicBreak'}, {ruleRepetition: 2})
    },
    /Cannot serialize rules with repetition `2` for `options\.ruleRepetition`, expected `3` or more/,
    'should throw on when given an incorrect `ruleRepetition`'
  )

  t.equal(
    to({type: 'thematicBreak'}, {ruleSpaces: true}),
    '* * *\n',
    'should support a thematic break w/ spaces w/ `ruleSpaces`'
  )

  t.end()
})

test('escape', (t) => {
  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '> a\n> b\nc >'}]}),
    '\\> a\n\\> b\nc >\n',
    'should escape what would otherwise be a block quote in a paragraph'
  )

  t.equal(
    to({
      type: 'listItem',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: '> a\n> b'}]}
      ]
    }),
    '*   \\> a\n    \\> b\n',
    'should escape what would otherwise be a block quote in a list item'
  )

  t.equal(
    to({
      type: 'blockquote',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: '> a\n> b'}]}
      ]
    }),
    '> \\> a\n> \\> b\n',
    'should escape what would otherwise be a block quote in a block quote'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a\\\nb'}]}),
    'a\\\\\nb\n',
    'should escape what would otherwise be a break'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '&amp'}]}),
    '\\&amp\n',
    'should escape what would otherwise be a named character reference'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '&#9;'}]}),
    '\\&#9;\n',
    'should escape what would otherwise be a numeric character reference'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a\\+b'}]}),
    'a\\\\+b\n',
    'should escape what would otherwise be a character escape'
  )

  t.equal(
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

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '```js\n```'}]}),
    '\\`\\`\\`js\n\\`\\`\\`\n',
    'should escape what would otherwise be code (flow)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '[a]: b'}]}),
    '\\[a]: b\n',
    'should escape what would otherwise be a definition'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '*a*'}]}),
    '\\*a\\*\n',
    'should escape what would otherwise be emphasis (asterisk)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '_a_'}]}),
    '\\_a\\_\n',
    'should escape what would otherwise be emphasis (underscore)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '# a'}]}),
    '\\# a\n',
    'should escape what would otherwise be a heading (atx)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a\n='}]}),
    'a\n\\=\n',
    'should escape what would otherwise be a heading (setext, equals)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a\n-'}]}),
    'a\n\\-\n',
    'should escape what would otherwise be a heading (setext, dash)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '<a\nb>'}]}),
    '\\<a\nb>\n',
    'should escape what would otherwise be html'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a `b`\n`c` d'}]}),
    'a \\`b\\`\n\\`c\\` d\n',
    'should escape what would otherwise be code (text)'
  )

  t.equal(
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

  t.equal(
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

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '![a][b]'}]}),
    '!\\[a]\\[b]\n',
    'should escape what would otherwise be an image (reference)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '![](a.jpg)'}]}),
    '!\\[]\\(a.jpg)\n',
    'should escape what would otherwise be an image (resource)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '[a][b]'}]}),
    '\\[a]\\[b]\n',
    'should escape what would otherwise be a link (reference)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '[](a.jpg)'}]}),
    '\\[]\\(a.jpg)\n',
    'should escape what would otherwise be a link (resource)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '+ a\n+ b'}]}),
    '\\+ a\n\\+ b\n',
    'should escape what would otherwise be a list item (plus)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '- a\n- b'}]}),
    '\\- a\n\\- b\n',
    'should escape what would otherwise be a list item (dash)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '* a\n* b'}]}),
    '\\* a\n\\* b\n',
    'should escape what would otherwise be a list item (asterisk)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '1. a\n2. b'}]}),
    '1\\. a\n2\\. b\n',
    'should escape what would otherwise be a list item (dot)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '1) a\n2) b'}]}),
    '1\\) a\n2\\) b\n',
    'should escape what would otherwise be a list item (paren)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '1.2.3. asd'}]}),
    '1.2.3. asd\n',
    'should not escape what can’t be a list (dot)'
  )

  t.equal(
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

  t.equal(
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

  t.equal(
    to(
      // @ts-expect-error: `null` for `checked` is what we’ve always used.
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
                            children: [
                              {
                                type: 'text',
                                value: 'bar'
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

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.equal(
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

  t.end()
})

test('roundtrip', (t) => {
  let doc = [
    '> *   Lorem ipsum dolor sit amet',
    '>',
    '> *   consectetur adipisicing elit',
    ''
  ].join('\n')

  t.equal(to(from(doc)), doc, 'should roundtrip spread items in block quotes')

  doc = [
    '*   Lorem ipsum dolor sit amet',
    '',
    '    1.  consectetur adipisicing elit',
    '',
    '    2.  sed do eiusmod tempor incididunt',
    ''
  ].join('\n')

  t.equal(to(from(doc)), doc, 'should roundtrip spread items in sublists (1)')

  doc = [
    '*   1.  Lorem ipsum dolor sit amet',
    '',
    '    2.  consectetur adipisicing elit',
    ''
  ].join('\n')

  t.equal(to(from(doc)), doc, 'should roundtrip spread items in sublists (2)')

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

  t.equal(to(from(doc)), doc, 'should roundtrip spread items in sublists (3)')

  doc = 'An autolink: <http://example.com/?foo=1&bar=2>.\n'

  t.equal(
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

  t.equal(to(from(doc)), doc, 'should roundtrip potential prototype injections')

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

  t.equal(to(from(doc)), doc, 'should roundtrip empty lists')

  doc = '*   a\n\n<!---->\n\n*   b\n'

  t.equal(to(from(doc)), doc, 'should roundtrip lists with break comments')

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

  t.equal(to(from(doc)), doc, 'should roundtrip indented blank lines in code')

  doc = '> a\n\n> b\n'

  t.equal(to(from(doc)), doc, 'should roundtrip adjacent block quotes')

  doc = '[**https://unifiedjs.com/**](https://unifiedjs.com/)\n'

  t.equal(to(from(doc)), doc, 'should roundtrip formatted URLs')

  const step1 = '\\ \\\\ \\\\\\ \\\\\\\\'
  const step2 = '\\ \\ \\\\\\ \\\\\\\\\n'

  t.equal(to(from(step1)), step2, 'should roundtrip backslashes (1)')
  t.equal(to(from(step2)), step2, 'should roundtrip backslashes (2)')

  doc = '\\\\\\*a\n'

  t.equal(to(from(doc)), doc, 'should not collapse escapes (1)')

  doc = '\\\\*a\\\\\\*'

  t.deepEqual(
    removePosition(from(doc)),
    removePosition(from(to(from(doc)))),
    'should not collapse escapes (2)'
  )

  doc = '```\n	\n```\n'

  t.equal(
    to(from(doc)),
    doc,
    'should roundtrip a sole blank line in fenced code'
  )

  t.end()
})
