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
#   ambiguity, a substantive intent-extracted dispatch, a unit routed by name (the intent
#   lives in the spec at that address).
#
# SAFETY MODEL (mirrors stance-guardrail):
#   - SCOPE-ENROLLED, exactly as its twin: a scope carrying a stance manifest is judged and
#     every other scope is silent. No repo opt-in, no allowlist — the projection that places a
#     persona also enrolls it, and declining the guard means declining the persona.
#   - FAILS OPEN, NEVER SILENTLY. Any error (no jq, no input, judge failure, unparseable verdict,
#     unexpected error) -> exit 0 (allow the call), and the call goes through WITH A NOTICE the
#     operator reads (`say`: Claude Code's JSON `systemMessage`, omp's relayed line) naming this
#     guard and why it could not judge. Silence is reserved for "judged, pass" and "not enrolled".
#   - LOOP-SAFE. A re-entry cap: never deny an identical tool_input twice (there is no
#     stop_hook_active analog for PreToolUse), so it can never wedge a call. The second,
#     identical call goes through unjudged, and says so.
#   - OBSERVABLE. Every notice is also a line in the miss log.
#
# INPUT  : Claude Code PreToolUse hook JSON on stdin (tool_name, tool_input, agent_type,
#          session_id, cwd, ...).
# OUTPUT : on collapse -> stdout
#          {"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny",
#           "permissionDecisionReason":"..."}} + exit 0.
#          judged, pass -> no stdout + exit 0 (allow the call).
#          let through with no verdict -> the notice `say` prints + exit 0 (allow the call).
#
# POSIX sh. Depends on: jq. Missing jq -> the guard says so and allows the call.

set -eu

# WHAT AN OPERATOR READS WHEN THE GUARD CANNOT JUDGE, defined before anything that needs a
# command: the first thing that can be missing is `jq`, and a worker run with a PATH holding
# little beyond `sh` and `cat` must still say it did not judge, so `esc`, `say` and `open`
# are builtins only and nothing external runs above the jq check.
#
# Claude Code shows the operator a hook's JSON `systemMessage` and NOT its plain stdout on
# exit 0. omp's extension bridge reads the worker's plain stdout and relays a line naming this
# guard and DARK to the session, and would relay a JSON object as raw JSON — hence one form per
# harness, chosen at projection by the harness's own name.
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
say() {
	case "claude" in
		claude) printf '{"systemMessage":"%s"}\n' "$(esc "$1")" ;;
		*) printf '%s\n' "$1" ;;
	esac
}

allow() { exit 0; }  # emit nothing; the tool call proceeds.

# A verdict and a failure are different facts and silence carries only one of them: `allow`
# means "judged, pass" or "not this guard's call", `open` means "could not judge" — the call
# still proceeds, and the operator is told.
open() {
	[ -z "${LOG:-}" ] || printf '%s\n' "open: $1 tool=${tool_name:-?} agent=${agent_type:-?}" >> "$LOG" 2>/dev/null || true
	say "STANCE GUARDRAIL (pre) — DARK: $1. This call was NOT judged; the absence of a deny is an absence of a verdict, not a clean one."
	exit 0
}

# A PreToolUse hook must never break a session. An unexpected error (a nonzero status reaching
# the trap) is let through AND SAID; every deliberate `exit 0` arrives with status 0.
trap 'rc=$?; [ "$rc" -eq 0 ] || open "an unexpected error stopped it (exit status $rc)"; exit 0' EXIT

# --- read hook input ------------------------------------------------------------------------
input="$(cat)"
[ -n "$input" ] || open "the hook received no input"
command -v jq >/dev/null 2>&1 || open "jq is not installed, so the hook payload cannot be read"

# A GUARD BINDS A PERSONA'S OWN MAIN SESSION AND NO SUBAGENT IT DISPATCHES. A subagent is bounded
# by what it was handed, judged by its assay and the whole check, and supervised by the main
# session. Claude Code fires this hook inside a subagent too (settings hooks and the subagent's
# own front-matter hooks), and there the payload carries `agent_id` — present only inside a
# subagent. A guard that does not bind there is not dark: it exits before it judges and says
# nothing.
[ -z "$(printf '%s' "$input" | jq -r '.agent_id // empty' 2>/dev/null || true)" ] || allow

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

# The per-repo opt-in is GONE, for the reason its twin states: it asked whether a guard may run in
# a DIRECTORY, and a stance belongs to the agent, not the checkout. `cwd` survives it — the worker
# still runs where the session runs.
cwd="$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null || true)"
[ -n "$cwd" ] && cd "$cwd" 2>/dev/null || true

# --- scope gate: the persona's OWN stance manifest -------------------------------------------
# The twin of the turn-end guard's gate, and inverted for the same reason: an allowlist here was
# a runtime self-filter over an enrollment the corpus already derives, and it had drifted the way
# such a list always drifts. Presence of a manifest in this persona's own scope IS enrollment.
# Absent → silence, never an error, so an unenrolled launch is untouched. The scope is the one
# the harness hands over: `stance_scope` where a dispatcher sits in the persona's own scope (omp),
# else the persona directory of the agent the payload NAMES (`agent_type`, Claude Code — none on a
# bare session) under this harness's home, one hop above the hooks root. No agent list here.
stance_scope="$(printf '%s' "$input" | jq -r '.stance_scope // empty' 2>/dev/null || true)"
if [ -z "$stance_scope" ]; then
	named="$(printf '%s' "$input" | jq -r '.agent_type // empty' 2>/dev/null || true)"
	case "$named" in '' | */* | . | ..) allow ;; esac
	stance_scope="$(dirname -- "$HOOKS_ROOT")/personas/$named"
fi
manifest="$stance_scope/stance/manifest.json"
[ -f "$manifest" ] || allow
agent_type="$(jq -r '.agent // empty' "$manifest" 2>/dev/null || true)"

# THE JUDGE IS SENT A BOUNDED EXCERPT, never the whole text. A judgement has to fit inside the
# time its harness allows a guard, and the text a turn or a dispatch carries has no bound of its own.
# One cap, declared once in the stance cell, bounds everything sent together: the standing
# directive, the operator's message, the agent turn and any layer-1 note. Text over its share is
# cut on a character boundary and marked where it was cut.
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
# Text is read with --rawfile from stdin and never with -R: jq 1.7's raw reader corrupts a
# multibyte character that straddles one of its read boundaries, on anything over a few KB.
# The final N bytes of stdin, or all of it when it fits — no marker, so a caller can count them.
judge_keep() { jq -n -j --rawfile text /dev/stdin --argjson n "$1" "$JUDGE_JQ"' $text | suf($n)'; }
# Stdin cut to at most N bytes by keeping its head and its tail, the seam marked. For a dispatch
# prompt or a menu, whose instruction may sit at either end.
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
# The marker for text cut off its front: judge_cut WHAT TOTAL-BYTES SHOWN-BYTES.
judge_cut() { printf '[ELIDED: the first %s of %s bytes of %s are not shown; what follows is its final part]' "$(($2 - $3))" "$2" "$1"; }


# --- extract the judged payload, branched by tool -------------------------------------------
tool_name="$(printf '%s' "$input" | jq -r '.tool_name // empty' 2>/dev/null || true)"
[ -n "$tool_name" ] || open "the payload names no tool, so there is no call to judge"

case "$tool_name" in
	AskUserQuestion)
		# the questions + their option menus — the permission-menu class
		body="$(printf '%s' "$input" | jq -r '
			(.tool_input.questions // [])
			| map("Q: " + (.question // "")
			      + "  OPTIONS: " + ((.options // []) | map(.label // "") | join(" | ")))
			| join("  ;;  ")
		' 2>/dev/null || true)"
		prefix="AskUserQuestion menu (a question/option menu handed to the operator): " ;;
	Agent|SendMessage)
		# the dispatch prompt/message — the dispatch-echo class
		body="$(printf '%s' "$input" | jq -r '.tool_input.prompt // .tool_input.message // .tool_input.description // ""' 2>/dev/null || true)"
		prefix="$tool_name dispatch (the delegate prompt/message): " ;;
	*)
		allow ;;  # DEFENCE IN DEPTH: every supported adapter computes a selector from the
		          # act, so this never fires there. A harness that could fire the act but
		          # not narrow it would WARN in projection, and this branch is what would
		          # keep the guard off every other tool call.
esac

[ -n "${body:-}" ] || allow  # nothing judgeable -> allow

# THE JUDGE IS SENT AT MOST JUDGE_PAYLOAD_CAP BYTES, prefix included: a menu or a dispatch prompt
# has no bound of its own, and a judgement has to fit the time the harness allows a guard. The
# instruction of a prompt may sit at either end, so both ends are kept and the seam is marked.
body="$(printf '%s' "$body" | judge_ends "$((JUDGE_PAYLOAD_CAP - $(judge_bytes "$prefix")))")"
payload="$prefix$body"

# --- loop-safety: never deny an identical tool_input twice ----------------------------------
# No stop_hook_active analog exists for PreToolUse; a per-(session,input) marker caps re-deny.
session_id="$(printf '%s' "$input" | jq -r '.session_id // "nosession"' 2>/dev/null || echo nosession)"
sig="$(printf '%s' "$input" | jq -c '.tool_input' 2>/dev/null | cksum | cut -d' ' -f1 2>/dev/null || echo 0)"
seen="${TMPDIR:-/tmp}/.stance-pre-$session_id-$sig"
[ -f "$seen" ] && open "this exact call was already denied once, so the re-entry cap lets it through unjudged"

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
	[ -n "$verdict" ] || open "the judge did not answer"
else
	verdict="$(printf '%s' "$payload" | $JUDGE_CMD "$RUBRIC" 2>/dev/null)" || open "the judge did not answer"
fi

decision="$(printf '%s\n' "$verdict" | sed -n 's/^VERDICT:[[:space:]]*//p' | head -1 | sed 's/[[:space:]]*$//')"
case "$decision" in
	PASS) allow ;;  # judged, pass: the one silent verdict
	BLOCK) ;;
	*) open "the judge's verdict was unparseable (no VERDICT: PASS or VERDICT: BLOCK line)" ;;
esac

reason="$(printf '%s\n' "$verdict" | sed -n 's/^REASON:[[:space:]]*//p' | head -1)"
[ -n "$reason" ] || reason="This tool call collapsed out of the intent-driven-expert stance."

# mark this exact input as denied-once (the cap) before emitting the deny
: > "$seen" 2>/dev/null || true

# --- DENY -----------------------------------------------------------------------------------
feedback="STANCE GUARDRAIL (pre) — denied this $tool_name call: it collapses out of the \
intent-driven-expert stance. $reason  Own the in-remit reversible call yourself instead of handing the \
operator a menu; extract and serve the underlying INTENT instead of transcribing literal words into a \
dispatch. Decide, note the call for review, and proceed. (Legitimate exceptions that should NOT be a menu \
here: a genuine irreversible-outward consent choice, a true INTENT ambiguity for /elicit, a substantive \
intent-extracted dispatch, or a unit of a plan routed by name, whose intent lives in its spec.)"

jq -cn --arg r "$feedback" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
exit 0
