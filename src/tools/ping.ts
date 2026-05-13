import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * `ping` — connectivity check.
 *
 * Returns a small structured payload confirming the server is alive. The Day 1
 * hello-world tool: every Linear-specific tool will land Days 2-5. This one
 * exists so a client (Claude Desktop, Cursor) can verify the stdio handshake
 * and tool-call round-trip work before we add anything more complicated.
 */
export function registerPingTool(server: McpServer): void {
  server.registerTool(
    "ping",
    {
      title: "Ping the Linear MCP server",
      description:
        "Returns a small status payload confirming the server is alive. Use this to verify connectivity before invoking real tools.",
      inputSchema: {
        message: z
          .string()
          .max(200)
          .optional()
          .describe("Optional message to echo back. Capped at 200 chars."),
      },
      outputSchema: {
        status: z.literal("ok"),
        server: z.string(),
        version: z.string(),
        echo: z.string().nullable(),
        timestamp: z.string(),
      },
    },
    async ({ message }) => {
      const payload = {
        status: "ok" as const,
        server: "linear-mcp",
        version: "0.1.0",
        echo: message ?? null,
        timestamp: new Date().toISOString(),
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(payload, null, 2),
          },
        ],
        structuredContent: payload,
      };
    }
  );
}
