import type { HookCell } from '@leclabs/agent-forge/anatomy';

// stance-guardrail-pre — the PreToolUse twin of `stance-guardrail` (the Stop cell).
// It STRUCTURALLY REFUSES, BEFORE the call fires, a mid-turn tool call that collapses
// out of the intent-driven-expert stance:
//   - AskUserQuestion : a permission / option-menu on an in-remit reversible call
//   - Agent / SendMessage : a dispatch that transcribes literal words w/o extracted intent
// These never fire `Stop`, so the Stop guard is blind to them (the closed blind spot).
// It SHARES the deployed judge backend + rubric of the sibling `stance-guardrail` hook
// (one rubric, one judge — no duplication); only this worker + its matcher are new.
// The claude adapter realizes `event`+`matcher` → a `settings.json` PreToolUse entry
// + `hooks/<id>/` workers; `test/hook-rule-boundary.test.ts` byte-locks the worker.

export const stanceGuardrailPre: HookCell = {
  id: 'stance-guardrail-pre',
  residue:
    'structural-refusal ↾ mid-turn tool-call · deny-before-fire ⟨intent-driven-expert-collapse⟩ ⟨permission-menu ⟨AskUserQuestion⟩ · dispatch-echo ⟨Agent · SendMessage : literal-transcription ∄ extracted-intent⟩⟩ · pass ⟨reserved · irreversible-outward-consent · substantive-dispatch · intent-ambiguity ↦ elicit⟩ · shared judge-backend ⟨sibling⟩ · loop-safe ⟨re-entry-cap : ¬deny identical twice⟩',
  substrate: 'harness',
  order: 1,
  events: ['tool.use.pre'],
  matcher: 'AskUserQuestion|Agent|SendMessage',
  entry: 'stance-guardrail-pre.sh',
  timeout: 60,
  refs: [],
  workers: [
    {
      filename: 'stance-guardrail-pre.sh',
      targetPath:
        'packages/agent-canon/src/toolkit/guardrail/stance-guardrail-pre.sh',
      executable: true,
      content: `#!/usr/bin/env sh
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
#   - OFF BY DEFAULT (git config agentfactory.stanceGuard true).
#   - AGENT-SCOPED (agent_type in the allowlist; default: nico mav). agent_type is
#     present only for subagents / --agent mode; a top-level session call fails open.
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

# The sibling Stop hook's deployed dir owns the SHARED judge + rubric (deployed together).
JUDGE_DIR="\${STANCE_GUARD_DIR:-$HOME/.claude/hooks/stance-guardrail}"
RUBRIC="\${STANCE_RUBRIC:-$JUDGE_DIR/stance-judge-prompt.md}"
JUDGE_CMD="\${STANCE_JUDGE_CMD:-sh $JUDGE_DIR/stance-judge.sh}"
LOG="\${STANCE_GUARD_LOG:-$HOME/.claude/hooks/stance-guardrail-pre/misses.log}"

# A PreToolUse hook must never break a session. Trap any unexpected error -> allow.
trap 'exit 0' EXIT

allow() { exit 0; }  # emit nothing; the tool call proceeds.
note() { printf '%s\\n' "$1" >> "$LOG" 2>/dev/null || true; }

# --- read hook input ------------------------------------------------------------------------
input="$(cat)"
[ -n "$input" ] || allow
command -v jq >/dev/null 2>&1 || allow  # no jq -> cannot parse -> fail open

# --- opt-in gate (off by default) -----------------------------------------------------------
# Per-repo, lives in .git/config, never checked in. Resolve relative to the hook's cwd.
cwd="$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null || true)"
[ -n "$cwd" ] && cd "$cwd" 2>/dev/null || true
enabled="$(git config --bool agentfactory.stanceGuard 2>/dev/null || echo false)"
[ "$enabled" = "true" ] || allow

# --- agent-scope gate -----------------------------------------------------------------------
# Only enforce for the configured agents (default: the principal-ic-intrinsic agents).
# agent_type is present only for a subagent / --agent tool call; absent for the top-level
# session -> fail open (unless STANCE_GUARD_AGENTS=*), exactly like the Stop guard.
agent_type="$(printf '%s' "$input" | jq -r '.agent_type // empty' 2>/dev/null || true)"
allowlist="\${STANCE_GUARD_AGENTS:-$(git config agentfactory.stanceGuardAgents 2>/dev/null || echo 'nico mav')}"
if [ "$allowlist" != "*" ]; then
	[ -n "$agent_type" ] || allow  # cannot identify the agent -> fail open
	in_scope=false
	for a in $allowlist; do
		[ "$a" = "$agent_type" ] && in_scope=true && break
	done
	[ "$in_scope" = true ] || allow
fi

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
		allow ;;  # the matcher should preclude this; be safe
esac

[ -n "\${body:-}" ] || allow  # nothing judgeable -> allow

# --- loop-safety: never deny an identical tool_input twice ----------------------------------
# No stop_hook_active analog exists for PreToolUse; a per-(session,input) marker caps re-deny.
session_id="$(printf '%s' "$input" | jq -r '.session_id // "nosession"' 2>/dev/null || echo nosession)"
sig="$(printf '%s' "$input" | jq -c '.tool_input' 2>/dev/null | cksum | cut -d' ' -f1 2>/dev/null || echo 0)"
seen="\${TMPDIR:-/tmp}/.stance-pre-$session_id-$sig"
[ -f "$seen" ] && allow  # already denied this exact input once -> let it through

# --- judge (SHARED backend + rubric) --------------------------------------------------------
verdict="$(printf '%s' "$payload" | $JUDGE_CMD "$RUBRIC" 2>/dev/null)" || {
	note "$(date -u +%Y-%m-%dT%H:%M:%SZ) judge-fail tool=$tool_name agent=\${agent_type:-?}"
	allow
}

decision="$(printf '%s\\n' "$verdict" | sed -n 's/^VERDICT:[[:space:]]*//p' | head -1)"
[ "$decision" = "BLOCK" ] || allow  # PASS, empty, or anything but BLOCK -> allow

reason="$(printf '%s\\n' "$verdict" | sed -n 's/^REASON:[[:space:]]*//p' | head -1)"
[ -n "$reason" ] || reason="This tool call collapsed out of the intent-driven-expert stance."

# mark this exact input as denied-once (the cap) before emitting the deny
: > "$seen" 2>/dev/null || true

# --- DENY -----------------------------------------------------------------------------------
feedback="STANCE GUARDRAIL (pre) — denied this $tool_name call: it collapses out of the \\
intent-driven-expert stance. $reason  Own the in-remit reversible call yourself instead of handing the \\
operator a menu; extract and serve the underlying INTENT instead of transcribing literal words into a \\
dispatch. Decide, note the call for review, and proceed. (Legitimate exceptions that should NOT be a menu \\
here: a genuine irreversible-outward consent choice, a true INTENT ambiguity for /elicit, or a substantive \\
intent-extracted dispatch.)"

jq -cn --arg r "$feedback" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
exit 0
`,
    },
  ],
};
