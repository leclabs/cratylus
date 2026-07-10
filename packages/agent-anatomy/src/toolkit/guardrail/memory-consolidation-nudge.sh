#!/usr/bin/env sh
# memory-consolidation-nudge — an ADVISORY Stop hook. It counts the agent's
# unconsolidated EPISODIC records and, over a conservative watermark, prints a
# non-blocking reminder to run a hot-path /dream. It NEVER blocks the turn.
#
# WHY (memory organ, E6c — harness half): per-turn ENCODE grows the raw
# EPISODIC log; only /dream folds + drains it. This is the ambient reminder that
# the backlog has grown enough to be worth consolidating while context is hot.
#
# CONTRACT:
#   - ADVISORY ONLY. On a full backlog it prints an advisory to stdout and exits
#     0. It NEVER emits {"decision":"block"} — a soft, recoverable duty must not
#     wedge a turn.
#   - FAILS OPEN + SILENT. Any error (no home, no jq, unreadable log) → exit 0,
#     no output. A reminder that misfires on its own flakiness is worse than a
#     missed one.
#   - Stop ONLY (turn.end). Registered on subagent.end would nudge transient
#     sub-turns; the organ home is the top-level agent's.
#
# HOME DERIVATION (the Stop-env caveat): a top-level Stop hook carries NO
# agent_type, so the home is not handed in. Best-effort, in order:
#   1. $CLAUDE_AGENT_HOME  — explicit override (also the test seam).
#   2. session registry     — match the hook JSON's session_id against
#                             ~/.agents/*/sessions/<id>.json (the E6a/E6b
#                             liveness registry; correct once wake has registered).
#   3. sole home            — the one ~/.agents/* when exactly one exists.
# None resolves ⇒ exit 0 silently (KNOWN LIMITATION — no honest count without a
# home; never fabricate one).
#
# INPUT  : Claude Code Stop hook JSON on stdin (session_id, cwd, …).
# OUTPUT : over watermark → an advisory line on stdout + exit 0; else nothing.
#
# POSIX sh. jq used ONLY for session_id (home path 2); missing jq degrades that
# one path, never the whole hook.

set -eu

# A Stop hook must never break a session. Any unexpected error → allow the stop.
trap 'exit 0' EXIT

# Conservative watermark: BELOW the point where a raw log is unwieldy to fold in
# one hot-context dream. A dream comfortably consolidates dozens of records, so 30
# flags "enough backlog to be worth folding now" while staying well under any hard
# compaction pressure. Tune via $MEMORY_NUDGE_WATERMARK.
WATERMARK="${MEMORY_NUDGE_WATERMARK:-30}"

AGENTS_ROOT="${HOME}/.agents"

# --- read hook input ------------------------------------------------------------
input="$(cat 2>/dev/null || true)"

# --- derive the agent home (best-effort; silent on failure) ---------------------
home="${CLAUDE_AGENT_HOME:-}"

if [ -z "$home" ]; then
	# Path 2: match the session_id against the memory session registry.
	sid=""
	if command -v jq >/dev/null 2>&1 && [ -n "$input" ]; then
		sid="$(printf '%s' "$input" | jq -r '.session_id // empty' 2>/dev/null || true)"
	fi
	if [ -n "$sid" ]; then
		for d in "$AGENTS_ROOT"/*/; do
			[ -d "$d" ] || continue
			if [ -f "${d}sessions/${sid}.json" ]; then
				home="${d%/}"
				break
			fi
		done
	fi
fi

if [ -z "$home" ]; then
	# Path 3: the sole ~/.agents/* home, when exactly one exists.
	count_homes=0
	sole=""
	for d in "$AGENTS_ROOT"/*/; do
		[ -d "$d" ] || continue
		count_homes=$((count_homes + 1))
		sole="${d%/}"
	done
	[ "$count_homes" -eq 1 ] && home="$sole"
fi

[ -n "$home" ] || exit 0  # no derivable home → silent (known limitation)

# --- count unconsolidated EPISODIC records --------------------------------------
episodic="${home}/EPISODIC.jsonl"
[ -f "$episodic" ] || exit 0  # nothing captured yet → silent

# Non-blank JSONL lines = pending (undrained) records. awk keeps it cheap and
# always prints a number (0 when empty), so set -e never trips.
count="$(awk 'NF{c++} END{print c+0}' "$episodic" 2>/dev/null || echo 0)"

# --- advise (never block) -------------------------------------------------------
if [ "$count" -ge "$WATERMARK" ]; then
	printf 'MEMORY — %s unconsolidated EPISODIC record(s) (watermark %s). Consider a hot-path /dream to fold + drain the log before it grows unwieldy.\n' \
		"$count" "$WATERMARK"
fi
exit 0
