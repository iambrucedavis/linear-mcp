#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerPingTool } from "./tools/ping.js";

// CRITICAL: this is a stdio MCP server. stdout is reserved for the JSON-RPC
// wire protocol — anything written there outside the SDK will corrupt the
// session. All logging must go to stderr (console.error / process.stderr).
// Do not `console.log` from anywhere in this codebase.

const SERVER_NAME = "linear-mcp";
const SERVER_VERSION = "0.1.0";

async function main(): Promise<void> {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  registerPingTool(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`[${SERVER_NAME}] v${SERVER_VERSION} connected on stdio`);
}

main().catch((err: unknown) => {
  console.error("[linear-mcp] fatal:", err);
  process.exit(1);
});
