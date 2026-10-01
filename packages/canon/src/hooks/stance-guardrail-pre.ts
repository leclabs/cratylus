import { anchorOf } from '@cratylus/schema';
import { handoff } from '../dimensions/autonomy/handoff.js';
import type { HookCell } from '../manifest.js';
import { stanceGuardrailJudgeClipLean } from './stance-guardrail.js';

// stance-guardrail-pre — the before-the-call twin of `stance-guardrail`. It denies a mid-turn
// call that collapses out of the intent-driven-expert stance, and binds the two acts that
// never fire the turn end: operator.consult.pre (a menu on an in-remit reversible call) and
// subagent.dispatch.pre (a dispatch that transcribes literal words). It shares the judge
// backend and rubric of the sibling cell. `test/hook-rule-boundary.test.ts` byte-locks the
// worker; `test/hook-act-selector.test.ts` holds the act selectors.

export const stanceGuardrailPre: HookCell = {
  id: 'stance-guardrail-pre',
  residue:
    'structural-refusal ↾ mid-turn tool-call · deny-before-fire ⟨intent-driven-expert-collapse⟩ ⟨permission-menu · dispatch-echo ⟨literal-transcription ∄ extracted-intent⟩⟩ · pass ⟨reserved · irreversible-outward-consent · substantive-dispatch · intent-ambiguity ↦ elicit⟩ · shared judge-backend ⟨sibling⟩ · refusal-holds ⟨a retried refusal is judged again ¬ waved-through⟩',
  substrate: 'harness',
  // Bound by the same composition as its turn-end twin: the stance it enforces is the
  // one `handoff` declares.
  binds: { dimension: 'autonomy', value: anchorOf(handoff) },
  order: 1,
  events: ['operator.consult.pre', 'subagent.dispatch.pre'],
  entry: 'stance-guardrail-pre.sh',
  timeout: 60,
  refs: [],
  workers: [
    {
      filename: 'stance-guardrail-pre.sh',
      targetPath: 'packages/canon/targets/guardrail/stance-guardrail-pre.sh',
      executable: true,
      content: `#!/usr/bin/env sh
# stance-guardrail-pre: denies, before it fires, an AskUserQuestion menu on an in-remit call or an
# Agent/SendMessage dispatch that echoes literal words. Every call is judged, a retry included.
# Fails open, never silently: what stops it judging lets the call through with a notice and a log line.
set -eu

# esc, say and open are builtins only, so they work before the jq check can fail.
esc() {
	_in="$1"
	_out=""
	_nl="$(printf '\\nx')"
	_nl="\${_nl%x}"
	_tab="$(printf '\\t')"
	_cr="$(printf '\\r')"
	while [ -n "$_in" ]; do
		_rest="\${_in#?}"
		_c="\${_in%"$_rest"}"
		case "$_c" in
			'\\') _c='\\\\' ;;
			'"') _c='\\"' ;;
			"$_nl") _c='\\n' ;;
			"$_tab") _c='\\t' ;;
			"$_cr") _c='\\r' ;;
		esac
		_out="$_out$_c"
		_in="$_rest"
	done
	printf '%s' "$_out"
}
# Claude Code shows the operator a JSON systemMessage; omp relays a plain line.
say() {
	case "{{fact:harness-name}}" in
		claude) printf '{"systemMessage":"%s"}\\n' "$(esc "$1")" ;;
		*) printf '%s\\n' "$1" ;;
	esac
}
allow() { exit 0; }
open() {
	[ -z "\${LOG:-}" ] || printf '%s\\n' "open: $1 tool=\${tool_name:-?} agent=\${agent_type:-?}" >> "$LOG" 2>/dev/null || true
	say "STANCE GUARDRAIL (pre) — DARK: $1. This call was NOT judged; the absence of a deny is an absence of a verdict, not a clean one."
	exit 0
}
trap 'rc=$?; [ "$rc" -eq 0 ] || open "an unexpected error stopped it (exit status $rc)"; exit 0' EXIT

input="$(cat)"
[ -n "$input" ] || open "the hook received no input"
command -v jq >/dev/null 2>&1 || open "jq is not installed, so the hook payload cannot be read"
field() { printf '%s' "$input" | jq -r "$1" 2>/dev/null || true; }

# Only a subagent's payload carries agent_id; the guard binds main sessions.
[ -z "$(field '.agent_id // empty')" ] || allow

# Sibling paths come from this script's own location, never from a harness home.
SELF_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
HOOKS_ROOT="$(dirname -- "$SELF_DIR")"
NEUTRAL_ROOT="$(dirname -- "$(dirname -- "$HOOKS_ROOT")")/.agents"
RUBRIC="\${STANCE_RUBRIC:-$NEUTRAL_ROOT/stance-guardrail/stance-judge-prompt.md}"
JUDGE_CMD="\${STANCE_JUDGE_CMD:-sh \${STANCE_GUARD_DIR:-$HOOKS_ROOT/stance-guardrail}/stance-judge.sh}"
LOG="\${STANCE_GUARD_LOG:-$SELF_DIR/misses.log}"

cwd="$(field '.cwd // empty')"
[ -n "$cwd" ] && cd "$cwd" 2>/dev/null || true

# A stance manifest in the persona's scope is the enrollment: omp hands the scope over as
# stance_scope, Claude Code names the agent as agent_type. No manifest, no judgement.
stance_scope="$(field '.stance_scope // empty')"
if [ -z "$stance_scope" ]; then
	named="$(field '.agent_type // empty')"
	case "$named" in '' | */* | . | ..) allow ;; esac
	stance_scope="$(dirname -- "$HOOKS_ROOT")/{{fact:harness-persona-root}}/$named"
fi
manifest="$stance_scope/{{fact:stance-manifest}}"
[ -f "$manifest" ] || allow
agent_type="$(jq -r '.agent // empty' "$manifest" 2>/dev/null || true)"

${stanceGuardrailJudgeClipLean}

tool_name="$(field '.tool_name // empty')"
[ -n "$tool_name" ] || open "the payload names no tool, so there is no call to judge"

case "$tool_name" in
	AskUserQuestion)
		body="$(field '
			(.tool_input.questions // [])
			| map("Q: " + (.question // "")
			      + "  OPTIONS: " + ((.options // []) | map(.label // "") | join(" | ")))
			| join("  ;;  ")
		')"
		prefix="AskUserQuestion menu (a question/option menu handed to the operator): " ;;
	Agent|SendMessage)
		body="$(field '.tool_input.prompt // .tool_input.message // .tool_input.description // ""')"
		prefix="$tool_name dispatch (the delegate prompt/message): " ;;
	*) allow ;;
esac

[ -n "\${body:-}" ] || allow

body="$(printf '%s' "$body" | judge_ends "$((JUDGE_PAYLOAD_CAP - $(judge_bytes "$prefix")))")"
payload="$prefix$body"

if [ -n "\${STANCE_EMIT_PAYLOAD:-}" ]; then
	jq -cn --arg r "$RUBRIC" --arg p "$payload" '{rubric:$r, payload:$p}'
	exit 0
fi
if [ -n "\${STANCE_VERDICT_FILE:-}" ]; then
	verdict="$(cat "\${STANCE_VERDICT_FILE}" 2>/dev/null || true)"
	[ -n "$verdict" ] || open "the judge did not answer"
else
	verdict="$(printf '%s' "$payload" | $JUDGE_CMD "$RUBRIC" 2>/dev/null)" || open "the judge did not answer"
fi

tag() { printf '%s\\n' "$verdict" | sed -n "s/^$1:[[:space:]]*//p" | head -1; }
decision="$(tag VERDICT | sed 's/[[:space:]]*$//')"
case "$decision" in
	PASS) allow ;;
	BLOCK) ;;
	*) open "the judge's verdict was unparseable (no VERDICT: PASS or VERDICT: BLOCK line)" ;;
esac

reason="$(tag REASON)"
[ -n "$reason" ] || reason="This tool call collapsed out of the intent-driven-expert stance."

feedback="STANCE GUARDRAIL (pre) — denied this $tool_name call: it collapses out of the \\
intent-driven-expert stance. $reason  Own the in-remit reversible call yourself instead of handing the \\
operator a menu; extract and serve the underlying INTENT instead of transcribing literal words into a \\
dispatch. Decide, note the call for review, and proceed. (Legitimate exceptions that should NOT be a menu \\
here: a genuine irreversible-outward consent choice, a true INTENT ambiguity for /elicit, a substantive \\
intent-extracted dispatch, or a unit or a closed plan routed by name, whose intent lives in its spec.)"

jq -cn --arg r "$feedback" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
exit 0
`,
    },
  ],
};
