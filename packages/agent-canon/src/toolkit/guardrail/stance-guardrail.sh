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

# --- loop safety: budget the BLOCKS, never the JUDGING ---------------------------------------
# SUPERSEDES the original `stop_hook_active=true → allow_stop` short-circuit, which was not a
# loop guard but a hole. It demoted the invariant to "enforced on alternating turns" and handed
# the agent a trivial escape: get blocked, emit anything at all, end again UNJUDGED. Observed in
# the wild — an agent blocked for deferring closed the very next turn with a bare "Proceeding to
# #2, I'll do X" and stopped without doing X, never judged, because this line fired. It also
# never terminated: block→skip→block→skip runs forever at half rate. Soundness given up, and
# termination not bought. Worse, it made the rubric's entire "When THIS judge has already fired"
# section DEAD CODE — that section exists to judge the response to a verdict, and the response to
# a verdict was the one turn guaranteed never to reach the judge.
#
# The replacement judges EVERY turn and bounds the number of times it may BLOCK:
#   - consecutive-block cap  — after N blocks on one task, stop blocking and fail LOUD+OPEN.
#   - no-progress detector   — if the judged turn is byte-identical to the one already blocked,
#                              the agent changed nothing and won't on the next attempt either.
# State is per-session, in a tmp file keyed by session id; absent/unwritable state → fail open.
BLOCK_CAP="${STANCE_BLOCK_CAP:-3}"
session="$(printf '%s' "$input" | jq -r '.session_id // "nosession"' 2>/dev/null || echo nosession)"
state_dir="${TMPDIR:-/tmp}/stance-guardrail"
mkdir -p "$state_dir" 2>/dev/null || true
count_file="$state_dir/$session.count"
hash_file="$state_dir/$session.lastblock"

block_count="$(cat "$count_file" 2>/dev/null || echo 0)"
case "$block_count" in *[!0-9]*) block_count=0 ;; esac

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
# THE WHOLE TURN, not its last fragment — and with tool activity marked.
#
# This used to take `last` non-empty text block. In a tool-heavy turn that is one block out of
# twenty, and it is usually a MID-TURN PREAMBLE, not the close. Measured on a live session: the
# judge was seeing 47% of one turn, 1 text block of 20. Both live false blocks came from exactly
# this — it judged "Adding the false-positive fixtures", a preamble whose very next assistant
# message was a `tool_use` performing the work, and called it announce-without-act because the
# tool call was invisible to it. The evidence was verbatim and the verdict was still wrong.
#
# So: take every assistant message since the last real user turn, and mark which ones carried
# tool calls. The judge can then see that a forward commitment was followed by action, which is
# the single fact it needs and never had. `[tools: …]` markers are not text the agent wrote, so
# the EVIDENCE check below greps the text-only projection to avoid matching a marker.
asst="$(jq -rs '
	[ .[] ] as $all
	| ( [ range(0; ($all|length))
	      | select( $all[.].type=="user"
	                and ( ($all[.].message.content | type) == "string"
	                      or ( $all[.].message.content | map(.type) | index("text") != null ) ) ) ]
	    | last // -1 ) as $lastuser
	| [ $all[($lastuser+1):][]
	    | select(.type == "assistant")
	    | (.message.content // []) as $c
	    | ( $c | map(select(.type == "text") | .text) | join("\n") ) as $t
	    | ( $c | map(select(.type == "tool_use") | .name) | join(", ") ) as $tools
	    | if $t == "" and $tools == "" then empty
	      elif $tools == "" then $t
	      elif $t == "" then "[tools: \($tools)]"
	      else "\($t)\n[tools: \($tools)]" end
	  ]
	| join("\n\n")
' "$transcript" 2>/dev/null || true)"

# Text-only projection of the same turn — what the agent actually WROTE. The EVIDENCE check must
# grep this, never the tool-annotated form, so a fabricated span cannot be satisfied by a marker.
asst_text="$(jq -rs '
	[ .[] ] as $all
	| ( [ range(0; ($all|length))
	      | select( $all[.].type=="user"
	                and ( ($all[.].message.content | type) == "string"
	                      or ( $all[.].message.content | map(.type) | index("text") != null ) ) ) ]
	    | last // -1 ) as $lastuser
	| [ $all[($lastuser+1):][] | select(.type == "assistant")
	    | (.message.content // []) | map(select(.type == "text") | .text) | join("\n") ]
	| map(select(. != "")) | join("\n\n")
' "$transcript" 2>/dev/null || true)"
[ -n "$asst_text" ] || asst_text="$asst"

[ -n "$asst" ] || allow_stop  # no judgeable agent text (e.g. pure tool turn) → allow stop

# THE OPERATOR SLOT — and it must actually hold the operator.
#
# A skill invocation (`/wake`, `/carry-on`, …) enters the transcript as a user-type message
# carrying the SKILL BODY. Taking the last user message therefore handed the judge 2.8 kB of the
# /wake skill definition as "the operator's most recent instruction" — measured on two of six live
# fixtures. The judge then reasoned about authorization from a document the operator never wrote,
# which is worse than having no context: it is confidently wrong context, and the rubric leans on
# this slot to decide whether an irreversible act was authorized.
#
# Skill bodies are recognizable and skipped: the harness wraps them in <command-name>/<command-
# message> tags, and they carry the skill's own formal preamble. Fall back to the most recent
# message that survives the filter.
operator="$(jq -rs '
	[ .[]
	  | select(.type == "user")
	  | (.message.content)
	  | if type == "string" then .
	    elif type == "array" then ([ .[] | select(.type == "text") | .text ] | join("\n"))
	    else "" end
	]
	| map(select(. != ""))
	| map(select(
	      (test("<command-name>") | not)
	      and (test("<command-message>") | not)
	      and (test("Base directory for this skill:") | not)
	      and (test("## Prime Principle") | not)
	      and (test("^\\s*<system-reminder>") | not)
	      and (test("\\[SYSTEM NOTIFICATION - NOT USER INPUT\\]") | not)
	      and (test("<task-notification>") | not)
	  ))
	| last // ""
' "$transcript" 2>/dev/null || true)"
[ -n "$operator" ] || operator="(no operator instruction found in transcript)"

# The judged payload: the operator's instruction (authorization context) THEN the agent turn.
turn="=== OPERATOR (most recent instruction — the authorization context) ===
$operator

=== AGENT (last assistant turn — judge THIS) ===
$asst"

# --- LAYER 1: deterministic checks (no LLM) --------------------------------------------------
# The judge is one sample from a small model — a noisy signal, and unfit to carry an invariant on
# its own. Anything decidable by inspection is decided HERE, where it is reproducible and free.
# The judge is reserved for the semantic residue that regex provably cannot reach.
#
# L1a · ANNOUNCE-WITHOUT-ACT. A Stop hook fires when the agent has produced text and no further
# tool call. So a first-person forward commitment in the FINAL text is, by construction, a
# commitment the turn did not honour: had the agent done the thing, the doing would precede the
# text and the text would report it ("I ran X"), not promise it ("I'll run X").
#
# The rubric could never catch this. Its turn-close rule asks only whether the close OFFERS the
# next action ("say the word") versus STATES it — and a bare statement PASSES. Replayed through
# the judge, a real turn reading "Proceeding to #2. I'll run the research and author the plan."
# came back PASS, with the judge commending the agent for "proceeding with a declared approach"
# while the agent had in fact proceeded with nothing. Stating and stopping is the collapse in its
# most fluent disguise, and it is invisible to a rule that only inspects the shape of the close.
#
# Contingent commitments are NOT this: waiting on a dispatched agent, on an operator's sign-off,
# or on an external event is legitimate, and the turn genuinely cannot proceed. Those are carved
# out below. Everything else routes to the judge with the offending span quoted, so the block
# names the evidence rather than restating the rule.
final_span="$(printf '%s' "$asst_text" | tail -c 700)"
l1_evidence=""
if printf '%s' "$final_span" | grep -Eqi "(^|[[:space:].\"'])(i'?ll|i will|i'?m going to|let me|now (i'?ll|running)|next (i'?ll|i will)|proceeding to|moving on to|starting (on|with)|taking (it|that) (on|now))[[:space:]]"; then
	# Carve-outs: the commitment is contingent on something outside this turn.
	if ! printf '%s' "$final_span" | grep -Eqi "when (it|they|that|the .*) (returns?|completes?|finishes?|lands?)|once (you|the operator|it|that)|awaiting|still running|report back when|on your (sign-?off|go|word)|if you|unless you|pending your"; then
		# Extract by SENTENCE, not by a windowed match. `grep -Eo ".{0,90}…{0,90}"` looks
		# obvious and is not portable: ugrep (the default grep on some hosts) rejects the nested
		# bounded quantifier with "exceeds complexity limits", the command fails, and the
		# substitution yields EMPTY — so the evidence clause silently vanishes and the block
		# degrades to the restated-rule feedback this rewrite exists to replace. A gate whose
		# evidence path fails open is a gate that lies about why it fired.
		l1_evidence="$(printf '%s' "$final_span" | tr '\n' ' ' | tr '.' '\n' \
			| grep -Eim1 "(i'?ll|i will|i'?m going to|let me|proceeding to|moving on to|starting (on|with))" \
			| sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | cut -c1-200)"
	fi
fi

# --- LAYER 2: the judge (semantic residue only) ----------------------------------------------
# The judge contract: turn on stdin, rubric path as argv[1]; emits VERDICT: PASS|BLOCK [+ REASON].
# Non-zero judge exit → fail open.
judged="$turn"
[ -n "$l1_evidence" ] && judged="$turn

=== LAYER-1 SIGNAL (deterministic pre-filter) ===
This turn's closing text makes a first-person forward commitment, and the turn is ENDING with no
tool call after it — so the committed action was NOT performed. Verbatim span:
  \"$l1_evidence\"
Unless that commitment is genuinely contingent on something outside this turn (a dispatched agent
still running, an operator sign-off, an external event), this is announce-without-act: BLOCK it,
and quote the span above as the evidence."

verdict="$(printf '%s' "$judged" | $JUDGE_CMD "$RUBRIC" 2>/dev/null)" || allow_stop

decision="$(printf '%s\n' "$verdict" | sed -n 's/^VERDICT:[[:space:]]*//p' | head -1)"
[ "$decision" = "BLOCK" ] || allow_stop  # PASS, empty, or anything but BLOCK → allow stop

reason="$(printf '%s\n' "$verdict" | sed -n 's/^REASON:[[:space:]]*//p' | head -1)"
[ -n "$reason" ] || reason="This turn collapsed out of the intent-driven-expert stance."

# --- EVIDENCE VERIFICATION: a block must quote text that is actually in the turn --------------
# The judge is one sample from a small model, and a wrong block costs exactly what a missed one
# does: an agent that yields to a fired gate whose diagnosis the record refutes has updated on a
# salient signal instead of on argument — the collapse wearing the guardrail's uniform.
#
# Observed live: the judge blocked a turn and quoted "Authoring the plan" as the offending span.
# That string was not in the turn it judged — it was the close of an EARLIER turn, and that turn
# had honoured it. Pure confabulation, and unfalsifiable from inside the model.
#
# So the quote is checked against the transcript MECHANICALLY. The judge must emit
# `EVIDENCE: <verbatim span>`; if that span does not literally occur in the judged turn, the
# block is discarded. A model cannot quote what is not there, which makes this cheap and total.
# EVIDENCE IS MANDATORY FOR A BLOCK. A missing line does not get the benefit of the doubt: the
# first cut of this check let an absent EVIDENCE line mean "verdict stands", and that exemption
# was immediately exercised — a fabricated block reached the agent because the span it should
# have been checked against had been stripped upstream by the judge's own output filter. An
# unevidenced block is indistinguishable from a fabricated one, so it is discarded either way.
# Layer-1 blocks are unaffected: they carry a span this hook extracted from the turn itself.
evidence="$(printf '%s\n' "$verdict" | sed -n 's/^EVIDENCE:[[:space:]]*//p' | head -1 \
	| sed 's/^["“]//;s/["”]$//;s/^[[:space:]]*//;s/[[:space:]]*$//')"
if [ -z "$evidence" ] && [ -z "$l1_evidence" ]; then
	printf 'stance-guardrail: DISCARDING block — no EVIDENCE line; an unevidenced block cannot be distinguished from a fabricated one. REASON was: %s\n' "$reason" >&2
	allow_stop
fi
if [ -n "$evidence" ] && [ "${#evidence}" -ge 12 ]; then
	if ! printf '%s' "$asst_text" | tr '\n' ' ' | grep -qF "$evidence"; then
		printf 'stance-guardrail: DISCARDING block — judge quoted a span absent from the turn (confabulated): %s\n' "$evidence" >&2
		allow_stop
	fi
fi

# --- loop safety, applied at the point of blocking -------------------------------------------
# Judging already happened; only the BLOCK is budgeted. Both exits below are LOUD — a guardrail
# that gives up silently teaches the agent nothing and lies to the operator about conformance.
turn_hash="$(printf '%s' "$asst_text" | cksum | cut -d' ' -f1)"
last_hash="$(cat "$hash_file" 2>/dev/null || echo none)"
if [ "$turn_hash" = "$last_hash" ]; then
	printf 'stance-guardrail: no progress since the last block (turn unchanged) — allowing stop, UNRESOLVED: %s\n' "$reason" >&2
	allow_stop
fi
if [ "$block_count" -ge "$BLOCK_CAP" ]; then
	printf 'stance-guardrail: block budget %s exhausted — allowing stop, UNRESOLVED: %s\n' "$BLOCK_CAP" "$reason" >&2
	allow_stop
fi
printf '%s' "$turn_hash" > "$hash_file" 2>/dev/null || true
printf '%s' "$((block_count + 1))" > "$count_file" 2>/dev/null || true
reason="$reason (stance-guardrail block $((block_count + 1)) of $BLOCK_CAP; on exhaustion this turn ends unresolved.)"

# --- BLOCK ----------------------------------------------------------------------------------
# Emit the Stop-hook block decision. The `reason` is fed back to the agent as a corrective
# instruction; it must re-assume the stance (own the call / extract the intent) and continue.
#
# The feedback QUOTES THE OFFENDING SPAN when Layer 1 found one. A model corrects far better
# against a concrete diff than against a restated rule — and the restated rule is what this
# guardrail used to send, which is why an agent could absorb the correction, agree with it in
# detail, and reproduce the same failure in its very next sentence.
evidence_clause=""
[ -n "$l1_evidence" ] && evidence_clause="The offending span is yours, verbatim: \"$l1_evidence\" — \
you committed to an action and then ended the turn without taking it. Stating a next action is not \
performing it. Do the thing NOW, in this turn, with tool calls; report it in the past tense when it \
is done. "

feedback="STANCE GUARDRAIL — blocked: you collapsed out of the intent-driven-expert stance. $reason \
${evidence_clause}Re-assume the stance: you are the owning expert; the operator owns intent + sign-off \
on irreversible acts only. Decide the in-remit call yourself (note it for review) instead of seeking \
permission, own your expert judgment (naming/design/architecture/how) instead of deferring it, and \
extract+serve the operator's INTENT instead of echoing their literal words. Then continue. (Legitimate \
exceptions: surfacing a genuine irreversible-outward act for consent, or routing a true INTENT \
ambiguity to /elicit.)"

# jq builds valid JSON regardless of quotes/newlines in the feedback.
jq -cn --arg r "$feedback" '{decision:"block", reason:$r}'
exit 0
