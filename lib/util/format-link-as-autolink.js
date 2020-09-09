module.exports = formatLinkAsAutolink

var toString = require('mdast-util-to-string')

function formatLinkAsAutolink(node) {
  var raw = toString(node)
  var url = node.url

  return (
    // If there’s a url…
    url &&
    // And there’s a no title…
    !node.title &&
    // And if the url is the same as the content…
    (raw === url || 'mailto:' + raw === url) &&
    // And that starts w/ a protocol…
    /^[a-z][a-z+.-]+:/i.test(url) &&
    // And that doesn’t contain ASCII control codes (character escapes and
    // references don’t work) or angle brackets…
    !/[\0- <>\u007F]/.test(url)
  )
}
