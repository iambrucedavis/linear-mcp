/**
 * Audit logging.
 *
 * Every tool invocation is recorded as one structured JSON line on stderr:
 * a timestamp, the tool name, and the inputs it was called with. This is the
 * `{ tool, inputs, timestamp }` audit trail the threat model (docs/SECURITY.md)
 * relies on for after-the-fact review.
 *
 * Two deliberate properties:
 *  - stderr, not stdout. stdout is the JSON-RPC wire; audit lines must never
 *    touch it. The MCP host (Claude Desktop / Claude Code) captures stderr.
 *  - The caller controls what goes in `inputs`. A tool must not pass sensitive
 *    values here — e.g. compose_update logs a voice-sample *count*, never the
 *    samples themselves. An audit log should record enough to reconstruct what
 *    happened without becoming a second copy of sensitive data.
 *
 * Intentionally one function, no dependencies, no log-level machinery — a
 * portfolio MCP server does not need a logging framework.
 */
export function logToolCall(tool: string, inputs: Record<string, unknown>): void {
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: "tool_call",
      tool,
      inputs,
    }),
  );
}
