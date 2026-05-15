import { describe, it, expect } from "vitest";
import { ComposeUpdateInput, ComposeUpdateOutput, LlmUpdate } from "../src/tools/compose-update.js";

/** Day 5 schema-contract tests for `compose_update` (happy + error paths). */

describe("compose_update — input schema", () => {
  it("happy path: applies defaults", () => {
    const parsed = ComposeUpdateInput.parse({ team_key: "BD" });
    expect(parsed.days).toBe(7);
    expect(parsed.format).toBe("slack");
  });

  it("happy path: accepts voice samples and an email format", () => {
    const parsed = ComposeUpdateInput.parse({
      team_key: "BD",
      format: "email",
      voice_samples: ["Hey team — quick update.", "Shipped a lot this week."],
    });
    expect(parsed.format).toBe("email");
    expect(parsed.voice_samples).toHaveLength(2);
  });

  it("error path: rejects an unknown format", () => {
    expect(ComposeUpdateInput.safeParse({ team_key: "BD", format: "telegram" }).success).toBe(false);
  });

  it("error path: rejects more than 5 voice samples", () => {
    const six = Array.from({ length: 6 }, (_, i) => `sample ${i}`);
    expect(ComposeUpdateInput.safeParse({ team_key: "BD", voice_samples: six }).success).toBe(false);
  });

  it("error path: rejects a missing team_key", () => {
    expect(ComposeUpdateInput.safeParse({ days: 7 }).success).toBe(false);
  });
});

describe("compose_update — LlmUpdate schema", () => {
  it("happy path: accepts a draft with highlights", () => {
    expect(
      LlmUpdate.safeParse({ draft: "We shipped checkout v2.", highlights: ["Checkout v2 is live."] })
        .success,
    ).toBe(true);
  });

  it("error path: rejects a missing draft", () => {
    expect(LlmUpdate.safeParse({ highlights: ["x"] }).success).toBe(false);
  });
});

describe("compose_update — output schema", () => {
  const validPayload = {
    team: { key: "BD", name: "Backend" },
    period: { since: "2026-05-08T00:00:00.000Z", until: "2026-05-15T00:00:00.000Z", days: 7 },
    format: "slack" as const,
    draft: "This week the team shipped CSV export and started on rate limiting.",
    highlights: ["CSV export shipped.", "Rate limiting underway."],
    activity_counts: { completed: 3, in_progress: 2, other: 1 },
    voice_samples_used: 0,
    model: "claude-sonnet-4-6",
    usage: { input_tokens: 800, output_tokens: 500, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    generated_at: "2026-05-15T12:00:00.000Z",
  };

  it("happy path: accepts a well-formed payload", () => {
    expect(ComposeUpdateOutput.safeParse(validPayload).success).toBe(true);
  });

  it("error path: rejects an activity_counts block missing a field", () => {
    const bad = { ...validPayload, activity_counts: { completed: 3, in_progress: 2 } };
    expect(ComposeUpdateOutput.safeParse(bad).success).toBe(false);
  });
});
