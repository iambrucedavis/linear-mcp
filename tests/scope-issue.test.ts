import { describe, it, expect } from "vitest";
import { ScopeIssueInput, ScopeIssueOutput, LlmScope } from "../src/tools/scope-issue.js";

/** Day 3 schema-contract tests for `scope_issue` (happy + error paths). */

describe("scope_issue — input schema", () => {
  it("happy path: accepts a Linear identifier", () => {
    expect(ScopeIssueInput.parse({ issue_id: "BD-123" })).toEqual({ issue_id: "BD-123" });
  });

  it("error path: rejects an empty issue_id", () => {
    expect(ScopeIssueInput.safeParse({ issue_id: "" }).success).toBe(false);
  });

  it("error path: rejects a missing issue_id", () => {
    expect(ScopeIssueInput.safeParse({}).success).toBe(false);
  });
});

const VALID_LLM_SCOPE = {
  subtasks: [{ title: "Add the endpoint", rationale: "Core of the feature." }],
  acceptance_criteria: ["Returns 200 with a JSON body for a valid request."],
  risks: [{ risk: "Schema migration needed", severity: "medium" as const, mitigation: "Ship behind a flag." }],
  effort_estimate: { points: 3, confidence: "medium" as const, reasoning: "Well-understood work." },
  open_questions: ["Should this be rate-limited?"],
};

describe("scope_issue — LlmScope schema (model output contract)", () => {
  it("happy path: accepts a well-formed breakdown", () => {
    expect(LlmScope.safeParse(VALID_LLM_SCOPE).success).toBe(true);
  });

  it("happy path: accepts empty risks and open_questions", () => {
    expect(
      LlmScope.safeParse({ ...VALID_LLM_SCOPE, risks: [], open_questions: [] }).success,
    ).toBe(true);
  });

  it("error path: rejects an invalid risk severity", () => {
    const bad = {
      ...VALID_LLM_SCOPE,
      risks: [{ risk: "x", severity: "critical", mitigation: "y" }],
    };
    expect(LlmScope.safeParse(bad).success).toBe(false);
  });

  it("error path: rejects an effort estimate missing confidence", () => {
    const bad = { ...VALID_LLM_SCOPE, effort_estimate: { points: 3, reasoning: "x" } };
    expect(LlmScope.safeParse(bad).success).toBe(false);
  });
});

describe("scope_issue — output schema", () => {
  const validPayload = {
    issue: {
      identifier: "BD-123",
      title: "Add CSV export",
      url: "https://linear.app/acme/issue/BD-123",
      current_state: "Todo",
      current_estimate: null,
      team: "Backend",
    },
    ...VALID_LLM_SCOPE,
    model: "claude-sonnet-4-6",
    usage: {
      input_tokens: 900,
      output_tokens: 600,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    },
    generated_at: "2026-05-15T12:00:00.000Z",
  };

  it("happy path: accepts a well-formed scope payload", () => {
    expect(ScopeIssueOutput.safeParse(validPayload).success).toBe(true);
  });

  it("error path: rejects a payload missing the issue facts block", () => {
    const { issue, ...withoutIssue } = validPayload;
    void issue;
    expect(ScopeIssueOutput.safeParse(withoutIssue).success).toBe(false);
  });
});
