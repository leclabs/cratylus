#!/usr/bin/env sh
# purview-guardrail — denies a mid-turn act outside the arrow the agent's own `## Role` contract declares. Needs jq.

set -eu
GUARD_ID=purview-guardrail
GUARD_NAME="PURVIEW GUARDRAIL"

# Builtins only until jq is checked: a PATH of little but `sh` must still be able to say so.
esc() {
	_i="$1"; _o=""; _n="$(printf '\nx')"; _n="${_n%x}"; _t="$(printf '\t')"; _r="$(printf '\r')"
	while [ -n "$_i" ]; do
		_s="${_i#?}"; _c="${_i%"$_s"}"
		case "$_c" in '\') _c='\\' ;; '"') _c='\"' ;; "$_n") _c='\n' ;; "$_t") _c='\t' ;; "$_r") _c='\r' ;; esac
		_o="$_o$_c"; _i="$_s"
	done
	printf '%s' "$_o"
}
say() {
	case "claude" in
		claude) printf '{"systemMessage":"%s"}\n' "$(esc "$1")" ;;
		*) printf '%s\n' "$1" ;;
	esac
}
allow() { exit 0; }
open() { say "$GUARD_NAME — DARK: $1. This call was NOT judged."; exit 0; }
trap 'rc=$?; [ "$rc" -eq 0 ] || open "an unexpected error stopped it (exit status $rc)"; exit 0' EXIT

input="$(cat)"
[ -n "$input" ] || open "the hook received no input"
command -v jq >/dev/null 2>&1 || open "jq is not installed"
field() { printf '%s' "$input" | jq -r "$1" 2>/dev/null || true; }

# Only a subagent's payload carries agent_id; a guard binds the persona's own session.
[ -z "$(field '.agent_id // empty')" ] || allow

HOOKS_ROOT="$(dirname -- "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)")"
NEUTRAL_ROOT="$(dirname -- "$(dirname -- "$HOOKS_ROOT")")/.agents"
RUBRIC="${PURVIEW_RUBRIC:-$NEUTRAL_ROOT/purview-guardrail/purview-judge-prompt.md}"
JUDGE_CMD="${STANCE_JUDGE_CMD:-sh ${STANCE_GUARD_DIR:-$HOOKS_ROOT/stance-guardrail}/stance-judge.sh}"

cd "$(field '.cwd // empty')" 2>/dev/null || true

# Enrolled by the persona's stance manifest: `stance_scope` (omp) or `agent_type` (Claude Code).
stance_scope="$(field '.stance_scope // empty')"
if [ -z "$stance_scope" ]; then
	named="$(field '.agent_type // empty')"
	case "$named" in '' | */* | . | ..) allow ;; esac
	stance_scope="$(dirname -- "$HOOKS_ROOT")/personas/$named"
fi
manifest="$stance_scope/stance/manifest.json"
[ -f "$manifest" ] || allow
GUARD_AGENT="$(jq -r '.agent // empty' "$manifest" 2>/dev/null || true)"
[ -n "$GUARD_AGENT" ] || open "the stance manifest at $manifest names no agent"

AGENT_MD="${PURVIEW_AGENT_MD:-$(dirname -- "$(dirname -- "$stance_scope")")/agents/$GUARD_AGENT.md}"
[ -f "$AGENT_MD" ] || open "the agent's Target is not at $AGENT_MD, so its contract cannot be read"
contract="$(awk '/^## Role$/{f=1;next} /^## /{f=0} f' "$AGENT_MD" 2>/dev/null || true)"
# A bare-token contract states no arrow.
[ "$(printf '%s\n' "$contract" | grep -c '[^[:space:]]')" -ge 2 ] || allow

JUDGE_PAYLOAD_CAP=12000
judge_bytes() { printf '%s' "$1" | wc -c | tr -d ' '; }
JUDGE_JQ='
def pre($n): . as $s | if $n <= 0 then "" else {lo: 0, hi: ($s | length)} | until(.lo >= .hi;
((.lo + .hi + 1) / 2 | floor) as $m | if ($s[:$m] | utf8bytelength) <= $n then .lo = $m else .hi = $m - 1 end) | $s[:.lo] end;
def suf($n): . as $s | if $n <= 0 then "" else {lo: 0, hi: ($s | length)} | until(.lo >= .hi;
((.lo + .hi + 1) / 2 | floor) as $m | if ($s[-$m:] | utf8bytelength) <= $n then .lo = $m else .hi = $m - 1 end)
| if .lo == 0 then "" else $s[-.lo:] end end;
'
# --rawfile, never -R: jq 1.7's raw reader corrupts a multibyte character straddling a read boundary.
judge_ends() {
jq -n -j --rawfile text /dev/stdin --argjson n "$1" "$JUDGE_JQ"'
$text | . as $s | ($s | utf8bytelength) as $t | if $t <= $n then $s else
((($n - 200) / 2) | floor) as $k | ($s | pre($k)) as $h | ($s | suf($k)) as $e
| ($t - ($h | utf8bytelength) - ($e | utf8bytelength)) as $gone
| $h + "\n[ELIDED: \($gone) of \($t) bytes from the middle are not shown]\n" + $e end'
}

GUARD_ACT="$(field '.tool_name // empty')"
[ -n "$GUARD_ACT" ] || open "the payload names no tool"

case "$GUARD_ACT" in
	Agent|SendMessage|Task)
		body="$(field '.tool_input.prompt // .tool_input.message // .tool_input.description // ""')"
		target="$(field '.tool_input.subagent_type // .tool_input.agent // .tool_input.name // ""')"
		act="DISPATCH to \`${target:-unnamed}\`"
		;;
	Write|Edit|MultiEdit|NotebookEdit)
		body="$(field '.tool_input.file_path // .tool_input.path // .tool_input.notebook_path // ""')"
		# Writing the contest file is never refused.
		case "$body" in */../* | */..) ;; "${TMPDIR:-/tmp}/guardrail-contest/"*) allow ;; esac
		act="WRITE to $body"
		;;
	*) allow ;;
esac
[ -n "${body:-}" ] || allow

GUARD_SESSION="$(field '.session_id // empty')"
GUARD_CALL="$(printf '%s' "$input" | jq -c '.tool_input' 2>/dev/null || true)"
case "$GUARD_SESSION" in '' | */* | . | ..) GUARD_SESSION=nosession ;; esac
CONTEST_DIR="${TMPDIR:-/tmp}/guardrail-contest/$GUARD_ID/$GUARD_SESSION"
CONTEST_AT="$CONTEST_DIR/stop"
[ "$GUARD_ACT" = stop ] || CONTEST_AT="$CONTEST_DIR/$(printf '%s %s' "$GUARD_ACT" "${GUARD_CALL:-}" | cksum | cut -d' ' -f1)"
contest_heard() {
	refusal="$(cat "$CONTEST_AT.refused" 2>/dev/null)" && contest="$(cat "$CONTEST_AT.contest" 2>/dev/null)" || contest=
	rm -f "$CONTEST_AT.contest" "$CONTEST_AT.refused"
	[ -n "$contest" ] || return 0
	log="${GUARD_CONTEST_LOG:-$NEUTRAL_ROOT/guardrail/contests.log}"
	mkdir -p "$(dirname -- "$log")" 2>/dev/null && jq -cn --arg time "$(date -u +%FT%TZ)" --arg guard "$GUARD_ID" \
		--arg session "$GUARD_SESSION" --arg agent "$GUARD_AGENT" --arg act "$GUARD_ACT" --arg refusal "$refusal" \
		--arg contest "$contest" '$ARGS.named' 2>/dev/null >> "$log" && kept="logged in $log" || kept="the contest was not recorded: $log is not writable"
	say "$GUARD_NAME — contested: this $GUARD_ACT went through unjudged on the agent's reason: $(printf '%s' "$contest" | tr '\n' ' ') ($kept)"
	exit 0
}
contest_refused() {
	mkdir -p "$CONTEST_DIR" 2>/dev/null && printf '%s\n' "$1" > "$CONTEST_AT.refused" 2>/dev/null || true
	[ "$GUARD_ACT" = stop ] && again="end the turn again" || again="repeat the same call"
	printf '%s' "Act on that reason, or if you hold it wrong state why with this command, then $again; it then goes through unjudged, your reason logged for the operator: printf '%s\\n' 'why' > '$CONTEST_AT.contest'"
}

contest_heard

# The contract may hold half the cap; evidence is checked against exactly this payload.
contract="$(printf '%s' "$contract" | judge_ends "$((JUDGE_PAYLOAD_CAP / 2))")"
head_part="=== THE HOLDER'S DECLARED CONTRACT (agent: $GUARD_AGENT) ===
$contract
=== THE ACT ABOUT TO FIRE ===
$act
"
body="$(printf '%s' "$body" | judge_ends "$((JUDGE_PAYLOAD_CAP - $(judge_bytes "$head_part")))")"
payload="$head_part$body"

# A host holding a model runs this twice around its own judgment, under the names the omp bridge speaks.
if [ -n "${STANCE_EMIT_PAYLOAD:-}" ]; then
	jq -cn --arg r "$RUBRIC" --arg p "$payload" '{rubric:$r,payload:$p}'
	exit 0
fi
if [ -n "${STANCE_VERDICT_FILE:-}" ]; then
	verdict="$(cat "$STANCE_VERDICT_FILE" 2>/dev/null || true)"
	[ -n "$verdict" ] || open "the judge did not answer"
else
	verdict="$(printf '%s' "$payload" | $JUDGE_CMD "$RUBRIC" 2>/dev/null)" || open "the judge did not answer"
fi

said() { printf '%s\n' "$verdict" | sed -n "s/^$1:[[:space:]]*//p" | head -1; }
case "$(said VERDICT | sed 's/[[:space:]]*$//')" in
	PASS) allow ;;
	BLOCK) ;;
	*) open "the judge's verdict was unparseable" ;;
esac

reason="$(said REASON)"
[ -n "$reason" ] || reason="This act is outside the arrow your role contract declares."

cited="$(said EVIDENCE)"
if [ -n "$cited" ]; then
	printf '%s' "$payload" | grep -qF -- "$cited" || {
		say "$GUARD_NAME — BLOCK DISCARDED: the judge cited a span that is not in the call (fabricated): $cited. No verdict stands; this call was NOT judged."
		exit 0
	}
fi

feedback="$GUARD_NAME — denied this $GUARD_ACT call: $reason Hand an act outside your arrow to the role that owns it, a unit of the loop by name. $(contest_refused "$reason")"
jq -cn --arg r "$feedback" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
exit 0
