# dsh-mcp-structured-content

Show the `structuredContent` of selected MCP tools to the model in dsh.

## Why

An MCP tool result has two parts: `content` for the model and `structuredContent` for programs.
The dsh MCP bridge keeps `structuredContent` on the tool value but renders only `content` for the model.
When a server puts the ids its next call needs only in `structuredContent`, the model cannot make that call.

Cua Driver's browser tools are the motivating case.
`get_browser_state` answers with a one-line summary such as `bound target bt-… with 2 tab(s)`, while the `target_id`, the `tab_id` of each tab, and every element ref exist only in `structuredContent`.
Without them the model cannot use `browser_click`, `browser_type`, `browser_navigate`, or a snapshot.

## Behavior

For each configured tool, a successful direct call gets one more text block holding the compact JSON serialization of its `structuredContent`, the backwards-compatible form MCP asks servers to return alongside structured results.

- Calls without `structuredContent`, failed calls, and decisions that replace the value are left unchanged.
- Programmatic (PTC) calls already read the value and are left unchanged.
- Content replaced by another `tools/post-execute` listener is kept and extended.

It runs on dsh's public `tools/post-execute` extension point and changes no tool definition or schema.

## Configuration

`tools` lists model-facing tool names. The default covers Cua Driver's browser tools that return ids only in `structuredContent`:

```yaml
- id: mcp-structured-content
  config:
    tools:
      - mcp__cua-driver-mcp__get_browser_state
      - mcp__cua-driver-mcp__browser_dialog
```

Add any other MCP tool with the same problem. Avoid tools whose text already carries the structured data, because the model would read it twice.

## Install

```sh
dsh plugin --profile web add github:YanzuoLu/dsh-mcp-structured-content
```

## Requirements

- dsh `>=0.2.0-rc.2 <0.3.0`
