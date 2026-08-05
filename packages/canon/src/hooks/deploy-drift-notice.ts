import type { HookCell } from '../manifest.js';

// deploy-drift-notice — the SessionStart advisory that answers, before the agent
// acts, whether the doctrine THIS HOST runs is the doctrine the corpus renders.
//
// THE INCIDENT. `~/.claude/agents/<name>.md` and the render tree diverged. An agent
// edited the corpus for a full session under a superseded first principle, and every
// gate in the repository stayed green the entire time — because every gate that
// existed was a claim about how a target is PRODUCED, and none was a claim about what
// a host is RUNNING. The comparison that would have caught it landed with
// `deploy --check`: reachable, correct, and speaking only when asked. A check that
// must be remembered is a check that will be forgotten at exactly the moment it
// matters — the session where the doctrine is already wrong. This cell is what asks.
//
// SILENCE WHEN CLEAN IS THE LOAD-BEARING HALF, not a courtesy. An advisory that fires
// every session trains its reader to skip it, and a skipped advisory is worse than an
// absent one: it occupies the slot where a real warning would have been read. So the
// in-sync path emits nothing at all, and the cost of that path is what makes the
// silence affordable (below).
//
// IT RELAYS A REPORT, IT DOES NOT COMPUTE ONE. `deploy --check` already produces the
// only thing worth saying — per artifact, the rendered lines this host is MISSING and
// the superseded lines it is STILL RUNNING. "3 files differ" does not tell an agent
// its own first principle is stale; the axiom does. Recomputing any of that here would
// put a second home under the one claim that must never fork, and the second home
// would be a shell script.
//
// WHAT IT MAY NOT DO: refuse. `ARCHITECTURE`'s fidelity ladder — a shortfall degrades
// and warns, it never refuses and never widens. A stale deployment must not block a
// session; it must be impossible to start one without being told.
//
// COST, MEASURED (2026-08-05, darwin/arm64, warm page cache, 39 rendered artifacts
// against a deployed `.claude` of ~40 files):
//   clean path, end to end   45 ms  (10 ms shell discovery + ~35 ms comparator)
//   drift path, end to end   60 ms  (the report is longer, and is printed)
//
// RE-MEASURED after the three repairs above, and reported as an A/B rather than as a
// new absolute, because an absolute is a claim about the rig as much as the worker.
// Same corpus, same real deployment, best-of-7, the PREVIOUS worker and this one run
// alternately in one session:
//   previous worker   56 ms clean · 58 ms drift
//   this worker       56 ms clean · 56 ms drift
// The change is free, and the whole spread between 45 and 56 belongs to the harness
// the numbers were taken through (a `sh` under a `bash` under a timestamping
// `python3`), not to anything the worker does. It could not have been otherwise: the
// three facts are SUBSTITUTED AT PROJECTION, so the resolved worker does the same
// three variable assignments it always did, and the one thing that got cheaper is the
// non-zero path, which no longer forks `printf | tail | grep` to recover a verdict.
//
// A FULL BYTE COMPARISON of every rendered artifact is therefore what runs — no
// digest, and above all NO SAMPLE. A sampled check that misses the founding doctrine
// reports "in sync", which is the exact failure this cell exists to end. The
// `deploy-drift-notice` suite re-measures the clean path and fails on a regression, so
// the number above is a held bound rather than a remembered one.
//
// THE CELL NAMES A CAPABILITY, NOT A PATH, and it now ASKS for everything it used to
// infer. `t-shim-path-from-capability`'s law is that a cell must not restate a
// location the projector already computes; the harder companion law is that a cell
// must not GUESS what the projector could have told it. Three guesses lived here and
// all three are gone:
//
//   1. THE COMPARATOR'S NAME was a shell literal, because the forge CLI's name had no
//      compile-time home the way `RUNTIME_BIN` does. It has one now — derived, not
//      declared: `forge/src/bin-name.ts` reads the `bin` key npm itself obeys, so
//      there is one authored spelling in the package and the cell names the fact
//      (`deploy-bin`) rather than repeating it.
//   2. THE HARNESS was assumed to be claude. The tree is still identified by SHAPE —
//      `--out` is an operator's choice and must never be assumed — but the shape it
//      matches is now THIS harness's, because the projector substitutes this
//      harness's hooks-file name (`harness-hooks-file`) and its own name
//      (`harness-name`, passed to the comparator so it audits the right home). A
//      codex session reports on the codex deployment. The pair lives on
//      `HarnessAdapter` and reaches here through projection, which is the only stage
//      that knows which adapter it is rendering for — the alternative was a
//      shell-side copy of the harness registry, a second home for adapter knowledge.
//   3. THE VERDICT was recovered by matching the report's closing line. `deploy
//      --check` exited 1 both when the host was stale and when the check itself
//      failed, so the exit status could not separate them and the worker read the
//      TEXT — coupling a hook worker to the comparator's output FORMAT because its
//      exit CONTRACT could not carry the distinction. The contract carries it now
//      (`forge/src/deploy/check-exit.ts`: 0 in sync · 1 drift · 2 no verdict), and
//      the one code that is forge's choice rather than POSIX's arrives as a fact.
//
// EVERY HOOK WORKER ON EVERY HARNESS HAD (2). This cell is only the first whose job
// made it visible, because it is the first that has to LOOK at the deployed tree
// rather than merely run in it — and the repair is on the shared channel, so the next
// one asks by name instead of rediscovering the blindness.
//
// The `workers[].content` is the TEMPLATE the committed worker at `targetPath`
// regenerates from — resolved bytes, byte-locked by `test/hook-rule-boundary.test.ts`.
// The committed resolution is the CLAUDE one (`COMMITTED_TARGET_HARNESS`), because a
// template with an adapter-relative fact has one resolution per harness and
// `targetPath` names one file; every DEPLOYED copy is resolved for the harness that
// session runs. EDIT THE CELL AND REGENERATE (`pnpm canon:project:targets`) — never
// the committed `.sh` alone.

export const deployDriftNotice: HookCell = {
  id: 'deploy-drift-notice',
  residue:
    'advisory ↾ session.start · deployed ≢ rendered ⇒ emit ⟨superseded-lines ∧ missing-lines ; ¬count · ¬digest · ¬sample⟩ · deployed ≡ rendered ⇒ ∅ ⟨silence-when-clean MANDATORY ⟨fires ∀session ⇒ reader-skips ⇒ worse-than-absent⟩⟩ · verdict ↦ comparator ⟨corpus-owned · ¬face-computed · ¬reimplemented⟩ · corpus ↦ walk-up ⟨cwd · corpus-marker⟩ ⟨∄ ⇒ ∅ ⟨¬in-scope ∴ ¬wrong⟩⟩ · tree ↦ shape ⟨agents ∧ skills ∧ THIS-harness-hooks-file ; ¬named-path⟩ · harness ↦ projection ⟨¬inferred ∴ session-own-deployment⟩ · stale ⊻ ¬ran ↦ exit-code ⟨¬report-text ∴ format ⊥ verdict⟩ · reached ∧ ∄verdict ⇒ SAY-SO ⟨silence ≡ in-sync ∴ ¬borrowable⟩ · ¬block · exit-0 ∀error',
  substrate: 'harness',
  events: ['session.start'],
  entry: 'deploy-drift-notice.sh',
  timeout: 10,
  refs: [],
  speech: [
    {
      id: 'drift',
      text: 'DEPLOY DRIFT — this host runs a SUPERSEDED projection of the canon. In the report below, a `-` line is doctrine THIS SESSION is operating under and the corpus no longer says; a `+` line is what the corpus says and this host never received. Read every `-` line as a false premise, not as background. `pnpm canon:deploy` converges the host.',
    },
    {
      id: 'no-verdict',
      // `%s` is the worker's printf arg for the comparator it actually invoked. A
      // BLIND line naming nothing sends the reader hunting for what failed.
      text: 'DEPLOY DRIFT — the comparator (`%s`) returned no verdict, so whether this host runs the current canon is UNKNOWN. This is not an in-sync report; nothing here establishes that the doctrine in force is the corpus.',
    },
    {
      id: 'no-comparator',
      text: 'DEPLOY DRIFT — this corpus is in scope and its deploy comparator (`%s`) is not installed here, so whether this host runs the current canon is UNKNOWN. Install the workspace dependencies to make the question answerable; until then this is not an in-sync report.',
    },
  ],
  workers: [
    {
      filename: 'deploy-drift-notice.sh',
      targetPath: 'packages/canon/src/toolkit/guardrail/deploy-drift-notice.sh',
      executable: true,
      content: `#!/usr/bin/env sh
# deploy-drift-notice — a SessionStart ADVISORY. It asks the corpus's own deploy
# tool whether the tree this host RUNS is the tree the corpus RENDERS, and speaks
# only when it is not.
#
# WHY (the incident): a deployed agent definition and the render tree diverged, an
# agent ran a superseded first principle for a whole session, and every gate in the
# repository stayed green throughout. The comparison was already reachable —
# \`deploy --check\` — and nothing ran it, so the drift stayed silent by default.
#
# CONTRACT:
#   - SILENT WHEN IN SYNC. An advisory that fires every session trains its reader
#     to skip it, and is then worse than absent.
#   - ADVISORY ONLY. Prints to stdout and exits 0. It never emits
#     {"decision":"block"} — a stale deployment must not block a session.
#   - NEVER SAMPLES. The comparison is the tool's own: whole tree, byte for byte.
#     A sampled check that misses the founding doctrine reports "in sync".
#   - NOT A COUNT. It relays the tool's report, which carries the superseded lines
#     still running and the rendered lines missing.
#
# NOTHING BELOW IS INFERRED THAT PROJECTION COULD STATE. The four values this
# worker cannot compute for itself are SUBSTITUTED into it when the cell is
# rendered — the comparator's name, this harness's name and hooks file, and the
# exit code the comparator returns for drift. A copy of any of them, spelled here,
# would be a second home in a file no compiler reads.
#
# COST: the cell header carries the measurement and its A/B. Not repeated here — a
# number in two places is a number that will disagree with itself. What is worth
# saying at this grain: the discovery below is a small fraction of it, and the rest
# is the comparator reading both trees whole, which is the point.
#
# INPUT  : SessionStart hook JSON on stdin (cwd, session_id, ...).
# OUTPUT : drift -> advisory + the report; unanswerable -> one BLIND line; else none.

set -eu

# A SessionStart hook must never break a session. Any unexpected error -> silence.
trap 'exit 0' EXIT

# ── WHAT PROJECTION TOLD US ────────────────────────────────────────────────────
# The corpus's own deploy tool. ONE authored spelling exists in the whole
# repository — \`packages/forge/package.json\`'s \`bin\` key, the one npm obeys — and
# \`forge/src/bin-name.ts\` derives from it, so this line is that key, relayed.
DEPLOY_TOOL={{fact:deploy-bin}}

# WHICH HARNESS THIS PROJECTION IS FOR. A hook worker is handed no identity by the
# session it runs in, so a worker that must LOOK at a deployed tree had to guess —
# and guessed claude, which made a codex session report on a sibling deployment.
# These two are the adapter's own \`name\` and \`hooksFile\`, substituted at
# projection: the codex render of this cell carries codex's.
HARNESS={{fact:harness-name}}
HARNESS_HOOKS_FILE={{fact:harness-hooks-file}}

# The status the comparator returns when it FOUND drift. \`0\` means success to
# POSIX and needs no telling; this one is the tool's own choice, so it is told.
DRIFT_RC={{fact:deploy-check-drift-code}}

# ── WHERE ARE WE? the corpus, by its own marker ────────────────────────────────
# \`agents.config.ts\` is the file \`deploy\` itself reads to learn which corpus it is
# operating on. Walking up for it asks the same question the tool asks, instead of
# inventing a second convention for "a checkout of the canon".
start="\${CRATYLUS_CORPUS:-}"
if [ -z "$start" ]; then
	input="$(cat 2>/dev/null || true)"
	if command -v jq >/dev/null 2>&1 && [ -n "$input" ]; then
		start="$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null || true)"
	fi
	[ -n "$start" ] || start="\${CLAUDE_PROJECT_DIR:-$PWD}"
fi

root=""
d="$start"
while [ -n "$d" ] && [ "$d" != "/" ]; do
	if [ -f "$d/agents.config.ts" ]; then
		root="$d"
		break
	fi
	d="\${d%/*}"
done
# NO CORPUS IN SCOPE IS SILENCE, and it is not the "clean" silence above. A session
# outside every checkout has no rendered doctrine to be compared against, so there is
# nothing here this hook could be right or wrong about — and speaking would fire it on
# every unrelated session, which is the one failure that makes an advisory worthless.
[ -n "$root" ] || exit 0

# ── WHICH TREE? this harness's render tree, by its SHAPE ───────────────────────
# A render tree is recognized by BEING one: \`agents/\` + \`skills/\` + THIS harness's
# own hooks file. That file is what distinguishes this harness's tree from another
# harness's tree sitting beside it, and it is named by projection rather than by
# this script — so a codex render of this worker skips the claude tree and a claude
# render skips the codex one. The \`--out\` dir is an operator's choice, so the tree
# is discovered, never named.
tree="\${CRATYLUS_RENDER_TREE:-}"
if [ -z "$tree" ]; then
	for c in "$root"/.render* "$root"/*/.render* "$root"/*/*/.render*; do
		case "$c" in
		*/node_modules/*) continue ;;
		esac
		[ -d "$c/agents" ] && [ -d "$c/skills" ] && [ -f "$c/$HARNESS_HOOKS_FILE" ] || continue
		tree="$c"
		break
	done
fi
# A corpus that has rendered nothing for THIS harness has nothing to be compared
# against — the same not-in-scope silence, one step in.
[ -n "$tree" ] || exit 0

# ── WHAT ASKS? the tool, never a reimplementation ──────────────────────────────
cli="\${CRATYLUS_DEPLOY_CHECK:-}"
if [ -z "$cli" ]; then
	if [ -x "$root/node_modules/.bin/$DEPLOY_TOOL" ]; then
		cli="$root/node_modules/.bin/$DEPLOY_TOOL"
	elif command -v "$DEPLOY_TOOL" >/dev/null 2>&1; then
		cli="$DEPLOY_TOOL"
	fi
fi
if [ -z "$cli" ]; then
	printf '{{speech:no-comparator}}\\n' "$DEPLOY_TOOL"
	exit 0
fi

# \`--harness\` is what makes the audited HOME this session's. Without it the tool
# resolves its default root, so a codex tree would be compared against the claude
# deployment — a report that is about neither.
# The tool reports and repairs nothing, so it is safe to point at a host mid-work.
set +e
out="$("$cli" deploy --check \\
	--harness "$HARNESS" \\
	--agents-dir "$tree/agents" \\
	--skills-dir "$tree/skills" \\
	--hooks-dir "$tree" 2>&1)"
rc=$?
set -e

# rc 0 IS the tool's verdict that no artifact is stale and none is absent (a foreign
# artifact is reported by it, and is not a defect). The silence is earned here, and
# nowhere else — every other exit takes a branch below.
[ "$rc" -ne 0 ] || exit 0

# WHICH KIND OF NON-ZERO — asked of the EXIT CODE, which is a contract, and not of
# the report's wording, which is a format. Drift has a code of its own; everything
# else that is not success is the check failing to produce a verdict, including the
# codes this worker was never told about (a crash, a signal, a missing file). The
# two demand opposite responses: relaying a broken tool as drift fabricates a
# verdict, and relaying it as silence is the bypass-by-omission this cell exists to
# end.
if [ "$rc" -eq "$DRIFT_RC" ]; then
	printf '%s\\n' '{{speech:drift}}'
	printf '%s\\n' "$out"
else
	printf '{{speech:no-verdict}}\\n' "$cli"
fi
exit 0
`,
    },
  ],
};
