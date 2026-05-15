# STACK.md

Pinned dependency versions and rationale. Last updated 2026-05-15 (Day 2).

## Runtime

| Tool | Version | Why |
| --- | --- | --- |
| Node.js | 25.9.0 | Latest stable. Native ESM, modern fetch, no transpile pain. |
| TypeScript | ~6.0.3 | Strict mode on. Matches MCP community conventions; helps the eval harness stay honest. |

## Dependencies

| Package | Version | Why |
| --- | --- | --- |
| `@modelcontextprotocol/sdk` | ^1.29.0 | The official TypeScript SDK. Handles JSON-RPC framing, stdio transport, schema validation, request/response types. Writing this by hand would burn two days for zero portfolio value. |
| `@linear/sdk` | ^84.0.0 | Linear's official GraphQL client. Typed, idiomatic, maintained. Beats hand-rolling GraphQL queries. |
| `@anthropic-ai/sdk` | ^0.96.0 | The official Anthropic SDK. Added Day 2 — the tools call Claude server-side (per-tool model choice + token telemetry need this; MCP "sampling" would hand model choice to the client). `messages.parse()` + `zodOutputFormat()` give schema-constrained JSON output. Justified in LEARNING.md. |
| `zod` | ^4.4.3 | Tool input/output validation. The bouncer at the door for inputs an LLM generated. Spec calls this out explicitly. Also doubles as the Anthropic structured-output schema. |

## Dev Dependencies

| Package | Version | Why |
| --- | --- | --- |
| `vitest` | ^4.1.6 | Test runner for the eval harness (Week 2 hero artifact). Fast, ESM-native, plays well with TS. |
| `tsx` | ^4.21.0 | Run TypeScript directly during local development without a separate build step. |
| `@types/node` | ^25.7.0 | Type definitions matched to Node 25. |

## What we explicitly did NOT install

- **No web framework** (Express/Fastify) — this is an MCP stdio server, not an HTTP service. Adding one would be cargo-culting.
- **No ORM** — Linear is the data layer. We don't own a database.
- **No logging library** — `console.error` writes to stderr, which the MCP host (Claude Desktop) captures. Pino/Winston would be overkill.
- **No dotenv** — Node 25 supports `--env-file` natively. One fewer dependency to audit.

The bar for adding any new dependency: it has to save real work AND survive a `LEARNING.md` justification entry.
