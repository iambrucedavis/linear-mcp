import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Helpers for building MCP tool results in a consistent shape.
 *
 * Every tool returns two things: a human-readable `content` block (so a person
 * reading the raw MCP traffic can see what happened) and, on success, a
 * `structuredContent` object that the model and downstream code can consume
 * without parsing prose.
 */

/**
 * A successful tool result. The payload is emitted both as pretty-printed JSON
 * text and as structured content validated against the tool's output schema.
 */
export function structuredResult(payload: Record<string, unknown>): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

/**
 * An error tool result. `isError: true` tells the MCP client this was a failure;
 * the model sees the message and can relay a clear explanation to the user.
 *
 * Use this for *expected* failures the caller can act on — missing config, an
 * upstream API rejection, a malformed model response. Genuine bugs should throw
 * and be caught at the tool boundary.
 */
export function errorResult(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}
