import { describe, it, expect } from "vitest";
import { WeeklySummaryInput, WeeklySummaryOutput, LlmSummary } from "../src/tools/weekly-summary.js";

/** Day 5 schema-contract tests for `weekly_summary` (happy + error paths). */

describe("weekly_summary — input schema", () => {
  it("happy path: applies the default window", () => {
    expect(WeeklySummaryInput.parse({ team_key: "BD" }).days).toBe(7);
  });

  it("happy path: accepts a custom window", () => {
    expect(WeeklySummaryInput.parse({ team_key: "BD", days: 30 }).days).toBe(30);
  });

  it("error path: rejects a missing team_key", () => {
    expect(WeeklySummaryInput.safeParse({ days: 7 }).success).toBe(false);
  });

  it("error path: rejects days above 60", () => {
    expect(WeeklySummaryInput.safeParse({ team_key: "BD", days: 90 }).success).toBe(false);
  });
});

describe("weekly_summary — LlmSummary schema", () => {
  it("happy path: accepts a narrative with themes", () => {
    expect(
      LlmSummary.safeParse({ narrative: "A steady week.", themes: ["Reliability", "Cleanup"] })
        .success,
    ).toBe(true);
  });

  it("error path: rejects a missing narrative", () => {
    expect(LlmSummary.safeParse({ themes: ["x"] }).success).toBe(false);
  });
});

describe("weekly_summary — output schema", () => {
  const validPayload = {
    team: { key: "BD", name: "Backend" },
    period: { since: "2026-05-08T00:00:00.000Z", until: "2026-05-15T00:00:00.000Z", days: 7 },
    narrative: "The team spent the week hardening checkout and clearing backlog debt.",
    themes: ["Checkout reliability", "Backlog cleanup"],
    by_the_numbers: { completed: 5, in_progress: 3, other_activity: 2 },
    model: "claude-sonnet-4-6",
    usage: { input_tokens: 950, output_tokens: 720, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    generated_at: "2026-05-15T12:00:00.000Z",
  };

  it("happy path: accepts a well-formed payload", () => {
    expect(WeeklySummaryOutput.safeParse(validPayload).success).toBe(true);
  });

  it("error path: rejects a by_the_numbers block missing a field", () => {
    const bad = { ...validPayload, by_the_numbers: { completed: 5, in_progress: 3 } };
    expect(WeeklySummaryOutput.safeParse(bad).success).toBe(false);
  });
});
