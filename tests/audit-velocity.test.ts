import { describe, it, expect } from "vitest";
import {
  AuditVelocityInput,
  AuditVelocityOutput,
  LlmVelocityDiagnosis,
} from "../src/tools/audit-velocity.js";

/** Day 4 schema-contract tests for `audit_velocity` (happy + error paths). */

describe("audit_velocity — input schema", () => {
  it("happy path: applies the default cycle_count", () => {
    expect(AuditVelocityInput.parse({ team_key: "BD" }).cycle_count).toBe(4);
  });

  it("error path: rejects a missing team_key", () => {
    expect(AuditVelocityInput.safeParse({ cycle_count: 4 }).success).toBe(false);
  });

  it("error path: rejects cycle_count below 2", () => {
    expect(AuditVelocityInput.safeParse({ team_key: "BD", cycle_count: 1 }).success).toBe(false);
  });

  it("error path: rejects cycle_count above 12", () => {
    expect(AuditVelocityInput.safeParse({ team_key: "BD", cycle_count: 13 }).success).toBe(false);
  });
});

const VALID_DIAGNOSIS = {
  trend: "stable" as const,
  diagnosis: "Throughput held between 19 and 22 points across all four cycles — steady delivery.",
  contributing_factors: ["Consistent planning; completed scope tracks planned scope closely."],
  recommendations: [],
};

describe("audit_velocity — LlmVelocityDiagnosis schema", () => {
  it("happy path: accepts a well-formed diagnosis", () => {
    expect(LlmVelocityDiagnosis.safeParse(VALID_DIAGNOSIS).success).toBe(true);
  });

  it("error path: rejects an invalid trend value", () => {
    expect(LlmVelocityDiagnosis.safeParse({ ...VALID_DIAGNOSIS, trend: "crashing" }).success).toBe(
      false,
    );
  });
});

describe("audit_velocity — output schema", () => {
  const validPayload = {
    team: { key: "BD", name: "Backend" },
    cycles: [
      {
        number: 11,
        name: "Cycle 11",
        starts_at: "2026-04-01T00:00:00.000Z",
        ends_at: "2026-04-14T00:00:00.000Z",
        completed_scope: 21,
        planned_scope: 24,
        completed_issues: 9,
        planned_issues: 11,
      },
    ],
    ...VALID_DIAGNOSIS,
    model: "claude-sonnet-4-6",
    usage: { input_tokens: 700, output_tokens: 400, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    generated_at: "2026-05-15T12:00:00.000Z",
  };

  it("happy path: accepts a well-formed payload", () => {
    expect(AuditVelocityOutput.safeParse(validPayload).success).toBe(true);
  });

  it("error path: rejects a payload missing the team block", () => {
    const { team, ...withoutTeam } = validPayload;
    void team;
    expect(AuditVelocityOutput.safeParse(withoutTeam).success).toBe(false);
  });
});
