#!/usr/bin/env sh
# stance-guardrail — a Stop / SubagentStop hook that STRUCTURALLY REFUSES a turn in which an
# agent collapses out of the intent-driven-expert (fiduciary-agent) stance.
#
# WHY THIS EXISTS (principal-stance plan, P4 — the harness half):
#   Encoding the principal stance as IDENTITY (Nico's half) raises the threshold but is not
#   truly invariant — enough operator pushback erodes any prompt-level stance, because RLHF
#   corrigibility reads a correction as "defer more." TRUE invariance needs the harness to
#   refuse the collapsed turn. This is that refusal: on Stop, it judges the last assistant turn
#   against the stance rubric and BLOCKS (Claude Code Stop-hook `{"decision":"block"}`) when it
#   detects collapse, feeding corrective feedback that tells the agent to re-assume the stance.
#
# WHAT IT BLOCKS (collapse signals — see stance-judge-prompt.md for the full rubric):
#   - permission-seeking for in-remit, reversible work ("should I…?", option-menus)
#   - deferring the agent's own expert judgment (naming/design/architecture/how) to the operator
#   - echoing / order-taking the operator's literal words instead of extracting+serving intent
# WHAT IT DOES NOT BLOCK (the reserved set):
#   - surfacing a genuine irreversible-outward act (deploy/push/publish) for consent
#   - routing a genuine INTENT ambiguity to /elicit
#
# SAFETY MODEL:
#   - OFF BY DEFAULT. Does nothing unless the repo opts in (git config agentfactory.stanceGuard true).
#   - AGENT-SCOPED. Only fires for agents on the allowlist (default: nico, mav — the principal-ic-intrinsic agents).
#   - FAILS OPEN. Any error (no transcript, judge failure, jq missing) → exit 0 (allow stop).
#     A guardrail that wedges work on its own flakiness is worse than a missed block.
#   - LOOP-SAFE. Honors stop_hook_active and a hard re-entry cap so it can never wedge a turn.
#
# INPUT  : Claude Code Stop/SubagentStop hook JSON on stdin (transcript_path, stop_hook_active,
#          agent_type [SubagentStop], session_id, cwd, …).
# OUTPUT : on collapse → stdout `{"decision":"block","reason":"…"}` + exit 0 (Stop-hook block).
#          otherwise → no stdout + exit 0 (allow stop).
#
# POSIX sh. Depends on: jq (transcript parse). Missing jq → fail open.

set -eu

SELF_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
RUBRIC="${STANCE_RUBRIC:-$SELF_DIR/stance-judge-prompt.md}"
JUDGE_CMD="${STANCE_JUDGE_CMD:-sh $SELF_DIR/stance-judge.sh}"

# A Stop hook must never break a session. Trap any unexpected error → allow the stop.
trap 'exit 0' EXIT

allow_stop() { exit 0; }  # emit nothing; the agent is permitted to stop.

# --- read hook input ------------------------------------------------------------------------
input="$(cat)"
[ -n "$input" ] || allow_stop

command -v jq >/dev/null 2>&1 || allow_stop  # no jq → cannot parse → fail open

# --- loop safety ----------------------------------------------------------------------------
# If a prior Stop hook already blocked this turn, do not block again — let the agent stop.
stop_active="$(printf '%s' "$input" | jq -r '.stop_hook_active // false' 2>/dev/null || echo false)"
[ "$stop_active" = "true" ] && allow_stop

# --- opt-in gate (off by default) -----------------------------------------------------------
# Per-repo, lives in .git/config, never checked in. A fresh clone is opted out.
# Resolve relative to the hook's cwd (the project), which is where the flag lives.
cwd="$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null || true)"
[ -n "$cwd" ] && cd "$cwd" 2>/dev/null || true
enabled="$(git config --bool agentfactory.stanceGuard 2>/dev/null || echo false)"
[ "$enabled" = "true" ] || allow_stop

# --- agent-scope gate -----------------------------------------------------------------------
# Only enforce the stance for the configured agents (the principal-ic-intrinsic agents by default).
# agent_type identifies the agent (verified by an introspective-hook capture): it is PRESENT for an
# --agent / @mention launch — top-level INCLUDED (a session started as @nico reports agent_type=nico)
# — and for every SubagentStop; it is ABSENT only for a DEFAULT top-level session (plain claude, no
# --agent). When absent we do NOT enforce: a session that never declared itself a principal should not
# get the principal rubric. STANCE_GUARD_AGENTS=* overrides to enforce on everyone (a blunt instrument).
agent_type="$(printf '%s' "$input" | jq -r '.agent_type // empty' 2>/dev/null || true)"
allowlist="${STANCE_GUARD_AGENTS:-$(git config agentfactory.stanceGuardAgents 2>/dev/null || echo 'nico mav')}"

if [ "$allowlist" != "*" ]; then
	[ -n "$agent_type" ] || allow_stop  # cannot identify the agent → fail open
	in_scope=false
	for a in $allowlist; do
		[ "$a" = "$agent_type" ] && in_scope=true && break
	done
	[ "$in_scope" = true ] || allow_stop
fi

# --- extract the last assistant turn from the transcript ------------------------------------
transcript="$(printf '%s' "$input" | jq -r '.transcript_path // empty' 2>/dev/null || true)"
[ -n "$transcript" ] && [ -f "$transcript" ] || allow_stop

# The transcript is JSONL: each line has top-level .type ("assistant"/"user"), .isSidechain
# (true for subagent lines), and .message.content as an array of blocks (thinking/text/tool_use)
# — or, for a user line, a plain string. We judge the AGENT's last assistant text, but the
# judge cannot tell an operator-ORDERED irreversible act (fine) from a unilateral one without the
# operator's instruction — so we also extract the most recent operator message and pass it
# alongside as authorization context. A tool_result-only user line carries no text — skipped.
asst="$(jq -rs '
	[ .[]
	  | select(.type == "assistant")
	  | (.message.content // [])
	  | map(select(.type == "text") | .text)
	  | join("\n")
	]
	| map(select(. != "")) | last // ""
' "$transcript" 2>/dev/null || true)"

[ -n "$asst" ] || allow_stop  # no judgeable agent text (e.g. pure tool turn) → allow stop

operator="$(jq -rs '
	[ .[]
	  | select(.type == "user")
	  | (.message.content)
	  | if type == "string" then .
	    elif type == "array" then ([ .[] | select(.type == "text") | .text ] | join("\n"))
	    else "" end
	]
	| map(select(. != "")) | last // ""
' "$transcript" 2>/dev/null || true)"
[ -n "$operator" ] || operator="(no operator instruction found in transcript)"

# The judged payload: the operator's instruction (authorization context) THEN the agent turn.
turn="=== OPERATOR (most recent instruction — the authorization context) ===
$operator

=== AGENT (last assistant turn — judge THIS) ===
$asst"

# --- judge ----------------------------------------------------------------------------------
# The judge contract: turn on stdin, rubric path as argv[1]; emits VERDICT: PASS|BLOCK [+ REASON].
# Non-zero judge exit → fail open.
verdict="$(printf '%s' "$turn" | $JUDGE_CMD "$RUBRIC" 2>/dev/null)" || allow_stop

decision="$(printf '%s\n' "$verdict" | sed -n 's/^VERDICT:[[:space:]]*//p' | head -1)"
[ "$decision" = "BLOCK" ] || allow_stop  # PASS, empty, or anything but BLOCK → allow stop

reason="$(printf '%s\n' "$verdict" | sed -n 's/^REASON:[[:space:]]*//p' | head -1)"
[ -n "$reason" ] || reason="This turn collapsed out of the intent-driven-expert stance."

# --- BLOCK ----------------------------------------------------------------------------------
# Emit the Stop-hook block decision. The `reason` is fed back to the agent as a corrective
# instruction; it must re-assume the stance (own the call / extract the intent) and continue.
feedback="STANCE GUARDRAIL — blocked: you collapsed out of the intent-driven-expert stance. $reason \
Re-assume the stance: you are the owning expert; the operator owns intent + sign-off on irreversible \
acts only. Decide the in-remit call yourself (note it for review) instead of seeking permission, own \
your expert judgment (naming/design/architecture/how) instead of deferring it, and extract+serve the \
operator's INTENT instead of echoing their literal words. Then continue. (Legitimate exceptions: \
surfacing a genuine irreversible-outward act for consent, or routing a true INTENT ambiguity to /elicit.)"

# jq builds valid JSON regardless of quotes/newlines in the feedback.
jq -cn --arg r "$feedback" '{decision:"block", reason:$r}'
exit 0
