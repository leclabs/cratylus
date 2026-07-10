import type { HookCell } from '../toolkit/hook-cell.js';

// memory-consolidation-nudge — an ADVISORY Stop hook (the harness half of the
// memory-consolidation protocol). On turn.end (Stop only — NOT SubagentStop), it
// cheaply counts the agent's unconsolidated EPISODIC records and, over a
// conservative watermark, prints a non-blocking advisory to run a hot-path dream.
//
// WHY THIS EXISTS (memory organ, E6c — the harness half):
//   Per-turn ENCODE grows the raw EPISODIC log; only /dream folds + drains it. An
//   agent that never dreams accretes an unbounded raw log and loses the
//   consolidation window while context is still hot. This hook is the ambient
//   reminder: it observes the backlog the agent cannot see from inside the turn
//   and surfaces "time to consolidate" — without ever wedging the turn.
//
// ADVISORY, NEVER BLOCKING (the load-bearing contract):
//   Unlike stance-guardrail, this hook NEVER emits `{"decision":"block"}`. It
//   prints an advisory line to stdout and exits 0. Memory consolidation is a
//   soft, recoverable duty; blocking a turn on an un-run ritual would wedge real
//   work for no correctness gain. The nudge is intentionally soft.
//
// HOME DERIVATION (the Stop-env caveat — flagged, not faked):
//   A top-level Stop hook fires in the harness env and carries NO agent_type
//   (that is a SubagentStop field), so the agent's home is not handed in. The
//   worker derives it best-effort, in order: (1) $CLAUDE_AGENT_HOME override;
//   (2) match the hook JSON's session_id against the memory session registry
//   `~/.agents/*/sessions/<id>.json` (the E6a/E6b liveness registry — the correct
//   derivation whenever wake has registered the session); (3) the sole
//   `~/.agents/*` home when exactly one exists. If none resolves, it exits 0
//   SILENTLY — a KNOWN LIMITATION (no reliable home ⇒ no honest count), never a
//   fabricated count.
//
// The `workers[].content` is the VERBATIM byte-anchor the committed worker at
// `targetPath` regenerates from (byte-locked by `test/hook-rule-boundary.test.ts`).

export const memoryConsolidationNudge: HookCell = {
  id: 'memory-consolidation-nudge',
  residue:
    'advisory ↾ turn-end · count(unfolded EPISODIC) ≥ watermark ⇒ emit hot-path-dream advisory ⟨¬block · exit-0 · ¬wedge-turn⟩ · watermark ⟨conservative · below-compaction-point⟩ · home ↦ $env ∨ session-registry-match ∨ sole ~/.agents/* ⟨¬derivable ⇒ silent⟩ · fail-open ∀error',
  substrate: 'harness',
  events: ['turn.end'],
  command: `sh "$HOME/.claude/hooks/memory-consolidation-nudge/memory-consolidation-nudge.sh"`,
  timeout: 10,
  refs: [],
  workers: [
    {
      filename: 'memory-consolidation-nudge.sh',
      targetPath:
        'packages/agent-anatomy/src/toolkit/guardrail/memory-consolidation-nudge.sh',
      executable: true,
      content: `#!/usr/bin/env sh
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
#   1. \$CLAUDE_AGENT_HOME  — explicit override (also the test seam).
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
# compaction pressure. Tune via \$MEMORY_NUDGE_WATERMARK.
WATERMARK="\${MEMORY_NUDGE_WATERMARK:-30}"

AGENTS_ROOT="\${HOME}/.agents"

# --- read hook input ------------------------------------------------------------
input="$(cat 2>/dev/null || true)"

# --- derive the agent home (best-effort; silent on failure) ---------------------
home="\${CLAUDE_AGENT_HOME:-}"

if [ -z "$home" ]; then
	# Path 2: match the session_id against the memory session registry.
	sid=""
	if command -v jq >/dev/null 2>&1 && [ -n "$input" ]; then
		sid="$(printf '%s' "$input" | jq -r '.session_id // empty' 2>/dev/null || true)"
	fi
	if [ -n "$sid" ]; then
		for d in "$AGENTS_ROOT"/*/; do
			[ -d "$d" ] || continue
			if [ -f "\${d}sessions/\${sid}.json" ]; then
				home="\${d%/}"
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
		sole="\${d%/}"
	done
	[ "$count_homes" -eq 1 ] && home="$sole"
fi

[ -n "$home" ] || exit 0  # no derivable home → silent (known limitation)

# --- count unconsolidated EPISODIC records --------------------------------------
episodic="\${home}/EPISODIC.jsonl"
[ -f "$episodic" ] || exit 0  # nothing captured yet → silent

# Non-blank JSONL lines = pending (undrained) records. awk keeps it cheap and
# always prints a number (0 when empty), so set -e never trips.
count="$(awk 'NF{c++} END{print c+0}' "$episodic" 2>/dev/null || echo 0)"

# --- advise (never block) -------------------------------------------------------
if [ "$count" -ge "$WATERMARK" ]; then
	printf 'MEMORY — %s unconsolidated EPISODIC record(s) (watermark %s). Consider a hot-path /dream to fold + drain the log before it grows unwieldy.\\n' \\
		"$count" "$WATERMARK"
fi
exit 0
`,
    },
  ],
};
