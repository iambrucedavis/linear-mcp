import { runAllEvals } from "./harness.js";
import { ALL_CASES } from "./cases.js";

/**
 * Eval harness entry point. Run with `npm run eval`.
 *
 * Builds the server, drives it through a real MCP client, runs all 30
 * ground-truth cases, writes `docs/EVAL_RESULTS.md`, and exits non-zero if any
 * graded case failed (so it can gate CI once live keys are available).
 */
const failed = await runAllEvals(ALL_CASES);
process.exit(failed > 0 ? 1 : 0);
