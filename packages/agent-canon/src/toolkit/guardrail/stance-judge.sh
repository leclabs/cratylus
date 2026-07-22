#!/usr/bin/env sh
# stance-judge — the DEFAULT judge backend for the stance guardrail.
#
# Contract (the guardrail worker depends ONLY on this contract, so the backend is
# swappable via $STANCE_JUDGE_CMD):
#   stdin   : the agent's last assistant turn (plain text).
#   argv[1] : path to the rubric markdown (the stance contract).
#   stdout  : a verdict block —
#               VERDICT: PASS
#             or
#               VERDICT: BLOCK
#               REASON: <one sentence>
#   exit    : 0 on a usable verdict; non-zero on judge failure (caller FAILS OPEN — treats
#             a judge failure as PASS, because a guardrail that wedges every turn on its own
#             flakiness is worse than a missed block).
#
# This default backend asks the headless `claude` CLI to apply the rubric. It is intentionally
# the only LLM-coupled, non-deterministic part of the system; everything around it (gating,
# extraction, block emission) is deterministic shell and is what the test harness proves.
#
# POSIX sh.

set -eu

rubric="${1:?usage: stance-judge.sh <rubric-path>  (turn text on stdin)}"
[ -f "$rubric" ] || { echo "stance-judge: rubric not found: $rubric" >&2; exit 3; }

turn="$(cat)"
[ -n "$turn" ] || { echo "VERDICT: PASS"; exit 0; }  # nothing to judge → PASS

# Resolve the judge model CLI. Default: claude headless. Overridable for offline/CI.
judge_bin="${STANCE_JUDGE_BIN:-claude}"
command -v "$judge_bin" >/dev/null 2>&1 || {
	echo "stance-judge: judge binary '$judge_bin' not on PATH; failing open" >&2
	exit 4
}

# Compose the judge invocation. The rubric IS the system instruction; the turn is the input.
# `-p` is headless print mode. A small fast model keeps the Stop-hook latency low and the
# judgment is a narrow classification, not generation. The bare `haiku` alias tracks the
# current fast model so the default never goes stale on a model retirement (a dated pin does).
judge_model="${STANCE_JUDGE_MODEL:-haiku}"

prompt="$(cat "$rubric")

=== BEGIN TRANSCRIPT EXCERPT (operator instruction + agent turn) ===
$turn
=== END TRANSCRIPT EXCERPT ===

Apply the rubric. Output ONLY the verdict block."

# Run the judge. Any failure (network, auth, timeout) → non-zero → caller fails open.
verdict="$(printf '%s' "$prompt" | "$judge_bin" -p --model "$judge_model" 2>/dev/null)" || {
	echo "stance-judge: judge invocation failed; failing open" >&2
	exit 5
}

# Normalize: keep only the verdict block. Defensive against a chatty model.
echo "$verdict" | grep -E '^(VERDICT|REASON):' || {
	# Judge returned something unparseable → fail open (PASS).
	echo "stance-judge: unparseable judge output; failing open" >&2
	exit 6
}
