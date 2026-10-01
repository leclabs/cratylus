#!/usr/bin/env sh
# stance-guardrail-pre: denies, before it fires, an AskUserQuestion menu on an in-remit call or an
# Agent/SendMessage dispatch that echoes literal words. Every call is judged, a retry included.
# Fails open, never silently: what stops it judging lets the call through with a notice and a log line.
set -eu

# esc, say and open are builtins only, so they work before the jq check can fail.
esc() {
	_in="$1"
	_out=""
	_nl="$(printf '\nx')"
	_nl="${_nl%x}"
	_tab="$(printf '\t')"
	_cr="$(printf '\r')"
	while [ -n "$_in" ]; do
		_rest="${_in#?}"
		_c="${_in%"$_rest"}"
		case "$_c" in
			'\') _c='\\' ;;
			'"') _c='\"' ;;
			"$_nl") _c='\n' ;;
			"$_tab") _c='\t' ;;
			"$_cr") _c='\r' ;;
		esac
		_out="$_out$_c"
		_in="$_rest"
	done
	printf '%s' "$_out"
}
# Claude Code shows the operator a JSON systemMessage; omp relays a plain line.
say() {
	case "claude" in
		claude) printf '{"systemMessage":"%s"}\n' "$(esc "$1")" ;;
		*) printf '%s\n' "$1" ;;
	esac
}
allow() { exit 0; }
open() {
	[ -z "${LOG:-}" ] || printf '%s\n' "open: $1 tool=${tool_name:-?} agent=${agent_type:-?}" >> "$LOG" 2>/dev/null || true
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
RUBRIC="${STANCE_RUBRIC:-$NEUTRAL_ROOT/stance-guardrail/stance-judge-prompt.md}"
JUDGE_CMD="${STANCE_JUDGE_CMD:-sh ${STANCE_GUARD_DIR:-$HOOKS_ROOT/stance-guardrail}/stance-judge.sh}"
LOG="${STANCE_GUARD_LOG:-$SELF_DIR/misses.log}"

cwd="$(field '.cwd // empty')"
[ -n "$cwd" ] && cd "$cwd" 2>/dev/null || true

# A stance manifest in the persona's scope is the enrollment: omp hands the scope over as
# stance_scope, Claude Code names the agent as agent_type. No manifest, no judgement.
stance_scope="$(field '.stance_scope // empty')"
if [ -z "$stance_scope" ]; then
	named="$(field '.agent_type // empty')"
	case "$named" in '' | */* | . | ..) allow ;; esac
	stance_scope="$(dirname -- "$HOOKS_ROOT")/personas/$named"
fi
manifest="$stance_scope/stance/manifest.json"
[ -f "$manifest" ] || allow
agent_type="$(jq -r '.agent // empty' "$manifest" 2>/dev/null || true)"

JUDGE_PAYLOAD_CAP=12000
judge_bytes() { printf '%s' "$1" | wc -c | tr -d ' '; }
JUDGE_JQ='
def pre($n): . as $s | if $n <= 0 then "" else
	{ lo: 0, hi: ($s | length) } | until(.lo >= .hi;
		((.lo + .hi + 1) / 2 | floor) as $m
		| if ($s[:$m] | utf8bytelength) <= $n then .lo = $m else .hi = $m - 1 end)
	| $s[:.lo] end;
def suf($n): . as $s | if $n <= 0 then "" else
	{ lo: 0, hi: ($s | length) } | until(.lo >= .hi;
		((.lo + .hi + 1) / 2 | floor) as $m
		| if ($s[-$m:] | utf8bytelength) <= $n then .lo = $m else .hi = $m - 1 end)
	| if .lo == 0 then "" else $s[-.lo:] end end;
'
judge_keep() { jq -n -j --rawfile text /dev/stdin --argjson n "$1" "$JUDGE_JQ"' $text | suf($n)'; }
judge_ends() {
	jq -n -j --rawfile text /dev/stdin --argjson n "$1" "$JUDGE_JQ"'
		$text | . as $s | ($s | utf8bytelength) as $t
		| if $t <= $n then $s else
			((($n - 200) / 2) | floor) as $k
			| ($s | pre($k)) as $h | ($s | suf($k)) as $e
			| ($t - ($h | utf8bytelength) - ($e | utf8bytelength)) as $gone
			| $h + "\n[ELIDED: \($gone) of \($t) bytes from the middle are not shown]\n" + $e
		end'
}
judge_cut() { printf '[ELIDED: the first %s of %s bytes of %s are not shown; what follows is its final part]' "$(($2 - $3))" "$2" "$1"; }


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

[ -n "${body:-}" ] || allow

body="$(printf '%s' "$body" | judge_ends "$((JUDGE_PAYLOAD_CAP - $(judge_bytes "$prefix")))")"
payload="$prefix$body"

if [ -n "${STANCE_EMIT_PAYLOAD:-}" ]; then
	jq -cn --arg r "$RUBRIC" --arg p "$payload" '{rubric:$r, payload:$p}'
	exit 0
fi
if [ -n "${STANCE_VERDICT_FILE:-}" ]; then
	verdict="$(cat "${STANCE_VERDICT_FILE}" 2>/dev/null || true)"
	[ -n "$verdict" ] || open "the judge did not answer"
else
	verdict="$(printf '%s' "$payload" | $JUDGE_CMD "$RUBRIC" 2>/dev/null)" || open "the judge did not answer"
fi

tag() { printf '%s\n' "$verdict" | sed -n "s/^$1:[[:space:]]*//p" | head -1; }
decision="$(tag VERDICT | sed 's/[[:space:]]*$//')"
case "$decision" in
	PASS) allow ;;
	BLOCK) ;;
	*) open "the judge's verdict was unparseable (no VERDICT: PASS or VERDICT: BLOCK line)" ;;
esac

reason="$(tag REASON)"
[ -n "$reason" ] || reason="This tool call collapsed out of the intent-driven-expert stance."

feedback="STANCE GUARDRAIL (pre) — denied this $tool_name call: it collapses out of the \
intent-driven-expert stance. $reason  Own the in-remit reversible call yourself instead of handing the \
operator a menu; extract and serve the underlying INTENT instead of transcribing literal words into a \
dispatch. Decide, note the call for review, and proceed. (Legitimate exceptions that should NOT be a menu \
here: a genuine irreversible-outward consent choice, a true INTENT ambiguity for /elicit, a substantive \
intent-extracted dispatch, or a unit or a closed plan routed by name, whose intent lives in its spec.)"

jq -cn --arg r "$feedback" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
exit 0
