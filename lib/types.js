/**
 * @typedef {import('unist').Parent} UnistParent
 * @typedef {import('unist').Point} Point
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').Content} Content
 * @typedef {Root | Content} Node
 * @typedef {Extract<Node, UnistParent>} Parent
 */

/**
 * @typedef TrackFields
 *   Info on where we are in the document we are generating.
 * @property {Point} now
 *   Current point.
 * @property {number} lineShift
 *   How many columns each line will typically be shifted by wrapping nodes.
 */

/**
 * @typedef SafeFields
 *   Info on the characters that are around the current thing we are
 *   generating.
 * @property {string} before
 *   Characters before this.
 *
 *   This could be several, but that it not guaranteed.
 *   Only one character is guaranteed.
 * @property {string} after
 *   Characters after this.
 *
 *   This could be several, but that it not guaranteed.
 *   Only one character is guaranteed.
 */

/**
 * @typedef {TrackFields & SafeFields} Info
 *   Info on the thing we are generating.
 */

/**
 * @callback Enter
 *   Enter something.
 * @param {string} type
 *   Label, more similar to a micromark event than an mdast node type.
 * @returns {Exit}
 *   Revert.
 */

/**
 * @callback Exit
 *   Exit something.
 * @returns {void}
 *   Nothing.
 */

/**
 * @typedef Context
 *   Mutating state.
 * @property {Array<string>} stack
 *   Stack of labels.
 * @property {Array<number>} indexStack
 *   Positions of children in their parents.
 * @property {Enter} enter
 *   Enter a thing.
 * @property {Options} options
 *   Configuration (optional).
 * @property {Array<Unsafe>} unsafe
 *   Unsafe patterns.
 * @property {Array<Join>} join
 *   Join handlers.
 * @property {Handle} handle
 *   Handle a node.
 * @property {Handlers} handlers
 *   Node handlers.
 * @property {string | undefined} bulletCurrent
 *   The marker used by the current list.
 * @property {string | undefined} bulletLastUsed
 *   The marker used by the previous list.
 */

/**
 * @callback Handle
 *   Handle a node.
 * @param {any} node
 *   Node to handle.
 * @param {Parent | undefined} parent
 *   Parent of `node`.
 * @param {Context} context
 *   Current mutable context.
 * @param {Info} Info
 *   Info on the characters that are around the current thing we are
 *   generating.
 * @returns {string}
 *   Serialized markdown.
 */

/**
 * @typedef {Record<string, Handle>} Handlers
 *   Map of handlers.
 */

/**
 * @callback Join
 *   Join handle.
 *
 *   “Blocks” are typically joined by one blank line.
 *   Sometimes it’s nicer to have them flush next to each other, yet other
 *   times they can’t occur together at all.
 *   Join functions receive two adjacent siblings and their parent and can return
 *   `number` or `boolean`, to signal how many blank lines to use between them.
 * @param {Node} left
 *   First of two adjacent siblings.
 * @param {Node} right
 *   Second of two adjacent siblings.
 * @param {Parent} parent
 *   Parent of the two siblings.
 * @param {Context} context
 *   Current mutable context.
 * @returns {boolean | null | undefined | void | number}
 *   How many blank lines to use between them.
 *
 *   Where `true` is as passing `1` and `false` means the nodes cannot be
 *   joined by a blank line, such as two adjacent block quotes or indented code
 *   after a list, in which case a comment will be injected to break them up:
 *
 *   ```markdown
 *   > Quote 1
 *
 *   <!---->
 *
 *   > Quote 2
 *   ```
 */

/**
 * @typedef Unsafe
 *   An entry on some character which is unsafe in certain contexts.
 * @property {string} character
 *   The single character.
 * @property {string | Array<string> | null | undefined} [inConstruct]
 *   Constructs where this is bad.
 * @property {string | Array<string> | null | undefined} [notInConstruct]
 *   Constructs where this is fine.
 * @property {string | null | undefined} [after]
 *   Conditional character before.
 * @property {string | null | undefined} [before]
 *   Conditional character after (can’t be used together with `atBreak`).
 * @property {boolean | null | undefined} [atBreak]
 *   Conditionally, at a break (can’t be used together with `before`).
 * @property {RegExp | null | undefined} [_compiled]
 *   The unsafe pattern (this whole object) compiled as a regex.
 *
 *   This is internal and must not be defined.
 */

/**
 * @typedef Options
 *   Configuration (optional).
 * @property {'-' | '*' | '+' | null | undefined} [bullet='*']
 *   Marker to use for bullets of items in unordered lists.
 * @property {'-' | '*' | '+' | null | undefined} [bulletOther]
 *   Marker to use in certain cases where the primary bullet doesn’t work.
 *
 *   There are three cases where the primary bullet can’t be used:
 *
 *   *   When three list items are on their own, the last one is empty, and
 *       `bullet` is also a valid `rule`: `* - +`.
 *       This would turn into a thematic break if serialized with three primary
 *       bullets.
 *       As this is an edge case unlikely to appear in normal markdown, the
 *       last list item will be given a different bullet.
 *   *   When a thematic break is the first child of one of the list items, and
 *       `bullet` is the same character as `rule`: `- ***`.
 *       This would turn into a single thematic break if serialized with
 *       primary bullets.
 *       As this is an edge case unlikely to appear in normal markdown this
 *       markup is always fixed, even if `bulletOther` is not passed
 *   *   When two unordered lists appear next to each other: `* a\n- b`.
 *       CommonMark sees different bullets as different lists, but several
 *       markdown parsers parse it as one list.
 *       To solve for both, we instead inject an empty comment between the two
 *       lists: `* a\n<!---->\n* b`, but if `bulletOther` is given explicitly,
 *       it will be used instead
 * @property {'.' | ')' | null | undefined} [bulletOrdered='.']
 *   Marker to use for bullets of items in ordered lists.
 * @property {'.' | ')' | null | undefined} [bulletOrderedOther]
 *   Marker to use in certain cases where the primary bullet for ordered items
 *   doesn’t work.
 *
 *   There is one case where the primary bullet for ordered items can’t be used:
 *
 *   *   When two ordered lists appear next to each other: `1. a\n2) b`.
 *       CommonMark added support for `)` as a marker, but other markdown
 *       parsers do not support it.
 *       To solve for both, we instead inject an empty comment between the two
 *       lists: `1. a\n<!---->\n1. b`, but if `bulletOrderedOther` is given
 *       explicitly, it will be used instead
 * @property {boolean | null | undefined} [closeAtx=false]
 *   Whether to add the same number of number signs (`#`) at the end of an ATX
 *   heading as the opening sequence.
 * @property {'_' | '*' | null | undefined} [emphasis='*']
 *   Marker to use for emphasis.
 * @property {'~' | '`' | null | undefined} [fence='`']
 *   Marker to use for fenced code.
 * @property {boolean | null | undefined} [fences=false]
 *   Whether to use fenced code always.
 *
 *   The default is to use fenced code if there is a language defined, if the
 *   code is empty, or if it starts or ends in blank lines.
 * @property {boolean | null | undefined} [incrementListMarker=true]
 *   Whether to increment the counter of ordered lists items.
 * @property {'tab' | 'one' | 'mixed' | null | undefined} [listItemIndent='tab']
 *   How to indent the content of list items.
 *
 *   Either with the size of the bullet plus one space (when `'one'`), a tab
 *   stop (`'tab'`), or depending on the item and its parent list (`'mixed'`,
 *   uses `'one'` if the item and list are tight and `'tab'` otherwise).
 * @property {'"' | "'" | null | undefined} [quote='"']
 *   Marker to use for titles.
 * @property {boolean | null | undefined} [resourceLink=false]
 *   Whether to always use resource links.
 *
 *   The default is to use autolinks (`<https://example.com>`) when possible
 *   and resource links (`[text](url)`) otherwise.
 * @property {'-' | '_' | '*' | null | undefined} [rule='*']
 *   Marker to use for thematic breaks.
 * @property {number | null | undefined} [ruleRepetition=3]
 *   Number of markers to use for thematic breaks.
 * @property {boolean | null | undefined} [ruleSpaces=false]
 *   Whether to add spaces between markers in thematic breaks.
 * @property {boolean | null | undefined} [setext=false]
 *   Whether to use setext headings when possible.
 *
 *   The default is to always use ATX headings (`# heading`) instead of setext
 *   headings (`heading\n=======`).
 *   Setext headings can’t be used for empty headings or headings with a rank
 *   of three or more.
 * @property {'_' | '*' | null | undefined} [strong='*']
 *   Marker to use for strong.
 * @property {boolean | null | undefined} [tightDefinitions=false]
 *   Whether to join definitions without a blank line.
 *
 *   The default is to add blank lines between any flow (“block”) construct.
 *   Turning this option on is a shortcut for a join function like so:
 *
 *   ```js
 *   function joinTightDefinitions(left, right) {
 *     if (left.type === 'definition' && right.type === 'definition') {
 *       return 0
 *     }
 *   }
 *   ```
 * @property {Handlers | null | undefined} [handlers={}]
 *   Object mapping node types to custom handlers.
 *
 *   Useful for syntax extensions.
 *   This option is a bit advanced.
 *   It’s recommended to look at the code in `lib/handle/` in
 *   `mdast-util-to-markdown` for examples.
 * @property {Array<Join> | null | undefined} [join=[]]
 *   List of functions used to determine what to place between two flow nodes.
 * @property {Array<Unsafe> | null | undefined} [unsafe=[]]
 *   List of extra patterns to escape.
 *
 *   Useful for syntax extensions.
 *   This option is quite advanced.
 *   It’s recommended to look at the code in `lib/unsafe.js` in
 *   `mdast-util-to-markdown` for examples.
 * @property {Array<Options> | null | undefined} [extensions=[]]
 *   List of extensions to include.
 *
 *   Each `ToMarkdownExtension` is an object with the same interface as
 *   `Options` here.
 */

export {}
