#!/usr/bin/env sh
# stance-guardrail: a Stop hook that blocks a turn collapsing out of the intent-driven-expert stance.
# FAILS OPEN, BUT NEVER SILENTLY-CLEAN: what stops it judging lets the stop through with a notice and a DARK row.
set -eu

# esc, say and dark use builtins only: they must work when jq is missing.
esc() {
	_in="$1"
	_out=""
	_nl='
'
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
say() {
	case "claude" in
		claude) printf '{"systemMessage":"%s"}\n' "$(esc "$1")" ;;
		*) printf '%s\n' "$1" ;;
	esac
}

trap 'rc=$?; [ -z "${view:-}" ] || rm -f "$view" 2>/dev/null; [ "$rc" -eq 0 ] || dark "an unexpected error stopped it (exit status $rc)"; exit 0' EXIT

allow_stop() { exit 0; }
row() { [ -z "${verdict_log:-}" ] || printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$verdict_log" 2>/dev/null || true; }
dark() {
	row DARK "" "$1"
	say "STANCE GUARDRAIL — DARK: $1. This turn was NOT judged; the absence of a block is an absence of a verdict, not a clean one."
	exit 0
}

input="$(cat)"
[ -n "$input" ] || dark "the hook received no input"
command -v jq >/dev/null 2>&1 || dark "jq is not installed, so the hook payload cannot be read"
field() { printf '%s' "$input" | jq -r "$1" 2>/dev/null || true; }

# Only a subagent's payload carries agent_id; the guard binds main sessions.
[ -z "$(field '.agent_id // empty')" ] || allow_stop

SELF_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
JUDGE_CMD="${STANCE_JUDGE_CMD:-sh $SELF_DIR/stance-judge.sh}"
NEUTRAL_ROOT="$(dirname -- "$(dirname -- "$(dirname -- "$SELF_DIR")")")/.agents"
RUBRIC="${STANCE_RUBRIC:-$NEUTRAL_ROOT/stance-guardrail/stance-judge-prompt.md}"

RUN_CAP=3
session="$(printf '%s' "$input" | jq -r '.session_id // "nosession"' 2>/dev/null || echo nosession)"
state_dir="${TMPDIR:-/tmp}/stance-guardrail"
mkdir -p "$state_dir" 2>/dev/null || true
run_file="$state_dir/$session.run"
verdict_log="$state_dir/$session.verdicts"

stop_active="$(field 'if .stop_hook_active == true then "yes" else "" end')"
run=0
run_hash=none
run_known=1
if [ -n "$stop_active" ] && [ -e "$run_file" ]; then
	run_state="$(cat "$run_file" 2>/dev/null || true)"
	run="${run_state%% *}"
	run_hash="${run_state#* }"
	case "$run" in '' | *[!0-9]*) run=0; run_hash=none; run_known=0 ;; esac
fi

cwd="$(field '.cwd // empty')"
[ -n "$cwd" ] && cd "$cwd" 2>/dev/null || true

# A stance manifest in the persona's scope enrolls it: omp passes the scope, Claude Code the agent_type.
stance_scope="$(field '.stance_scope // empty')"
if [ -z "$stance_scope" ]; then
	named="$(field '.agent_type // empty')"
	case "$named" in '' | */* | . | ..) allow_stop ;; esac
	stance_scope="$(dirname -- "$(dirname -- "$SELF_DIR")")/personas/$named"
fi
manifest="$stance_scope/stance/manifest.json"
[ -f "$manifest" ] || allow_stop

manifest_rubric="$(jq -r '.rubric // empty' "$manifest" 2>/dev/null || true)"
case "$manifest_rubric" in
	'') ;;
	/*) RUBRIC="$manifest_rubric" ;;
	*) RUBRIC="$(dirname -- "$manifest")/$manifest_rubric" ;;
esac
[ -z "$manifest_rubric" ] || [ -f "$RUBRIC" ] || \
	dark "the rubric named by $manifest is not readable at '$RUBRIC'"

GUARD_ID=stance-guardrail
GUARD_NAME="STANCE GUARDRAIL"
GUARD_SESSION="$session"
GUARD_AGENT="$(jq -r '.agent // empty' "$manifest" 2>/dev/null || true)"
GUARD_ACT=stop
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
judge_keep() { jq -n -j --rawfile text /dev/stdin --argjson n "$1" "$JUDGE_JQ"' $text | suf($n)'; }
judge_cut() { printf '[ELIDED: the first %s of %s bytes of %s are not shown; what follows is its final part]' "$(($2 - $3))" "$2" "$1"; }


transcript="$(field '.transcript_path // empty')"
[ -n "$transcript" ] && [ -f "$transcript" ] || dark "no readable transcript at '$transcript'"

last="$(field '.last_assistant_message // empty')"
if [ -n "$last" ]; then
	present="$(jq -rs --arg t "$last" '
		[ .[] | select(.type == "assistant") ] | last
		| ((.message.content // []) | map(select(.type == "text") | .text) | join("\n")) == $t
	' "$transcript" 2>/dev/null || echo false)"
	if [ "$present" != true ]; then
		view="$state_dir/$session.turn.$$"
		{
			cat "$transcript"
			printf '\n'
			jq -cn --arg t "$last" '{type:"assistant", isSidechain:false, message:{role:"assistant", content:[{type:"text", text:$t}]}}'
		} > "$view" 2>/dev/null && transcript="$view"
	fi
fi

# One transcript read: asst is the turn with tool calls marked, text its words alone, operator the
# last real operator message, standing the utterance that set the loop position.
parts="$(jq -rsc '
	def blocks(k): (.message.content // []) | map(select(.type == k));
	def said: blocks("text") | map(.text) | join("\n");
	def texts: if type == "string" then . elif type == "array" then ([ .[] | select(.type == "text") | .text ] | join("\n")) else "" end;
	def keep(re): map(select(test(re) | not));
	. as $all
	| ([ range(0; length) | select($all[.].type == "user" and (($all[.].message.content | type) == "string" or ($all[.].message.content | map(.type) | index("text") != null))) ] | last // -1) as $u
	| [ $all[$u + 1:][] | select(.type == "assistant") | { t: said, tools: (blocks("tool_use") | map(.name) | join(", ")) } ] as $turn
	| ([ $all[] | select(.type == "user") | .message.content | texts ] | map(select(. != ""))
	   | keep("^\\s*<system-reminder>") | keep("\\[SYSTEM NOTIFICATION - NOT USER INPUT\\]") | keep("<task-notification>")) as $users
	| ($users | map(select(test("(^|[^[:alpha:]])(carry[- ]?on|weitermachen|proceed)([^[:alpha:]]|$)"; "i"))) | last) as $hit
	| {
	    asst: ($turn | map(select(.t != "" or .tools != "") | if .tools == "" then .t else (if .t == "" then "" else .t + "\n" end) + "[tools: \(.tools)]" end) | join("\n\n")),
	    text: ($turn | map(.t) | map(select(. != "")) | join("\n\n")),
	    operator: ($users | keep("<command-name>") | keep("<command-message>") | keep("^\\s*Base directory for this skill:") | keep("\\n---\\n\\nSkill: [^\\n]*SKILL\\.md\\s*$") | last // ""),
	    standing: (if $hit == null then "" else
	        ($hit
	         | if test("<command-message>") then (capture("<command-message>(?<m>[^<]*)").m)
	           elif test("<command-name>") then (capture("<command-name>(?<m>[^<]*)").m)
	           else . end
	         | gsub("\\s+"; " ")) end)
	  }
' "$transcript" 2>/dev/null || true)"
part() { printf '%s' "$parts" | jq -r ".$1 // empty" 2>/dev/null || true; }
asst="$(part asst)"
[ -n "$asst" ] || allow_stop
asst_text="$(part text)"
[ -n "$asst_text" ] || asst_text="$asst"

asst_close="$(jq -rs '
	. as $all
	| ([ range(0; length) | select($all[.].type == "user" and (($all[.].message.content | type) == "string" or ($all[.].message.content | map(.type) | index("text") != null))) ] | last // -1) as $u
	| [ $all[$u + 1:][] | select(.type == "assistant") ] as $turn
	| ([ range(0; ($turn | length)) | select(($turn[.].message.content // []) | map(.type) | index("tool_use") != null) ] | last // -1) as $t
	| [ $turn[$t + 1:][] | (.message.content // []) | map(select(.type == "text") | .text) | join("\n") ]
	| map(select(. != "")) | join("\n\n")
' "$transcript" 2>/dev/null || true)"
close_fallback=""
[ -n "$asst_close" ] || { asst_close="$asst_text"; close_fallback=1; }

operator="$(part operator)"
[ -n "$operator" ] || operator="(no operator instruction found in transcript)"

standing="$(part standing)"
if [ -n "$standing" ]; then
	loop_position="out-of-the-loop, set by the operator's \"$(printf '%s' "$standing" | cut -c1-300)\""
else
	loop_position="on-the-loop"
fi

final_span="$(printf '%s' "$asst_close" | tail -c 700)"
l1_evidence=""
if printf '%s' "$final_span" | grep -Eqi "(^|[[:space:].\"'])(i'?ll|i will|i'?m going to|let me|now (i'?ll|running)|next (i'?ll|i will)|proceeding to|moving on to|starting (on|with)|taking (it|that) (on|now))[[:space:]]"; then
	if ! printf '%s' "$final_span" | grep -Eqi "when (it|they|that|the .*) (returns?|completes?|finishes?|lands?)|once (you|the operator|it|that)|awaiting|still running|report back when|on your (sign-?off|go|word)|if you|unless you|pending your"; then
		# By sentence: ugrep rejects a windowed `.{0,90}` match.
		l1_evidence="$(printf '%s' "$final_span" | tr '\n' ' ' | tr '.' '\n' \
			| grep -Eim1 "(i'?ll|i will|i'?m going to|let me|proceeding to|moving on to|starting (on|with))" \
			| sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | cut -c1-200)"
	fi
fi
l1_block=""
[ -z "$l1_evidence" ] || l1_block="

Layer-1 span: \"$l1_evidence\""

op_room=$((JUDGE_PAYLOAD_CAP / 4))
op_total="$(judge_bytes "$operator")"
if [ "$op_total" -gt "$op_room" ]; then
	op_shown="$(printf '%s' "$operator" | judge_keep $((op_room - 200)))"
	operator="$(judge_cut 'the operator message' "$op_total" "$(judge_bytes "$op_shown")")
$op_shown"
fi
turn_head="Loop position: $loop_position

=== OPERATOR (most recent instruction — the authorization context) ===
$operator

=== AGENT ==="
room=$((JUDGE_PAYLOAD_CAP - $(judge_bytes "$turn_head") - $(judge_bytes "$l1_block") - 1))
[ "$room" -gt 400 ] || room=400
asst_total="$(judge_bytes "$asst")"
if [ "$asst_total" -le "$room" ]; then
	asst_sent="$asst"
	close_seen="$asst_close"
else
	asst_shown="$(printf '%s' "$asst" | judge_keep $((room - 200)))"
	asst_sent="$(judge_cut 'the agent turn' "$asst_total" "$(judge_bytes "$asst_shown")")
$asst_shown"
	if [ -n "$close_fallback" ]; then
		close_seen="$(printf '%s\n' "$asst_shown" | sed '/^\[tools: .*\]$/d')"
	else
		close_seen="$(printf '%s' "$asst_close" | judge_keep "$(judge_bytes "$asst_shown")")"
	fi
fi
judged="$turn_head
$asst_sent$l1_block"

if [ -n "${STANCE_EMIT_PAYLOAD:-}" ]; then
	jq -cn --arg r "$RUBRIC" --arg p "$judged" '{rubric:$r, payload:$p}'
	exit 0
fi
if [ -n "${STANCE_VERDICT_FILE:-}" ]; then
	verdict="$(cat "${STANCE_VERDICT_FILE}" 2>/dev/null)" || dark "the judge did not answer"
	[ -n "$verdict" ] || dark "the judge did not answer"
else
	verdict="$(printf '%s' "$judged" | $JUDGE_CMD "$RUBRIC" 2>/dev/null)" || dark "the judge did not answer"
fi

tag() { printf '%s\n' "$verdict" | sed -n "s/^$1:[[:space:]]*//p" | head -1; }
decision="$(tag VERDICT | sed 's/[[:space:]]*$//')"
case "$decision" in
	PASS) allow_stop ;;
	BLOCK) ;;
	*) dark "the judge's verdict was unparseable (no VERDICT: PASS or VERDICT: BLOCK line)" ;;
esac

reason="$(tag REASON)"
[ -n "$reason" ] || reason="This turn collapsed out of the intent-driven-expert stance."

evidence="$(tag EVIDENCE | sed 's/^["“]//;s/["”]$//;s/^[[:space:]]*//;s/[[:space:]]*$//')"
if [ -z "$evidence" ] && [ -z "$l1_evidence" ]; then
	row DARK "" "$reason"
	say "STANCE GUARDRAIL — BLOCK DISCARDED: the judge blocked this turn but quoted no EVIDENCE line, and an unevidenced block cannot be told from a fabricated one. No verdict stands; this turn was NOT judged clean. The judge's reason was: $reason"
	allow_stop
fi
if [ -n "$evidence" ] && [ "${#evidence}" -ge 12 ]; then
	row "$decision" "$evidence" "$reason"
	norm() { printf '%s' "$1" | tr '\n' ' ' | sed -e 's/[[:space:]][[:space:]]*/ /g' -e 's/^[-*][[:space:]]//' -e 's/ [-*] / /g'; }
	if ! printf '%s' "$(norm "$close_seen")" | grep -qF -- "$(norm "$evidence")"; then
		row DARK "" "$evidence"
		say "STANCE GUARDRAIL — BLOCK DISCARDED: the judge blocked this turn but quoted a span that is not in the turn's CLOSE as the judge was sent it (mid-turn preamble, text the excerpt elided, or confabulated): $evidence. No verdict stands; this turn was NOT judged clean."
		allow_stop
	fi
fi

# A refused stop holds back no effect: a repeat of the turn last blocked, or a block after RUN_CAP, is let through said.
turn_hash="$(printf '%s' "$asst_text" | cksum)"
run_next=$((run + 1))
let_through=""
if [ -n "$stop_active" ]; then
	if [ "$run_known" -eq 0 ]; then
		let_through="the run of refused stops it follows cannot be read, and a bound that cannot be counted cannot hold"
	elif [ "$run" -ge 1 ] && [ "$turn_hash" = "$run_hash" ]; then
		let_through="this stop is byte-identical to the turn it already refused, so refusing it again cannot help"
	elif [ "$run" -ge "$RUN_CAP" ]; then
		let_through="it has refused this run of stops $run times"
	fi
fi
if [ -z "$let_through" ] && ! printf '%s %s' "$run_next" "$turn_hash" > "$run_file" 2>/dev/null; then
	[ -z "$stop_active" ] || let_through="the run of refused stops cannot be written, and a bound that cannot be counted cannot hold"
fi
if [ -n "$let_through" ]; then
	rm -f "$run_file" 2>/dev/null || true
	row UNRESOLVED "$evidence" "$reason"
	say "STANCE GUARDRAIL — stop let through UNRESOLVED: the judge blocked this stop, and the finding STANDS and is unaddressed — $let_through. The next stop that follows no block is judged and blocked again. The judge's reason was: $reason"
	allow_stop
fi
evidence_clause=""
[ -n "$l1_evidence" ] && evidence_clause="The offending span is yours, verbatim: \"$l1_evidence\" — you committed to an action and then ended the turn without taking it; do it now, with tool calls. "
[ -z "$evidence_clause" ] && [ -n "$evidence" ] && evidence_clause="The span checked against your close, verbatim: \"$evidence\". "

feedback="STANCE GUARDRAIL — blocked: $reason ${evidence_clause}Decide the in-remit call yourself and continue. $(contest_refused "$reason")"

jq -cn --arg r "$feedback" '{decision:"block", reason:$r}'
exit 0
