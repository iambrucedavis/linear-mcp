# LEARNING.md

Bruce's running notebook. What I learned building the Linear MCP server, explained in plain English. Most recent entries on top.

---

## 2026-05-13 — Why we chose `McpServer` over the lower-level `Server`

The MCP TypeScript SDK ships two server classes. `Server` is the low-level one — you write your own request handlers for every JSON-RPC method (`tools/list`, `tools/call`, `initialize`, etc.). `McpServer` wraps that with `.registerTool()`, `.registerResource()`, `.registerPrompt()` helpers and — the part that actually matters — it lets you describe inputs and outputs with **Zod** (a TypeScript validation library) and auto-converts them to JSON Schema for the wire protocol. The older `.tool()` method is now deprecated in favor of `.registerTool()`.

I picked `McpServer` because three things land for free: input validation (the LLM's arguments get parsed before our code runs), TypeScript types on the handler's `args` parameter (so the code is type-safe end-to-end), and an auto-generated JSON Schema in the tool listing (so AI clients know the exact shape they should send). The lower-level `Server` makes sense if you need protocol-level oddities like custom JSON-RPC methods or hand-tuned schema output. We don't.

**Why this matters for the job hunt:** "I used the SDK's high-level API because it gave me zod-validated inputs without a hand-rolled JSON Schema layer" is the kind of small, specific choice that signals you read the SDK before writing code. Senior engineers do that. Juniors copy the first tutorial they find.

---

## 2026-05-13 — Why Zod for tool inputs

MCP servers receive inputs from an AI model, and models sometimes make stuff up or send slightly wrong data. Zod is a TypeScript library (think "runtime type checker") that validates data shape before our code uses it — like a bouncer at the door. If Claude sends `{ "message": 12345 }` when our `ping` tool expects a string, Zod rejects it before the handler runs, and the AI gets a clear error message about what it should have sent instead.

There's a second, less obvious reason: with `McpServer`, Zod schemas double as the source of truth for the JSON Schema we advertise to clients. We write the validation rules in TypeScript, the SDK converts them to JSON Schema for the wire protocol, and the AI sees a precise spec of what each tool accepts. One definition, three jobs: runtime validation, TypeScript types, and the published API contract.

**Why this matters for the job hunt:** "I use Zod as a defense against hallucinated tool calls" is the sentence that makes a senior AI engineer nod. It shows you think about safety, not just function — and that's the part most MCP tutorials skip.

---

## 2026-05-13 — Why stdio (not HTTP/SSE) for transport

MCP supports two ways for a client and server to talk: **stdio** (the server reads JSON-RPC messages from standard input and writes responses to standard output, like a Unix command-line tool) and **HTTP/SSE** (the server runs as a web service the client connects to over the network). I picked stdio.

Reason: Claude Desktop and Cursor — the two clients people actually use — launch local MCP servers as child processes. They write to the child's stdin and read from its stdout. No ports to bind, no auth to wire up, no firewall rules. The whole "the server is just a program the client spawns" model is dead simple and matches every MCP server in the wild today. HTTP/SSE matters when you want a remote, multi-tenant server — that's a Project V2 concern, not Day 1.

One trap worth flagging: in a stdio server, **stdout is sacred** — anything written there outside the SDK corrupts the protocol. All logs go to stderr (`console.error`). I left a comment at the top of `src/index.ts` to remind future-me.

**Why this matters for the job hunt:** Knowing why stdio is the default, and being able to articulate when you'd switch to HTTP/SSE, is the kind of "I understand the tradeoffs, not just the tutorial" signal that surfaces in technical interviews.

---

## 2026-05-13 — What MCP actually is

The Model Context Protocol (MCP) is a standard way to give AI assistants like Claude tools they can use. Without MCP, every AI app (Claude Desktop, Cursor, ChatGPT) would need its own custom integration for every external system — one for Linear, one for GitHub, one for your database, and so on. MCP fixes that by saying: "Write the integration once, as a small program called an *MCP server* (a process that exposes tools via a standard protocol). Any AI app that speaks MCP can use it."

The analogy that works: a restaurant menu. The MCP server is the menu — it tells the AI what tools exist, what arguments each one needs, and what it returns. The AI is the customer. The user is the diner who decided to come in. The protocol itself (the way the AI talks to the server) is just JSON messages going back and forth over a pipe (called *stdio* — standard input/output, the same channels your terminal uses).

The non-obvious thing: MCP isn't a REST API. A REST API is "app calls another app's endpoint." MCP is specifically designed for AI to *discover* what's available, *understand* it from descriptions, and *invoke* it with arguments it generated. That last part is why MCP servers need to be paranoid — the AI might send slightly wrong inputs, and the server has to catch that before anything bad happens.

**Why this matters for the job hunt:** In an interview, "I built an MCP server" is impressive. "I built an MCP server and I can explain why MCP exists in two sentences without using the word 'protocol' three times" is the senior-engineer version. Recruiters and hiring managers can't always tell good design from bad, but they can tell who can explain their work.

---
