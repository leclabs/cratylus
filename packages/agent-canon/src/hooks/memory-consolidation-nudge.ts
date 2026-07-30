import type { HookCell } from '@leclabs/agent-forge/anatomy';
import { RUNTIME_BIN } from '@leclabs/agent-runtime/bin-name';

// memory-consolidation-nudge — an ADVISORY Stop hook (the harness half of the
// memory-consolidation protocol). On turn.end (Stop only — NOT SubagentStop), it
// cheaply counts the agent's unconsolidated EPISODIC records and, over a
// conservative watermark, prints a non-blocking advisory to run a hot-path dream.
//
// WHY THIS EXISTS (memory dimension, E6c — the harness half):
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
// EDIT THE CELL AND REGENERATE (`pnpm canon:project:targets`) — never the committed
// `.sh` alone; a hand-edit drifts the anchor and the byte-lock goes red.
//
// The runtime bin's name is INTERPOLATED from `RUNTIME_BIN`, its one home, because
// the worker names it inside a shell string no compiler reads. `$MEMORY_BIN` stays
// the override and the test seam; the interpolated name is only its DEFAULT.

export const memoryConsolidationNudge: HookCell = {
  id: 'memory-consolidation-nudge',
  residue:
    'advisory ↾ turn-end · owed ⇒ emit hot-path-dream advisory ⟨¬block · exit-0 · ¬wedge-turn⟩ · owed ↦ runtime ⟨backlog ∨ store-pressure ∨ scope-drift ; ¬face-computed⟩ · home ↦ $env ∨ runtime(session) ⟨¬derivable ⇒ silent⟩ · fail-open ∀error',
  substrate: 'harness',
  events: ['turn.end'],
  entry: 'memory-consolidation-nudge.sh',
  timeout: 10,
  refs: [],
  workers: [
    {
      filename: 'memory-consolidation-nudge.sh',
      targetPath:
        'packages/agent-canon/src/toolkit/guardrail/memory-consolidation-nudge.sh',
      executable: true,
      content: `#!/usr/bin/env sh
# memory-consolidation-nudge — an ADVISORY Stop hook. It asks the memory runtime
# whether a consolidation is owed and, if so, prints a non-blocking reminder to
# run a hot-path /dream. It NEVER blocks the turn.
#
# WHY (memory dimension, E6c — harness half): per-turn ENCODE grows the raw
# EPISODIC log and the prose stores only ever grow; only /dream folds, drains and
# depalimpsests them. This is the ambient reminder to do it while context is hot.
#
# THE FACE ASKS, IT DOES NOT KNOW. Both questions this hook needs — which home
# owns this session, and whether a dream is owed — are answered by the runtime:
#
#   memory home  --session <id>   -> the owning home (registry lookup)
#   memory audit --home <h> --owed -> "owed" | "clear"
#
# It previously derived the home by scanning ~/.agents/* and counted the backlog
# by awk-ing EPISODIC.jsonl. Both made a harness FACE read the being's memory
# layout, and the second put a second home on the "is a dream owed" predicate —
# one that measured only raw-record count, so an oversized prose store never
# raised a signal at all.
#
# CONTRACT:
#   - ADVISORY ONLY. Prints to stdout and exits 0. It NEVER emits
#     {"decision":"block"} — a soft, recoverable duty must not wedge a turn.
#   - FAILS OPEN + SILENT. Any error (no runtime, no home, no jq) -> exit 0, no
#     output. A reminder that misfires on its own flakiness is worse than a
#     missed one.
#   - Stop ONLY (turn.end). Registered on subagent.end it would nudge transient
#     sub-turns; the dimension home is the top-level agent's.
#
# INPUT  : Claude Code Stop hook JSON on stdin (session_id, cwd, ...).
# OUTPUT : owed -> one advisory line + exit 0; else nothing.

set -eu

# A Stop hook must never break a session. Any unexpected error -> allow the stop.
trap 'exit 0' EXIT

# The runtime bin. \$MEMORY_BIN is the override and the test seam.
MEM="\${MEMORY_BIN:-${RUNTIME_BIN}}"
command -v "\$MEM" >/dev/null 2>&1 || exit 0

input="\$(cat 2>/dev/null || true)"

# --- resolve the home: explicit override, else ask the registry ----------------
home="\${CLAUDE_AGENT_HOME:-}"
if [ -z "\$home" ]; then
	sid=""
	if command -v jq >/dev/null 2>&1 && [ -n "\$input" ]; then
		sid="\$(printf '%s' "\$input" | jq -r '.session_id // empty' 2>/dev/null || true)"
	fi
	[ -n "\$sid" ] || exit 0
	home="\$("\$MEM" memory home --session "\$sid" 2>/dev/null || true)"
fi
[ -n "\$home" ] || exit 0

# --- ask whether a dream is owed ------------------------------------------------
# The verdict and the FAILURE are separated deliberately. Every runtime call here is
# \`2>/dev/null || true\` so a reminder can never fail a turn — correct, but it made an
# unreachable runtime yield an EMPTY verdict, which is exactly what "clear" yields. So
# a broken runtime read as a clean bill of health, silently and forever: the nudge
# would stop existing and nothing would say so. \`if signal absent then pass\` is a
# bypass by omission; this inverts it to \`if signal absent then SAY SO\`, while still
# never blocking.
if verdict="\$("\$MEM" memory audit --home "\$home" --owed 2>/dev/null)"; then
	if [ "\$verdict" = "owed" ]; then
		printf 'MEMORY — a consolidation is owed (unfolded records, an oversized store, or scope drift). Consider a hot-path /dream to fold, drain and depalimpsest while context is hot.\\n'
	fi
else
	printf 'MEMORY — the runtime did not answer whether a consolidation is owed (\`%s memory audit\` failed). The nudge is BLIND until that is fixed; this is not a clear verdict.\\n' "\$MEM"
fi
exit 0
`,
    },
  ],
};
