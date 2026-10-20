import { z } from 'zod'

export const name = 'mcp-structured-content'
export const inject = ['tools']

/**
 * Cua Driver browser tools whose text content is a one-line summary while the
 * target, tab, and element ids the next call needs exist only in
 * `structuredContent`.
 */
const CUA_BROWSER_TOOLS = [
  'mcp__cua-driver-mcp__get_browser_state',
  'mcp__cua-driver-mcp__browser_dialog',
]

/** An entry without a config block validates as `{}`, so the defaults apply. */
export const Config = z.object({
  /** Model-facing tool names whose `structuredContent` is appended to the text the model sees. */
  tools: z.array(z.string().min(1)).default(CUA_BROWSER_TOOLS),
}).prefault({})

/**
 * The dsh MCP bridge keeps an MCP result's `structuredContent` on the tool
 * value but renders only its `content` for the model. For the configured tools
 * this appends the compact JSON serialization as one more text block, the
 * backwards-compatible form MCP asks servers to return alongside structured
 * results. Programmatic (PTC) calls read the value directly and are untouched.
 */
export function apply(ctx, config) {
  const tools = new Set(config.tools)
  ctx.on('tools/post-execute', async (exec, result, next) => {
    const decision = await next()
    if (!tools.has(exec.name) || exec.parent !== undefined || result.isError) return decision
    if (decision.kind !== 'accept' || Object.hasOwn(decision, 'value')) return decision
    const structured = result.value?.structuredContent
    if (structured === undefined) return decision
    return {
      ...decision,
      content: [
        ...decision.content ?? result.content,
        { type: 'text', text: `structuredContent: ${JSON.stringify(structured)}` },
      ],
    }
  })
}
