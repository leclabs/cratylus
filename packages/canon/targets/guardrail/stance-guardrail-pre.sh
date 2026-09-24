#!/usr/bin/env sh
# stance-guardrail-pre — a PreToolUse hook that STRUCTURALLY REFUSES a mid-turn tool
# call that collapses out of the intent-driven-expert (fiduciary-agent) stance BEFORE
# it fires. The pre-hoc twin of stance-guardrail (Stop): AskUserQuestion menus and
# Agent/SendMessage dispatch-echo never fire Stop, so the Stop guard cannot see them.
#
# WHAT IT DENIES (see stance-judge-prompt.md — the SHARED rubric):
#   - AskUserQuestion : a permission / option-menu on an in-remit reversible call
#   - Agent/SendMessage : a dispatch transcribing literal words without extracted intent
# WHAT IT DOES NOT DENY (reserved): an irreversible-outward consent menu, a true INTENT
#   ambiguity, a substantive intent-extracted dispatch.
#
# SAFETY MODEL (mirrors stance-guardrail):
#   - SCOPE-ENROLLED, exactly as its twin: a scope carrying a stance manifest is judged and
#     every other scope is silent. No repo opt-in, no allowlist — the projection that places a
#     persona also enrolls it, and declining the guard means declining the persona.
#   - FAILS OPEN. Any error (no jq, judge failure, bad input) -> exit 0 (allow the call).
#   - LOOP-SAFE. A re-entry cap: never deny an identical tool_input twice (there is no
#     stop_hook_active analog for PreToolUse), so it can never wedge a call.
#   - OBSERVABLE. Judge failures/timeouts are logged (fails open, but a miss is visible).
#
# INPUT  : Claude Code PreToolUse hook JSON on stdin (tool_name, tool_input, agent_type
#          [subagents], session_id, cwd, ...).
# OUTPUT : on collapse -> stdout
#          {"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny",
#           "permissionDecisionReason":"..."}} + exit 0.
#          otherwise -> no stdout + exit 0 (allow the call).
#
# POSIX sh. Depends on: jq. Missing jq -> fail open.

set -eu

# The sibling Stop hook's deployed dir owns the SHARED judge + rubric (deployed
# together, as siblings under the SAME hooks root).
#
# RESOLVED FROM THIS SCRIPT'S OWN LOCATION, never from a harness's home. These four
# lines named `$HOME/.claude/...` outright, so the copy deployed under
# `~/.omp/hooks/` reached across into the CLAUDE tree for its judge — and on a host
# with no claude deployment it found nothing, failed open, and logged its misses to
# a directory that does not exist. Every hooks root holds both hook dirs as
# siblings, so `../stance-guardrail` is true at every site this file can land; the
# sibling Stop worker already derives its own dir this way and this is the same
# derivation, one level up. The env overrides are unchanged and still win.
SELF_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
HOOKS_ROOT="$(dirname -- "$SELF_DIR")"
JUDGE_DIR="${STANCE_GUARD_DIR:-$HOOKS_ROOT/stance-guardrail}"
# The RUBRIC is not in either hook dir: it is harness-invariant and deploys once
# to the neutral `.agents` root, the sibling of every harness home. Same
# derivation as the sibling Stop worker, one level further out.
NEUTRAL_ROOT="$(dirname -- "$(dirname -- "$HOOKS_ROOT")")/.agents"
RUBRIC="${STANCE_RUBRIC:-$NEUTRAL_ROOT/stance-guardrail/stance-judge-prompt.md}"
JUDGE_CMD="${STANCE_JUDGE_CMD:-sh $JUDGE_DIR/stance-judge.sh}"
LOG="${STANCE_GUARD_LOG:-$SELF_DIR/misses.log}"

# A PreToolUse hook must never break a session. Trap any unexpected error -> allow.
trap 'exit 0' EXIT

allow() { exit 0; }  # emit nothing; the tool call proceeds.
note() { printf '%s\n' "$1" >> "$LOG" 2>/dev/null || true; }

# --- read hook input ------------------------------------------------------------------------
input="$(cat)"
[ -n "$input" ] || allow
command -v jq >/dev/null 2>&1 || allow  # no jq -> cannot parse -> fail open

# The per-repo opt-in is GONE, for the reason its twin states: it asked whether a guard may run in
# a DIRECTORY, and a stance belongs to the agent, not the checkout. `cwd` survives it — the worker
# still runs where the session runs.
cwd="$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null || true)"
[ -n "$cwd" ] && cd "$cwd" 2>/dev/null || true

# --- scope gate: the persona's OWN stance manifest -------------------------------------------
# The twin of the turn-end guard's gate, and inverted for the same reason: an allowlist here was
# a runtime self-filter over an enrollment the corpus already derives, and it had drifted the way
# such a list always drifts. Presence of a manifest in this persona's own scope IS enrollment.
# Absent → silence, never an error, so an unenrolled launch is untouched.
stance_scope="$(printf '%s' "$input" | jq -r '.stance_scope // empty' 2>/dev/null || true)"
[ -n "$stance_scope" ] || allow
manifest="$stance_scope/stance/manifest.json"
[ -f "$manifest" ] || allow
agent_type="$(jq -r '.agent // empty' "$manifest" 2>/dev/null || true)"

# --- extract the judged payload, branched by tool -------------------------------------------
tool_name="$(printf '%s' "$input" | jq -r '.tool_name // empty' 2>/dev/null || true)"
[ -n "$tool_name" ] || allow

case "$tool_name" in
	AskUserQuestion)
		# the questions + their option menus — the permission-menu class
		body="$(printf '%s' "$input" | jq -r '
			(.tool_input.questions // [])
			| map("Q: " + (.question // "")
			      + "  OPTIONS: " + ((.options // []) | map(.label // "") | join(" | ")))
			| join("  ;;  ")
		' 2>/dev/null || true)"
		payload="AskUserQuestion menu (a question/option menu handed to the operator): $body" ;;
	Agent|SendMessage)
		# the dispatch prompt/message — the dispatch-echo class
		body="$(printf '%s' "$input" | jq -r '.tool_input.prompt // .tool_input.message // .tool_input.description // ""' 2>/dev/null || true)"
		payload="$tool_name dispatch (the delegate prompt/message): $body" ;;
	*)
		allow ;;  # DEFENCE IN DEPTH, and on some harnesses the only narrowing there is:
		          # claude's adapter computes a selector from the act and this never fires;
		          # codex has no subject selector, so its projection WARNS and this branch
		          # is what keeps the guard off every other tool call.
esac

[ -n "${body:-}" ] || allow  # nothing judgeable -> allow

# --- loop-safety: never deny an identical tool_input twice ----------------------------------
# No stop_hook_active analog exists for PreToolUse; a per-(session,input) marker caps re-deny.
session_id="$(printf '%s' "$input" | jq -r '.session_id // "nosession"' 2>/dev/null || echo nosession)"
sig="$(printf '%s' "$input" | jq -c '.tool_input' 2>/dev/null | cksum | cut -d' ' -f1 2>/dev/null || echo 0)"
seen="${TMPDIR:-/tmp}/.stance-pre-$session_id-$sig"
[ -f "$seen" ] && allow  # already denied this exact input once -> let it through

# --- judge (SHARED backend + rubric) --------------------------------------------------------
# The same out-of-process seam the Stop worker carries, and for the same reason: a
# host that already holds a model must not be made to spawn another vendor's CLI.
# The deny-once marker is written AFTER this point, so the emit pass mutates nothing.
if [ -n "${STANCE_EMIT_PAYLOAD:-}" ]; then
	jq -cn --arg r "$RUBRIC" --arg p "$payload" '{rubric:$r, payload:$p}'
	exit 0
fi
if [ -n "${STANCE_VERDICT_FILE:-}" ]; then
	verdict="$(cat "${STANCE_VERDICT_FILE}" 2>/dev/null || true)"
	[ -n "$verdict" ] || {
		note "$(date -u +%Y-%m-%dT%H:%M:%SZ) judge-empty tool=$tool_name agent=${agent_type:-?}"
		allow
	}
else
	verdict="$(printf '%s' "$payload" | $JUDGE_CMD "$RUBRIC" 2>/dev/null)" || {
		note "$(date -u +%Y-%m-%dT%H:%M:%SZ) judge-fail tool=$tool_name agent=${agent_type:-?}"
		allow
	}
fi

decision="$(printf '%s\n' "$verdict" | sed -n 's/^VERDICT:[[:space:]]*//p' | head -1)"
[ "$decision" = "BLOCK" ] || allow  # PASS, empty, or anything but BLOCK -> allow

reason="$(printf '%s\n' "$verdict" | sed -n 's/^REASON:[[:space:]]*//p' | head -1)"
[ -n "$reason" ] || reason="This tool call collapsed out of the intent-driven-expert stance."

# mark this exact input as denied-once (the cap) before emitting the deny
: > "$seen" 2>/dev/null || true

# --- DENY -----------------------------------------------------------------------------------
feedback="STANCE GUARDRAIL (pre) — denied this $tool_name call: it collapses out of the \
intent-driven-expert stance. $reason  Own the in-remit reversible call yourself instead of handing the \
operator a menu; extract and serve the underlying INTENT instead of transcribing literal words into a \
dispatch. Decide, note the call for review, and proceed. (Legitimate exceptions that should NOT be a menu \
here: a genuine irreversible-outward consent choice, a true INTENT ambiguity for /elicit, or a substantive \
intent-extracted dispatch.)"

jq -cn --arg r "$feedback" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
exit 0
