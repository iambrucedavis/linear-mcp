/**
 * seed-demo.mjs — populate a fresh Linear workspace with a realistic demo
 * project so the six tools have real data to work on.
 *
 * This is a one-off dev utility, NOT part of the MCP server. The server is
 * read-only by design; this script is the only thing here that writes to
 * Linear, and it's deliberately separate.
 *
 *   node scripts/seed-demo.mjs
 */
import { join } from "node:path";
import { LinearClient } from "@linear/sdk";

try {
  process.loadEnvFile(join(import.meta.dirname, "..", ".env"));
} catch {
  /* env may already be set */
}

const apiKey = process.env.LINEAR_API_KEY;
if (!apiKey) {
  console.error("LINEAR_API_KEY is not set. Put it in .env first.");
  process.exit(1);
}

const linear = new LinearClient({ apiKey });

// ---------------------------------------------------------------------------
// Demo issues — a believable web-app team backlog.
// state: backlog | unstarted | started | completed
// priority: 1 urgent · 2 high · 3 normal · 4 low · 0 none
// ---------------------------------------------------------------------------
const ISSUES = [
  {
    title: "Add CSV export to the reporting dashboard",
    state: "backlog",
    priority: 3,
    assign: true,
    description:
      "We've had three customer requests this month for getting report data out of the dashboard. Right now it's view-only. We need an export — probably CSV. Should cover the main reporting tables. Not sure if it needs to respect the date-range filters or just export everything. Whatever we do, it can't time out on the big accounts.",
  },
  { title: "Login redirect loops on Safari after SSO", state: "started", priority: 1, assign: true },
  { title: "Orders endpoint p95 latency is over 2 seconds", state: "started", priority: 2, assign: true },
  { title: "Rate-limit the public API", state: "unstarted", priority: 2, assign: false },
  { title: "Dark mode button contrast fails WCAG AA", state: "unstarted", priority: 3, assign: false },
  { title: "Flaky integration test in the checkout suite", state: "backlog", priority: 4, assign: true, blocked: true },
  { title: "Migrate the auth service to the new token format", state: "started", priority: 2, assign: true, blocked: true },
  { title: "Onboarding drops users at the workspace step", state: "unstarted", priority: 2, assign: true },
  { title: "Add pagination to global search results", state: "backlog", priority: 3, assign: false },
  { title: "Webhook retries overwhelm the billing service", state: "started", priority: 1, assign: true },
  { title: "Upgrade Node to 22 LTS across all services", state: "completed", priority: 3, assign: true },
  { title: "Fix timezone bug in the weekly digest email", state: "completed", priority: 3, assign: true },
  { title: "Add an empty state to the projects list", state: "completed", priority: 4, assign: true },
  { title: "Null dereference in the invoice renderer (Sentry)", state: "completed", priority: 2, assign: true },
  { title: "Document the deploy rollback procedure", state: "completed", priority: 4, assign: true },
  { title: "Q2 cycle 3 retro — action items", state: "backlog", priority: 3, assign: false },
];

async function main() {
  const viewer = await linear.viewer;
  console.error(`Signed in as ${viewer.name} <${viewer.email}>`);

  const teams = await linear.teams();
  const team = teams.nodes[0];
  if (!team) {
    console.error("No team found in this workspace. Create a team in Linear first.");
    process.exit(1);
  }
  console.error(`Using team: ${team.name} (${team.key})`);

  // Workflow states, mapped by type.
  const states = (await team.states()).nodes;
  const stateByType = {};
  for (const s of states) {
    if (!stateByType[s.type]) stateByType[s.type] = s.id;
  }

  // "Blocked" label — reuse if it exists, else create it.
  const labels = (await team.labels()).nodes;
  let blockedLabelId = labels.find((l) => /blocked/i.test(l.name))?.id;
  if (!blockedLabelId) {
    const created = await linear.createIssueLabel({ teamId: team.id, name: "Blocked", color: "#eb5757" });
    blockedLabelId = (await created.issueLabel)?.id;
    console.error("Created label: Blocked");
  }

  let made = 0;
  for (const spec of ISSUES) {
    const input = {
      teamId: team.id,
      title: spec.title,
      priority: spec.priority,
    };
    if (spec.description) input.description = spec.description;
    if (spec.assign) input.assigneeId = viewer.id;
    if (stateByType[spec.state]) input.stateId = stateByType[spec.state];
    if (spec.blocked && blockedLabelId) input.labelIds = [blockedLabelId];

    const payload = await linear.createIssue(input);
    const issue = await payload.issue;
    made += 1;
    console.error(`  + ${issue?.identifier ?? "?"}  ${spec.title}`);
  }

  console.error(`\nDone. Created ${made} issues in ${team.name}.`);
}

main().catch((err) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
