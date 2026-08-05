// ─────────────────────────────────────────────────────────────────────────────
// `deploy --check`'s EXIT CONTRACT — three outcomes, three codes, one home.
//
// THE DEFECT THIS RETIRES. The check exited `1` both when the HOST was stale and
// when the CHECK ITSELF failed. Those demand opposite responses from a caller,
// and the caller that most needed to tell them apart — the SessionStart drift
// advisory — could only do it by matching the report's closing VERDICT LINE with
// `grep`. That coupled a hook worker to the comparator's output FORMAT because
// its exit CONTRACT could not carry the distinction: reformat the report and the
// advisory silently reclassifies a stale host as a broken tool.
//
// WHY NOT `--json`. It trades an exit-code contract for a parsing contract — the
// same coupling one layer down, with every existing caller still reading the
// code anyway. The distinction belongs in the channel every caller already reads.
//
// THE THIRD CODE IS A REFUSAL, NOT A FAILURE REPORT. `noVerdict` says nothing
// about the host: it says this process never got far enough to have an opinion.
// A caller that maps it to `inSync` has manufactured an exoneration out of a
// crash, and a caller that maps it to `drift` has fabricated a verdict — which
// is why it is a code of its own rather than a shade of either.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The process exit status `cratylus deploy --check` returns.
 *
 * A CLOSED THREE-WAY, and the reason it is a table rather than three literals at
 * three `return` sites: the codes are read by a shell worker that cannot import
 * them, so the projector hands one across as the `deploy-check-drift-code` fact.
 * A value that travels out of the language needs a name inside it first.
 */
export const DEPLOY_CHECK_EXIT = {
  /** The deployed tree IS what the corpus renders. */
  inSync: 0,
  /**
   * The host is running superseded bytes, or never received rendered ones. OUR
   * defect, and the report above the code names each artifact and each line.
   */
  drift: 1,
  /**
   * The check could not run — bad arguments, an unreadable tree, an unknown
   * harness. NOT a claim about the host in either direction.
   */
  noVerdict: 2,
} as const;

// THE RESIDUAL, and it is real rather than an alibi. `drift` is `1`, which is also
// what a Node process exits with when it dies before this module's code is reached
// at all — an import that fails, a runtime that will not start. A caller reading
// only the code would relay that crash as a stale host.
//
// Every failure that happens INSIDE the command is covered: `runDeployCheck`
// catches around everything after its sink is bound (including adapter selection,
// which used to throw past the catch), and the CLI's argument refusals return
// `noVerdict` when a verdict was asked for. What is left is the window before the
// program exists, which no exit code of ours can occupy.
//
// IT IS NOT CLOSED BY RE-READING THE REPORT. That was the previous design, and the
// cost was that a hook worker's correctness became a function of the comparator's
// output format — the coupling this contract exists to remove. Nor is it closed by
// renumbering so that `drift` is a code an accident cannot produce: `--check` tools
// exit `1` on "found something" by long convention (`grep`, `git diff
// --exit-code`), and every operator's CI already reads it that way. The residual is
// smaller than either repair, and it is loud when it happens: the advisory relays
// the tool's own bytes, so a reader gets a stack trace where a diff belongs.

/** One of the three statuses above. */
export type DeployCheckExit =
  (typeof DEPLOY_CHECK_EXIT)[keyof typeof DEPLOY_CHECK_EXIT];
