import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/**
 * Evaluation harness for the Linear MCP server.
 *
 * What it does: builds an MCP *client*, spawns the real built server
 * (`dist/index.js`) as a subprocess, and drives it over stdio — the exact same
 * path a real client (Claude Desktop, Claude Code) uses. Each eval case calls a
 * tool for real and runs a set of checks against the result. It then writes a
 * pass/fail table to `docs/EVAL_RESULTS.md`.
 *
 * Why a standalone runner and not vitest: the offline contract tests
 * (`tests/*.test.ts`, 56 of them) already use vitest — they're fast and need no
 * keys. This harness is a different job: it grades behaviour against the *live*
 * Linear and Anthropic APIs and emits a human-readable report. A plain runner
 * that produces a report is a better fit — and easier to read — than bending a
 * test runner into a report generator. The two are complementary: vitest checks
 * the contracts, this harness checks the quality.
 *
 * Run with `npm run eval`. With no API keys it still runs every deterministic
 * case (input validation, error paths) and reports the rest as skipped — so the
 * harness itself is always exercised.
 */

// ---------------------------------------------------------------------------
// Case + check types
// ---------------------------------------------------------------------------

/** The normalized result of one tool call. */
export interface ToolOutcome {
  isError: boolean;
  structured: Record<string, unknown> | undefined;
  text: string;
}

/** One assertion against a tool outcome. `run` throws an Error to fail. */
export interface EvalCheck {
  label: string;
  run: (outcome: ToolOutcome) => void;
}

/** One ground-truth eval case: an input, and the criteria for "good enough". */
export interface EvalCase {
  tool: string;
  name: string;
  /** Args, or a builder given the process env (for cases keyed to real data). */
  args: Record<string, unknown> | ((env: NodeJS.ProcessEnv) => Record<string, unknown>);
  /** True for deterministic cases (validation, error paths) that need no API keys. */
  offline?: boolean;
  /** Env vars that must be set for this case to run (e.g. EVAL_TEAM_KEY); else it skips. */
  requires?: string[];
  checks: EvalCheck[];
}

interface CaseResult {
  tool: string;
  name: string;
  status: "pass" | "fail" | "skip";
  detail: string;
}

// ---------------------------------------------------------------------------
// Check builders — the reusable assertion vocabulary
// ---------------------------------------------------------------------------

/** A generic check: throw inside `fn` to fail it. */
export function check(label: string, fn: (o: ToolOutcome) => void): EvalCheck {
  return { label, run: fn };
}

/** Asserts the tool returned a successful (non-error) result. */
export function expectOk(): EvalCheck {
  return check("returns a success result", (o) => {
    if (o.isError) throw new Error(`expected success, got an error result: ${o.text}`);
  });
}

/** Asserts the tool returned an error result — for validation and error-path cases. */
export function expectError(): EvalCheck {
  return check("returns an error result", (o) => {
    if (!o.isError) throw new Error("expected an error result, got success");
  });
}

/** Asserts the structured output is present and parses against the tool's zod schema. */
export function expectSchema(schema: { safeParse: (v: unknown) => { success: boolean } }): EvalCheck {
  return check("structured output matches the tool's schema", (o) => {
    if (o.isError) throw new Error(`tool errored, no structured output: ${o.text}`);
    if (o.structured === undefined) throw new Error("no structuredContent on the result");
    if (!schema.safeParse(o.structured).success) {
      throw new Error("structuredContent did not match the declared output schema");
    }
  });
}

/** Reads `structured` for a content check; throws a clear message if it's absent. */
export function structured(o: ToolOutcome): Record<string, unknown> {
  if (o.structured === undefined) {
    throw new Error(o.isError ? `tool errored: ${o.text}` : "no structuredContent on the result");
  }
  return o.structured;
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

const ROOT = join(import.meta.dirname, "..", "..");

/** Loads the project `.env` so the harness can detect which keys are available. */
function loadEnv(): void {
  try {
    process.loadEnvFile(join(ROOT, ".env"));
  } catch {
    // No .env — keys may still be set in the ambient environment.
  }
}

function hasLiveKeys(): boolean {
  return Boolean(process.env.LINEAR_API_KEY?.trim() && process.env.ANTHROPIC_API_KEY?.trim());
}

function extractText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .filter((b): b is { type: string; text: string } => {
      return typeof b === "object" && b !== null && (b as { type?: unknown }).type === "text";
    })
    .map((b) => b.text)
    .join("\n");
}

async function callTool(client: Client, name: string, args: Record<string, unknown>): Promise<ToolOutcome> {
  try {
    const result = await client.callTool({ name, arguments: args });
    return {
      isError: result.isError === true,
      structured: result.structuredContent as Record<string, unknown> | undefined,
      text: extractText(result.content),
    };
  } catch (err) {
    // The MCP layer surfaces input-schema rejections as a thrown protocol error.
    // For our purposes that is just another error outcome.
    return { isError: true, structured: undefined, text: err instanceof Error ? err.message : String(err) };
  }
}

function runChecks(outcome: ToolOutcome, checks: EvalCheck[]): string[] {
  const failures: string[] = [];
  for (const c of checks) {
    try {
      c.run(outcome);
    } catch (err) {
      failures.push(`${c.label} — ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return failures;
}

/**
 * Runs every eval case and writes `docs/EVAL_RESULTS.md`.
 * @returns the number of failed (non-skipped) cases.
 */
export async function runAllEvals(cases: EvalCase[]): Promise<number> {
  loadEnv();
  const live = hasLiveKeys();

  const transport = new StdioClientTransport({
    command: "node",
    args: [join(ROOT, "dist", "index.js")],
    stderr: "ignore",
  });
  const client = new Client({ name: "linear-mcp-eval-harness", version: "0.1.0" });
  await client.connect(transport);

  // Connectivity sanity check — exercises the whole client→subprocess path even
  // when no API keys are configured.
  const ping = await callTool(client, "ping", { message: "eval harness" });
  const pingOk = !ping.isError;

  const results: CaseResult[] = [];
  for (const c of cases) {
    const env = process.env;
    const missingEnv = (c.requires ?? []).filter((k) => !env[k]?.trim());
    const needsKeys = !c.offline;

    if ((needsKeys && !live) || missingEnv.length > 0) {
      const why =
        missingEnv.length > 0
          ? `requires ${missingEnv.join(", ")}`
          : "requires LINEAR_API_KEY + ANTHROPIC_API_KEY";
      results.push({ tool: c.tool, name: c.name, status: "skip", detail: why });
      continue;
    }

    const args = typeof c.args === "function" ? c.args(env) : c.args;
    const outcome = await callTool(client, c.tool, args);
    const failures = runChecks(outcome, c.checks);
    results.push({
      tool: c.tool,
      name: c.name,
      status: failures.length === 0 ? "pass" : "fail",
      detail: failures.join(" | "),
    });
  }

  await client.close();

  await writeReport(results, live, pingOk);

  const failed = results.filter((r) => r.status === "fail").length;
  const passed = results.filter((r) => r.status === "pass").length;
  const skipped = results.filter((r) => r.status === "skip").length;
  console.error(
    `\nEval harness: ${passed} passed, ${failed} failed, ${skipped} skipped ` +
      `(${live ? "LIVE" : "OFFLINE"} mode). Report: docs/EVAL_RESULTS.md`,
  );
  return failed;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

async function writeReport(results: CaseResult[], live: boolean, pingOk: boolean): Promise<void> {
  const tools = [...new Set(results.map((r) => r.tool))];

  const rows = tools.map((tool) => {
    const forTool = results.filter((r) => r.tool === tool);
    const passed = forTool.filter((r) => r.status === "pass").length;
    const failed = forTool.filter((r) => r.status === "fail").length;
    const skipped = forTool.filter((r) => r.status === "skip").length;
    const graded = passed + failed;
    const rate = graded === 0 ? "—" : `${Math.round((passed / graded) * 100)}%`;
    return { tool, total: forTool.length, passed, failed, skipped, rate };
  });

  const total = {
    total: results.length,
    passed: results.filter((r) => r.status === "pass").length,
    failed: results.filter((r) => r.status === "fail").length,
    skipped: results.filter((r) => r.status === "skip").length,
  };
  const gradedTotal = total.passed + total.failed;
  const totalRate = gradedTotal === 0 ? "—" : `${Math.round((total.passed / gradedTotal) * 100)}%`;

  const failures = results.filter((r) => r.status === "fail");
  const skips = results.filter((r) => r.status === "skip");

  const lines: string[] = [];
  lines.push("# Eval results");
  lines.push("");
  lines.push(`Generated ${new Date().toISOString()} by \`npm run eval\`.`);
  lines.push("");
  lines.push(
    live
      ? "**Mode: LIVE** — run against the live Linear and Anthropic APIs."
      : "**Mode: OFFLINE** — no API keys were configured. Only deterministic cases " +
          "(input validation, error paths) ran; live-API cases are reported as skipped. " +
          "Set `LINEAR_API_KEY` and `ANTHROPIC_API_KEY` (and `EVAL_TEAM_KEY` / `EVAL_ISSUE_ID`) " +
          "in `.env` and re-run for a full report.",
  );
  lines.push("");
  lines.push(`Server connectivity (\`ping\`): ${pingOk ? "OK" : "FAILED"}.`);
  lines.push("");
  lines.push("| Tool | Cases | Passed | Failed | Skipped | Pass rate |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const r of rows) {
    lines.push(`| \`${r.tool}\` | ${r.total} | ${r.passed} | ${r.failed} | ${r.skipped} | ${r.rate} |`);
  }
  lines.push(
    `| **Total** | ${total.total} | ${total.passed} | ${total.failed} | ${total.skipped} | **${totalRate}** |`,
  );
  lines.push("");
  lines.push("Pass rate is computed over graded (non-skipped) cases.");
  lines.push("");

  lines.push("## Failures");
  lines.push("");
  if (failures.length === 0) {
    lines.push("None.");
  } else {
    for (const f of failures) {
      lines.push(`- **\`${f.tool}\` — ${f.name}**: ${f.detail}`);
    }
  }
  lines.push("");

  lines.push("## Skipped");
  lines.push("");
  if (skips.length === 0) {
    lines.push("None.");
  } else {
    for (const s of skips) {
      lines.push(`- \`${s.tool}\` — ${s.name} (${s.detail})`);
    }
  }
  lines.push("");

  await writeFile(join(ROOT, "docs", "EVAL_RESULTS.md"), lines.join("\n"), "utf8");
}
