#!/usr/bin/env sh
# deploy-drift-notice — a SessionStart ADVISORY. It asks the corpus's own deploy
# tool whether the tree this host RUNS is the tree the corpus RENDERS, and speaks
# only when it is not.
#
# WHY (the incident): a deployed agent definition and the render tree diverged, an
# agent ran a superseded first principle for a whole session, and every gate in the
# repository stayed green throughout. The comparison was already reachable —
# `deploy --check` — and nothing ran it, so the drift stayed silent by default.
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
# COST (measured; see the cell header): ~45 ms on the clean path, of which ~10 ms is
# the discovery below and the rest is the comparator reading both trees whole.
#
# INPUT  : SessionStart hook JSON on stdin (cwd, session_id, ...).
# OUTPUT : drift -> advisory + the report; unanswerable -> one BLIND line; else none.

set -eu

# A SessionStart hook must never break a session. Any unexpected error -> silence.
trap 'exit 0' EXIT

# The corpus's own deploy tool — the ONE spelling of that bin in this worker, held
# against `packages/forge/package.json`'s `bin` key by canon's bin-name gate, so a
# rename of the CLI cannot leave this worker naming a program that no longer exists.
DEPLOY_TOOL=cratylus

# ── WHERE ARE WE? the corpus, by its own marker ────────────────────────────────
# `agents.config.ts` is the file `deploy` itself reads to learn which corpus it is
# operating on. Walking up for it asks the same question the tool asks, instead of
# inventing a second convention for "a checkout of the canon".
start="${CRATYLUS_CORPUS:-}"
if [ -z "$start" ]; then
	input="$(cat 2>/dev/null || true)"
	if command -v jq >/dev/null 2>&1 && [ -n "$input" ]; then
		start="$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null || true)"
	fi
	[ -n "$start" ] || start="${CLAUDE_PROJECT_DIR:-$PWD}"
fi

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

# ── WHICH TREE? the render tree, by its SHAPE ──────────────────────────────────
# A render tree is recognized by BEING one: `agents/` + `skills/` + this harness's
# own hooks file. `settings.json` is the claude adapter's hooks file, and it is what
# distinguishes this harness's tree from a codex tree (`hooks.json`) sitting beside
# it. The `--out` dir is an operator's choice, so it is discovered, never named.
#
# THE CLAUDE TREE IS WHAT THIS IDENTIFIES, and on another harness that makes the
# report about a SIBLING deployment rather than this session's. It is never a false
# report — the tool opens by naming the root it read — but see the cell header for why
# the harness's own identity does not reach this worker.
tree="${CRATYLUS_RENDER_TREE:-}"
if [ -z "$tree" ]; then
	for c in "$root"/.render* "$root"/*/.render* "$root"/*/*/.render*; do
		case "$c" in
		*/node_modules/*) continue ;;
		esac
		[ -d "$c/agents" ] && [ -d "$c/skills" ] && [ -f "$c/settings.json" ] || continue
		tree="$c"
		break
	done
fi
# A corpus that has rendered nothing has nothing to be compared against — the same
# not-in-scope silence, one step in.
[ -n "$tree" ] || exit 0

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
	printf 'DEPLOY DRIFT — this corpus is in scope and its deploy comparator (`%s`) is not installed here, so whether this host runs the current canon is UNKNOWN. Install the workspace dependencies to make the question answerable; until then this is not an in-sync report.\n' "$DEPLOY_TOOL"
	exit 0
fi

# The tool reports and repairs nothing, so it is safe to point at a host mid-work.
set +e
out="$("$cli" deploy --check \
	--agents-dir "$tree/agents" \
	--skills-dir "$tree/skills" \
	--hooks-dir "$tree" 2>&1)"
rc=$?
set -e

# rc 0 IS the tool's verdict that no artifact is stale and none is absent (a foreign
# artifact is reported by it, and is not a defect). The silence is earned here, and
# nowhere else — every other exit takes a branch below.
[ "$rc" -ne 0 ] || exit 0

# WHICH KIND OF NON-ZERO. `deploy --check` returns 1 both for drift and for its own
# failure, so the exit status alone cannot separate "this host is stale" from "the
# check never ran" — and reporting the second as the first would be a fabricated
# verdict, while reporting it as silence would be the bypass-by-omission this whole
# cell exists to end. The tool's closing VERDICT LINE separates them. Only the last
# three lines are searched: the verdict is always among them, whereas an artifact's
# own quoted content — this worker's, on the day IT is the stale file — never is.
if printf '%s\n' "$out" | tail -n 3 | grep -q 'NOT running what the corpus renders'; then
	printf '%s\n' 'DEPLOY DRIFT — this host runs a SUPERSEDED projection of the canon. In the report below, a `-` line is doctrine THIS SESSION is operating under and the corpus no longer says; a `+` line is what the corpus says and this host never received. Read every `-` line as a false premise, not as background. `pnpm canon:deploy` converges the host.'
	printf '%s\n' "$out"
else
	printf 'DEPLOY DRIFT — the comparator (`%s`) returned no verdict, so whether this host runs the current canon is UNKNOWN. This is not an in-sync report; nothing here establishes that the doctrine in force is the corpus.\n' "$cli"
fi
exit 0
