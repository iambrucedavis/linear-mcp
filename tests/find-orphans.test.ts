import { describe, it, expect } from "vitest";
import { FindOrphansInput, FindOrphansOutput, LlmOrphanSummaries } from "../src/tools/find-orphans.js";

/** Day 4 schema-contract tests for `find_orphans` (happy + error paths). */

describe("find_orphans — input schema", () => {
  it("happy path: applies defaults", () => {
    const parsed = FindOrphansInput.parse({});
    expect(parsed.stale_days).toBe(14);
    expect(parsed.max_count).toBe(30);
    expect(parsed.team_key).toBeUndefined();
  });

  it("happy path: accepts an explicit team_key", () => {
    expect(FindOrphansInput.parse({ team_key: "BD" }).team_key).toBe("BD");
  });

  it("error path: rejects stale_days above 365", () => {
    expect(FindOrphansInput.safeParse({ stale_days: 999 }).success).toBe(false);
  });

  it("error path: rejects max_count of zero", () => {
    expect(FindOrphansInput.safeParse({ max_count: 0 }).success).toBe(false);
  });
});

describe("find_orphans — LlmOrphanSummaries schema", () => {
  it("happy path: accepts identifier/summary pairs", () => {
    const result = LlmOrphanSummaries.safeParse({
      summaries: [{ identifier: "BD-9", summary: "Stale 40 days — assign or close." }],
    });
    expect(result.success).toBe(true);
  });

  it("error path: rejects a summary entry missing the identifier", () => {
    expect(LlmOrphanSummaries.safeParse({ summaries: [{ summary: "x" }] }).success).toBe(false);
  });
});

describe("find_orphans — output schema", () => {
  const validPayload = {
    orphans: [
      {
        identifier: "BD-9",
        title: "Old migration task",
        url: "https://linear.app/acme/issue/BD-9",
        reasons: ["stale", "unassigned"],
        days_since_update: 41,
        state: "Backlog",
        priority: "Medium",
        assignee: null,
        summary: "Untouched for 41 days and unassigned — assign an owner or close it.",
      },
    ],
    total_orphans: 1,
    stale_threshold_days: 14,
    team_key: null,
    model: "claude-haiku-4-5",
    usage: { input_tokens: 200, output_tokens: 90, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    generated_at: "2026-05-15T12:00:00.000Z",
  };

  it("happy path: accepts a well-formed payload", () => {
    expect(FindOrphansOutput.safeParse(validPayload).success).toBe(true);
  });

  it("happy path: accepts an empty orphans list", () => {
    expect(
      FindOrphansOutput.safeParse({ ...validPayload, orphans: [], total_orphans: 0 }).success,
    ).toBe(true);
  });

  it("error path: rejects an unknown orphan reason", () => {
    const bad = { ...validPayload, orphans: [{ ...validPayload.orphans[0], reasons: ["misplaced"] }] };
    expect(FindOrphansOutput.safeParse(bad).success).toBe(false);
  });
});
