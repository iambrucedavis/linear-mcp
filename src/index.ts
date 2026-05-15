#!/usr/bin/env node
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerPingTool } from "./tools/ping.js";
import { registerTriageInboxTool } from "./tools/triage-inbox.js";

// Load secrets from a .env file at the project root, if one exists. The path is
// resolved relative to this compiled file (dist/index.js), so it works no matter
// what working directory the MCP client launches the server from. If there is
// no .env, that's fine — environment variables may be set directly, and each
// tool reports a clear error if a key it needs is missing.
try {
  process.loadEnvFile(join(import.meta.dirname, "..", ".env"));
} catch {
  // No .env file present — ignore and rely on the ambient environment.
}

// CRITICAL: this is a stdio MCP server. stdout is reserved for the JSON-RPC
// wire protocol — anything written there outside the SDK will corrupt the
// session. All logging must go to stderr (console.error). Do not console.log.

const SERVER_NAME = "linear-mcp";
const SERVER_VERSION = "0.1.0";

async function main(): Promise<void> {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  registerPingTool(server);
  registerTriageInboxTool(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`[${SERVER_NAME}] v${SERVER_VERSION} connected on stdio`);
}

main().catch((err: unknown) => {
  console.error("[linear-mcp] fatal:", err);
  process.exit(1);
});
