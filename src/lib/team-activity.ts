import { getLinearClient } from "./linear-client.js";

/**
 * Shared team-activity fetch for the two narrative tools (compose_update,
 * weekly_summary). Both need the same underlying data — what a team touched
 * recently — and categorize it differently, so the fetch lives here once.
 */

export interface ActivityIssue {
  identifier: string;
  title: string;
  url: string;
  state: string;
  /** Linear workflow-state category: triage | backlog | unstarted | started | completed | canceled. */
  state_type: string;
  assignee: string | null;
  completed_at: string | null;
  updated_at: string;
  priority: string;
}

export interface TeamActivity {
  team: { key: string; name: string };
  issues: ActivityIssue[];
}

const ACTIVITY_QUERY = `
  query TeamActivity($key: String!, $filter: IssueFilter!) {
    teams(filter: { key: { eq: $key } }, first: 1) {
      nodes {
        name
        key
        issues(filter: $filter, first: 100) {
          nodes {
            identifier
            title
            url
            updatedAt
            completedAt
            priorityLabel
            state { name type }
            assignee { name }
          }
        }
      }
    }
  }
`;

interface RawIssue {
  identifier: string;
  title: string;
  url: string;
  updatedAt: string;
  completedAt: string | null;
  priorityLabel: string;
  state: { name: string; type: string } | null;
  assignee: { name: string } | null;
}

interface ActivityQueryData {
  teams: {
    nodes: Array<{ name: string; key: string; issues: { nodes: RawIssue[] } }>;
  };
}

type ActivityVars = { key: string; filter: Record<string, unknown> };

/**
 * Fetches every issue for `teamKey` updated since `sinceISO`.
 *
 * @returns the team's activity, or an `{ error }` object carrying a
 *   user-facing message (team not found, or an upstream API rejection).
 */
export async function fetchTeamActivity(
  teamKey: string,
  sinceISO: string,
): Promise<TeamActivity | { error: string }> {
  const linear = getLinearClient();
  const response = await linear.client.rawRequest<ActivityQueryData, ActivityVars>(ACTIVITY_QUERY, {
    key: teamKey,
    filter: { updatedAt: { gt: sinceISO } },
  });

  if (response.errors && response.errors.length > 0) {
    return {
      error: `Linear API rejected the activity query: ${response.errors
        .map((e) => e.message)
        .join("; ")}`,
    };
  }

  const team = response.data?.teams.nodes[0];
  if (!team) {
    return { error: `No Linear team found with key "${teamKey}". Check the team key and try again.` };
  }

  const issues: ActivityIssue[] = team.issues.nodes.map((i) => ({
    identifier: i.identifier,
    title: i.title,
    url: i.url,
    state: i.state?.name ?? "Unknown",
    state_type: i.state?.type ?? "unknown",
    assignee: i.assignee?.name ?? null,
    completed_at: i.completedAt,
    updated_at: i.updatedAt,
    priority: i.priorityLabel,
  }));

  return { team: { key: team.key, name: team.name }, issues };
}

/** Splits a team's issues into the three buckets the narrative tools report on. */
export function categorize(issues: ActivityIssue[]): {
  completed: ActivityIssue[];
  in_progress: ActivityIssue[];
  other: ActivityIssue[];
} {
  const completed: ActivityIssue[] = [];
  const in_progress: ActivityIssue[] = [];
  const other: ActivityIssue[] = [];
  for (const issue of issues) {
    if (issue.state_type === "completed" || issue.completed_at !== null) {
      completed.push(issue);
    } else if (issue.state_type === "started") {
      in_progress.push(issue);
    } else {
      other.push(issue);
    }
  }
  return { completed, in_progress, other };
}
