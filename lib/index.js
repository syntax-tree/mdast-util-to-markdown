module.exports = toMarkdown

var zwitch = require('zwitch')
var blockquote = require('./handle/blockquote')
var code = require('./handle/code')
var definition = require('./handle/definition')
var emphasis = require('./handle/emphasis')
var hardBreak = require('./handle/break')
var heading = require('./handle/heading')
var html = require('./handle/html')
var image = require('./handle/image')
var imageReference = require('./handle/image-reference')
var inlineCode = require('./handle/inline-code')
var link = require('./handle/link')
var linkReference = require('./handle/link-reference')
var list = require('./handle/list')
var listItem = require('./handle/list-item')
var paragraph = require('./handle/paragraph')
var root = require('./handle/root')
var strong = require('./handle/strong')
var text = require('./handle/text')
var thematicBreak = require('./handle/thematic-break')
var unsafe = require('./unsafe')

// To do (extension)
// - GFM: `tableCellPadding`, `tablePipeAlign`, `stringLength`.
// - Frontmatter: `yaml`, `toml`.
// - Footnotes: `footnote`, `footnoteDefinition`, `footnoteReference`.
function toMarkdown(tree, options) {
  var settings = options || {}
  var stack = []
  var handle = zwitch('type', {
    invalid: invalid,
    unknown: unknown,
    handlers: Object.assign(
      {
        blockquote: blockquote,
        break: hardBreak,
        code: code,
        definition: definition,
        emphasis: emphasis,
        heading: heading,
        html: html,
        image: image,
        imageReference: imageReference,
        inlineCode: inlineCode,
        link: link,
        linkReference: linkReference,
        list: list,
        listItem: listItem,
        paragraph: paragraph,
        root: root,
        strong: strong,
        text: text,
        thematicBreak: thematicBreak
      },
      settings.handlers
    )
  })

  var context = {
    handle: handle,
    stack: stack,
    enter: enter,
    options: settings,
    unsafePatterns: unsafe.concat(settings.unsafe || [])
  }

  return handle(tree, null, context, {before: '\n', after: '\n'})

  function enter(name) {
    stack.push(name)
    return exit

    function exit() {
      stack.pop()
    }
  }
}

function invalid(value) {
  throw new Error('Cannot handle value `' + value + '`, expected node')
}

function unknown(node) {
  throw new Error('Cannot handle unknown node `' + node.type + '`')
}
