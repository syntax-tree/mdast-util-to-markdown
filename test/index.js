/**
 * @typedef {import('mdast').BlockContent} BlockContent
 * @typedef {import('mdast').List} List
 * @typedef {import('../index.js').Handle} Handle
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {removePosition} from 'unist-util-remove-position'
import {fromMarkdown as from} from 'mdast-util-from-markdown'
import {toMarkdown as to} from '../index.js'

test('core', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(
      Object.keys(await import('mdast-util-to-markdown')).sort(),
      ['defaultHandlers', 'toMarkdown']
    )
  })

  await t.test('should support a `root`', async function () {
    assert.equal(
      to({
        type: 'root',
        children: [
          {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
          {type: 'thematicBreak'},
          {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
        ]
      }),
      'a\n\n***\n\nb\n'
    )
  })

  await t.test(
    'should not use blank lines between nodes when given phrasing',
    async function () {
      assert.equal(
        to({
          type: 'root',
          children: [
            {type: 'text', value: 'a'},
            {type: 'break'},
            {type: 'text', value: 'b'}
          ]
        }),
        'a\\\nb\n'
      )
    }
  )

  await t.test('should support adjacent definitions', async function () {
    assert.equal(
      to({
        type: 'root',
        children: [
          {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
          {type: 'definition', identifier: 'b', url: ''},
          {type: 'definition', identifier: 'c', url: ''},
          {type: 'paragraph', children: [{type: 'text', value: 'd'}]}
        ]
      }),
      'a\n\n[b]: <>\n\n[c]: <>\n\nd\n'
    )
  })

  await t.test(
    'should support tight adjacent definitions when `tightDefinitions: true`',
    async function () {
      assert.equal(
        to(
          {
            type: 'root',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
              {type: 'definition', identifier: 'b', url: ''},
              {type: 'definition', identifier: 'c', url: ''},
              {type: 'paragraph', children: [{type: 'text', value: 'd'}]}
            ]
          },
          {tightDefinitions: true}
        ),
        'a\n\n[b]: <>\n[c]: <>\n\nd\n'
      )
    }
  )

  await t.test(
    'should inject HTML comments between lists w/ the same marker',
    async function () {
      assert.equal(
        to({
          type: 'root',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
            {type: 'list', children: [{type: 'listItem', children: []}]},
            {type: 'list', children: [{type: 'listItem', children: []}]},
            {
              type: 'list',
              ordered: true,
              children: [{type: 'listItem', children: []}]
            },
            {
              type: 'list',
              ordered: true,
              children: [{type: 'listItem', children: []}]
            },
            {type: 'paragraph', children: [{type: 'text', value: 'd'}]}
          ]
        }),
        'a\n\n*\n\n<!---->\n\n*\n\n1.\n\n<!---->\n\n1.\n\nd\n'
      )
    }
  )

  await t.test(
    'should inject HTML comments between lists and an indented code',
    async function () {
      assert.equal(
        to({
          type: 'root',
          children: [
            {type: 'code', value: 'a'},
            {type: 'list', children: [{type: 'listItem', children: []}]},
            {type: 'code', value: 'b'}
          ]
        }),
        '    a\n\n*\n\n<!---->\n\n    b\n'
      )
    }
  )

  await t.test(
    'should inject HTML comments between adjacent indented code',
    async function () {
      assert.equal(
        to({
          type: 'root',
          children: [
            {type: 'code', value: 'a'},
            {type: 'code', value: 'b'}
          ]
        }),
        '    a\n\n<!---->\n\n    b\n'
      )
    }
  )

  await t.test(
    'should not honour `spread: false` for two paragraphs',
    async function () {
      assert.equal(
        to({
          type: 'listItem',
          spread: false,
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
            {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
          ]
        }),
        '*   a\n\n    b\n'
      )
    }
  )

  await t.test(
    'should not honour `spread: false` for a paragraph and a definition',
    async function () {
      assert.equal(
        to({
          type: 'listItem',
          spread: false,
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
            {type: 'definition', identifier: 'b', label: 'c', url: 'd'}
          ]
        }),
        '*   a\n\n    [c]: d\n'
      )
    }
  )

  await t.test(
    'should honour `spread: false` for a paragraph and a heading',
    async function () {
      assert.equal(
        to({
          type: 'listItem',
          spread: false,
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
            {type: 'heading', depth: 1, children: [{type: 'text', value: 'b'}]}
          ]
        }),
        '*   a\n    # b\n'
      )
    }
  )

  await t.test(
    'should not honour `spread: false` for a paragraph and a setext heading',
    async function () {
      assert.equal(
        to(
          {
            type: 'listItem',
            spread: false,
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
              {
                type: 'heading',
                depth: 1,
                children: [{type: 'text', value: 'b'}]
              }
            ]
          },
          {setext: true}
        ),
        '*   a\n\n    b\n    =\n'
      )
    }
  )

  await t.test('should throw on a non-node', async function () {
    assert.throws(function () {
      // @ts-expect-error: check how the runtime handles a non-object.
      to(false)
    }, /Cannot handle value `false`, expected node/)
  })

  await t.test('should throw on an unknown node', async function () {
    assert.throws(function () {
      // @ts-expect-error: check how the runtime handles an unknown node.
      to({type: 'unknown'})
    }, /Cannot handle unknown node `unknown`/)
  })

  await t.test('should throw on an unknown node in a tree', async function () {
    assert.throws(function () {
      to({
        type: 'paragraph',
        // @ts-expect-error: check how the runtime handles an unknown child.
        children: [{type: 'text', value: 'a'}, {type: 'unknown'}]
      })
    }, /Cannot handle unknown node `unknown`/)
  })
})

test('blockquote', async function (t) {
  await t.test('should support a block quote', async function () {
    // @ts-expect-error: check how the runtime handles `children` missing.
    assert.equal(to({type: 'blockquote'}), '>\n')
  })

  await t.test('should support a block quote w/ a child', async function () {
    assert.equal(
      to({
        type: 'blockquote',
        children: [{type: 'paragraph', children: [{type: 'text', value: 'a'}]}]
      }),
      '> a\n'
    )
  })

  await t.test('should support a block quote w/ children', async function () {
    assert.equal(
      to({
        type: 'blockquote',
        children: [
          {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
          {type: 'thematicBreak'},
          {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
        ]
      }),
      '> a\n>\n> ***\n>\n> b\n'
    )
  })

  await t.test(
    'should support text w/ a line ending in a block quote',
    async function () {
      assert.equal(
        to({
          type: 'blockquote',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a\nb'}]}
          ]
        }),
        '> a\n> b\n'
      )
    }
  )

  await t.test(
    'should support adjacent texts in a block quote',
    async function () {
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
        '> ab\n'
      )
    }
  )

  await t.test(
    'should support a block quote in a block quote',
    async function () {
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
        '> a\n> b\n>\n> > a\n> > `b\n> > c`\n> > d\n> >\n> > # a b\n'
      )
    }
  )

  await t.test('should support a break in a block quote', async function () {
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
      '> a\\\n> b\n'
    )
  })

  await t.test(
    'should support code (flow, indented) in a block quote',
    async function () {
      assert.equal(
        to({
          type: 'blockquote',
          children: [{type: 'code', value: 'a\nb\n\nc'}]
        }),
        '>     a\n>     b\n>\n>     c\n'
      )
    }
  )

  await t.test(
    'should support code (flow, fenced) in a block quote',
    async function () {
      assert.equal(
        to({
          type: 'blockquote',
          children: [{type: 'code', lang: 'a\nb', value: 'c\nd\n\ne'}]
        }),
        '> ```a&#xA;b\n> c\n> d\n>\n> e\n> ```\n'
      )
    }
  )

  await t.test(
    'should support code (text) in a block quote',
    async function () {
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
        '> a\n> `b\n> c`\n> d\n'
      )
    }
  )

  await t.test(
    'should support padded code (text) in a block quote',
    async function () {
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
        '> a\n> `  b\n> c  `\n> d\n'
      )
    }
  )

  await t.test(
    'should support a definition in a block quote',
    async function () {
      assert.equal(
        to({
          type: 'blockquote',
          children: [
            {
              type: 'definition',
              identifier: 'a\nb',
              url: 'c\nd',
              title: 'e\nf'
            },
            {
              type: 'paragraph',
              children: [{type: 'text', value: 'a\nb'}]
            }
          ]
        }),
        '> [a\n> b]: <c&#xA;d> "e\n> f"\n>\n> a\n> b\n'
      )
    }
  )

  await t.test(
    'should support an emphasis in a block quote',
    async function () {
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
        '> a\n> *c\n> d*\n> d\n'
      )
    }
  )

  await t.test(
    'should support a heading (atx) in a block quote',
    async function () {
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
        '> ### a&#xA;b\n'
      )
    }
  )

  await t.test(
    'should support a heading (setext) in a block quote',
    async function () {
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
        '> a\n> b\n> =\n'
      )
    }
  )

  await t.test(
    'should support html (flow) in a block quote',
    async function () {
      assert.equal(
        to({
          type: 'blockquote',
          children: [{type: 'html', value: '<div\nhidden>'}]
        }),
        '> <div\n> hidden>\n'
      )
    }
  )

  await t.test(
    'should support html (text) in a block quote',
    async function () {
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
        '> a <span\n> hidden>\n> b\n'
      )
    }
  )

  await t.test(
    'should support an image (resource) in a block quote',
    async function () {
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
        '> a\n> ![d\n> e](<b&#xA;c> "f\n> g")\n> h\n'
      )
    }
  )

  await t.test(
    'should support an image (reference) in a block quote',
    async function () {
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
        '> a\n> ![b\n> c][d\n> e]\n> g\n'
      )
    }
  )

  await t.test(
    'should support a link (resource) in a block quote',
    async function () {
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
        '> a\n> [d\n> e](<b&#xA;c> "f\n> g")\n> h\n'
      )
    }
  )

  await t.test(
    'should support a link (reference) in a block quote',
    async function () {
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
        '> a\n> [b\n> c][d\n> e]\n> g\n'
      )
    }
  )

  await t.test('should support a list in a block quote', async function () {
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
      '> a\n> b\n>\n> -   c\n>     d\n>\n> -   ***\n>\n> -   e\n>     f\n'
    )
  })

  await t.test('should support a strong in a block quote', async function () {
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
      '> a\n> **c\n> d**\n> d\n'
    )
  })

  await t.test(
    'should support a thematic break in a block quote',
    async function () {
      assert.equal(
        to({
          type: 'blockquote',
          children: [{type: 'thematicBreak'}, {type: 'thematicBreak'}]
        }),
        '> ***\n>\n> ***\n'
      )
    }
  )
})

test('break', async function (t) {
  await t.test('should support a break', async function () {
    assert.equal(to({type: 'break'}), '\\\n')
  })

  await t.test(
    'should serialize breaks in heading (atx) as a space',
    async function () {
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
        '### a b\n'
      )
    }
  )

  await t.test(
    'should serialize breaks in heading (atx) as a space',
    async function () {
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
        '### a b\n'
      )
    }
  )

  await t.test(
    'should serialize breaks in heading (setext)',
    async function () {
      assert.equal(to(from('a  \nb\n=\n'), {setext: true}), 'a\\\nb\n=\n')
    }
  )
})

test('code (flow)', async function (t) {
  await t.test('should support empty code', async function () {
    // @ts-expect-error: check how the runtime handles `value` missing.
    assert.equal(to({type: 'code'}), '```\n```\n')
  })

  await t.test(
    'should throw on when given an incorrect `fence`',
    async function () {
      assert.throws(function () {
        // @ts-expect-error: check how the runtime handles an incorrect `fence` marker.
        to({type: 'code', value: ''}, {fence: '+'})
      }, /Cannot serialize code with `\+` for `options\.fence`, expected `` ` `` or `~`/)
    }
  )

  await t.test('should support code w/ a value (indent)', async function () {
    assert.equal(to({type: 'code', value: 'a'}), '    a\n')
  })

  await t.test('should support code w/ a value (fences)', async function () {
    assert.equal(
      to({type: 'code', value: 'a'}, {fences: true}),
      '```\na\n```\n'
    )
  })

  await t.test('should support code w/ a lang', async function () {
    assert.equal(to({type: 'code', lang: 'a', value: ''}), '```a\n```\n')
  })

  await t.test(
    'should support (ignore) code w/ only a meta',
    async function () {
      assert.equal(to({type: 'code', meta: 'a', value: ''}), '```\n```\n')
    }
  )

  await t.test('should support code w/ lang and meta', async function () {
    assert.equal(
      to({type: 'code', lang: 'a', meta: 'b', value: ''}),
      '```a b\n```\n'
    )
  })

  await t.test('should encode a space in `lang`', async function () {
    assert.equal(
      to({type: 'code', lang: 'a b', value: ''}),
      '```a&#x20;b\n```\n'
    )
  })

  await t.test('should encode a line ending in `lang`', async function () {
    assert.equal(
      to({type: 'code', lang: 'a\nb', value: ''}),
      '```a&#xA;b\n```\n'
    )
  })

  await t.test('should encode a grave accent in `lang`', async function () {
    assert.equal(
      to({type: 'code', lang: 'a`b', value: ''}),
      '```a&#x60;b\n```\n'
    )
  })

  await t.test('should escape a backslash in `lang`', async function () {
    assert.equal(
      to({type: 'code', lang: 'a\\-b', value: ''}),
      '```a\\\\-b\n```\n'
    )
  })

  await t.test('should not encode a space in `meta`', async function () {
    assert.equal(
      to({type: 'code', lang: 'x', meta: 'a b', value: ''}),
      '```x a b\n```\n'
    )
  })

  await t.test('should encode a line ending in `meta`', async function () {
    assert.equal(
      to({type: 'code', lang: 'x', meta: 'a\nb', value: ''}),
      '```x a&#xA;b\n```\n'
    )
  })

  await t.test('should encode a grave accent in `meta`', async function () {
    assert.equal(
      to({type: 'code', lang: 'x', meta: 'a`b', value: ''}),
      '```x a&#x60;b\n```\n'
    )
  })

  await t.test('should escape a backslash in `meta`', async function () {
    assert.equal(
      to({type: 'code', lang: 'x', meta: 'a\\-b', value: ''}),
      '```x a\\\\-b\n```\n'
    )
  })

  await t.test(
    'should support fenced code w/ tildes when `fence: "~"`',
    async function () {
      assert.equal(to({type: 'code', value: ''}, {fence: '~'}), '~~~\n~~~\n')
    }
  )

  await t.test(
    'should not encode a grave accent when using tildes for fences',
    async function () {
      assert.equal(
        to({type: 'code', lang: 'a`b', value: ''}, {fence: '~'}),
        '~~~a`b\n~~~\n'
      )
    }
  )

  await t.test(
    'should use more grave accents for fences if there are streaks of grave accents in the value (fences)',
    async function () {
      assert.equal(
        to({type: 'code', value: '```\nasd\n```'}, {fences: true}),
        '````\n```\nasd\n```\n````\n'
      )
    }
  )

  await t.test(
    'should use more tildes for fences if there are streaks of tildes in the value (fences)',
    async function () {
      assert.equal(
        to({type: 'code', value: '~~~\nasd\n~~~'}, {fence: '~', fences: true}),
        '~~~~\n~~~\nasd\n~~~\n~~~~\n'
      )
    }
  )

  await t.test('should use a fence if there is an info', async function () {
    assert.equal(to({type: 'code', lang: 'a', value: 'b'}), '```a\nb\n```\n')
  })

  await t.test(
    'should use a fence if there is only whitespace',
    async function () {
      assert.equal(to({type: 'code', value: ' '}), '```\n \n```\n')
    }
  )

  await t.test(
    'should use a fence if there first line is blank (void)',
    async function () {
      assert.equal(to({type: 'code', value: '\na'}), '```\n\na\n```\n')
    }
  )

  await t.test(
    'should use a fence if there first line is blank (filled)',
    async function () {
      assert.equal(to({type: 'code', value: ' \na'}), '```\n \na\n```\n')
    }
  )

  await t.test(
    'should use a fence if there last line is blank (void)',
    async function () {
      assert.equal(to({type: 'code', value: 'a\n'}), '```\na\n\n```\n')
    }
  )

  await t.test(
    'should use a fence if there last line is blank (filled)',
    async function () {
      assert.equal(to({type: 'code', value: 'a\n '}), '```\na\n \n```\n')
    }
  )

  await t.test(
    'should use an indent if the value is indented',
    async function () {
      assert.equal(
        to({type: 'code', value: '  a\n\n b'}),
        '      a\n\n     b\n'
      )
    }
  )
})

test('definition', async function (t) {
  await t.test('should support a definition w/o label', async function () {
    assert.equal(
      // @ts-expect-error: check how the runtime handles `identifier`, `url` missing.
      to({type: 'definition'}),
      '[]: <>\n'
    )
  })

  await t.test('should support a definition w/ label', async function () {
    assert.equal(
      // @ts-expect-error: check how the runtime handles `identifier` missing.
      to({type: 'definition', label: 'a', url: ''}),
      '[a]: <>\n'
    )
  })

  await t.test('should escape a backslash in `label`', async function () {
    assert.equal(
      // @ts-expect-error: check how the runtime handles `identifier` missing.
      to({type: 'definition', label: '\\', url: ''}),
      '[\\\\]: <>\n'
    )
  })

  await t.test(
    'should escape an opening bracket in `label`',
    async function () {
      assert.equal(
        // @ts-expect-error: check how the runtime handles `identifier` missing.
        to({type: 'definition', label: '[', url: ''}),
        '[\\[]: <>\n'
      )
    }
  )

  await t.test('should escape a closing bracket in `label`', async function () {
    assert.equal(
      // @ts-expect-error: check how the runtime handles `identifier` missing.
      to({type: 'definition', label: ']', url: ''}),
      '[\\]]: <>\n'
    )
  })

  await t.test('should support a definition w/ identifier', async function () {
    assert.equal(
      to({type: 'definition', identifier: 'a', url: ''}),
      '[a]: <>\n'
    )
  })

  await t.test('should escape a backslash in `identifier`', async function () {
    assert.equal(
      to({type: 'definition', identifier: '\\', url: ''}),
      '[\\\\]: <>\n'
    )
  })

  await t.test(
    'should escape an opening bracket in `identifier`',
    async function () {
      assert.equal(
        to({type: 'definition', identifier: '[', url: ''}),
        '[\\[]: <>\n'
      )
    }
  )

  await t.test(
    'should escape a closing bracket in `identifier`',
    async function () {
      assert.equal(
        to({type: 'definition', identifier: ']', url: ''}),
        '[\\]]: <>\n'
      )
    }
  )

  await t.test('should support a definition w/ url', async function () {
    assert.equal(
      to({type: 'definition', identifier: 'a', url: 'b'}),
      '[a]: b\n'
    )
  })

  await t.test(
    'should support a definition w/ enclosed url w/ whitespace in url',
    async function () {
      assert.equal(
        to({type: 'definition', identifier: 'a', url: 'b c'}),
        '[a]: <b c>\n'
      )
    }
  )

  await t.test(
    'should escape an opening angle bracket in `url` in an enclosed url',
    async function () {
      assert.equal(
        to({type: 'definition', identifier: 'a', url: 'b <c'}),
        '[a]: <b \\<c>\n'
      )
    }
  )

  await t.test(
    'should escape a closing angle bracket in `url` in an enclosed url',
    async function () {
      assert.equal(
        to({type: 'definition', identifier: 'a', url: 'b >c'}),
        '[a]: <b \\>c>\n'
      )
    }
  )

  await t.test(
    'should escape a backslash in `url` in an enclosed url',
    async function () {
      assert.equal(
        to({type: 'definition', identifier: 'a', url: 'b \\.c'}),
        '[a]: <b \\\\.c>\n'
      )
    }
  )

  await t.test(
    'should encode a line ending in `url` in an enclosed url',
    async function () {
      assert.equal(
        to({type: 'definition', identifier: 'a', url: 'b\nc'}),
        '[a]: <b&#xA;c>\n'
      )
    }
  )

  await t.test(
    'should encode a line ending in `url` in an enclosed url',
    async function () {
      assert.equal(
        to({type: 'definition', identifier: 'a', url: '\f'}),
        '[a]: <\f>\n'
      )
    }
  )

  await t.test(
    'should escape an opening paren in `url` in a raw url',
    async function () {
      assert.equal(
        to({type: 'definition', identifier: 'a', url: 'b(c'}),
        '[a]: b\\(c\n'
      )
    }
  )

  await t.test(
    'should escape a closing paren in `url` in a raw url',
    async function () {
      assert.equal(
        to({type: 'definition', identifier: 'a', url: 'b)c'}),
        '[a]: b\\)c\n'
      )
    }
  )

  await t.test(
    'should escape a backslash in `url` in a raw url',
    async function () {
      assert.equal(
        to({type: 'definition', identifier: 'a', url: 'b\\?c'}),
        '[a]: b\\\\?c\n'
      )
    }
  )

  await t.test('should support a definition w/ title', async function () {
    assert.equal(
      to({type: 'definition', identifier: 'a', url: '', title: 'b'}),
      '[a]: <> "b"\n'
    )
  })

  await t.test('should support a definition w/ url & title', async function () {
    assert.equal(
      to({type: 'definition', identifier: 'a', url: 'b', title: 'c'}),
      '[a]: b "c"\n'
    )
  })

  await t.test(
    'should escape a quote in `title` in a title',
    async function () {
      assert.equal(
        to({type: 'definition', identifier: 'a', url: '', title: '"'}),
        '[a]: <> "\\""\n'
      )
    }
  )

  await t.test(
    'should escape a backslash in `title` in a title',
    async function () {
      assert.equal(
        to({type: 'definition', identifier: 'a', url: '', title: '\\'}),
        '[a]: <> "\\\\"\n'
      )
    }
  )

  await t.test(
    'should support a definition w/ title when `quote: "\'"`',
    async function () {
      assert.equal(
        to(
          {type: 'definition', identifier: 'a', url: '', title: 'b'},
          {quote: "'"}
        ),
        "[a]: <> 'b'\n"
      )
    }
  )

  await t.test(
    'should escape a quote in `title` in a title when `quote: "\'"`',
    async function () {
      assert.equal(
        to(
          {type: 'definition', identifier: 'a', url: '', title: "'"},
          {quote: "'"}
        ),
        "[a]: <> '\\''\n"
      )
    }
  )

  await t.test(
    'should throw on when given an incorrect `quote`',
    async function () {
      assert.throws(function () {
        to(
          {type: 'definition', identifier: 'a', url: '', title: 'b'},
          // @ts-expect-error: check how the runtime handles an incorrect `quote`.
          {quote: '.'}
        )
      }, /Cannot serialize title with `\.` for `options\.quote`, expected `"`, or `'`/)
    }
  )
})

test('emphasis', async function (t) {
  await t.test('should support an empty emphasis', async function () {
    assert.equal(
      // @ts-expect-error: check how the runtime handles `children` missing.
      to({type: 'emphasis'}),
      '**\n'
    )
  })

  await t.test(
    'should throw on when given an incorrect `emphasis`',
    async function () {
      assert.throws(function () {
        // @ts-expect-error: check how the runtime handles incorrect `emphasis`.
        to({type: 'emphasis'}, {emphasis: '?'})
      }, /Cannot serialize emphasis with `\?` for `options\.emphasis`, expected `\*`, or `_`/)
    }
  )

  await t.test('should support an emphasis w/ children', async function () {
    assert.equal(
      to({type: 'emphasis', children: [{type: 'text', value: 'a'}]}),
      '*a*\n'
    )
  })

  await t.test(
    'should support an emphasis w/ underscores when `emphasis: "_"`',
    async function () {
      assert.equal(
        to(
          {type: 'emphasis', children: [{type: 'text', value: 'a'}]},
          {emphasis: '_'}
        ),
        '_a_\n'
      )
    }
  )
})

test('heading', async function (t) {
  await t.test(
    'should serialize a heading w/o rank as a heading of rank 1',
    async function () {
      assert.equal(
        // @ts-expect-error: check how the runtime handles `children` missing.
        to({type: 'heading'}),
        '#\n'
      )
    }
  )

  await t.test('should serialize a heading w/ rank 1', async function () {
    assert.equal(
      // @ts-expect-error: check how the runtime handles `children` missing.
      to({type: 'heading', depth: 1}),
      '#\n'
    )
  })

  await t.test('should serialize a heading w/ rank 6', async function () {
    assert.equal(to({type: 'heading', depth: 6, children: []}), '######\n')
  })

  await t.test('should serialize a heading w/ rank 7 as 6', async function () {
    assert.equal(
      to({
        type: 'heading',
        // @ts-expect-error: check how the runtime handles `depth` being too high.
        depth: 7,
        children: []
      }),
      '######\n'
    )
  })

  await t.test('should serialize a heading w/ rank 0 as 1', async function () {
    assert.equal(
      to({
        type: 'heading',
        // @ts-expect-error: check how the runtime handles `depth` being too low.
        depth: 0,
        children: []
      }),
      '#\n'
    )
  })

  await t.test('should serialize a heading w/ content', async function () {
    assert.equal(
      to({type: 'heading', depth: 1, children: [{type: 'text', value: 'a'}]}),
      '# a\n'
    )
  })

  await t.test(
    'should serialize a heading w/ rank 1 as setext when `setext: true`',
    async function () {
      assert.equal(
        to(
          {type: 'heading', depth: 1, children: [{type: 'text', value: 'a'}]},
          {setext: true}
        ),
        'a\n=\n'
      )
    }
  )

  await t.test(
    'should serialize a heading w/ rank 2 as setext when `setext: true`',
    async function () {
      assert.equal(
        to(
          {type: 'heading', depth: 2, children: [{type: 'text', value: 'a'}]},
          {setext: true}
        ),
        'a\n-\n'
      )
    }
  )

  await t.test(
    'should serialize a heading w/ rank 3 as atx when `setext: true`',
    async function () {
      assert.equal(
        to(
          {type: 'heading', depth: 3, children: [{type: 'text', value: 'a'}]},
          {setext: true}
        ),
        '### a\n'
      )
    }
  )

  await t.test(
    'should serialize a setext underline as long as the last line (1)',
    async function () {
      assert.equal(
        to(
          {
            type: 'heading',
            depth: 2,
            children: [{type: 'text', value: 'aa\rb'}]
          },
          {setext: true}
        ),
        'aa\rb\n-\n'
      )
    }
  )

  await t.test(
    'should serialize a setext underline as long as the last line (2)',
    async function () {
      assert.equal(
        to(
          {
            type: 'heading',
            depth: 1,
            children: [{type: 'text', value: 'a\r\nbbb'}]
          },
          {setext: true}
        ),
        'a\r\nbbb\n===\n'
      )
    }
  )

  await t.test(
    'should serialize an empty heading w/ rank 1 as atx when `setext: true`',
    async function () {
      assert.equal(
        to({type: 'heading', depth: 1, children: []}, {setext: true}),
        '#\n'
      )
    }
  )

  await t.test(
    'should serialize an empty heading w/ rank 2 as atx when `setext: true`',
    async function () {
      assert.equal(
        to({type: 'heading', depth: 2, children: []}, {setext: true}),
        '##\n'
      )
    }
  )

  await t.test(
    'should serialize an heading w/ rank 1 and code w/ a line ending as setext',
    async function () {
      assert.equal(
        to({
          type: 'heading',
          depth: 1,
          children: [{type: 'inlineCode', value: '\n'}]
        }),
        '`\n`\n=\n'
      )
    }
  )

  await t.test(
    'should serialize an heading w/ rank 1 and html w/ a line ending as setext',
    async function () {
      assert.equal(
        to({
          type: 'heading',
          depth: 1,
          children: [{type: 'html', value: '<a\n/>'}]
        }),
        '<a\n/>\n==\n'
      )
    }
  )

  await t.test(
    'should serialize an heading w/ rank 1 and text w/ a line ending as setext',
    async function () {
      assert.equal(
        to({
          type: 'heading',
          depth: 1,
          children: [{type: 'text', value: 'a\nb'}]
        }),
        'a\nb\n=\n'
      )
    }
  )

  await t.test(
    'should serialize an heading w/ rank 1 and a break as setext',
    async function () {
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
        'a\\\nb\n=\n'
      )
    }
  )

  await t.test(
    'should serialize a heading with a closing sequence when `closeAtx` (empty)',
    async function () {
      assert.equal(
        to({type: 'heading', depth: 1, children: []}, {closeAtx: true}),
        '# #\n'
      )
    }
  )

  await t.test(
    'should serialize a with a closing sequence when `closeAtx` (content)',
    async function () {
      assert.equal(
        to(
          {type: 'heading', depth: 3, children: [{type: 'text', value: 'a'}]},
          {closeAtx: true}
        ),
        '### a ###\n'
      )
    }
  )

  await t.test(
    'should not escape a `#` at the start of phrasing in a heading',
    async function () {
      assert.equal(
        to({
          type: 'heading',
          depth: 2,
          children: [{type: 'text', value: '# a'}]
        }),
        '## # a\n'
      )
    }
  )

  await t.test(
    'should not escape a `1)` at the start of phrasing in a heading',
    async function () {
      assert.equal(
        to({
          type: 'heading',
          depth: 2,
          children: [{type: 'text', value: '1) a'}]
        }),
        '## 1) a\n'
      )
    }
  )

  await t.test(
    'should not escape a `+` at the start of phrasing in a heading',
    async function () {
      assert.equal(
        to({
          type: 'heading',
          depth: 2,
          children: [{type: 'text', value: '+ a'}]
        }),
        '## + a\n'
      )
    }
  )

  await t.test(
    'should not escape a `-` at the start of phrasing in a heading',
    async function () {
      assert.equal(
        to({
          type: 'heading',
          depth: 2,
          children: [{type: 'text', value: '- a'}]
        }),
        '## - a\n'
      )
    }
  )

  await t.test(
    'should not escape a `=` at the start of phrasing in a heading',
    async function () {
      assert.equal(
        to({
          type: 'heading',
          depth: 2,
          children: [{type: 'text', value: '= a'}]
        }),
        '## = a\n'
      )
    }
  )

  await t.test(
    'should not escape a `>` at the start of phrasing in a heading',
    async function () {
      assert.equal(
        to({
          type: 'heading',
          depth: 2,
          children: [{type: 'text', value: '> a'}]
        }),
        '## > a\n'
      )
    }
  )

  await t.test(
    'should escape a `#` at the end of a heading (1)',
    async function () {
      assert.equal(
        to({
          type: 'heading',
          depth: 1,
          children: [{type: 'text', value: 'a #'}]
        }),
        '# a \\#\n'
      )
    }
  )

  await t.test(
    'should escape a `#` at the end of a heading (2)',
    async function () {
      assert.equal(
        to({
          type: 'heading',
          depth: 1,
          children: [{type: 'text', value: 'a ##'}]
        }),
        '# a #\\#\n'
      )
    }
  )

  await t.test('should not escape a `#` in a heading (2)', async function () {
    assert.equal(
      to({
        type: 'heading',
        depth: 1,
        children: [{type: 'text', value: 'a # b'}]
      }),
      '# a # b\n'
    )
  })

  await t.test(
    'should encode a space at the start of an atx heading',
    async function () {
      assert.equal(
        to({
          type: 'heading',
          depth: 1,
          children: [{type: 'text', value: '  a'}]
        }),
        '# &#x20; a\n'
      )
    }
  )

  await t.test(
    'should encode a tab at the start of an atx heading',
    async function () {
      assert.equal(
        to({
          type: 'heading',
          depth: 1,
          children: [{type: 'text', value: '\t\ta'}]
        }),
        '# &#x9;\ta\n'
      )
    }
  )

  await t.test(
    'should encode a space at the end of an atx heading',
    async function () {
      assert.equal(
        to({
          type: 'heading',
          depth: 1,
          children: [{type: 'text', value: 'a  '}]
        }),
        '# a &#x20;\n'
      )
    }
  )

  await t.test(
    'should encode a tab at the end of an atx heading',
    async function () {
      assert.equal(
        to({
          type: 'heading',
          depth: 1,
          children: [{type: 'text', value: 'a\t\t'}]
        }),
        '# a\t&#x9;\n'
      )
    }
  )

  await t.test(
    'should encode spaces around a line ending in a setext heading',
    async function () {
      assert.equal(
        to({
          type: 'heading',
          depth: 1,
          children: [{type: 'text', value: 'a \n b'}]
        }),
        'a&#x20;\n&#x20;b\n=======\n'
      )
    }
  )

  await t.test(
    'should not need to encode spaces around a line ending in an atx heading (because the line ending is encoded)',
    async function () {
      assert.equal(
        to({
          type: 'heading',
          depth: 3,
          children: [{type: 'text', value: 'a \n b'}]
        }),
        '### a &#xA; b\n'
      )
    }
  )
})

test('html', async function (t) {
  await t.test('should support a void html', async function () {
    // @ts-expect-error: check how the runtime handles `value` missing
    assert.equal(to({type: 'html'}), '')
  })

  await t.test('should support an empty html', async function () {
    assert.equal(to({type: 'html', value: ''}), '')
  })

  await t.test('should support html', async function () {
    assert.equal(to({type: 'html', value: 'a\nb'}), 'a\nb\n')
  })

  await t.test(
    'should prevent html (text) from becoming html (flow) (1)',
    async function () {
      assert.equal(
        to({
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a\n'},
            {type: 'html', value: '<div>'}
          ]
        }),
        'a <div>\n'
      )
    }
  )

  await t.test(
    'should prevent html (text) from becoming html (flow) (2)',
    async function () {
      assert.equal(
        to({
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a\r'},
            {type: 'html', value: '<div>'}
          ]
        }),
        'a <div>\n'
      )
    }
  )

  await t.test(
    'should prevent html (text) from becoming html (flow) (3)',
    async function () {
      assert.equal(
        to({
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a\r\n'},
            {type: 'html', value: '<div>'}
          ]
        }),
        'a <div>\n'
      )
    }
  )

  await t.test('should serialize html (text)', async function () {
    assert.equal(
      to({
        type: 'paragraph',
        children: [
          {type: 'html', value: '<x>'},
          {type: 'text', value: 'a'}
        ]
      }),
      '<x>a\n'
    )
  })
})

test('image', async function (t) {
  await t.test('should support an image', async function () {
    // @ts-expect-error: check how the runtime handles `alt`, `url` missing.
    assert.equal(to({type: 'image'}), '![]()\n')
  })

  await t.test('should support `alt`', async function () {
    assert.equal(
      // @ts-expect-error: check how the runtime handles `url` missing.
      to({type: 'image', alt: 'a'}),
      '![a]()\n'
    )
  })

  await t.test('should support a url', async function () {
    assert.equal(to({type: 'image', url: 'a'}), '![](a)\n')
  })

  await t.test('should support a title', async function () {
    assert.equal(to({type: 'image', url: '', title: 'a'}), '![](<> "a")\n')
  })

  await t.test('should support a url and title', async function () {
    assert.equal(to({type: 'image', url: 'a', title: 'b'}), '![](a "b")\n')
  })

  await t.test(
    'should support an image w/ enclosed url w/ whitespace in url',
    async function () {
      assert.equal(to({type: 'image', url: 'b c'}), '![](<b c>)\n')
    }
  )

  await t.test(
    'should escape an opening angle bracket in `url` in an enclosed url',
    async function () {
      assert.equal(to({type: 'image', url: 'b <c'}), '![](<b \\<c>)\n')
    }
  )

  await t.test(
    'should escape a closing angle bracket in `url` in an enclosed url',
    async function () {
      assert.equal(to({type: 'image', url: 'b >c'}), '![](<b \\>c>)\n')
    }
  )

  await t.test(
    'should escape a backslash in `url` in an enclosed url',
    async function () {
      assert.equal(to({type: 'image', url: 'b \\+c'}), '![](<b \\\\+c>)\n')
    }
  )

  await t.test(
    'should encode a line ending in `url` in an enclosed url',
    async function () {
      assert.equal(to({type: 'image', url: 'b\nc'}), '![](<b&#xA;c>)\n')
    }
  )

  await t.test(
    'should escape an opening paren in `url` in a raw url',
    async function () {
      assert.equal(to({type: 'image', url: 'b(c'}), '![](b\\(c)\n')
    }
  )

  await t.test(
    'should escape a closing paren in `url` in a raw url',
    async function () {
      assert.equal(to({type: 'image', url: 'b)c'}), '![](b\\)c)\n')
    }
  )

  await t.test(
    'should escape a backslash in `url` in a raw url',
    async function () {
      assert.equal(to({type: 'image', url: 'b\\+c'}), '![](b\\\\+c)\n')
    }
  )

  await t.test(
    'should support control characters in images',
    async function () {
      assert.equal(to({type: 'image', url: '\f'}), '![](<\f>)\n')
    }
  )

  await t.test('should escape a double quote in `title`', async function () {
    assert.equal(
      to({type: 'image', url: '', title: 'b"c'}),
      '![](<> "b\\"c")\n'
    )
  })

  await t.test('should escape a backslash in `title`', async function () {
    assert.equal(
      to({type: 'image', url: '', title: 'b\\.c'}),
      '![](<> "b\\\\.c")\n'
    )
  })

  await t.test(
    'should support an image w/ title when `quote: "\'"`',
    async function () {
      assert.equal(
        to({type: 'image', url: '', title: 'b'}, {quote: "'"}),
        "![](<> 'b')\n"
      )
    }
  )

  await t.test(
    'should escape a quote in `title` in a title when `quote: "\'"`',
    async function () {
      assert.equal(
        to({type: 'image', url: '', title: "'"}, {quote: "'"}),
        "![](<> '\\'')\n"
      )
    }
  )

  await t.test(
    'should throw on when given an incorrect `quote`',
    async function () {
      assert.throws(function () {
        // @ts-expect-error: check how the runtime handles `quote` being wrong.
        to({type: 'image', title: 'a'}, {quote: '.'})
      }, /Cannot serialize title with `\.` for `options\.quote`, expected `"`, or `'`/)
    }
  )
})

test('imageReference', async function (t) {
  await t.test(
    'should support a link reference (nonsensical)',
    async function () {
      assert.equal(
        // @ts-expect-error: check how the runtime handles `alt`, `referenceType`, `identifier` missing.
        to({type: 'imageReference'}),
        '![][]\n'
      )
    }
  )

  await t.test('should support `alt`', async function () {
    assert.equal(
      // @ts-expect-error: check how the runtime handles `referenceType`, `identifier` missing.
      to({type: 'imageReference', alt: 'a'}),
      '![a][]\n'
    )
  })

  await t.test(
    'should support an `identifier` (nonsensical)',
    async function () {
      assert.equal(
        // @ts-expect-error: check how the runtime handles `alt`, `referenceType` missing.
        to({type: 'imageReference', identifier: 'a'}),
        '![][a]\n'
      )
    }
  )

  await t.test('should support a `label` (nonsensical)', async function () {
    assert.equal(
      // @ts-expect-error: check how the runtime handles `referenceType`, `identifier` missing.
      to({type: 'imageReference', label: 'a'}),
      '![][a]\n'
    )
  })

  await t.test('should support `referenceType: "shortcut"`', async function () {
    assert.equal(
      to({
        type: 'imageReference',
        alt: 'A',
        identifier: 'A',
        referenceType: 'shortcut'
      }),
      '![A]\n'
    )
  })

  await t.test(
    'should support `referenceType: "collapsed"`',
    async function () {
      assert.equal(
        to({
          type: 'imageReference',
          alt: 'A',
          identifier: 'A',
          referenceType: 'collapsed'
        }),
        '![A][]\n'
      )
    }
  )

  await t.test(
    'should support `referenceType: "full"` (default)',
    async function () {
      assert.equal(
        to({
          type: 'imageReference',
          alt: 'A',
          identifier: 'A',
          referenceType: 'full'
        }),
        '![A][A]\n'
      )
    }
  )

  await t.test('should prefer label over identifier', async function () {
    assert.equal(
      to({
        type: 'imageReference',
        alt: '&',
        label: '&',
        identifier: '&amp;',
        referenceType: 'full'
      }),
      '![&][&]\n'
    )
  })

  await t.test('should decode `identifier` if w/o `label`', async function () {
    assert.equal(
      to({
        type: 'imageReference',
        alt: '&',
        identifier: '&amp;',
        referenceType: 'full'
      }),
      '![&][&]\n'
    )
  })

  await t.test(
    'should support incorrect character references',
    async function () {
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
        '![\\&a;][&b;]\n'
      )
    }
  )

  await t.test(
    'should unescape `identifier` if w/o `label`',
    async function () {
      assert.equal(
        to({
          type: 'imageReference',
          alt: '+',
          identifier: '\\+',
          referenceType: 'full'
        }),
        '![+][+]\n'
      )
    }
  )

  await t.test(
    'should use a collapsed reference if w/o `referenceType` and the label matches the reference',
    async function () {
      assert.equal(
        // @ts-expect-error: check how the runtime handles `referenceType` missing.
        to({type: 'imageReference', alt: 'a', identifier: 'a'}),
        '![a][]\n'
      )
    }
  )

  await t.test(
    'should use a full reference if w/o `referenceType` and the label does not match the reference',
    async function () {
      assert.equal(
        // @ts-expect-error: check how the runtime handles `referenceType` missing.
        to({type: 'imageReference', alt: 'a', identifier: 'b'}),
        '![a][b]\n'
      )
    }
  )
})

test('code (text)', async function (t) {
  await t.test('should support an empty code text', async function () {
    assert.equal(
      // @ts-expect-error: check how the runtime handles `value` missing.
      to({type: 'inlineCode'}),
      '``\n'
    )
  })

  await t.test('should support a code text', async function () {
    assert.equal(to({type: 'inlineCode', value: 'a'}), '`a`\n')
  })

  await t.test('should support a space', async function () {
    assert.equal(to({type: 'inlineCode', value: ' '}), '` `\n')
  })

  await t.test('should support an eol', async function () {
    assert.equal(to({type: 'inlineCode', value: '\n'}), '`\n`\n')
  })

  await t.test('should support several spaces', async function () {
    assert.equal(to({type: 'inlineCode', value: '  '}), '`  `\n')
  })

  await t.test(
    'should use a fence of two grave accents if the value contains one',
    async function () {
      assert.equal(to({type: 'inlineCode', value: 'a`b'}), '``a`b``\n')
    }
  )

  await t.test(
    'should use a fence of one grave accent if the value contains two',
    async function () {
      assert.equal(to({type: 'inlineCode', value: 'a``b'}), '`a``b`\n')
    }
  )

  await t.test(
    'should use a fence of three grave accents if the value contains two and one',
    async function () {
      assert.equal(to({type: 'inlineCode', value: 'a``b`c'}), '```a``b`c```\n')
    }
  )

  await t.test(
    'should pad w/ a space if the value starts w/ a grave accent',
    async function () {
      assert.equal(to({type: 'inlineCode', value: '`a'}), '`` `a ``\n')
    }
  )

  await t.test(
    'should pad w/ a space if the value ends w/ a grave accent',
    async function () {
      assert.equal(to({type: 'inlineCode', value: 'a`'}), '`` a` ``\n')
    }
  )

  await t.test(
    'should pad w/ a space if the value starts and ends w/ a space',
    async function () {
      assert.equal(to({type: 'inlineCode', value: ' a '}), '`  a  `\n')
    }
  )

  await t.test(
    'should not pad w/ spaces if the value ends w/ a non-space',
    async function () {
      assert.equal(to({type: 'inlineCode', value: ' a'}), '` a`\n')
    }
  )

  await t.test(
    'should not pad w/ spaces if the value starts w/ a non-space',
    async function () {
      assert.equal(to({type: 'inlineCode', value: 'a '}), '`a `\n')
    }
  )

  await t.test('should prevent breaking out of code (-)', async function () {
    assert.equal(to({type: 'inlineCode', value: 'a\n- b'}), '`a - b`\n')
  })

  await t.test('should prevent breaking out of code (#)', async function () {
    assert.equal(to({type: 'inlineCode', value: 'a\n#'}), '`a #`\n')
  })

  await t.test(
    'should prevent breaking out of code (\\d\\.)',
    async function () {
      assert.equal(to({type: 'inlineCode', value: 'a\n1. '}), '`a 1. `\n')
    }
  )

  await t.test('should prevent breaking out of code (cr)', async function () {
    assert.equal(to({type: 'inlineCode', value: 'a\r- b'}), '`a - b`\n')
  })

  await t.test('should prevent breaking out of code (crlf)', async function () {
    assert.equal(to({type: 'inlineCode', value: 'a\r\n- b'}), '`a - b`\n')
  })
})

test('link', async function (t) {
  await t.test('should support a link', async function () {
    // @ts-expect-error: check how the runtime handles `children`, `url` missing.
    assert.equal(to({type: 'link'}), '[]()\n')
  })

  await t.test('should support children', async function () {
    assert.equal(
      // @ts-expect-error: check how the runtime handles `url` missing.
      to({type: 'link', children: [{type: 'text', value: 'a'}]}),
      '[a]()\n'
    )
  })

  await t.test('should support a url', async function () {
    assert.equal(to({type: 'link', url: 'a', children: []}), '[](a)\n')
  })

  await t.test('should support a title', async function () {
    assert.equal(
      to({type: 'link', url: '', title: 'a', children: []}),
      '[](<> "a")\n'
    )
  })

  await t.test('should support a url and title', async function () {
    assert.equal(
      to({type: 'link', url: 'a', title: 'b', children: []}),
      '[](a "b")\n'
    )
  })

  await t.test(
    'should support a link w/ enclosed url w/ whitespace in url',
    async function () {
      assert.equal(to({type: 'link', url: 'b c', children: []}), '[](<b c>)\n')
    }
  )

  await t.test(
    'should escape an opening angle bracket in `url` in an enclosed url',
    async function () {
      assert.equal(
        to({type: 'link', url: 'b <c', children: []}),
        '[](<b \\<c>)\n'
      )
    }
  )

  await t.test(
    'should escape a closing angle bracket in `url` in an enclosed url',
    async function () {
      assert.equal(
        to({type: 'link', url: 'b >c', children: []}),
        '[](<b \\>c>)\n'
      )
    }
  )

  await t.test(
    'should escape a backslash in `url` in an enclosed url',
    async function () {
      assert.equal(
        to({type: 'link', url: 'b \\+c', children: []}),
        '[](<b \\\\+c>)\n'
      )
    }
  )

  await t.test(
    'should encode a line ending in `url` in an enclosed url',
    async function () {
      assert.equal(
        to({type: 'link', url: 'b\nc', children: []}),
        '[](<b&#xA;c>)\n'
      )
    }
  )

  await t.test(
    'should escape an opening paren in `url` in a raw url',
    async function () {
      assert.equal(to({type: 'link', url: 'b(c', children: []}), '[](b\\(c)\n')
    }
  )

  await t.test(
    'should escape a closing paren in `url` in a raw url',
    async function () {
      assert.equal(to({type: 'link', url: 'b)c', children: []}), '[](b\\)c)\n')
    }
  )

  await t.test(
    'should escape a backslash in `url` in a raw url',
    async function () {
      assert.equal(
        to({type: 'link', url: 'b\\.c', children: []}),
        '[](b\\\\.c)\n'
      )
    }
  )

  await t.test('should support control characters in links', async function () {
    assert.equal(to({type: 'link', url: '\f', children: []}), '[](<\f>)\n')
  })

  await t.test('should escape a double quote in `title`', async function () {
    assert.equal(
      to({type: 'link', url: '', title: 'b"c', children: []}),
      '[](<> "b\\"c")\n'
    )
  })

  await t.test('should escape a backslash in `title`', async function () {
    assert.equal(
      to({type: 'link', url: '', title: 'b\\-c', children: []}),
      '[](<> "b\\\\-c")\n'
    )
  })

  await t.test(
    'should use an autolink for nodes w/ a value similar to the url and a protocol',
    async function () {
      assert.equal(
        to({
          type: 'link',
          url: 'tel:123',
          children: [{type: 'text', value: 'tel:123'}]
        }),
        '<tel:123>\n'
      )
    }
  )

  await t.test(
    'should use a resource link (`resourceLink: true`)',
    async function () {
      assert.equal(
        to(
          {
            type: 'link',
            url: 'tel:123',
            children: [{type: 'text', value: 'tel:123'}]
          },
          {resourceLink: true}
        ),
        '[tel:123](tel:123)\n'
      )
    }
  )

  await t.test(
    'should use a normal link for nodes w/ a value similar to the url w/o a protocol',
    async function () {
      assert.equal(
        to({
          type: 'link',
          url: 'a',
          children: [{type: 'text', value: 'a'}]
        }),
        '[a](a)\n'
      )
    }
  )

  await t.test(
    'should use an autolink for nodes w/ a value similar to the url and a protocol',
    async function () {
      assert.equal(
        to({
          type: 'link',
          url: 'tel:123',
          children: [{type: 'text', value: 'tel:123'}]
        }),
        '<tel:123>\n'
      )
    }
  )

  await t.test(
    'should use a normal link for nodes w/ a value similar to the url w/ a title',
    async function () {
      assert.equal(
        to({
          type: 'link',
          url: 'tel:123',
          title: 'a',
          children: [{type: 'text', value: 'tel:123'}]
        }),
        '[tel:123](tel:123 "a")\n'
      )
    }
  )

  await t.test(
    'should use an autolink for nodes w/ a value similar to the url and a protocol (email)',
    async function () {
      assert.equal(
        to({
          type: 'link',
          url: 'mailto:a@b.c',
          children: [{type: 'text', value: 'a@b.c'}]
        }),
        '<a@b.c>\n'
      )
    }
  )

  await t.test('should not escape in autolinks', async function () {
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
      '<a.b-c_d@a.b>\n'
    )
  })

  await t.test(
    'should support a link w/ title when `quote: "\'"`',
    async function () {
      assert.equal(
        to({type: 'link', url: '', title: 'b', children: []}, {quote: "'"}),
        "[](<> 'b')\n"
      )
    }
  )

  await t.test(
    'should escape a quote in `title` in a title when `quote: "\'"`',
    async function () {
      assert.equal(
        to({type: 'link', url: '', title: "'", children: []}, {quote: "'"}),
        "[](<> '\\'')\n"
      )
    }
  )

  await t.test(
    'should not escape unneeded characters in a `destinationLiteral`',
    async function () {
      assert.equal(
        to({type: 'link', url: 'a b![c](d*e_f[g_h`i', children: []}),
        '[](<a b![c](d*e_f[g_h`i>)\n'
      )
    }
  )

  await t.test(
    'should not escape unneeded characters in a `destinationRaw`',
    async function () {
      assert.equal(
        to({type: 'link', url: 'a![b](c*d_e[f_g`h<i</j', children: []}),
        '[](a![b]\\(c*d_e[f_g`h<i</j)\n'
      )
    }
  )

  await t.test(
    'should not escape unneeded characters in a `title` (double quotes)',
    async function () {
      assert.equal(
        to({
          type: 'link',
          url: '#',
          title: 'a![b](c*d_e[f_g`h<i</j',
          children: []
        }),
        '[](# "a![b](c*d_e[f_g`h<i</j")\n'
      )
    }
  )

  await t.test(
    'should not escape unneeded characters in a `title` (single quotes)',
    async function () {
      assert.equal(
        to(
          {
            type: 'link',
            url: '#',
            title: 'a![b](c*d_e[f_g`h<i</j',
            children: []
          },
          {quote: "'"}
        ),
        "[](# 'a![b](c*d_e[f_g`h<i</j')\n"
      )
    }
  )

  await t.test(
    'should throw on when given an incorrect `quote`',
    async function () {
      assert.throws(function () {
        // @ts-expect-error: check how the runtime handles `quote` being wrong.
        to({type: 'link', title: 'b'}, {quote: '.'})
      }, /Cannot serialize title with `\.` for `options\.quote`, expected `"`, or `'`/)
    }
  )
})

test('linkReference', async function (t) {
  await t.test(
    'should support a link reference (nonsensical)',
    async function () {
      assert.equal(
        // @ts-expect-error: check how the runtime handles `children`, `referenceType`, `identifier` missing.
        to({type: 'linkReference'}),
        '[][]\n'
      )
    }
  )

  await t.test('should support `children`', async function () {
    assert.equal(
      // @ts-expect-error: check how the runtime handles `referenceType`, `identifier` missing.
      to({type: 'linkReference', children: [{type: 'text', value: 'a'}]}),
      '[a][]\n'
    )
  })

  await t.test(
    'should support an `identifier` (nonsensical)',
    async function () {
      assert.equal(
        // @ts-expect-error: check how the runtime handles `referenceType` missing.
        to({type: 'linkReference', identifier: 'a', children: []}),
        '[][a]\n'
      )
    }
  )

  await t.test('should support a `label` (nonsensical)', async function () {
    assert.equal(
      // @ts-expect-error: check how the runtime handles `children`, `referenceType`, `identifier` missing.
      to({type: 'linkReference', label: 'a'}),
      '[][a]\n'
    )
  })

  await t.test('should support `referenceType: "shortcut"`', async function () {
    assert.equal(
      to({
        type: 'linkReference',
        children: [{type: 'text', value: 'A'}],
        identifier: 'A',
        referenceType: 'shortcut'
      }),
      '[A]\n'
    )
  })

  await t.test(
    'should support `referenceType: "collapsed"`',
    async function () {
      assert.equal(
        to({
          type: 'linkReference',
          children: [{type: 'text', value: 'A'}],
          label: 'A',
          identifier: 'a',
          referenceType: 'collapsed'
        }),
        '[A][]\n'
      )
    }
  )

  await t.test(
    'should support `referenceType: "full"` (default)',
    async function () {
      assert.equal(
        to({
          type: 'linkReference',
          children: [{type: 'text', value: 'A'}],
          label: 'A',
          identifier: 'a',
          referenceType: 'full'
        }),
        '[A][A]\n'
      )
    }
  )

  await t.test('should prefer label over identifier', async function () {
    assert.equal(
      to({
        type: 'linkReference',
        children: [{type: 'text', value: '&'}],
        label: '&',
        identifier: '&amp;',
        referenceType: 'full'
      }),
      '[&][&]\n'
    )
  })

  await t.test('should decode `identifier` if w/o `label`', async function () {
    assert.equal(
      to({
        type: 'linkReference',
        children: [{type: 'text', value: '&'}],
        identifier: '&amp;',
        referenceType: 'full'
      }),
      '[&][&]\n'
    )
  })

  await t.test(
    'should support incorrect character references',
    async function () {
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
        '[\\&a;][&b;]\n'
      )
    }
  )

  await t.test(
    'should not escape unneeded characters in a `reference`',
    async function () {
      assert.equal(
        to({
          type: 'linkReference',
          identifier: 'a![b](c*d_e[f_g`h<i</j',
          referenceType: 'full',
          children: []
        }),
        '[][a!\\[b\\](c*d_e\\[f_g`h<i</j]\n'
      )
    }
  )

  await t.test(
    'should unescape `identifier` if w/o `label`',
    async function () {
      assert.equal(
        to({
          type: 'linkReference',
          children: [{type: 'text', value: '+'}],
          identifier: '\\+',
          referenceType: 'full'
        }),
        '[+][+]\n'
      )
    }
  )

  await t.test(
    'should use a collapsed reference if w/o `referenceType` and the label matches the reference',
    async function () {
      assert.equal(
        // @ts-expect-error: check how the runtime handles `referenceType` missing.
        to({
          type: 'linkReference',
          children: [{type: 'text', value: 'a'}],
          label: 'a',
          identifier: 'a'
        }),
        '[a][]\n'
      )
    }
  )

  await t.test(
    'should use a full reference if w/o `referenceType` and the label does not match the reference',
    async function () {
      assert.equal(
        // @ts-expect-error: check how the runtime handles `referenceType` missing.
        to({
          type: 'linkReference',
          children: [{type: 'text', value: 'a'}],
          label: 'b',
          identifier: 'b'
        }),
        '[a][b]\n'
      )
    }
  )

  await t.test(
    'should use a full reference if w/o `referenceType` and the label does not match the reference',
    async function () {
      assert.equal(
        to({
          type: 'paragraph',
          children: [
            // @ts-expect-error: check how the runtime handles `referenceType` missing.
            {
              type: 'linkReference',
              identifier: '',
              children: [{type: 'text', value: 'a'}]
            },
            {type: 'text', value: '(b)'}
          ]
        }),
        '[a][]\\(b)\n'
      )
    }
  )
})

test('list', async function (t) {
  await t.test('should support an empty list', async function () {
    // @ts-expect-error: check how the runtime handles `children` missing.
    assert.equal(to({type: 'list'}), '')
  })

  await t.test('should support a list w/ an item', async function () {
    assert.equal(
      // @ts-expect-error: check how the runtime handles `children` in item missing.
      to({type: 'list', children: [{type: 'listItem'}]}),
      '*\n'
    )
  })

  await t.test('should support a list w/ items', async function () {
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
      '-   a\n\n-   ***\n\n-   b\n'
    )
  })

  await t.test(
    'should not use blank lines between items for lists w/ `spread: false`',
    async function () {
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
        '-   a\n-   ***\n'
      )
    }
  )

  await t.test(
    'should support a list w/ `spread: false`, w/ a spread item',
    async function () {
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
        '-   a\n\n    b\n-   ***\n'
      )
    }
  )

  await t.test(
    'should support a list w/ `ordered` and an empty item',
    async function () {
      assert.equal(
        to({
          type: 'list',
          ordered: true,
          children: [{type: 'listItem', children: []}]
        }),
        '1.\n'
      )
    }
  )

  await t.test('should support a list w/ `ordered`', async function () {
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
      '1.  a\n\n2.  ***\n\n3.  b\n'
    )
  })

  await t.test(
    'should support a list w/ `ordered` and `spread: false`',
    async function () {
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
        '1.  a\n2.  ***\n3.  b\n'
      )
    }
  )

  await t.test(
    'should support a list w/ `ordered` when `incrementListMarker: false`',
    async function () {
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
        '1.  a\n1.  ***\n1.  b\n'
      )
    }
  )

  await t.test(
    'should support a list w/ `ordered` and `start`',
    async function () {
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
        '0. a\n\n1. ***\n'
      )
    }
  )

  await t.test(
    'should support a correct prefix and indent `listItemIndent: "mixed"` and a tight list',
    async function () {
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
        '* a\n  b\n* c\n  d\n'
      )
    }
  )

  await t.test(
    'should support a correct prefix and indent `listItemIndent: "mixed"` and a tight list',
    async function () {
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
        '*   a\n    b\n\n*   c\n    d\n'
      )
    }
  )

  await t.test(
    'should support a correct prefix and indent for items 9 and 10 when `listItemIndent: "one"`',
    async function () {
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
        '9. a\n   b\n10. c\n    d\n'
      )
    }
  )

  await t.test(
    'should support a correct prefix and indent for items 99 and 100 when `listItemIndent: "one"`',
    async function () {
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
        '99. a\n    b\n100. c\n     d\n'
      )
    }
  )

  await t.test(
    'should support a correct prefix and indent for items 999 and 1000 when `listItemIndent: "one"`',
    async function () {
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
        '999. a\n     b\n1000. c\n      d\n'
      )
    }
  )

  await t.test(
    'should support a correct prefix and indent for items 9 and 10 when `listItemIndent: "tab"`',
    async function () {
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
        '9.  a\n    b\n10. c\n    d\n'
      )
    }
  )

  await t.test(
    'should support a correct prefix and indent for items 99 and 100 when `listItemIndent: "tab"`',
    async function () {
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
        '99. a\n    b\n100.    c\n        d\n'
      )
    }
  )

  await t.test(
    'should support a correct prefix and indent for items 999 and 1000 when `listItemIndent: "tab"`',
    async function () {
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
        '999.    a\n        b\n1000.   c\n        d\n'
      )
    }
  )
})

test('listItem', async function (t) {
  await t.test('should support a list item', async function () {
    // @ts-expect-error: check how the runtime handles `children` missing.
    assert.equal(to({type: 'listItem'}), '*\n')
  })

  await t.test(
    'should serialize an item w/ a plus as bullet when `bullet: "+"`',
    async function () {
      assert.equal(to({type: 'listItem', children: []}, {bullet: '+'}), '+\n')
    }
  )

  await t.test('should throw on an incorrect bullet', async function () {
    assert.throws(function () {
      to(
        {type: 'listItem', children: []},
        {
          // @ts-expect-error: check how the runtime handles `bullet` being wrong.
          bullet: '.'
        }
      )
    }, /Cannot serialize items with `\.` for `options\.bullet`, expected `\*`, `\+`, or `-`/)
  })

  await t.test('should support a list item w/ a child', async function () {
    assert.equal(
      to({
        type: 'listItem',
        children: [{type: 'paragraph', children: [{type: 'text', value: 'a'}]}]
      }),
      '*   a\n'
    )
  })

  await t.test('should support a list item w/ children', async function () {
    assert.equal(
      to({
        type: 'listItem',
        children: [
          {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
          {type: 'thematicBreak'},
          {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
        ]
      }),
      '*   a\n\n    ***\n\n    b\n'
    )
  })

  await t.test(
    'should use one space after the bullet for `listItemIndent: "one"`',
    async function () {
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
        '* a\n\n  ***\n'
      )
    }
  )

  await t.test(
    'should use one space after the bullet for `listItemIndent: "1"` (deprecated)',
    async function () {
      assert.equal(
        to(
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
              {type: 'thematicBreak'}
            ]
          },
          {
            // @ts-expect-error: check how the runtime handles `listItemIdent` being wrong.
            listItemIndent: '1'
          }
        ),
        '* a\n\n  ***\n'
      )
    }
  )

  await t.test(
    'should use one space after the bullet for `listItemIndent: "mixed"`, when the item is not spread',
    async function () {
      assert.equal(
        to(
          {
            type: 'listItem',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'a'}]}
            ]
          },
          {listItemIndent: 'mixed'}
        ),
        '* a\n'
      )
    }
  )

  await t.test(
    'should use a tab stop of spaces after the bullet for `listItemIndent: "mixed"`, when the item is spread',
    async function () {
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
        '*   a\n\n    ***\n'
      )
    }
  )

  await t.test(
    'should throw on an incorrect `listItemIndent`',
    async function () {
      assert.throws(function () {
        to(
          {type: 'listItem', children: []},
          {
            // @ts-expect-error: check how the runtime handles `listItemIndent` being wrong.
            listItemIndent: 'x'
          }
        )
      }, /Cannot serialize items with `x` for `options\.listItemIndent`, expected `tab`, `one`, or `mixed`/)
    }
  )

  await t.test(
    'should not use blank lines between child blocks for items w/ `spread: false`',
    async function () {
      assert.equal(
        to({
          type: 'listItem',
          spread: false,
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
            {type: 'thematicBreak'}
          ]
        }),
        '*   a\n    ***\n'
      )
    }
  )

  await t.test('should support `bulletOther`', async function () {
    assert.equal(
      to(createList(createList(createList())), {bulletOther: '+'}),
      '*   *   +\n'
    )
  })

  await t.test(
    'should default to an `bulletOther` different from `bullet` (1)',
    async function () {
      assert.equal(
        to(createList(createList(createList())), {bullet: '-'}),
        '-   -   *\n'
      )
    }
  )

  await t.test(
    'should default to an `bulletOther` different from `bullet` (2)',
    async function () {
      assert.equal(
        to(createList(createList(createList())), {bullet: '*'}),
        '*   *   -\n'
      )
    }
  )

  await t.test(
    'should throw when given an incorrect `bulletOther`',
    async function () {
      assert.throws(function () {
        to(createList(createList(createList())), {
          // @ts-expect-error: check how the runtime handles `bulletOther` being wrong.
          bulletOther: '?'
        })
      }, /Cannot serialize items with `\?` for `options\.bulletOther`, expected/)
    }
  )

  await t.test(
    'should throw when an `bulletOther` is given equal to `bullet`',
    async function () {
      assert.throws(function () {
        to(createList(createList(createList())), {
          bullet: '-',
          bulletOther: '-'
        })
      }, /Expected `bullet` \(`-`\) and `bulletOther` \(`-`\) to be different/)
    }
  )

  await t.test(
    'should use a different bullet than a thematic rule marker, if the first child of a list item is a thematic break (1)',
    async function () {
      assert.equal(
        to({
          type: 'list',
          children: [{type: 'listItem', children: [{type: 'thematicBreak'}]}]
        }),
        '-   ***\n'
      )
    }
  )

  await t.test(
    'should use a different bullet than a thematic rule marker, if the first child of a list item is a thematic break (2)',
    async function () {
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
        '-   a\n\n-   ***\n'
      )
    }
  )

  await t.test(
    'should *not* use a different bullet for an empty list item in two lists',
    async function () {
      assert.equal(to(createList(createList())), '*   *\n')
    }
  )

  await t.test(
    'should use a different bullet for an empty list item in three lists (1)',
    async function () {
      assert.equal(to(createList(createList(createList()))), '*   *   -\n')
    }
  )

  await t.test(
    'should use a different bullet for an empty list item in three lists (2)',
    async function () {
      assert.equal(
        to({
          type: 'list',
          children: [
            {type: 'listItem', children: []},
            {type: 'listItem', children: [createList(createList())]}
          ]
        }),
        '*\n\n*   *   -\n'
      )
    }
  )

  await t.test(
    'should not use a different bullet for an empty list item in three lists if `bullet` isn’t a thematic rule marker',
    async function () {
      assert.equal(
        to(createList(createList(createList())), {bullet: '+'}),
        '+   +   +\n'
      )
    }
  )

  await t.test(
    'should use a different bullet for an empty list item in four lists',
    async function () {
      assert.equal(
        to(createList(createList(createList(createList())))),
        '*   *   *   -\n'
      )
    }
  )

  await t.test(
    'should use a different bullet for an empty list item in five lists',
    async function () {
      assert.equal(
        to(createList(createList(createList(createList(createList()))))),
        '*   *   *   *   -\n'
      )
    }
  )

  await t.test(
    'should not use a different bullet for an empty list item at non-head in two lists',
    async function () {
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
        '*   *   *   a\n\n        <!---->\n\n        *\n'
      )
    }
  )

  await t.test('should support `bulletOrdered`', async function () {
    assert.equal(
      to(
        {
          type: 'list',
          ordered: true,
          children: [{type: 'listItem', children: []}]
        },
        {bulletOrdered: ')'}
      ),
      '1)\n'
    )
  })

  await t.test(
    'should throw on a `bulletOrdered` that is invalid',
    async function () {
      assert.throws(function () {
        to(
          {
            type: 'list',
            ordered: true,
            children: [{type: 'listItem', children: []}]
          },
          {
            // @ts-expect-error: check how the runtime handles `bulletOrdered` being wrong.
            bulletOrdered: '~'
          }
        )
      }, /Cannot serialize items with `~` for `options.bulletOrdered`/)
    }
  )

  await t.test('should support `bulletOrderedOther`', async function () {
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
      '1.\n\n1)\n'
    )
  })

  await t.test(
    'should throw on a `bulletOrderedOther` that is invalid',
    async function () {
      assert.throws(function () {
        to(
          {
            type: 'list',
            ordered: true,
            children: [{type: 'listItem', children: []}]
          },

          {
            // @ts-expect-error: check how the runtime handles `bulletOrderedOther`.
            bulletOrderedOther: '~'
          }
        )
      }, /Cannot serialize items with `~` for `options.bulletOrderedOther`/)
    }
  )

  await t.test(
    'should throw on a `bulletOrderedOther` that matches `bulletOrdered`',
    async function () {
      assert.throws(function () {
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
      }, /Expected `bulletOrdered` \(`.`\) and `bulletOrderedOther` \(`.`\) to be different/)
    }
  )
})

test('paragraph', async function (t) {
  await t.test('should support an empty paragraph', async function () {
    assert.equal(
      // @ts-expect-error: check how the runtime handles `children` missing.
      to({type: 'paragraph'}),
      ''
    )
  })

  await t.test('should support a paragraph', async function () {
    assert.equal(
      to({type: 'paragraph', children: [{type: 'text', value: 'a\nb'}]}),
      'a\nb\n'
    )
  })

  await t.test(
    'should encode spaces at the start of paragraphs',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: '  a'}]}),
        '&#x20; a\n'
      )
    }
  )

  await t.test(
    'should encode spaces at the end of paragraphs',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: 'a  '}]}),
        'a &#x20;\n'
      )
    }
  )

  await t.test(
    'should encode tabs at the start of paragraphs',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: '\t\ta'}]}),
        '&#x9;\ta\n'
      )
    }
  )

  await t.test(
    'should encode tabs at the end of paragraphs',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: 'a\t\t'}]}),
        'a\t&#x9;\n'
      )
    }
  )

  await t.test(
    'should encode spaces around line endings in paragraphs',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: 'a  \n  b'}]}),
        'a &#x20;\n&#x20; b\n'
      )
    }
  )

  await t.test(
    'should encode spaces around line endings in paragraphs',
    async function () {
      assert.equal(
        to({
          type: 'paragraph',
          children: [{type: 'text', value: 'a\t\t\n\t\tb'}]
        }),
        'a\t&#x9;\n&#x9;\tb\n'
      )
    }
  )
})

test('strong', async function (t) {
  await t.test('should support an empty strong', async function () {
    assert.equal(
      // @ts-expect-error: check how the runtime handles `children` missing.
      to({type: 'strong'}),
      '****\n'
    )
  })

  await t.test(
    'should throw on when given an incorrect `strong`',
    async function () {
      assert.throws(function () {
        to(
          {type: 'strong', children: []},
          {
            // @ts-expect-error: check how the runtime handles `strong` being wrong.
            strong: '?'
          }
        )
      }, /Cannot serialize strong with `\?` for `options\.strong`, expected `\*`, or `_`/)
    }
  )

  await t.test('should support a strong w/ children', async function () {
    assert.equal(
      to({type: 'strong', children: [{type: 'text', value: 'a'}]}),
      '**a**\n'
    )
  })

  await t.test(
    'should support a strong w/ underscores when `emphasis: "_"`',
    async function () {
      assert.equal(
        to(
          {type: 'strong', children: [{type: 'text', value: 'a'}]},
          {strong: '_'}
        ),
        '__a__\n'
      )
    }
  )
})

test('text', async function (t) {
  await t.test('should support a void text', async function () {
    // @ts-expect-error: check how the runtime handles `value` missing.
    assert.equal(to({type: 'text'}), '')
  })

  await t.test('should support an empty text', async function () {
    assert.equal(to({type: 'text', value: ''}), '')
  })

  await t.test('should support text', async function () {
    assert.equal(to({type: 'text', value: 'a\nb'}), 'a\nb\n')
  })
})

test('thematic break', async function (t) {
  await t.test('should support a thematic break', async function () {
    assert.equal(to({type: 'thematicBreak'}), '***\n')
  })

  await t.test(
    'should support a thematic break w/ dashes when `rule: "-"`',
    async function () {
      assert.equal(to({type: 'thematicBreak'}, {rule: '-'}), '---\n')
    }
  )

  await t.test(
    'should support a thematic break w/ underscores when `rule: "_"`',
    async function () {
      assert.equal(to({type: 'thematicBreak'}, {rule: '_'}), '___\n')
    }
  )

  await t.test(
    'should throw on when given an incorrect `rule`',
    async function () {
      assert.throws(function () {
        to(
          {type: 'thematicBreak'},
          {
            // @ts-expect-error: check how the runtime handles `rule` being wrong.
            rule: '.'
          }
        )
      }, /Cannot serialize rules with `.` for `options\.rule`, expected `\*`, `-`, or `_`/)
    }
  )

  await t.test(
    'should support a thematic break w/ more repetitions w/ `ruleRepetition`',
    async function () {
      assert.equal(to({type: 'thematicBreak'}, {ruleRepetition: 5}), '*****\n')
    }
  )

  await t.test(
    'should throw on when given an incorrect `ruleRepetition`',
    async function () {
      assert.throws(function () {
        to({type: 'thematicBreak'}, {ruleRepetition: 2})
      }, /Cannot serialize rules with repetition `2` for `options\.ruleRepetition`, expected `3` or more/)
    }
  )

  await t.test(
    'should support a thematic break w/ spaces w/ `ruleSpaces`',
    async function () {
      assert.equal(to({type: 'thematicBreak'}, {ruleSpaces: true}), '* * *\n')
    }
  )
})

test('escape', async function (t) {
  await t.test(
    'should escape what would otherwise be a block quote in a paragraph',
    async function () {
      assert.equal(
        to({
          type: 'paragraph',
          children: [{type: 'text', value: '> a\n> b\nc >'}]
        }),
        '\\> a\n\\> b\nc >\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be a block quote in a list item',
    async function () {
      assert.equal(
        to({
          type: 'listItem',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: '> a\n> b'}]}
          ]
        }),
        '*   \\> a\n    \\> b\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be a block quote in a block quote',
    async function () {
      assert.equal(
        to({
          type: 'blockquote',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: '> a\n> b'}]}
          ]
        }),
        '> \\> a\n> \\> b\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be a break',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: 'a\\\nb'}]}),
        'a\\\\\nb\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be a named character reference',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: '&amp'}]}),
        '\\&amp\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be a numeric character reference',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: '&#9;'}]}),
        '\\&#9;\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be a character escape',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: 'a\\+b'}]}),
        'a\\\\+b\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be a character escape of an autolink',
    async function () {
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
        'a\\\\<https://a.b>\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be code (flow)',
    async function () {
      assert.equal(
        to({
          type: 'paragraph',
          children: [{type: 'text', value: '```js\n```'}]
        }),
        '\\`\\`\\`js\n\\`\\`\\`\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be a definition',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: '[a]: b'}]}),
        '\\[a]: b\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be emphasis (asterisk)',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: '*a*'}]}),
        '\\*a\\*\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be emphasis (underscore)',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: '_a_'}]}),
        '\\_a\\_\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be a heading (atx)',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: '# a'}]}),
        '\\# a\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be a heading (setext, equals)',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: 'a\n='}]}),
        'a\n\\=\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be a heading (setext, dash)',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: 'a\n-'}]}),
        'a\n\\-\n'
      )
    }
  )

  await t.test('should escape what would otherwise be html', async function () {
    assert.equal(
      to({type: 'paragraph', children: [{type: 'text', value: '<a\nb>'}]}),
      '\\<a\nb>\n'
    )
  })

  await t.test(
    'should escape what would otherwise be code (text)',
    async function () {
      assert.equal(
        to({
          type: 'paragraph',
          children: [{type: 'text', value: 'a `b`\n`c` d'}]
        }),
        'a \\`b\\`\n\\`c\\` d\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise turn a link into an image',
    async function () {
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
        '\\![a](b)\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise turn a link reference into an image reference',
    async function () {
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
        '\\![a][b]\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be an image (reference)',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: '![a][b]'}]}),
        '!\\[a]\\[b]\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be an image (resource)',
    async function () {
      assert.equal(
        to({
          type: 'paragraph',
          children: [{type: 'text', value: '![](a.jpg)'}]
        }),
        '!\\[]\\(a.jpg)\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be a link (reference)',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: '[a][b]'}]}),
        '\\[a]\\[b]\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be a link (resource)',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: '[](a.jpg)'}]}),
        '\\[]\\(a.jpg)\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be a list item (plus)',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: '+ a\n+ b'}]}),
        '\\+ a\n\\+ b\n'
      )
    }
  )

  await t.test(
    'should not escape `+` when not followed by whitespace',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: '+a'}]}),
        '+a\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be a list item (dash)',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: '- a\n- b'}]}),
        '\\- a\n\\- b\n'
      )
    }
  )

  await t.test(
    'should not escape `-` when not followed by whitespace',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: '-a'}]}),
        '-a\n'
      )
    }
  )

  await t.test(
    'should escape `-` when followed by another `-` (as it looks like a thematic break, setext underline)',
    async function () {
      assert.equal(
        to({type: 'paragraph', children: [{type: 'text', value: '--a'}]}),
        '\\--a\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be a list item (asterisk)',
    async function () {
      // Note: these are in titles, because the `*` case here is about flow nodes,
      // not phrasing (emphasis).
      assert.equal(
        to({
          type: 'definition',
          identifier: 'x',
          url: 'y',
          title: 'a\n* b\n* c'
        }),
        '[x]: y "a\n\\* b\n\\* c"\n'
      )
    }
  )

  await t.test(
    'should not escape `*` when not followed by whitespace',
    async function () {
      assert.equal(
        to({type: 'definition', identifier: 'x', url: 'y', title: 'a\n*b'}),
        '[x]: y "a\n*b"\n'
      )
    }
  )

  await t.test(
    'should escape `*` when followed by another `*` (as it looks like a thematic break)',
    async function () {
      assert.equal(
        to({type: 'definition', identifier: 'x', url: 'y', title: 'a\n**b'}),
        '[x]: y "a\n\\**b"\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be a list item (dot)',
    async function () {
      assert.equal(
        to({
          type: 'paragraph',
          children: [{type: 'text', value: '1. a\n2. b'}]
        }),
        '1\\. a\n2\\. b\n'
      )
    }
  )

  await t.test(
    'should escape what would otherwise be a list item (paren)',
    async function () {
      assert.equal(
        to({
          type: 'paragraph',
          children: [{type: 'text', value: '1) a\n2) b'}]
        }),
        '1\\) a\n2\\) b\n'
      )
    }
  )

  await t.test(
    'should not escape what can’t be a list (dot)',
    async function () {
      assert.equal(
        to({
          type: 'paragraph',
          children: [{type: 'text', value: '1.2.3. asd'}]
        }),
        '1.2.3. asd\n'
      )
    }
  )

  await t.test('should support options in extensions', async function () {
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
      '[a]: <>\n[b]: <>\n'
    )
  })

  await t.test(
    'should support empty `join`, `handlers`, `extensions` in an extension (coverage)',
    async function () {
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
        '__a__\n'
      )
    }
  )

  await t.test(
    'should make `join` from options highest priority',
    async function () {
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
            join: [
              function () {
                return 0
              }
            ]
          }
        ),
        '1.  foo\n    *   bar\n'
      )
    }
  )

  await t.test(
    'should prefer main options over extension options',
    async function () {
      assert.equal(
        to(
          {
            type: 'root',
            children: [{type: 'strong', children: [{type: 'text', value: 'a'}]}]
          },
          {strong: '*', extensions: [{strong: '_'}]}
        ),
        '**a**\n'
      )
    }
  )

  await t.test(
    'should prefer extension options over subextension options',
    async function () {
      assert.equal(
        to(
          {
            type: 'root',
            children: [{type: 'strong', children: [{type: 'text', value: 'a'}]}]
          },
          {extensions: [{strong: '*', extensions: [{strong: '_'}]}]}
        ),
        '**a**\n'
      )
    }
  )

  await t.test(
    'should handle literal backslashes properly when before constructs (1)',
    async function () {
      assert.equal(
        to({
          type: 'paragraph',
          children: [
            {type: 'text', value: '\\'},
            {type: 'emphasis', children: [{type: 'text', value: 'a'}]}
          ]
        }),
        '\\\\*a*\n'
      )
    }
  )

  await t.test(
    'should handle literal backslashes properly when before constructs (2)',
    async function () {
      assert.equal(
        to({
          type: 'paragraph',
          children: [
            {type: 'text', value: '\\\\'},
            {type: 'emphasis', children: [{type: 'text', value: 'a'}]}
          ]
        }),
        '\\\\\\\\*a*\n'
      )
    }
  )
})

test('roundtrip', async function (t) {
  await t.test(
    'should roundtrip spread items in block quotes',
    async function () {
      const doc = [
        '> *   Lorem ipsum dolor sit amet',
        '>',
        '> *   consectetur adipisicing elit',
        ''
      ].join('\n')

      assert.equal(to(from(doc)), doc)
    }
  )

  await t.test(
    'should roundtrip spread items in sublists (1)',
    async function () {
      const doc = [
        '*   Lorem ipsum dolor sit amet',
        '',
        '    1.  consectetur adipisicing elit',
        '',
        '    2.  sed do eiusmod tempor incididunt',
        ''
      ].join('\n')

      assert.equal(to(from(doc)), doc)
    }
  )

  await t.test(
    'should roundtrip spread items in sublists (2)',
    async function () {
      const doc = [
        '*   1.  Lorem ipsum dolor sit amet',
        '',
        '    2.  consectetur adipisicing elit',
        ''
      ].join('\n')

      assert.equal(to(from(doc)), doc)
    }
  )

  await t.test(
    'should roundtrip spread items in sublists (3)',
    async function () {
      const doc = [
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

      assert.equal(to(from(doc)), doc)
    }
  )

  await t.test(
    'should roundtrip autolinks w/ potentially escapable characters',
    async function () {
      const doc = 'An autolink: <http://example.com/?foo=1&bar=2>.\n'

      assert.equal(to(from(doc)), doc)
    }
  )

  await t.test(
    'should roundtrip potential prototype injections',
    async function () {
      const doc = [
        'A [primary][toString], [secondary][constructor], and [tertiary][__proto__] link.',
        '',
        '[toString]: http://primary.com',
        '',
        '[__proto__]: http://tertiary.com',
        '',
        '[constructor]: http://secondary.com',
        ''
      ].join('\n')

      assert.equal(to(from(doc)), doc)
    }
  )

  await t.test('should roundtrip empty lists', async function () {
    const doc = [
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

    assert.equal(to(from(doc)), doc)
  })

  await t.test('should roundtrip empty lists', async function () {
    const doc = '*   a\n\n<!---->\n\n*   b\n'

    assert.equal(to(from(doc)), doc)
  })

  await t.test(
    'should roundtrip indented blank lines in code',
    async function () {
      // The first one could have (up to) four spaces, but it doesn’t add anything,
      // so we don’t roundtrip it.
      const doc = [
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

      assert.equal(to(from(doc)), doc)
    }
  )

  await t.test('should roundtrip adjacent block quotes', async function () {
    const doc = '> a\n\n> b\n'

    assert.equal(to(from(doc)), doc)
  })

  await t.test('should roundtrip formatted URLs', async function () {
    const doc = '[**https://unifiedjs.com/**](https://unifiedjs.com/)\n'

    assert.equal(to(from(doc)), doc)
  })

  await t.test('should roundtrip backslashes (1)', async function () {
    const step1 = '\\ \\\\ \\\\\\ \\\\\\\\'
    const step2 = '\\ \\ \\\\\\ \\\\\\\\\n'

    assert.equal(to(from(step1)), step2)

    assert.equal(to(from(step2)), step2)
  })

  await t.test('should not collapse escapes (1)', async function () {
    const doc = '\\\\\\*a\n'

    assert.equal(to(from(doc)), doc)
  })

  await t.test('should not collapse escapes (2)', async function () {
    const doc = '\\\\*a\\\\\\*'

    assert.deepEqual(
      removePosition(from(doc)),
      removePosition(from(to(from(doc))))
    )
  })

  await t.test(
    'should roundtrip a sole blank line in fenced code',
    async function () {
      const doc = '```\n	\n```\n'

      assert.equal(to(from(doc)), doc)
    }
  )

  await t.test(
    'should roundtrip an empty list item in two more lists',
    async function () {
      const doc = '*   *   -\n'

      assert.equal(to(from(doc)), doc)
    }
  )

  await t.test(
    'should roundtrip a thematic break at the start of a list item',
    async function () {
      const doc = '-   ***\n'

      assert.equal(to(from(doc)), doc)
    }
  )

  await t.test(
    'should roundtrip different lists w/ `bulletOther`',
    async function () {
      const tree = from('* a\n- b')

      assert.deepEqual(
        removePosition(tree, {force: true}),
        removePosition(from(to(tree, {bullet: '*', bulletOther: '-'})), {
          force: true
        })
      )
    }
  )

  await t.test(
    'should roundtrip different lists w/ `bulletOther` and lists that could turn into thematic breaks (1)',
    async function () {
      const tree = from('* ---\n- - +\n+ b')

      assert.deepEqual(
        removePosition(tree, {force: true}),
        removePosition(from(to(tree, {bullet: '*', bulletOther: '-'})), {
          force: true
        })
      )
    }
  )

  await t.test(
    'should roundtrip different lists w/ `bulletOther` and lists that could turn into thematic breaks (2)',
    async function () {
      const tree = from('- - +\n* ---\n+ b')

      assert.deepEqual(
        removePosition(tree, {force: true}),
        removePosition(from(to(tree, {bullet: '*', bulletOther: '-'})), {
          force: true
        })
      )
    }
  )

  await t.test(
    'should roundtrip different lists w/ `bulletOther` and lists that could turn into thematic breaks (3)',
    async function () {
      const tree = from('- - +\n- -')

      assert.deepEqual(
        removePosition(tree, {force: true}),
        removePosition(from(to(tree, {bullet: '*', bulletOther: '-'})), {
          force: true
        })
      )
    }
  )

  await t.test(
    'should roundtrip different lists w/ `bulletOther` and lists that could turn into thematic breaks (4)',
    async function () {
      const tree = from('* - +\n    *\n    -\n    +')

      assert.deepEqual(
        removePosition(tree, {force: true}),
        removePosition(from(to(tree, {bullet: '*', bulletOther: '-'})), {
          force: true
        })
      )
    }
  )

  await t.test(
    'should roundtrip different lists w/ `bulletOther` and lists that could turn into thematic breaks (5)',
    async function () {
      const tree = from('* - +\n  - *\n    -\n    +')

      assert.deepEqual(
        removePosition(tree, {force: true}),
        removePosition(from(to(tree, {bullet: '*', bulletOther: '-'})), {
          force: true
        })
      )
    }
  )

  await t.test(
    'should roundtrip different lists w/ `bulletOther` and lists that could turn into thematic breaks (6)',
    async function () {
      const tree = from('- +\n- *\n  -\n  +')

      assert.deepEqual(
        removePosition(tree, {force: true}),
        removePosition(from(to(tree, {bullet: '*', bulletOther: '-'})), {
          force: true
        })
      )
    }
  )

  await t.test(
    'should roundtrip different lists w/ `bulletOrderedOther`',
    async function () {
      const tree = from('1. a\n1) b')

      assert.deepEqual(
        removePosition(tree, {force: true}),
        removePosition(
          from(to(tree, {bulletOrdered: '.', bulletOrderedOther: ')'})),
          {force: true}
        )
      )
    }
  )

  await t.test(
    'should roundtrip different lists w/ `bulletOrderedOther` and lists that could turn into thematic breaks (1)',
    async function () {
      const tree = from('1. ---\n1) 1. 1)\n1. b')

      assert.deepEqual(
        removePosition(tree, {force: true}),
        removePosition(
          from(to(tree, {bulletOrdered: '.', bulletOrderedOther: ')'})),
          {force: true}
        )
      )
    }
  )

  await t.test(
    'should roundtrip different lists w/ `bulletOrderedOther` and lists that could turn into thematic breaks (2)',
    async function () {
      const tree = from('1. 1. 1)\n1) ---\n1. b')

      assert.deepEqual(
        removePosition(tree, {force: true}),
        removePosition(
          from(to(tree, {bulletOrdered: '.', bulletOrderedOther: ')'})),
          {force: true}
        )
      )
    }
  )

  await t.test(
    'should roundtrip different lists w/ `bulletOrderedOther` and lists that could turn into thematic breaks (3)',
    async function () {
      const tree = from('1. 1. 1)\n1. 1.')

      assert.deepEqual(
        removePosition(tree, {force: true}),
        removePosition(
          from(to(tree, {bulletOrdered: '.', bulletOrderedOther: ')'})),
          {force: true}
        )
      )
    }
  )

  await t.test(
    'should roundtrip different lists w/ `bulletOrderedOther` and lists that could turn into thematic breaks (4)',
    async function () {
      const tree = from('1. 1) 1.\n      1.\n      1)\n    1.')

      assert.deepEqual(
        removePosition(tree, {force: true}),
        removePosition(
          from(to(tree, {bulletOrdered: '.', bulletOrderedOther: ')'})),
          {force: true}
        )
      )
    }
  )

  await t.test(
    'should roundtrip different lists w/ `bulletOrderedOther` and lists that could turn into thematic breaks (5)',
    async function () {
      const tree = from('1. 1) 1.\n   1) 1.\n     1)\n     1.')

      assert.deepEqual(
        removePosition(tree, {force: true}),
        removePosition(
          from(to(tree, {bulletOrdered: '.', bulletOrderedOther: ')'})),
          {force: true}
        )
      )
    }
  )

  await t.test(
    'should roundtrip different lists w/ `bulletOrderedOther` and lists that could turn into thematic breaks (6)',
    async function () {
      const tree = from('1. 1)\n1. 1.\n   1)\n   1.')

      assert.deepEqual(
        removePosition(tree, {force: true}),
        removePosition(
          from(to(tree, {bulletOrdered: '.', bulletOrderedOther: ')'})),
          {force: true}
        )
      )
    }
  )

  await t.test('should roundtrip a single encoded space', async function () {
    const doc = '&#x20;\n'

    assert.equal(to(from(doc)), doc)
  })

  await t.test('should roundtrip a single encoded tab', async function () {
    const doc = '&#x9;\n'

    assert.equal(to(from(doc)), doc)
  })

  await t.test(
    'should roundtrip encoded spaces and tabs where needed',
    async function () {
      const doc = '&#x20; a &#x20;\n&#x9;\tb\t&#x9;\n'

      assert.equal(to(from(doc)), doc)
    }
  )

  await t.test('should roundtrip asterisks (tree)', async function () {
    const doc = `Separate paragraphs:

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
    const tree = from(doc)

    assert.deepEqual(
      removePosition(from(to(tree)), {force: true}),
      removePosition(tree, {force: true})
    )
  })

  await t.test('should roundtrip underscores (tree)', async function () {
    const doc = `Separate paragraphs:

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
    const tree = from(doc)

    assert.deepEqual(
      removePosition(from(to(tree)), {force: true}),
      removePosition(tree, {force: true})
    )
  })

  await t.test('should roundtrip attention-like plain text', async function () {
    const doc = to(from(`(____`))

    assert.equal(to(from(doc)), doc)
  })

  await t.test(
    'should roundtrip faux “fill in the blank” spans',
    async function () {
      const doc = to(
        from(
          'Once activated, a service worker ______, then transitions to idle…'
        )
      )

      assert.equal(to(from(doc)), doc)
    }
  )
})

test('position (output)', async function (t) {
  await t.test('should track output positions (1)', async function () {
    assert.equal(
      to(
        {
          type: 'blockquote',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
            // @ts-expect-error: If you want to support custom nodes in types,
            // please see `@types/mdast` on how to do that.
            {type: 'unknown'}
          ]
        },
        {
          handlers: {
            /**
             * @type {Handle}
             * @param {unknown} _
             */
            unknown(_, _2, _3, info) {
              const {now, lineShift} = info
              assert.deepEqual(
                {now, lineShift},
                {now: {line: 3, column: 3}, lineShift: 2}
              )
              return 'x'
            }
          }
        }
      ),
      '> a\n>\n> x\n'
    )
  })

  await t.test('should track output positions (2)', async function () {
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
                    // @ts-expect-error: If you want to support custom nodes in types,
                    // please see `@types/mdast` on how to do that.
                    {type: 'unknown'}
                  ]
                }
              ]
            }
          ]
        },
        {
          handlers: {
            /**
             * @type {Handle}
             * @param {unknown} _
             */
            unknown(_, _2, _3, info) {
              const {now, lineShift} = info
              assert.deepEqual(
                {now, lineShift},
                {now: {line: 2, column: 4}, lineShift: 2}
              )
              return 'b'
            }
          }
        }
      ),
      '> a\n> *b*\n'
    )
  })
})

/**
 * @param {Array<BlockContent> | BlockContent | undefined} [d]
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
