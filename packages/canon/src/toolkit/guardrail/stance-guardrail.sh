#!/usr/bin/env sh
# stance-guardrail — a Stop / SubagentStop hook that STRUCTURALLY REFUSES a turn in which an
# agent collapses out of the intent-driven-expert (fiduciary-agent) stance.
#
# WHY THIS EXISTS (the harness half of the principal stance):
#   Encoding the principal stance as IDENTITY (Nico's half) raises the threshold but is not
#   truly invariant — enough operator pushback erodes any prompt-level stance. NOTE the original
#   justification here blamed "RLHF corrigibility reads a correction as 'defer more'"; that is
#   OVER-ATTRIBUTED and is corrected rather than deleted, since it was load-bearing for the cap
#   that has now been removed. Perez et al. measure sycophancy as "similar for models trained
#   with various numbers of RL steps, including 0" — it is not RLHF-specific — and the stronger
#   claim, that a correction RAISES deference on later unrelated work, is unmeasured. The nearest
#   result finds carryover that dissolves across topic change and is SYMMETRIC: non-deferential
#   states self-perpetuate too. So a corrective gate is not self-defeating by construction.
#   TRUE invariance needs the harness to
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
#   - FAILS OPEN, BUT NEVER SILENTLY-CLEAN. Any error → exit 0 (allow stop): a guardrail that
#     wedges work on its own flakiness is worse than a missed block. But once the guard is
#     ENABLED and in scope, a failure that prevents judging (no transcript, judge unreachable)
#     announces itself via `dark` instead of passing as a clean turn — silence is reserved for
#     "judged, no collapse". Pre-enablement paths (no jq, opted out, off-allowlist) stay silent:
#     there, not-checking is the correct answer, not a failure to report.
#   - LOOP-SAFE. Honors stop_hook_active and a hard re-entry cap so it can never wedge a turn.
#   - POSITION-SOUND. Every rubric rule that can fire is a claim about the turn's CLOSE. So the
#     L1 window and the EVIDENCE check both run against `asst_close` — the text AFTER the last
#     tool call — never the whole-turn blob. A span from a mid-turn preamble is out of scope for
#     a verdict about how the turn ended, however genuinely present those characters are.
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

# A VERDICT and a FAILURE are different facts, and silence can only carry one of them.
# `allow_stop` means "checked, no collapse". It must never also be the answer to "could
# not check" — that is a bypass by omission: with the judge unreachable the guardrail
# reports a clean turn forever and nothing ever says the guardrail went dark. Exactly the
# defect fixed one file over in the memory nudge ("a broken runtime read as a clean bill
# of health, silently and forever"); the inversion is the same — `if signal absent then
# pass` becomes `if signal absent then SAY SO` — and, as there, it still never wedges the
# turn. Reached only AFTER the opt-in and allowlist checks, so a repo that never enabled
# the guard stays silent.
dark() {
	printf 'STANCE GUARDRAIL — DARK: %s. This turn was NOT judged; the absence of a block is an absence of a verdict, not a clean one.\n' "$1"
	exit 0
}

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
session="$(printf '%s' "$input" | jq -r '.session_id // "nosession"' 2>/dev/null || echo nosession)"
state_dir="${TMPDIR:-/tmp}/stance-guardrail"
mkdir -p "$state_dir" 2>/dev/null || true
count_file="$state_dir/$session.count"
hash_file="$state_dir/$session.lastblock"
verdict_log="$state_dir/$session.verdicts"

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
[ -n "$transcript" ] && [ -f "$transcript" ] || dark "no readable transcript at '$transcript'"

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

# THE CLOSE — assistant text appearing AFTER the last message that carried a tool_use.
#
# Every rubric rule that can actually fire is POSITIONAL ("read the turn's FINAL sentences in
# isolation"; "and the turn is ending"; "POSITION IS THE LAW"). `asst_text` is the whole turn
# flattened to one blob and encodes no position at all, so the judge was asked a positional
# question about a payload from which position had been deleted, and the EVIDENCE check then
# authenticated the span against that same blob — establishing only that the characters occur
# SOMEWHERE. A mid-turn preamble followed by four tool calls and a 3000-char report satisfied
# it exactly as well as a genuine dangling close.
#
# Measured, on the three blocks this hook fired in its own authoring session: every cited span
# preceded the last tool call, and every turn ended with a 2983-3458 char report. All three
# reasons were false about what followed the span. An independent audit reproduced the live
# judge n=15 and the stated reason reproduced 0/15.
#
# Empty close (the turn ended ON a tool call) ⇒ fall back to the whole turn: that is the one
# case where "no text after the tools" is the truth, not a projection artefact.
asst_close="$(jq -rs '
	[ .[] ] as $all
	| ( [ range(0; ($all|length))
	      | select( $all[.].type=="user"
	                and ( ($all[.].message.content | type) == "string"
	                      or ( $all[.].message.content | map(.type) | index("text") != null ) ) ) ]
	    | last // -1 ) as $lastuser
	| [ $all[($lastuser+1):][] | select(.type == "assistant") ] as $turn
	| ( [ range(0; ($turn|length))
	      | select( ($turn[.].message.content // []) | map(.type) | index("tool_use") != null ) ]
	    | last // -1 ) as $lasttool
	| [ $turn[($lasttool+1):][]
	    | (.message.content // []) | map(select(.type == "text") | .text) | join("\n") ]
	| map(select(. != "")) | join("\n\n")
' "$transcript" 2>/dev/null || true)"
[ -n "$asst_close" ] || asst_close="$asst_text"

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
# Windowed off THE CLOSE, not the whole-turn blob. Taking the last 700 bytes of the
# concatenation reaches BACKWARD ACROSS TOOL BOUNDARIES whenever the final text block is short —
# reintroducing the very bug this section claims to have fixed ("it judged 'Adding the
# false-positive fixtures', a preamble whose very next assistant message was a tool_use").
# It has not fired yet only because the offending turns happened to close with ~3000 chars.
final_span="$(printf '%s' "$asst_close" | tail -c 700)"
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

verdict="$(printf '%s' "$judged" | $JUDGE_CMD "$RUBRIC" 2>/dev/null)" || dark "the judge did not answer"

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
	# Checked against THE CLOSE, not the whole turn. Existence-somewhere was never the
	# proposition worth authenticating: every rule that can fire is a claim about the turn's
	# FINAL text, so a span drawn from a mid-turn preamble is out of scope for the verdict
	# built on it even though the characters are genuinely present. Measured on this hook's
	# own three blocks — all three spans preceded the last tool call, all three reasons were
	# false about what followed, and all three passed the old whole-turn check.
# THE ONE MECHANICALLY-CHECKED ARTIFACT, RECORDED. `$evidence` is the only part of a block
# that survives a check against the turn; `$reason` is unverified model prose. Both were
# discarded, so a block could not be audited afterwards without re-running a judge measured at
# 3/5 on identical payloads — i.e. the record of WHY a turn was blocked was reconstructible only
# by a non-deterministic process. Appended, never rotated by this hook; the state dir is tmp.
printf '%s\t%s\t%s\n' "$decision" "$evidence" "$reason" >> "$verdict_log" 2>/dev/null || true
	if ! printf '%s' "$asst_close" | tr '\n' ' ' | grep -qF "$evidence"; then
		printf 'stance-guardrail: DISCARDING block — judge quoted a span that is not in the turn'"'"'s CLOSE (mid-turn preamble, or confabulated): %s\n' "$evidence" >&2
		allow_stop
	fi
fi

# --- loop safety: bound EFFORT, never PERMISSION ----------------------------------------------
# A safety check must never be a function of how many times it has fired. Ethernet caps attempts
# then aborts and REPORTS; TCP caps retransmits then closes and SIGNALS; systemd caps starts then
# FAILS; CrashLoopBackOff backs off restarts and never starts ignoring the crash. In every one the
# counter governs EFFORT and the terminal state is a loud, typed refusal — permission is never what
# gets spent.
#
# Two guards sit below and they bound DIFFERENT things. The no-progress detector bounds EFFORT
# and is the primary: a byte-identical repeat cannot be helped by blocking again. The one-shot
# bypass bounds how hard the gate presses when the agent keeps changing the turn without fixing
# it — and it RESETS on use, so enforcement is never off for more than a single turn.
#
# The reset is the load-bearing part. A counter that permanently changes behaviour is a circuit
# breaker wired backwards (an open breaker REJECTS; that one opened into ALLOW) and fail-open
# under attack (CWE-636), abandoning at the cap the distinction `dark` makes correctly above:
# fail open when the ENFORCER is broken, never when the POLICY is being violated.
#
# What remains is the no-progress detector, which is the correct guard and was always doing the
# real work: if the judged turn is BYTE-IDENTICAL to the one already blocked, the agent changed
# nothing and will not on the next attempt. That bounds effort and terminates on a genuine wedge.
# It now announces on stdout — it too was reporting to stderr, where neither agent nor operator
# reads it, which made a livelock exit indistinguishable from a clean turn.
BLOCK_CAP="${STANCE_BLOCK_CAP:-3}"
turn_hash="$(printf '%s' "$asst_text" | cksum | cut -d' ' -f1)"
last_hash="$(cat "$hash_file" 2>/dev/null || echo none)"
if [ "$turn_hash" = "$last_hash" ]; then
	printf 'STANCE GUARDRAIL — NO PROGRESS: this turn is byte-identical to the one already blocked, so blocking again cannot help. Allowing the stop UNRESOLVED: %s — the finding STANDS and is unaddressed.\n' "$reason"
	allow_stop
fi

# ONE-SHOT BYPASS, SELF-RESETTING. After N consecutive blocks the agent may pass ONCE — and
# spending it RE-ARMS the gate immediately by zeroing the counter, so the very next collapsed
# turn blocks again. Enforcement is therefore never off for more than a single turn.
#
# This is the intent the earlier code failed to implement. It compared the count to the cap and
# allowed the stop WITHOUT resetting, so the counter stayed at the cap forever and every later
# turn passed: a one-turn escape valve that silently became a session-wide disable. Measured in
# this hook's own authoring session — the counter sat at 3 while collapse after collapse went
# unpoliced, and the two an operator eventually caught both fell in that window.
#
# The distinction is the whole point, and it is what the safety literature actually objects to.
# A counter that PERMANENTLY changes behaviour is the Therac-25 shape: its proceed-key override
# allowed five retries, regulators ordered it removed, the manufacturer reduced five to three,
# and the accepted fix deleted the counter concept. A counter that grants a bounded escape and
# then RESTORES enforcement is a different object — it bounds how hard the gate presses, not
# whether the policy still applies.
if [ "$block_count" -ge "$BLOCK_CAP" ]; then
	printf '0' > "$count_file" 2>/dev/null || true
	printf 'STANCE GUARDRAIL — BYPASS SPENT after %s consecutive blocks. This turn was judged COLLAPSED and is allowed through UNRESOLVED: %s — the gate is RE-ARMED as of now; the next collapsed turn blocks again.\n' "$BLOCK_CAP" "$reason"
	allow_stop
fi
printf '%s' "$turn_hash" > "$hash_file" 2>/dev/null || true
printf '%s' "$((block_count + 1))" > "$count_file" 2>/dev/null || true
reason="$reason (stance-guardrail block $((block_count + 1)) this session — a COUNT, not a budget: this gate does not stop enforcing, however many times it fires.)"

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
# Ship the VERIFIED span on a judge block too. Only `$evidence` survived a mechanical check
# against the close; `$reason` is unverified model prose. Sending the reason alone leaves the
# recipient able to argue only with the one string nothing authenticated — and an agent that
# refutes a fabricated reason has dodged a verdict that may still be correct, which is exactly
# what happened three times in this hook's authoring session.
[ -z "$evidence_clause" ] && [ -n "$evidence" ] && evidence_clause="The span this was checked \
against, verbatim from your close: \"$evidence\" — the REASON above is the judge's unverified \
wording; THIS span is what mechanically matched. Argue with the span, not the wording. "

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
