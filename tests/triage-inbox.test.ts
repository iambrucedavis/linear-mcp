import { describe, it, expect } from "vitest";
import {
  TriageInboxInput,
  TriageInboxOutput,
  TriageItem,
  LlmTriage,
} from "../src/tools/triage-inbox.js";

/**
 * Day 2 unit tests for `triage_inbox`.
 *
 * These exercise the schema contracts — the part of the tool that runs without
 * a live Linear or Anthropic call. The full live eval harness lands on Day 8;
 * this is the "every tool gets a happy-path and an error-path test" baseline.
 */

describe("triage_inbox — input schema", () => {
  it("happy path: applies defaults when given an empty object", () => {
    const parsed = TriageInboxInput.parse({});
    expect(parsed.unread_only).toBe(true);
    expect(parsed.max_count).toBe(20);
  });

  it("happy path: accepts valid explicit values", () => {
    expect(TriageInboxInput.parse({ unread_only: false, max_count: 5 })).toEqual({
      unread_only: false,
      max_count: 5,
    });
  });

  it("error path: rejects max_count above the limit of 50", () => {
    expect(TriageInboxInput.safeParse({ max_count: 999 }).success).toBe(false);
  });

  it("error path: rejects max_count below 1", () => {
    expect(TriageInboxInput.safeParse({ max_count: 0 }).success).toBe(false);
  });

  it("error path: rejects a non-integer max_count", () => {
    expect(TriageInboxInput.safeParse({ max_count: 3.5 }).success).toBe(false);
  });

  it("error path: rejects a wrong-typed unread_only", () => {
    expect(TriageInboxInput.safeParse({ unread_only: "yes" }).success).toBe(false);
  });
});

const VALID_ITEM = {
  notification_id: "notif_abc",
  notification_type: "issueAssignedToYou",
  title: "Fix the login redirect bug",
  issue_identifier: "BD-12",
  issue_url: "https://linear.app/acme/issue/BD-12",
  priority: "high" as const,
  summary: "You were assigned a login redirect bug.",
  suggested_action: "Start work, or re-assign if you lack context.",
  is_read: false,
  created_at: "2026-05-15T12:00:00.000Z",
};

describe("triage_inbox — output schema", () => {
  const validPayload = {
    triaged: [VALID_ITEM],
    total_fetched: 1,
    total_triaged: 1,
    unread_only: true,
    model: "claude-haiku-4-5",
    usage: {
      input_tokens: 420,
      output_tokens: 110,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    },
    generated_at: "2026-05-15T12:00:01.000Z",
  };

  it("happy path: accepts a well-formed triage payload", () => {
    expect(TriageInboxOutput.safeParse(validPayload).success).toBe(true);
  });

  it("happy path: accepts an empty inbox (no notifications)", () => {
    expect(
      TriageInboxOutput.safeParse({ ...validPayload, triaged: [], total_triaged: 0 }).success,
    ).toBe(true);
  });

  it("error path: rejects an invalid priority value", () => {
    const bad = { ...validPayload, triaged: [{ ...VALID_ITEM, priority: "critical" }] };
    expect(TriageInboxOutput.safeParse(bad).success).toBe(false);
  });

  it("error path: rejects a payload missing the usage block", () => {
    const { usage, ...withoutUsage } = validPayload;
    void usage;
    expect(TriageInboxOutput.safeParse(withoutUsage).success).toBe(false);
  });
});

describe("triage_inbox — TriageItem schema", () => {
  it("happy path: allows a null issue_url (non-issue notifications)", () => {
    expect(
      TriageItem.safeParse({ ...VALID_ITEM, issue_identifier: null, issue_url: null }).success,
    ).toBe(true);
  });
});

describe("triage_inbox — LlmTriage schema (model output contract)", () => {
  it("happy path: accepts the judgment-only shape Claude is asked to produce", () => {
    const result = LlmTriage.safeParse({
      triaged: [
        {
          notification_id: "notif_abc",
          priority: "normal",
          summary: "A comment was added to an issue you follow.",
          suggested_action: "Read when convenient — no action needed.",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("error path: rejects a model item missing suggested_action", () => {
    const result = LlmTriage.safeParse({
      triaged: [{ notification_id: "notif_abc", priority: "low", summary: "FYI." }],
    });
    expect(result.success).toBe(false);
  });
});
