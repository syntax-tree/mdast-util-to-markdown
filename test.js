var test = require('tape')
var to = require('.')

test('mdast-util-to-markdown', function (t) {
  t.equal(typeof to, 'function', 'should expose a function')

  t.end()
})

test('core', function (t) {
  t.equal(
    to({
      type: 'root',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
        {type: 'thematicBreak'},
        {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
      ]
    }),
    'a\n\n***\n\nb',
    'should support a `root`'
  )

  t.equal(
    to({
      type: 'root',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
        {type: 'definition', label: 'b'},
        {type: 'definition', label: 'c'},
        {type: 'paragraph', children: [{type: 'text', value: 'd'}]}
      ]
    }),
    'a\n\n[b]: <>\n\n[c]: <>\n\nd',
    'should support adjacent definitions'
  )

  t.equal(
    to(
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
    'a\n\n[b]: <>\n[c]: <>\n\nd',
    'should support tight adjacent definitions when `tightDefinitions: true`'
  )

  t.equal(
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
    'a\n\n*\n\n<!---->\n\n*\n\n1.\n\n<!---->\n\n1.\n\nd',
    'should inject HTML comments between lists w/ the same ordered as they’d otherwise run into each other'
  )

  t.equal(
    to({
      type: 'root',
      children: [
        {type: 'code', value: 'a'},
        {type: 'list', children: [{type: 'listItem'}]},
        {type: 'code', value: 'b'}
      ]
    }),
    '    a\n\n*\n\n<!---->\n\n    b',
    'should inject HTML comments between lists and an indented code as they’d otherwise run into each other'
  )

  t.throws(
    function () {
      to(false)
    },
    /Cannot handle value `false`, expected node/,
    'should throw on a non-node'
  )

  t.throws(
    function () {
      to({type: 'unknown'})
    },
    /Cannot handle unknown node `unknown`/,
    'should throw on an unknown node'
  )

  t.throws(
    function () {
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

test('blockquote', function (t) {
  t.equal(to({type: 'blockquote'}), '>', 'should support a block quote')

  t.equal(
    to({
      type: 'blockquote',
      children: [{type: 'paragraph', children: [{type: 'text', value: 'a'}]}]
    }),
    '> a',
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
    '> a\n>\n> ***\n>\n> b',
    'should support a block quote w/ children'
  )

  t.equal(
    to({
      type: 'blockquote',
      children: [{type: 'paragraph', children: [{type: 'text', value: 'a\nb'}]}]
    }),
    '> a\n> b',
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
    '> ab',
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
              children: [{type: 'text', value: 'a b'}]
            }
          ]
        }
      ]
    }),
    '> a\n> b\n>\n> > a\n> > `b\n> > c`\n> > d\n> >\n> > # a b',
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
    '> a\\\n> b',
    'should support a break in a block quote'
  )

  t.equal(
    to({type: 'blockquote', children: [{type: 'code', value: 'a\nb\n\nc'}]}),
    '>     a\n>     b\n>\n>     c',
    'should support code (flow, indented) in a block quote'
  )

  t.equal(
    to({
      type: 'blockquote',
      children: [{type: 'code', lang: 'a\nb', value: 'c\nd\n\ne'}]
    }),
    '> ```a&#xA;b\n> c\n> d\n>\n> e\n> ```',
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
    '> a\n> `b\n> c`\n> d',
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
    '> a\n> `  b\n> c  `\n> d',
    'should support padded code (text) in a block quote'
  )

  t.equal(
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
    '> [a\n> b]: <c&#xA;d> "e\n> f"\n>\n> a\n> b',
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
    '> a\n> *c\n> d*\n> d',
    'should support an emphasis in a block quote'
  )

  t.equal(
    to({
      type: 'blockquote',
      children: [
        {
          type: 'heading',
          children: [{type: 'text', value: 'a\nb'}]
        }
      ]
    }),
    '> # a&#xA;b',
    'should support a heading (atx) in a block quote'
  )

  t.equal(
    to(
      {
        type: 'blockquote',
        children: [
          {
            type: 'heading',
            children: [{type: 'text', value: 'a\nb'}]
          }
        ]
      },
      {setext: true}
    ),
    '> a\n> b\n> =',
    'should support a heading (setext) in a block quote'
  )

  t.equal(
    to({
      type: 'blockquote',
      children: [{type: 'html', value: '<div\nhidden>'}]
    }),
    '> <div\n> hidden>',
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
    '> a <span\n> hidden>\n> b',
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
    '> a\n> ![d\n> e](<b&#xA;c> "f\n> g")\n> h',
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
            {type: 'imageReference', alt: 'b\nc', label: 'd\ne'},
            {type: 'text', value: '\nf'}
          ]
        }
      ]
    }),
    '> a\n> ![b\n> c][d\n> e]\n> f',
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
    '> a\n> [d\n> e](<b&#xA;c> "f\n> g")\n> h',
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
              label: 'd\ne'
            },
            {type: 'text', value: '\nf'}
          ]
        }
      ]
    }),
    '> a\n> [b\n> c][d\n> e]\n> f',
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
    '> a\n> b\n>\n> *   c\n>     d\n>\n> *   ***\n>\n> *   e\n>     f',
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
    '> a\n> **c\n> d**\n> d',
    'should support a strong in a block quote'
  )

  t.equal(
    to({
      type: 'blockquote',
      children: [{type: 'thematicBreak'}, {type: 'thematicBreak'}]
    }),
    '> ***\n>\n> ***',
    'should support a thematic break in a block quote'
  )

  t.end()
})

test('break', function (t) {
  t.equal(to({type: 'break'}), '\\\n', 'should support a break')

  t.end()
})

test('code (flow)', function (t) {
  t.equal(to({type: 'code'}), '```\n```', 'should support empty code')

  t.equal(
    to({type: 'code', value: 'a'}),
    '    a',
    'should support code w/ a value (indent)'
  )

  t.equal(
    to({type: 'code', value: 'a'}, {fences: true}),
    '```\na\n```',
    'should support code w/ a value (fences)'
  )

  t.equal(
    to({type: 'code', lang: 'a'}),
    '```a\n```',
    'should support code w/ a lang'
  )

  t.equal(
    to({type: 'code', meta: 'a'}),
    '```\n```',
    'should support (ignore) code w/ only a meta'
  )

  t.equal(
    to({type: 'code', lang: 'a', meta: 'b'}),
    '```a b\n```',
    'should support code w/ lang and meta'
  )

  t.equal(
    to({type: 'code', lang: 'a b'}),
    '```a&#x20;b\n```',
    'should encode a space in `lang`'
  )

  t.equal(
    to({type: 'code', lang: 'a\nb'}),
    '```a&#xA;b\n```',
    'should encode a line ending in `lang`'
  )

  t.equal(
    to({type: 'code', lang: 'a`b'}),
    '```a&#x60;b\n```',
    'should encode a grave accent in `lang`'
  )

  t.equal(
    to({type: 'code', lang: 'a\\-b'}),
    '```a\\\\-b\n```',
    'should escape a backslash in `lang`'
  )

  t.equal(
    to({type: 'code', lang: 'x', meta: 'a b'}),
    '```x a b\n```',
    'should not encode a space in `meta`'
  )

  t.equal(
    to({type: 'code', lang: 'x', meta: 'a\nb'}),
    '```x a&#xA;b\n```',
    'should encode a line ending in `meta`'
  )

  t.equal(
    to({type: 'code', lang: 'x', meta: 'a`b'}),
    '```x a&#x60;b\n```',
    'should encode a grave accent in `meta`'
  )

  t.equal(
    to({type: 'code', lang: 'x', meta: 'a\\-b'}),
    '```x a\\\\-b\n```',
    'should escape a backslash in `meta`'
  )

  t.equal(
    to({type: 'code'}, {fence: '~'}),
    '~~~\n~~~',
    'should support fenced code w/ tildes when `fence: "~"`'
  )

  t.equal(
    to({type: 'code', lang: 'a`b'}, {fence: '~'}),
    '~~~a`b\n~~~',
    'should not encode a grave accent when using tildes for fences'
  )

  t.equal(
    to({type: 'code', value: '```\nasd\n```'}, {fences: true}),
    '````\n```\nasd\n```\n````',
    'should use more grave accents for fences if there are streaks of grave accents in the value (fences)'
  )

  t.equal(
    to({type: 'code', value: '~~~\nasd\n~~~'}, {fence: '~', fences: true}),
    '~~~~\n~~~\nasd\n~~~\n~~~~',
    'should use more tildes for fences if there are streaks of tildes in the value (fences)'
  )

  t.equal(
    to({type: 'code', lang: 'a', value: 'b'}),
    '```a\nb\n```',
    'should use a fence if there is an info'
  )

  t.equal(
    to({type: 'code', value: ' '}),
    '```\n \n```',
    'should use a fence if there is only whitespace'
  )

  t.equal(
    to({type: 'code', value: '\na'}),
    '```\n\na\n```',
    'should use a fence if there first line is blank (void)'
  )

  t.equal(
    to({type: 'code', value: ' \na'}),
    '```\n \na\n```',
    'should use a fence if there first line is blank (filled)'
  )

  t.equal(
    to({type: 'code', value: 'a\n'}),
    '```\na\n\n```',
    'should use a fence if there last line is blank (void)'
  )

  t.equal(
    to({type: 'code', value: 'a\n '}),
    '```\na\n \n```',
    'should use a fence if there last line is blank (filled)'
  )

  t.equal(
    to({type: 'code', value: '  a\n\n b'}),
    '      a\n\n     b',
    'should use an indent if the value is indented'
  )

  t.end()
})

test('definition', function (t) {
  t.equal(
    to({type: 'definition'}),
    '[]: <>',
    'should support a definition w/o label'
  )

  t.equal(
    to({type: 'definition', label: 'a'}),
    '[a]: <>',
    'should support a definition w/ label'
  )

  t.equal(
    to({type: 'definition', label: '\\'}),
    '[\\\\]: <>',
    'should escape a backslash in `label`'
  )

  t.equal(
    to({type: 'definition', label: '['}),
    '[\\[]: <>',
    'should escape an opening bracket in `label`'
  )

  t.equal(
    to({type: 'definition', label: ']'}),
    '[\\]]: <>',
    'should escape a closing bracket in `label`'
  )

  t.equal(
    to({type: 'definition', identifier: 'a'}),
    '[a]: <>',
    'should support a definition w/ identifier'
  )

  t.equal(
    to({type: 'definition', identifier: '\\'}),
    '[\\\\]: <>',
    'should escape a backslash in `identifier`'
  )

  t.equal(
    to({type: 'definition', identifier: '['}),
    '[\\[]: <>',
    'should escape an opening bracket in `identifier`'
  )

  t.equal(
    to({type: 'definition', identifier: ']'}),
    '[\\]]: <>',
    'should escape a closing bracket in `identifier`'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: 'b'}),
    '[a]: b',
    'should support a definition w/ url'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: 'b c'}),
    '[a]: <b c>',
    'should support a definition w/ enclosed url w/ whitespace in url'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: 'b <c'}),
    '[a]: <b \\<c>',
    'should escape an opening angle bracket in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: 'b >c'}),
    '[a]: <b \\>c>',
    'should escape a closing angle bracket in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: 'b \\.c'}),
    '[a]: <b \\\\.c>',
    'should escape a backslash in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: 'b\nc'}),
    '[a]: <b&#xA;c>',
    'should encode a line ending in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: 'b(c'}),
    '[a]: b\\(c',
    'should escape an opening paren in `url` in a raw url'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: 'b)c'}),
    '[a]: b\\)c',
    'should escape a closing paren in `url` in a raw url'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', url: 'b\\?c'}),
    '[a]: b\\\\?c',
    'should escape a backslash in `url` in a raw url'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', title: 'b'}),
    '[a]: <> "b"',
    'should support a definition w/ title'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', title: '"'}),
    '[a]: <> "\\""',
    'should escape a quote in `title` in a title'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', title: '\\'}),
    '[a]: <> "\\\\"',
    'should escape a backslash in `title` in a title'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', title: 'b'}, {quote: "'"}),
    "[a]: <> 'b'",
    'should support a definition w/ title when `quote: "\'"`'
  )

  t.equal(
    to({type: 'definition', identifier: 'a', title: "'"}, {quote: "'"}),
    "[a]: <> '\\''",
    'should escape a quote in `title` in a title when `quote: "\'"`'
  )

  t.throws(
    function () {
      to({type: 'definition', identifier: 'a', title: 'b'}, {quote: '.'})
    },
    /Cannot serialize title with `\.`, expected `"`, or `'`/,
    'should throw on when given an incorrect `emphasis`'
  )

  t.end()
})

test('emphasis', function (t) {
  t.equal(to({type: 'emphasis'}), '**', 'should support an empty emphasis')

  t.throws(
    function () {
      to({type: 'emphasis'}, {emphasis: '?'})
    },
    /Cannot serialize emphasis with `\?`, expected `\*`, or `_`/,
    'should throw on when given an incorrect `emphasis`'
  )

  t.equal(
    to({type: 'emphasis', children: [{type: 'text', value: 'a'}]}),
    '*a*',
    'should support an emphasis w/ children'
  )

  t.equal(
    to(
      {type: 'emphasis', children: [{type: 'text', value: 'a'}]},
      {emphasis: '_'}
    ),
    '_a_',
    'should support an emphasis w/ underscores when `emphasis: "_"`'
  )

  t.end()
})

test('heading', function (t) {
  t.equal(
    to({type: 'heading'}),
    '#',
    'should serialize a heading w/o rank as a heading of rank 1'
  )

  t.equal(
    to({type: 'heading', depth: 1}),
    '#',
    'should serialize a heading w/ rank 1'
  )

  t.equal(
    to({type: 'heading', depth: 6}),
    '######',
    'should serialize a heading w/ rank 6'
  )

  t.equal(
    to({type: 'heading', depth: 7}),
    '######',
    'should serialize a heading w/ rank 7 as 6'
  )

  t.equal(
    to({type: 'heading', depth: 0}),
    '#',
    'should serialize a heading w/ rank 0 as 1'
  )

  t.equal(
    to({type: 'heading', depth: 1, children: [{type: 'text', value: 'a'}]}),
    '# a',
    'should serialize a heading w/ content'
  )

  t.equal(
    to(
      {type: 'heading', depth: 1, children: [{type: 'text', value: 'a'}]},
      {setext: true}
    ),
    'a\n=',
    'should serialize a heading w/ rank 1 as setext when `setext: true`'
  )

  t.equal(
    to(
      {type: 'heading', depth: 2, children: [{type: 'text', value: 'a'}]},
      {setext: true}
    ),
    'a\n-',
    'should serialize a heading w/ rank 2 as setext when `setext: true`'
  )

  t.equal(
    to(
      {type: 'heading', depth: 3, children: [{type: 'text', value: 'a'}]},
      {setext: true}
    ),
    '### a',
    'should serialize a heading w/ rank 3 as atx when `setext: true`'
  )

  t.equal(
    to(
      {type: 'heading', depth: 2, children: [{type: 'text', value: 'aa\rb'}]},
      {setext: true}
    ),
    'aa\rb\n-',
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
    'a\r\nbbb\n===',
    'should serialize a setext underline as long as the last line (2)'
  )

  t.equal(
    to({type: 'heading', depth: 1}, {setext: true}),
    '#',
    'should serialize an empty heading w/ rank 1 as atx when `setext: true`'
  )

  t.equal(
    to({type: 'heading', depth: 2}, {setext: true}),
    '##',
    'should serialize an empty heading w/ rank 2 as atx when `setext: true`'
  )

  t.equal(
    to({type: 'heading'}, {closeAtx: true}),
    '# #',
    'should serialize a with a closing sequence when `closeAtx` (empty)'
  )

  t.equal(
    to(
      {type: 'heading', depth: 3, children: [{type: 'text', value: 'a'}]},
      {closeAtx: true}
    ),
    '### a ###',
    'should serialize a with a closing sequence when `closeAtx` (content)'
  )

  t.end()
})

test('html', function (t) {
  t.equal(to({type: 'html'}), '', 'should support a void html')
  t.equal(to({type: 'html', value: ''}), '', 'should support an empty html')
  t.equal(to({type: 'html', value: 'a\nb'}), 'a\nb', 'should support html')
  t.end()
})

test('image', function (t) {
  t.equal(to({type: 'image'}), '![]()', 'should support an image')

  t.equal(to({type: 'image', alt: 'a'}), '![a]()', 'should support `alt`')

  t.equal(to({type: 'image', url: 'a'}), '![](a)', 'should support a url')

  t.equal(
    to({type: 'image', title: 'a'}),
    '![](<> "a")',
    'should support a title'
  )

  t.equal(
    to({type: 'image', url: 'a', title: 'b'}),
    '![](a "b")',
    'should support a url and title'
  )

  t.equal(
    to({type: 'image', url: 'b c'}),
    '![](<b c>)',
    'should support an image w/ enclosed url w/ whitespace in url'
  )

  t.equal(
    to({type: 'image', url: 'b <c'}),
    '![](<b \\<c>)',
    'should escape an opening angle bracket in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'image', url: 'b >c'}),
    '![](<b \\>c>)',
    'should escape a closing angle bracket in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'image', url: 'b \\+c'}),
    '![](<b \\\\+c>)',
    'should escape a backslash in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'image', url: 'b\nc'}),
    '![](<b&#xA;c>)',
    'should encode a line ending in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'image', url: 'b(c'}),
    '![](b\\(c)',
    'should escape an opening paren in `url` in a raw url'
  )

  t.equal(
    to({type: 'image', url: 'b)c'}),
    '![](b\\)c)',
    'should escape a closing paren in `url` in a raw url'
  )

  t.equal(
    to({type: 'image', url: 'b\\+c'}),
    '![](b\\\\+c)',
    'should escape a backslash in `url` in a raw url'
  )

  t.equal(
    to({type: 'image', title: 'b"c'}),
    '![](<> "b\\"c")',
    'should escape a double quote in `title`'
  )

  t.equal(
    to({type: 'image', title: 'b\\.c'}),
    '![](<> "b\\\\.c")',
    'should escape a backslash in `title`'
  )

  t.equal(
    to({type: 'image', title: 'b'}, {quote: "'"}),
    "![](<> 'b')",
    'should support an image w/ title when `quote: "\'"`'
  )

  t.equal(
    to({type: 'image', title: "'"}, {quote: "'"}),
    "![](<> '\\'')",
    'should escape a quote in `title` in a title when `quote: "\'"`'
  )

  t.throws(
    function () {
      to({type: 'image', title: 'a'}, {quote: '.'})
    },
    /Cannot serialize title with `\.`, expected `"`, or `'`/,
    'should throw on when given an incorrect `emphasis`'
  )

  t.end()
})

test('imageReference', function (t) {
  t.equal(
    to({type: 'imageReference'}),
    '![][]',
    'should support a link reference (nonsensical)'
  )

  t.equal(
    to({type: 'imageReference', alt: 'a'}),
    '![a][]',
    'should support `alt`'
  )

  t.equal(
    to({type: 'imageReference', identifier: 'a'}),
    '![][a]',
    'should support an `identifier` (nonsensical)'
  )

  t.equal(
    to({type: 'imageReference', label: 'a'}),
    '![][a]',
    'should support a `label` (nonsensical)'
  )

  t.equal(
    to({
      type: 'imageReference',
      alt: 'A',
      label: 'A',
      referenceType: 'shortcut'
    }),
    '![A]',
    'should support `referenceType: "shortcut"`'
  )

  t.equal(
    to({
      type: 'imageReference',
      alt: 'A',
      label: 'A',
      referenceType: 'collapsed'
    }),
    '![A][]',
    'should support `referenceType: "collapsed"`'
  )

  t.equal(
    to({
      type: 'imageReference',
      alt: 'A',
      label: 'A',
      referenceType: 'full'
    }),
    '![A][A]',
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
    '![&][&]',
    'should prefer label over identifier'
  )

  t.equal(
    to({
      type: 'imageReference',
      alt: '&',
      identifier: '&amp;',
      referenceType: 'full'
    }),
    '![&][&]',
    'should decode `identifier` if w/o `label`'
  )

  t.equal(
    to({
      type: 'imageReference',
      alt: '&a;',
      identifier: '&b;',
      referenceType: 'full'
    }),
    '![&a;][&b;]',
    'should support incorrect character references'
  )

  t.equal(
    to({
      type: 'imageReference',
      alt: '+',
      identifier: '\\+',
      referenceType: 'full'
    }),
    '![+][+]',
    'should unescape `identifier` if w/o `label`'
  )

  t.equal(
    to({type: 'imageReference', alt: 'a', label: 'a'}),
    '![a][]',
    'should use a collapsed reference if w/o `referenceType` and the label matches the reference'
  )

  t.equal(
    to({type: 'imageReference', alt: 'a', label: 'b'}),
    '![a][b]',
    'should use a full reference if w/o `referenceType` and the label does not match the reference'
  )

  t.end()
})

test('Code text', function (t) {
  t.equal(to({type: 'inlineCode'}), '``', 'should support an empty code text')

  t.equal(
    to({type: 'inlineCode', value: 'a'}),
    '`a`',
    'should support a code text'
  )

  t.equal(to({type: 'inlineCode', value: ' '}), '` `', 'should support a space')

  t.equal(
    to({type: 'inlineCode', value: '\n'}),
    '`\n`',
    'should support an eol'
  )

  t.equal(
    to({type: 'inlineCode', value: '  '}),
    '`  `',
    'should support several spaces'
  )

  t.equal(
    to({type: 'inlineCode', value: 'a`b'}),
    '``a`b``',
    'should use a fence of two grave accents if the value contains one'
  )

  t.equal(
    to({type: 'inlineCode', value: 'a``b'}),
    '`a``b`',
    'should use a fence of one grave accent if the value contains two'
  )

  t.equal(
    to({type: 'inlineCode', value: 'a``b`c'}),
    '```a``b`c```',
    'should use a fence of three grave accents if the value contains two and one'
  )

  t.equal(
    to({type: 'inlineCode', value: '`a'}),
    '`` `a ``',
    'should pad w/ a space if the value starts w/ a grave accent'
  )

  t.equal(
    to({type: 'inlineCode', value: 'a`'}),
    '`` a` ``',
    'should pad w/ a space if the value ends w/ a grave accent'
  )

  t.equal(
    to({type: 'inlineCode', value: ' a'}),
    '`  a `',
    'should pad w/ a space if the value starts w/ a space'
  )

  t.equal(
    to({type: 'inlineCode', value: 'a '}),
    '` a  `',
    'should pad w/ a space if the value ends w/ a space'
  )

  t.end()
})

test('link', function (t) {
  t.equal(to({type: 'link'}), '[]()', 'should support a link')

  t.equal(
    to({type: 'link', children: [{type: 'text', value: 'a'}]}),
    '[a]()',
    'should support children'
  )

  t.equal(to({type: 'link', url: 'a'}), '[](a)', 'should support a url')

  t.equal(
    to({type: 'link', title: 'a'}),
    '[](<> "a")',
    'should support a title'
  )

  t.equal(
    to({type: 'link', url: 'a', title: 'b'}),
    '[](a "b")',
    'should support a url and title'
  )

  t.equal(
    to({type: 'link', url: 'b c'}),
    '[](<b c>)',
    'should support a link w/ enclosed url w/ whitespace in url'
  )

  t.equal(
    to({type: 'link', url: 'b <c'}),
    '[](<b \\<c>)',
    'should escape an opening angle bracket in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'link', url: 'b >c'}),
    '[](<b \\>c>)',
    'should escape a closing angle bracket in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'link', url: 'b \\+c'}),
    '[](<b \\\\+c>)',
    'should escape a backslash in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'link', url: 'b\nc'}),
    '[](<b&#xA;c>)',
    'should encode a line ending in `url` in an enclosed url'
  )

  t.equal(
    to({type: 'link', url: 'b(c'}),
    '[](b\\(c)',
    'should escape an opening paren in `url` in a raw url'
  )

  t.equal(
    to({type: 'link', url: 'b)c'}),
    '[](b\\)c)',
    'should escape a closing paren in `url` in a raw url'
  )

  t.equal(
    to({type: 'link', url: 'b\\.c'}),
    '[](b\\\\.c)',
    'should escape a backslash in `url` in a raw url'
  )

  t.equal(
    to({type: 'link', title: 'b"c'}),
    '[](<> "b\\"c")',
    'should escape a double quote in `title`'
  )

  t.equal(
    to({type: 'link', title: 'b\\-c'}),
    '[](<> "b\\\\-c")',
    'should escape a backslash in `title`'
  )

  t.equal(
    to({
      type: 'link',
      url: 'tel:123',
      children: [{type: 'text', value: 'tel:123'}]
    }),
    '<tel:123>',
    'should use an autolink for nodes w/ a value similar to the url and a protocol'
  )

  t.equal(
    to({
      type: 'link',
      url: 'a',
      children: [{type: 'text', value: 'a'}]
    }),
    '[a](a)',
    'should use a normal link for nodes w/ a value similar to the url w/o a protocol'
  )

  t.equal(
    to({
      type: 'link',
      url: 'tel:123',
      children: [{type: 'text', value: 'tel:123'}]
    }),
    '<tel:123>',
    'should use an autolink for nodes w/ a value similar to the url and a protocol'
  )

  t.equal(
    to({
      type: 'link',
      url: 'tel:123',
      title: 'a',
      children: [{type: 'text', value: 'tel:123'}]
    }),
    '[tel:123](tel:123 "a")',
    'should use a normal link for nodes w/ a value similar to the url w/ a title'
  )

  t.equal(
    to({
      type: 'link',
      url: 'mailto:a@b.c',
      children: [{type: 'text', value: 'a@b.c'}]
    }),
    '<a@b.c>',
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
    '<a.b-c_d@a.b>',
    'should not escape in autolinks'
  )

  t.equal(
    to({type: 'link', title: 'b'}, {quote: "'"}),
    "[](<> 'b')",
    'should support a link w/ title when `quote: "\'"`'
  )

  t.equal(
    to({type: 'link', title: "'"}, {quote: "'"}),
    "[](<> '\\'')",
    'should escape a quote in `title` in a title when `quote: "\'"`'
  )

  t.throws(
    function () {
      to({type: 'link', title: 'b'}, {quote: '.'})
    },
    /Cannot serialize title with `\.`, expected `"`, or `'`/,
    'should throw on when given an incorrect `emphasis`'
  )

  t.end()
})

test('linkReference', function (t) {
  t.equal(
    to({type: 'linkReference'}),
    '[][]',
    'should support a link reference (nonsensical)'
  )

  t.equal(
    to({type: 'linkReference', children: [{type: 'text', value: 'a'}]}),
    '[a][]',
    'should support `children`'
  )

  t.equal(
    to({type: 'linkReference', identifier: 'a'}),
    '[][a]',
    'should support an `identifier` (nonsensical)'
  )

  t.equal(
    to({type: 'linkReference', label: 'a'}),
    '[][a]',
    'should support a `label` (nonsensical)'
  )

  t.equal(
    to({
      type: 'linkReference',
      children: [{type: 'text', value: 'A'}],
      label: 'A',
      referenceType: 'shortcut'
    }),
    '[A]',
    'should support `referenceType: "shortcut"`'
  )

  t.equal(
    to({
      type: 'linkReference',
      children: [{type: 'text', value: 'A'}],
      label: 'A',
      referenceType: 'collapsed'
    }),
    '[A][]',
    'should support `referenceType: "collapsed"`'
  )

  t.equal(
    to({
      type: 'linkReference',
      children: [{type: 'text', value: 'A'}],
      label: 'A',
      referenceType: 'full'
    }),
    '[A][A]',
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
    '[&][&]',
    'should prefer label over identifier'
  )

  t.equal(
    to({
      type: 'linkReference',
      children: [{type: 'text', value: '&'}],
      identifier: '&amp;',
      referenceType: 'full'
    }),
    '[&][&]',
    'should decode `identifier` if w/o `label`'
  )

  t.equal(
    to({
      type: 'linkReference',
      children: [{type: 'text', value: '&a;'}],
      identifier: '&b;',
      referenceType: 'full'
    }),
    '[&a;][&b;]',
    'should support incorrect character references'
  )

  t.equal(
    to({
      type: 'linkReference',
      children: [{type: 'text', value: '+'}],
      identifier: '\\+',
      referenceType: 'full'
    }),
    '[+][+]',
    'should unescape `identifier` if w/o `label`'
  )

  t.equal(
    to({
      type: 'linkReference',
      children: [{type: 'text', value: 'a'}],
      label: 'a'
    }),
    '[a][]',
    'should use a collapsed reference if w/o `referenceType` and the label matches the reference'
  )

  t.equal(
    to({
      type: 'linkReference',
      children: [{type: 'text', value: 'a'}],
      label: 'b'
    }),
    '[a][b]',
    'should use a full reference if w/o `referenceType` and the label does not match the reference'
  )

  t.end()
})

test('list', function (t) {
  t.equal(to({type: 'list'}), '', 'should support an empty list')

  t.equal(
    to({type: 'list', children: [{type: 'listItem'}]}),
    '*',
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
    '*   a\n\n*   ***\n\n*   b',
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
    '*   a\n*   ***',
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
    '*   a\n\n    b\n*   ***',
    'should support a list w/ `spread: false`, w/ a spread item'
  )

  t.equal(
    to({type: 'list', ordered: true, children: [{type: 'listItem'}]}),
    '1.',
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
    '1.  a\n\n2.  ***\n\n3.  b',
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
    '1.  a\n2.  ***\n3.  b',
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
    '1.  a\n1.  ***\n1.  b',
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
    '0. a\n\n1. ***',
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
    '* a\n  b\n* c\n  d',
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
    '*   a\n    b\n\n*   c\n    d',
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
    '9. a\n   b\n10. c\n    d',
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
    '99. a\n    b\n100. c\n     d',
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
    '999. a\n     b\n1000. c\n      d',
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
    '9.  a\n    b\n10. c\n    d',
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
    '99. a\n    b\n100.    c\n        d',
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
    '999.    a\n        b\n1000.   c\n        d',
    'should support a correct prefix and indent for items 999 and 1000 when `listItemIndent: "tab"`'
  )

  t.end()
})

test('listItem', function (t) {
  t.equal(to({type: 'listItem'}), '*', 'should support a list item')

  t.equal(
    to({type: 'listItem'}, {bullet: '+'}),
    '+',
    'should serialize an item w/ a plus as bullet when `bullet: "+"`'
  )

  t.throws(
    function () {
      to({type: 'listItem'}, {bullet: '.'})
    },
    /Cannot serialize items with `\.`, expected `\*`, `\+`, or `-`/,
    'should throw on an incorrect bullet'
  )

  t.equal(
    to({
      type: 'listItem',
      children: [{type: 'paragraph', children: [{type: 'text', value: 'a'}]}]
    }),
    '*   a',
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
    '*   a\n\n    ***\n\n    b',
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
    '* a\n\n  ***',
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
      {listItemIndent: '1'}
    ),
    '* a\n\n  ***',
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
    '* a',
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
    '*   a\n\n    ***',
    'should use a tab stop of spaces after the bullet for `listItemIndent: "mixed"`, when the item is spread'
  )

  t.throws(
    function () {
      to({type: 'listItem'}, {listItemIndent: 'x'})
    },
    /Cannot serialize items with `x`, expected `tab`, `one`, or `mixed`/,
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
    '*   a\n    ***',
    'should not use blank lines between child blocks for items w/ `spread: false`'
  )

  t.end()
})

test('paragraph', function (t) {
  t.equal(to({type: 'paragraph'}), '', 'should support an empty paragraph')

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a\nb'}]}),
    'a\nb',
    'should support a paragraph'
  )

  t.end()
})

test('strong', function (t) {
  t.equal(to({type: 'strong'}), '****', 'should support an empty strong')

  t.throws(
    function () {
      to({type: 'strong'}, {strong: '?'})
    },
    /Cannot serialize strong with `\?`, expected `\*`, or `_`/,
    'should throw on when given an incorrect `emphasis`'
  )

  t.equal(
    to({type: 'strong', children: [{type: 'text', value: 'a'}]}),
    '**a**',
    'should support a strong w/ children'
  )

  t.equal(
    to({type: 'strong', children: [{type: 'text', value: 'a'}]}, {strong: '_'}),
    '__a__',
    'should support a strong w/ underscores when `emphasis: "_"`'
  )

  t.end()
})

test('text', function (t) {
  t.equal(to({type: 'text'}), '', 'should support a void text')
  t.equal(to({type: 'text', value: ''}), '', 'should support an empty text')
  t.equal(to({type: 'text', value: 'a\nb'}), 'a\nb', 'should support text')
  t.end()
})

test('thematic break', function (t) {
  t.equal(to({type: 'thematicBreak'}), '***', 'should support a thematic break')

  t.equal(
    to({type: 'thematicBreak'}, {rule: '-'}),
    '---',
    'should support a thematic break w/ dashes when `rule: "-"`'
  )

  t.equal(
    to({type: 'thematicBreak'}, {rule: '_'}),
    '___',
    'should support a thematic break w/ underscores when `rule: "_"`'
  )

  t.throws(
    function () {
      to({type: 'thematicBreak'}, {rule: '.'})
    },
    /Cannot serialize rules with `.`, expected `\*`, `-`, or `_`/,
    'should throw on when given an incorrect `rule`'
  )

  t.equal(
    to({type: 'thematicBreak'}, {ruleRepetition: 5}),
    '*****',
    'should support a thematic break w/ more repetitions w/ `ruleRepetition`'
  )

  t.throws(
    function () {
      to({type: 'thematicBreak'}, {ruleRepetition: 2})
    },
    /Cannot serialize rules with repetition `2`, expected `3` or more/,
    'should throw on when given an incorrect `rule`'
  )

  t.equal(
    to({type: 'thematicBreak'}, {ruleSpaces: true}),
    '* * *',
    'should support a thematic break w/ spaces w/ `ruleSpaces`'
  )

  t.end()
})

test('escape', function (t) {
  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '> a\n> b\nc >'}]}),
    '\\> a\n\\> b\nc >',
    'should escape what would otherwise be a block quote in a paragraph'
  )

  t.equal(
    to({
      type: 'listItem',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: '> a\n> b'}]}
      ]
    }),
    '*   \\> a\n    \\> b',
    'should escape what would otherwise be a block quote in a list item'
  )

  t.equal(
    to({
      type: 'blockquote',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: '> a\n> b'}]}
      ]
    }),
    '> \\> a\n> \\> b',
    'should escape what would otherwise be a block quote in a block quote'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a\\\nb'}]}),
    'a\\\\\nb',
    'should escape what would otherwise be a break'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '&amp'}]}),
    '\\&amp',
    'should escape what would otherwise be a named character reference'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '&#9;'}]}),
    '\\&#9;',
    'should escape what would otherwise be a numeric character reference'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a\\+b'}]}),
    'a\\\\+b',
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
    'a\\\\<https://a.b>',
    'should escape what would otherwise be a character escape of an autolink'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '```js\n```'}]}),
    '\\`\\`\\`js\n\\`\\`\\`',
    'should escape what would otherwise be code (flow)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '[a]: b'}]}),
    '\\[a]: b',
    'should escape what would otherwise be a definition'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '*a*'}]}),
    '\\*a\\*',
    'should escape what would otherwise be emphasis (asterisk)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '_a_'}]}),
    '\\_a\\_',
    'should escape what would otherwise be emphasis (underscore)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '# a'}]}),
    '\\# a',
    'should escape what would otherwise be a heading (atx)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a\n='}]}),
    'a\n\\=',
    'should escape what would otherwise be a heading (setext, equals)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a\n-'}]}),
    'a\n\\-',
    'should escape what would otherwise be a heading (setext, dash)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '<a\nb>'}]}),
    '\\<a\nb>',
    'should escape what would otherwise be html'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: 'a `b`\n`c` d'}]}),
    'a \\`b\\`\n\\`c\\` d',
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
    '\\![a](b)',
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
          label: 'b'
        }
      ]
    }),
    '\\![a][b]',
    'should escape what would otherwise turn a link reference into an image reference'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '![a][b]'}]}),
    '\\!\\[a]\\[b]',
    'should escape what would otherwise be an image (reference)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '![](a.jpg)'}]}),
    '\\!\\[](a.jpg)',
    'should escape what would otherwise be an image (resource)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '[a][b]'}]}),
    '\\[a]\\[b]',
    'should escape what would otherwise be a link (reference)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '[](a.jpg)'}]}),
    '\\[](a.jpg)',
    'should escape what would otherwise be a link (resource)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '+ a\n+ b'}]}),
    '\\+ a\n\\+ b',
    'should escape what would otherwise be a list item (plus)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '- a\n- b'}]}),
    '\\- a\n\\- b',
    'should escape what would otherwise be a list item (dash)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '* a\n* b'}]}),
    '\\* a\n\\* b',
    'should escape what would otherwise be a list item (asterisk)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '1. a\n2. b'}]}),
    '1\\. a\n2\\. b',
    'should escape what would otherwise be a list item (dot)'
  )

  t.equal(
    to({type: 'paragraph', children: [{type: 'text', value: '1) a\n2) b'}]}),
    '1\\) a\n2\\) b',
    'should escape what would otherwise be a list item (paren)'
  )

  t.end()
})
