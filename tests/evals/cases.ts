import type { EvalCase } from "./harness.js";
import { check, expectOk, expectError, expectSchema, structured } from "./harness.js";
import { TriageInboxOutput } from "../../src/tools/triage-inbox.js";
import { ScopeIssueOutput } from "../../src/tools/scope-issue.js";
import { FindOrphansOutput } from "../../src/tools/find-orphans.js";
import { AuditVelocityOutput } from "../../src/tools/audit-velocity.js";
import { ComposeUpdateOutput } from "../../src/tools/compose-update.js";
import { WeeklySummaryOutput } from "../../src/tools/weekly-summary.js";

/**
 * Ground-truth eval cases — five per tool, thirty in all.
 *
 * Each case is an input plus the criteria for "good enough". Because the live
 * data lives in whoever's Linear workspace runs this, the criteria are
 * structural and behavioural — schema conformance, internal consistency,
 * non-empty content, valid enum values — rather than exact-match ground truth.
 * Cases that genuinely need real data read a workspace pointer from the
 * environment (`EVAL_TEAM_KEY`, `EVAL_ISSUE_ID`) and skip if it is unset.
 *
 * `offline: true` marks deterministic cases (input validation, error paths)
 * that need no API keys and always run.
 */

/** Asserts a numeric field on the structured output satisfies a predicate. */
function field(label: string, get: (s: Record<string, unknown>) => unknown, ok: (v: unknown) => boolean) {
  return check(label, (o) => {
    const value = get(structured(o));
    if (!ok(value)) throw new Error(`${label}: got ${JSON.stringify(value)}`);
  });
}

const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isArray = (v: unknown): v is unknown[] => Array.isArray(v);

// ===========================================================================
// triage_inbox  (no workspace pointer needed — uses the key owner's inbox)
// ===========================================================================

const triageCases: EvalCase[] = [
  {
    tool: "triage_inbox",
    name: "default call returns a schema-valid triage list",
    args: {},
    checks: [
      expectOk(),
      expectSchema(TriageInboxOutput),
      field(
        "total_triaged equals the triaged array length",
        (s) => [s.total_triaged, (s.triaged as unknown[]).length],
        (v) => Array.isArray(v) && v[0] === v[1],
      ),
    ],
  },
  {
    tool: "triage_inbox",
    name: "respects a small max_count",
    args: { max_count: 3, unread_only: false },
    checks: [
      expectOk(),
      expectSchema(TriageInboxOutput),
      field("returns at most 3 items", (s) => (s.triaged as unknown[]).length, (v) => (v as number) <= 3),
    ],
  },
  {
    tool: "triage_inbox",
    name: "every triaged item is well-formed",
    args: { max_count: 10 },
    checks: [
      expectOk(),
      check("each item has a valid priority, summary, and action", (o) => {
        const items = structured(o).triaged as Array<Record<string, unknown>>;
        const priorities = new Set(["urgent", "high", "normal", "low"]);
        for (const it of items) {
          if (!priorities.has(it.priority as string)) throw new Error(`bad priority ${String(it.priority)}`);
          if (!isNonEmptyString(it.summary)) throw new Error("empty summary");
          if (!isNonEmptyString(it.suggested_action)) throw new Error("empty suggested_action");
        }
      }),
    ],
  },
  {
    tool: "triage_inbox",
    name: "rejects an out-of-range max_count",
    args: { max_count: 999 },
    offline: true,
    checks: [expectError()],
  },
  {
    tool: "triage_inbox",
    name: "rejects a wrong-typed unread_only",
    args: { unread_only: "yes" },
    offline: true,
    checks: [expectError()],
  },
];

// ===========================================================================
// scope_issue  (happy paths need a real issue id → EVAL_ISSUE_ID)
// ===========================================================================

const scopeCases: EvalCase[] = [
  {
    tool: "scope_issue",
    name: "rejects an empty issue_id",
    args: { issue_id: "" },
    offline: true,
    checks: [expectError()],
  },
  {
    tool: "scope_issue",
    name: "errors cleanly on an unknown issue id",
    args: { issue_id: "ZZZZ-999999" },
    checks: [
      expectError(),
      check("error message names the missing issue", (o) => {
        if (!/no linear issue/i.test(o.text)) throw new Error(`unhelpful error: ${o.text}`);
      }),
    ],
  },
  {
    tool: "scope_issue",
    name: "scopes a real issue into subtasks",
    args: (env) => ({ issue_id: env.EVAL_ISSUE_ID }),
    requires: ["EVAL_ISSUE_ID"],
    checks: [
      expectOk(),
      expectSchema(ScopeIssueOutput),
      field("produces at least one subtask", (s) => (s.subtasks as unknown[]).length, (v) => (v as number) >= 1),
      field("produces acceptance criteria", (s) => s.acceptance_criteria, isArray),
    ],
  },
  {
    tool: "scope_issue",
    name: "produces a usable effort estimate",
    args: (env) => ({ issue_id: env.EVAL_ISSUE_ID }),
    requires: ["EVAL_ISSUE_ID"],
    checks: [
      expectOk(),
      check("effort estimate has points and a valid confidence", (o) => {
        const est = structured(o).effort_estimate as Record<string, unknown>;
        if (typeof est.points !== "number") throw new Error("points is not a number");
        if (!["high", "medium", "low"].includes(est.confidence as string)) {
          throw new Error(`bad confidence ${String(est.confidence)}`);
        }
      }),
    ],
  },
  {
    tool: "scope_issue",
    name: "echoes the real issue's identity",
    args: (env) => ({ issue_id: env.EVAL_ISSUE_ID }),
    requires: ["EVAL_ISSUE_ID"],
    checks: [
      expectOk(),
      field(
        "issue.identifier is populated",
        (s) => (s.issue as Record<string, unknown>).identifier,
        isNonEmptyString,
      ),
    ],
  },
];

// ===========================================================================
// find_orphans  (scans the whole workspace — no pointer needed)
// ===========================================================================

const orphanCases: EvalCase[] = [
  {
    tool: "find_orphans",
    name: "default scan returns a schema-valid list",
    args: {},
    checks: [
      expectOk(),
      expectSchema(FindOrphansOutput),
      field(
        "total_orphans equals the orphans array length",
        (s) => [s.total_orphans, (s.orphans as unknown[]).length],
        (v) => Array.isArray(v) && v[0] === v[1],
      ),
    ],
  },
  {
    tool: "find_orphans",
    name: "every orphan has reasons and a summary",
    args: { max_count: 15 },
    checks: [
      expectOk(),
      check("each orphan is well-formed", (o) => {
        const orphans = structured(o).orphans as Array<Record<string, unknown>>;
        for (const it of orphans) {
          if (!Array.isArray(it.reasons) || it.reasons.length === 0) throw new Error("no reasons");
          if (!isNonEmptyString(it.summary)) throw new Error("empty summary");
          if (typeof it.days_since_update !== "number" || (it.days_since_update as number) < 0) {
            throw new Error("bad days_since_update");
          }
        }
      }),
    ],
  },
  {
    tool: "find_orphans",
    name: "respects a small max_count",
    args: { max_count: 5 },
    checks: [
      expectOk(),
      field("returns at most 5 orphans", (s) => (s.orphans as unknown[]).length, (v) => (v as number) <= 5),
    ],
  },
  {
    tool: "find_orphans",
    name: "rejects a stale_days over the limit",
    args: { stale_days: 9999 },
    offline: true,
    checks: [expectError()],
  },
  {
    tool: "find_orphans",
    name: "rejects a max_count of zero",
    args: { max_count: 0 },
    offline: true,
    checks: [expectError()],
  },
];

// ===========================================================================
// audit_velocity  (needs a real team → EVAL_TEAM_KEY)
// ===========================================================================

const velocityCases: EvalCase[] = [
  {
    tool: "audit_velocity",
    name: "rejects a missing team_key",
    args: { cycle_count: 4 },
    offline: true,
    checks: [expectError()],
  },
  {
    tool: "audit_velocity",
    name: "rejects a cycle_count below 2",
    args: { team_key: "BD", cycle_count: 1 },
    offline: true,
    checks: [expectError()],
  },
  {
    tool: "audit_velocity",
    name: "errors cleanly on an unknown team",
    args: { team_key: "ZZZNOPE" },
    checks: [
      expectError(),
      check("error message names the missing team", (o) => {
        if (!/no linear team/i.test(o.text)) throw new Error(`unhelpful error: ${o.text}`);
      }),
    ],
  },
  {
    tool: "audit_velocity",
    name: "diagnoses a real team's velocity",
    args: (env) => ({ team_key: env.EVAL_TEAM_KEY, cycle_count: 4 }),
    requires: ["EVAL_TEAM_KEY"],
    checks: [
      expectOk(),
      expectSchema(AuditVelocityOutput),
      field("trend is a valid value", (s) => s.trend, (v) =>
        ["improving", "stable", "declining", "volatile"].includes(v as string),
      ),
    ],
  },
  {
    tool: "audit_velocity",
    name: "returns at least two cycles with scope data",
    args: (env) => ({ team_key: env.EVAL_TEAM_KEY, cycle_count: 4 }),
    requires: ["EVAL_TEAM_KEY"],
    checks: [
      expectOk(),
      field("has at least 2 cycles", (s) => (s.cycles as unknown[]).length, (v) => (v as number) >= 2),
    ],
  },
];

// ===========================================================================
// compose_update  (needs a real team → EVAL_TEAM_KEY)
// ===========================================================================

const composeCases: EvalCase[] = [
  {
    tool: "compose_update",
    name: "rejects an unknown format",
    args: { team_key: "BD", format: "telegram" },
    offline: true,
    checks: [expectError()],
  },
  {
    tool: "compose_update",
    name: "rejects more than five voice samples",
    args: { team_key: "BD", voice_samples: ["a", "b", "c", "d", "e", "f"] },
    offline: true,
    checks: [expectError()],
  },
  {
    tool: "compose_update",
    name: "drafts a Slack update from real activity",
    args: (env) => ({ team_key: env.EVAL_TEAM_KEY, days: 14 }),
    requires: ["EVAL_TEAM_KEY"],
    checks: [
      expectOk(),
      expectSchema(ComposeUpdateOutput),
      field("draft is non-empty", (s) => s.draft, isNonEmptyString),
      field("returns at least one highlight", (s) => (s.highlights as unknown[]).length, (v) => (v as number) >= 1),
    ],
  },
  {
    tool: "compose_update",
    name: "honours the email format",
    args: (env) => ({ team_key: env.EVAL_TEAM_KEY, format: "email", days: 14 }),
    requires: ["EVAL_TEAM_KEY"],
    checks: [
      expectOk(),
      field("format echoes back as email", (s) => s.format, (v) => v === "email"),
    ],
  },
  {
    tool: "compose_update",
    name: "counts the voice samples it was given",
    args: (env) => ({ team_key: env.EVAL_TEAM_KEY, days: 14, voice_samples: ["Hey team — quick one."] }),
    requires: ["EVAL_TEAM_KEY"],
    checks: [
      expectOk(),
      field("voice_samples_used is 1", (s) => s.voice_samples_used, (v) => v === 1),
    ],
  },
];

// ===========================================================================
// weekly_summary  (needs a real team → EVAL_TEAM_KEY)
// ===========================================================================

const summaryCases: EvalCase[] = [
  {
    tool: "weekly_summary",
    name: "rejects a missing team_key",
    args: { days: 7 },
    offline: true,
    checks: [expectError()],
  },
  {
    tool: "weekly_summary",
    name: "rejects a window over 60 days",
    args: { team_key: "BD", days: 90 },
    offline: true,
    checks: [expectError()],
  },
  {
    tool: "weekly_summary",
    name: "errors cleanly on an unknown team",
    args: { team_key: "ZZZNOPE" },
    checks: [
      expectError(),
      check("error message names the missing team", (o) => {
        if (!/no linear team/i.test(o.text)) throw new Error(`unhelpful error: ${o.text}`);
      }),
    ],
  },
  {
    tool: "weekly_summary",
    name: "summarizes a real team's activity",
    args: (env) => ({ team_key: env.EVAL_TEAM_KEY, days: 14 }),
    requires: ["EVAL_TEAM_KEY"],
    checks: [
      expectOk(),
      expectSchema(WeeklySummaryOutput),
      field("narrative is non-empty prose", (s) => s.narrative, isNonEmptyString),
      field("themes is an array", (s) => s.themes, isArray),
    ],
  },
  {
    tool: "weekly_summary",
    name: "by-the-numbers counts are non-negative",
    args: (env) => ({ team_key: env.EVAL_TEAM_KEY, days: 14 }),
    requires: ["EVAL_TEAM_KEY"],
    checks: [
      expectOk(),
      check("completed / in_progress / other counts are all >= 0", (o) => {
        const n = structured(o).by_the_numbers as Record<string, number>;
        for (const k of ["completed", "in_progress", "other_activity"]) {
          if (typeof n[k] !== "number" || n[k] < 0) throw new Error(`bad ${k}: ${String(n[k])}`);
        }
      }),
    ],
  },
];

/** All thirty eval cases, in tool order. */
export const ALL_CASES: EvalCase[] = [
  ...triageCases,
  ...scopeCases,
  ...orphanCases,
  ...velocityCases,
  ...composeCases,
  ...summaryCases,
];
