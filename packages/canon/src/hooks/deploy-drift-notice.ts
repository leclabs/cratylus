import type { HookCell } from '../manifest.js';

// deploy-drift-notice — the advisory that answers, before the agent acts, whether
// the doctrine THIS HOST runs is the doctrine the corpus renders.
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
// IT ASKS AGAIN, BECAUSE THE HOST GOES STALE MID-SESSION. Bound to `session.start`
// alone, the cell answered a question that expires: a projection landing during the
// session it was authored in left the rest of that session running the superseded
// copy with nothing further to say. That is not hypothetical and it is not rare —
// it is the ORDINARY shape of work here, where a session edits a cell, projects it,
// and keeps going under the version it just replaced. The 16-hour-old projection of
// an agent's own governing cell was this; so was a `praxis` edit that landed under a
// running session hours later.
//
// `prompt.submit` IS THE RE-ARM, and it is the same question at a finer grain rather
// than a second mechanism. Both events put the notice in the one position that makes
// it worth having — BEFORE the agent acts on an instruction — and on both harnesses
// the answer reaches the agent's own context, which is where a false premise has to
// be corrected because the agent is the thing holding it. `turn.end` was the runner-up
// and is the wrong end of the turn: it speaks after the acting is done, and on claude
// its stdout lands in the transcript rather than in the context of the reader who
// needs it. `file.edit.post` was rejected as a category error — a cell EDIT is not
// drift; drift begins when the render tree moves, which happens under a shell command.
//
// A RE-ARM IS ONLY AS GOOD AS ITS SILENCE, and this one is where the silence had to be
// re-earned. Fired every prompt, an unchanged verdict would repeat the same advisory
// until the reader stopped seeing it — the exact failure the in-sync path was built to
// avoid, re-entering through the door held open for the fix. So the trigger is a CHANGE
// in the verdict, never a verdict that is merely non-empty: the worker records the last
// verdict this session was told (keyed by ⟨harness, session⟩, carrying ⟨corpus, tree⟩ so
// the same session moved to another checkout asks a fresh question) and speaks only when
// the new one differs. Said once, a standing drift is then silent until it changes or is
// repaired. THE CLEAN VERDICT IS RECORDED TOO, and that is what makes a REAPPEARING drift
// audible: without it, drift → deploy → the identical drift again would match the stale
// record and say nothing.
//
// NO SESSION IDENTITY MEANS NO SUPPRESSION, deliberately, in that direction. When the
// payload carries no usable `session_id` or the state cannot be written, every run
// speaks. A repeated advisory under genuine drift is noise the operator can end with one
// command; a suppressed one is silence, and this cell's own residue says silence is
// borrowed from the in-sync path and may never be handed to any other.
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
// RE-MEASURED AGAIN for the re-arm, same rig, same A/B discipline (best-of-7, the two
// workers run alternately; the clean leg against a fixture host deployed from this
// corpus's own render tree, so it is a real in-sync verdict rather than an early exit):
//   previous worker   62 ms clean · 62 ms drift
//   this worker       60 ms clean · 64 ms drift
// Per run it is free — the state costs one `cat` and one small write, which is under
// this rig's noise. THE COST THAT ACTUALLY CHANGED IS FREQUENCY, and saying so is the
// point of measuring: the hook now runs once per PROMPT rather than once per session,
// so a 40-prompt session pays ~2.4 s of wall clock it did not pay before, spread across
// 40 moments where the agent is already waiting on a model. That is the price of not
// running superseded doctrine for the other 39 of them, and it is the trade this cell
// exists to take. The per-run number is what keeps it payable, which is why the bound
// is held by a test rather than remembered.
//
// A FULL BYTE COMPARISON of every rendered artifact is therefore what runs — no
// digest, and above all NO SAMPLE. A sampled check that misses the founding doctrine
// reports "in sync", which is the exact failure this cell exists to end. The
// `deploy-drift-notice` suite re-measures the clean path and fails on a regression, so
// the number above is a held bound rather than a remembered one.
//
// THE CELL NAMES A CAPABILITY, NOT A PATH, and it now ASKS for everything it used to
// infer. TWO LAWS BIND A CELL. The first: a cell must not restate a location the
// projector already computes. The harder companion: a cell must not GUESS what the
// projector could have told it. Three guesses lived here and all three are gone:
//
//   1. THE COMPARATOR'S NAME was a shell literal, because the forge CLI's name had no
//      compile-time home the way `CLI_BIN` does. It has one now — derived, not
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
    'advisory ↾ session.start ∧ prompt.submit ⟨re-arm ∴ mid-session projection ⇏ stale ∀remaining-turns⟩ · deployed ≢ rendered ⇒ emit ⟨superseded-lines ∧ missing-lines ; ¬count · ¬digest · ¬sample⟩ ↾ verdict ≢ last-told ⟨trigger ≜ verdict-change · ¬verdict-non-empty ∴ re-arm ⇏ re-notify · memory ↾ ⟨harness · session⟩ ∧ ⟨corpus · tree⟩ · in-sync recorded ∴ recurrence audible · ∄session-id ⇒ ¬suppress ⟨noise ≻ borrowed-silence⟩⟩ · deployed ≡ rendered ⇒ ∅ ⟨silence-when-clean MANDATORY ⟨fires ∀session ⇒ reader-skips ⇒ worse-than-absent⟩⟩ · verdict ↦ comparator ⟨corpus-owned · ¬face-computed · ¬reimplemented⟩ · corpus ↦ walk-up ⟨cwd · corpus-marker⟩ ⟨∄ ⇒ ∅ ⟨¬in-scope ∴ ¬wrong⟩⟩ · tree ↦ shape ⟨agents ∧ skills ∧ THIS-harness-hooks-file ; ¬named-path⟩ · harness ↦ projection ⟨¬inferred ∴ session-own-deployment⟩ · stale ⊻ ¬ran ↦ exit-code ⟨¬report-text ∴ format ⊥ verdict⟩ · reached ∧ ∄verdict ⇒ SAY-SO ⟨silence ≡ in-sync ∴ ¬borrowable⟩ · ¬block · exit-0 ∀error',
  substrate: 'harness',
  events: ['session.start', 'prompt.submit'],
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
      targetPath: 'packages/canon/targets/guardrail/deploy-drift-notice.sh',
      executable: true,
      content: `#!/usr/bin/env sh
# deploy-drift-notice — an ADVISORY, at session start and again before every
# prompt. It asks the corpus's own deploy tool whether the tree this host RUNS is
# the tree the corpus RENDERS, and speaks only when the answer CHANGES to "no".
#
# WHY (the incident): a deployed agent definition and the render tree diverged, an
# agent ran a superseded first principle for a whole session, and every gate in the
# repository stayed green throughout. The comparison was already reachable —
# \`deploy --check\` — and nothing ran it, so the drift stayed silent by default.
#
# WHY AGAIN (the second incident): bound to session start alone, it answered a
# question that expires. A projection landing MID-session left the rest of that
# session running the superseded copy with nothing further to say — which is the
# ordinary shape of work here, not an edge case. \`prompt.submit\` re-asks it in the
# same position that made the first answer worth having: before the agent acts.
#
# CONTRACT:
#   - SILENT WHEN IN SYNC. An advisory that fires every session trains its reader
#     to skip it, and is then worse than absent.
#   - SPEAKS ON A CHANGE, NOT ON A STATE. Re-armed per prompt, a standing drift
#     would otherwise repeat until it stopped being read — the same failure, back
#     through the door the re-arm opened. The last verdict this session was told is
#     recorded; an identical one is silent.
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
# INPUT  : SessionStart / UserPromptSubmit hook JSON on stdin (cwd, session_id, ...).
# OUTPUT : a CHANGED drift verdict -> advisory + the report; a changed unanswerable
#          one -> a BLIND line; in sync, or unchanged since this session was told -> none.

set -eu

# Neither a session start nor a prompt may be broken by an advisory. Any unexpected
# error -> silence.
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

# ── THE PAYLOAD, DRAINED ONCE ──────────────────────────────────────────────────
# Two fields are needed and stdin can only be read once, so both come off ONE jq —
# the same single fork the cwd lookup already cost, not a second one. \`.cwd\` says
# which corpus; \`.session_id\` says who is being told, which is what lets a re-armed
# advisory stay quiet about a verdict it has already delivered.
input="$(cat 2>/dev/null || true)"
cwd=""
sid=""
if command -v jq >/dev/null 2>&1 && [ -n "$input" ]; then
	fields="$(printf '%s' "$input" | jq -r '.cwd // "", .session_id // ""' 2>/dev/null || true)"
	{
		read -r cwd || true
		read -r sid || true
	} <<EOF
$fields
EOF
fi

# ── WHERE ARE WE? the corpus, by its own marker ────────────────────────────────
# \`cratylus.config.ts\` is the file \`deploy\` itself reads to learn which corpus it is
# operating on. Walking up for it asks the same question the tool asks, instead of
# inventing a second convention for "a checkout of the canon".
start="\${CRATYLUS_CORPUS:-$cwd}"
[ -n "$start" ] || start="\${CLAUDE_PROJECT_DIR:-$PWD}"

root=""
d="$start"
while [ -n "$d" ] && [ "$d" != "/" ]; do
	if [ -f "$d/cratylus.config.ts" ]; then
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
#
# THE GLOB USED TO BE \`.render*\`, WHICH MADE THE PARAGRAPH ABOVE FALSE. The shape
# test only ever ran on candidates a NAME had already selected, so "discovered, never
# named" described the second half of a two-stage filter whose first stage was a
# hard-coded prefix. Any operator honouring the documented freedom — \`--out
# build/corpus\` — got silence, and silence here is indistinguishable from in-sync.
# The rename of the corpus's own tree is what surfaced it; the defect predates it.
#
# So the candidate set is now DOTTED DIRECTORIES at the same depths, plus one level
# beneath each, because a tree that splits per harness puts the shape one deeper
# (\`.cratylus/claude\`, not \`.render-ts\`). Dotted, because that is the convention
# for generated trees (\`.next\`, \`.turbo\`, \`.svelte-kit\`) and because walking every
# directory in a checkout to find one that has \`agents/\` is a cost this hook cannot
# pay on every prompt. The shape test is still what decides; the glob now only bounds
# where to look, and it no longer bounds it to one spelling.
tree="\${CRATYLUS_RENDER_TREE:-}"
if [ -z "$tree" ]; then
	for c in \\
		"$root"/.*/ "$root"/*/.*/ "$root"/*/*/.*/ \\
		"$root"/.*/*/ "$root"/*/.*/*/ "$root"/*/*/.*/*/; do
		case "$c" in
		*/node_modules/*) continue ;;
		*/.git/*) continue ;;
		*/./ | */../) continue ;;
		esac
		c="\${c%/}"
		[ -d "$c/agents" ] && [ -d "$c/skills" ] && [ -f "$c/$HARNESS_HOOKS_FILE" ] || continue
		tree="$c"
		break
	done
fi
# A corpus that has rendered nothing for THIS harness has nothing to be compared
# against — the same not-in-scope silence, one step in.
[ -n "$tree" ] || exit 0

# ── WHAT WAS THIS SESSION ALREADY TOLD? ────────────────────────────────────────
# The re-arm's whole cost is here. Asked before every prompt, an unchanged verdict
# repeated until the reader stopped seeing it would be the in-sync failure re-entering
# through the door opened to fix the stale one. So one small file per session holds the
# last verdict delivered, and the trigger is the DIFFERENCE.
#
# The key is \`⟨harness, session⟩\` and the CONTENT carries \`⟨corpus, tree⟩\`: two
# harnesses in one session audit two hosts and must not overwrite each other's answer,
# and the same session moved to another checkout is asking a different question rather
# than repeating one. A session id that is not a plain token is treated as absent —
# nothing here builds a path out of an unexamined payload field.
state=""
case "$sid" in
'' | *[!A-Za-z0-9._-]*) ;;
*)
	stash="\${TMPDIR:-/tmp}/cratylus-deploy-drift"
	if [ -d "$stash" ] || mkdir -p "$stash" 2>/dev/null; then
		state="$stash/$HARNESS-$sid"
	fi
	;;
esac

# \`changed <verdict>\` — record it as the last thing this session was told, and
# answer whether it DIFFERS from what was recorded before.
#
# NO STATE MEANS EVERY RUN SPEAKS, and the asymmetry is deliberate. Without a session
# id there is nothing to suppress against, and a repeated advisory under real drift is
# noise one \`deploy\` ends, while a suppressed one is SILENCE — which this cell spends
# its whole contract making mean "in sync", and may therefore lend to nothing else.
changed() {
	now="$root|$tree|$1"
	[ -n "$state" ] || return 0
	last=""
	[ ! -f "$state" ] || last="$(cat "$state" 2>/dev/null || true)"
	printf '%s' "$now" >"$state" 2>/dev/null || true
	[ "$last" != "$now" ]
}

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
	if changed "no-comparator"; then
		printf '{{speech:no-comparator}}\\n' "$DEPLOY_TOOL"
	fi
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
#
# IT IS RECORDED ANYWAY, and that is what makes a RETURNING drift audible: drift, then
# a deploy, then the identical drift again would match a record that still said "drift"
# and be swallowed. Recording the clean verdict makes the second one a change. Its own
# result is discarded — a host that has just gone from stale to in-sync gets no all-clear
# either, because silence-when-clean is unconditional.
if [ "$rc" -eq 0 ]; then
	changed in-sync || true
	exit 0
fi

# WHICH KIND OF NON-ZERO — asked of the EXIT CODE, which is a contract, and not of
# the report's wording, which is a format. Drift has a code of its own; everything
# else that is not success is the check failing to produce a verdict, including the
# codes this worker was never told about (a crash, a signal, a missing file). The
# two demand opposite responses: relaying a broken tool as drift fabricates a
# verdict, and relaying it as silence is the bypass-by-omission this cell exists to
# end.
#
# THE REPORT IS PART OF THE VERDICT, not decoration on it. Two drifts that differ in
# WHICH doctrine is superseded are two things to be told, so the report's bytes are what
# the session remembers — a key of "drift" alone would announce the first stale artifact
# and swallow every one after it.
if [ "$rc" -eq "$DRIFT_RC" ]; then
	if changed "drift
$out"; then
		printf '%s\\n' '{{speech:drift}}'
		printf '%s\\n' "$out"
	fi
else
	if changed "no-verdict $rc
$out"; then
		printf '{{speech:no-verdict}}\\n' "$cli"
	fi
fi
exit 0
`,
    },
  ],
};
