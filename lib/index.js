module.exports = toMarkdown

var zwitch = require('zwitch')
var defaultHandlers = require('./handle')
var defaultUnsafePatterns = require('./unsafe')

// To do (extension)
// - GFM: `tableCellPadding`, `tablePipeAlign`, `stringLength`.
// - Footnotes: `footnote`, `footnoteDefinition`, `footnoteReference`.
function toMarkdown(tree, options) {
  var settings = options || {}
  var extensions = configure(settings)
  var stack = []
  var handle = zwitch('type', {
    invalid: invalid,
    unknown: unknown,
    handlers: extensions.handlers
  })
  var context = {
    handle: handle,
    stack: stack,
    enter: enter,
    options: settings,
    unsafePatterns: extensions.unsafe
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

function configure(settings) {
  var unsafe = defaultUnsafePatterns
  var handlers = Object.assign({}, defaultHandlers)
  var extensions = [
    {unsafe: settings.unsafe, handlers: settings.handlers}
  ].concat(settings.extensions || [])
  var length = extensions.length
  var index = -1
  var extension

  while (++index < length) {
    extension = extensions[index]
    unsafe = unsafe.concat(extension.unsafe || [])
    handlers = Object.assign(handlers, extension.handlers || {})
  }

  return {unsafe: unsafe, handlers: handlers}
}
