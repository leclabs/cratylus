#!/usr/bin/env sh
# deploy-drift-notice — an ADVISORY, at session start and again before every
# prompt. It asks the corpus's own deploy tool whether the tree this host RUNS is
# the tree the corpus RENDERS, and speaks only when the answer CHANGES to "no".
#
# WHY (the incident): a deployed agent definition and the render tree diverged, an
# agent ran a superseded first principle for a whole session, and every gate in the
# repository stayed green throughout. The comparison was already reachable —
# `deploy --check` — and nothing ran it, so the drift stayed silent by default.
#
# WHY AGAIN (the second incident): bound to session start alone, it answered a
# question that expires. A projection landing MID-session left the rest of that
# session running the superseded copy with nothing further to say — which is the
# ordinary shape of work here, not an edge case. `prompt.submit` re-asks it in the
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
# repository — `packages/forge/package.json`'s `bin` key, the one npm obeys — and
# `forge/src/bin-name.ts` derives from it, so this line is that key, relayed.
DEPLOY_TOOL=cratylus

# WHICH HARNESS THIS PROJECTION IS FOR. A hook worker is handed no identity by the
# session it runs in, so a worker that must LOOK at a deployed tree had to guess —
# and guessed claude, which made a codex session report on a sibling deployment.
# These two are the adapter's own `name` and `hooksFile`, substituted at
# projection: the codex render of this cell carries codex's.
HARNESS=claude
HARNESS_HOOKS_FILE=settings.json

# The status the comparator returns when it FOUND drift. `0` means success to
# POSIX and needs no telling; this one is the tool's own choice, so it is told.
DRIFT_RC=1

# ── THE PAYLOAD, DRAINED ONCE ──────────────────────────────────────────────────
# Two fields are needed and stdin can only be read once, so both come off ONE jq —
# the same single fork the cwd lookup already cost, not a second one. `.cwd` says
# which corpus; `.session_id` says who is being told, which is what lets a re-armed
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
# `agents.config.ts` is the file `deploy` itself reads to learn which corpus it is
# operating on. Walking up for it asks the same question the tool asks, instead of
# inventing a second convention for "a checkout of the canon".
start="${CRATYLUS_CORPUS:-$cwd}"
[ -n "$start" ] || start="${CLAUDE_PROJECT_DIR:-$PWD}"

root=""
d="$start"
while [ -n "$d" ] && [ "$d" != "/" ]; do
	if [ -f "$d/agents.config.ts" ]; then
		root="$d"
		break
	fi
	d="${d%/*}"
done
# NO CORPUS IN SCOPE IS SILENCE, and it is not the "clean" silence above. A session
# outside every checkout has no rendered doctrine to be compared against, so there is
# nothing here this hook could be right or wrong about — and speaking would fire it on
# every unrelated session, which is the one failure that makes an advisory worthless.
[ -n "$root" ] || exit 0

# ── WHICH TREE? this harness's render tree, by its SHAPE ───────────────────────
# A render tree is recognized by BEING one: `agents/` + `skills/` + THIS harness's
# own hooks file. That file is what distinguishes this harness's tree from another
# harness's tree sitting beside it, and it is named by projection rather than by
# this script — so a codex render of this worker skips the claude tree and a claude
# render skips the codex one. The `--out` dir is an operator's choice, so the tree
# is discovered, never named.
#
# THE GLOB USED TO BE `.render*`, WHICH MADE THE PARAGRAPH ABOVE FALSE. The shape
# test only ever ran on candidates a NAME had already selected, so "discovered, never
# named" described the second half of a two-stage filter whose first stage was a
# hard-coded prefix. Any operator honouring the documented freedom — `--out
# build/corpus` — got silence, and silence here is indistinguishable from in-sync.
# The rename of the corpus's own tree is what surfaced it; the defect predates it.
#
# So the candidate set is now DOTTED DIRECTORIES at the same depths, plus one level
# beneath each, because a tree that splits per harness puts the shape one deeper
# (`.cratylus/claude`, not `.render-ts`). Dotted, because that is the convention
# for generated trees (`.next`, `.turbo`, `.svelte-kit`) and because walking every
# directory in a checkout to find one that has `agents/` is a cost this hook cannot
# pay on every prompt. The shape test is still what decides; the glob now only bounds
# where to look, and it no longer bounds it to one spelling.
tree="${CRATYLUS_RENDER_TREE:-}"
if [ -z "$tree" ]; then
	for c in \
		"$root"/.*/ "$root"/*/.*/ "$root"/*/*/.*/ \
		"$root"/.*/*/ "$root"/*/.*/*/ "$root"/*/*/.*/*/; do
		case "$c" in
		*/node_modules/*) continue ;;
		*/.git/*) continue ;;
		*/./ | */../) continue ;;
		esac
		c="${c%/}"
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
# The key is `⟨harness, session⟩` and the CONTENT carries `⟨corpus, tree⟩`: two
# harnesses in one session audit two hosts and must not overwrite each other's answer,
# and the same session moved to another checkout is asking a different question rather
# than repeating one. A session id that is not a plain token is treated as absent —
# nothing here builds a path out of an unexamined payload field.
state=""
case "$sid" in
'' | *[!A-Za-z0-9._-]*) ;;
*)
	stash="${TMPDIR:-/tmp}/cratylus-deploy-drift"
	if [ -d "$stash" ] || mkdir -p "$stash" 2>/dev/null; then
		state="$stash/$HARNESS-$sid"
	fi
	;;
esac

# `changed <verdict>` — record it as the last thing this session was told, and
# answer whether it DIFFERS from what was recorded before.
#
# NO STATE MEANS EVERY RUN SPEAKS, and the asymmetry is deliberate. Without a session
# id there is nothing to suppress against, and a repeated advisory under real drift is
# noise one `deploy` ends, while a suppressed one is SILENCE — which this cell spends
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
cli="${CRATYLUS_DEPLOY_CHECK:-}"
if [ -z "$cli" ]; then
	if [ -x "$root/node_modules/.bin/$DEPLOY_TOOL" ]; then
		cli="$root/node_modules/.bin/$DEPLOY_TOOL"
	elif command -v "$DEPLOY_TOOL" >/dev/null 2>&1; then
		cli="$DEPLOY_TOOL"
	fi
fi
if [ -z "$cli" ]; then
	if changed "no-comparator"; then
		printf 'DEPLOY DRIFT — this corpus is in scope and its deploy comparator (`%s`) is not installed here, so whether this host runs the current canon is UNKNOWN. Install the workspace dependencies to make the question answerable; until then this is not an in-sync report.\n' "$DEPLOY_TOOL"
	fi
	exit 0
fi

# `--harness` is what makes the audited HOME this session's. Without it the tool
# resolves its default root, so a codex tree would be compared against the claude
# deployment — a report that is about neither.
# The tool reports and repairs nothing, so it is safe to point at a host mid-work.
set +e
out="$("$cli" deploy --check \
	--harness "$HARNESS" \
	--agents-dir "$tree/agents" \
	--skills-dir "$tree/skills" \
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
		printf '%s\n' 'DEPLOY DRIFT — this host runs a SUPERSEDED projection of the canon. In the report below, a `-` line is doctrine THIS SESSION is operating under and the corpus no longer says; a `+` line is what the corpus says and this host never received. Read every `-` line as a false premise, not as background. `pnpm canon:deploy` converges the host.'
		printf '%s\n' "$out"
	fi
else
	if changed "no-verdict $rc
$out"; then
		printf 'DEPLOY DRIFT — the comparator (`%s`) returned no verdict, so whether this host runs the current canon is UNKNOWN. This is not an in-sync report; nothing here establishes that the doctrine in force is the corpus.\n' "$cli"
	fi
fi
exit 0
