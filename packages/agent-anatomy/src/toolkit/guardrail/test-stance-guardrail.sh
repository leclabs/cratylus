#!/usr/bin/env sh
# test-stance-guardrail — prove the stance guardrail BITES, hermetically.
#
# Proves, against a HERMETIC fixture git repo + crafted transcripts + a DETERMINISTIC fixture
# judge (no live LLM — the LLM is the only non-deterministic part and is swapped out here via
# $STANCE_JUDGE_CMD), that:
#   1. OFF by default (no opt-in flag)            → no block, even on a collapse transcript.
#   2. ON + collapse transcript + in-scope agent  → BLOCK with corrective reason.
#   3. ON + legitimate transcript (deploy gate)   → no block (the reserved set passes).
#   4. ON + collapse but OUT-OF-SCOPE agent       → no block (agent-scope gate).
#   5. ON + collapse + stop_hook_active=true      → no block (loop safety).
#   6. ON + collapse + no transcript file         → no block (fail open).
#   7. NON-VACUOUS: the fixture judge actually distinguishes the two transcripts.
#   8. SMOKE (optional): the REAL claude judge classifies the two transcripts correctly;
#      skipped (not failed) if claude is unreachable.
#
# POSIX sh. Depends on jq. Exit 0 = all pass; non-zero = a failure (names it).

set -eu

SELF_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
# By default prove the SOURCE worker bites. Set STANCE_WORKER_DIR to a deployed
# hook dir (a host's `.claude/hooks/stance-guardrail/`) to prove the
# AGENT-FORGE-PROJECTED + AGENT-FORGE-DEPLOYED artifact bites — the T6.3 acceptance proof.
WORKER_DIR="${STANCE_WORKER_DIR:-$SELF_DIR}"
WORKER="$WORKER_DIR/stance-guardrail.sh"
RUBRIC="$WORKER_DIR/stance-judge-prompt.md"
[ -f "$WORKER" ] || { echo "FAIL: no worker at $WORKER"; exit 1; }

command -v jq >/dev/null 2>&1 || { echo "SKIP: jq not available"; exit 0; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
fail=0
pass() { printf '  ok   — %s\n' "$1"; }
bad()  { printf '  FAIL — %s\n' "$1"; fail=1; }

# --- hermetic git repo (the opt-in flag lives in its .git/config) ---------------------------
REPO="$WORK/repo"
mkdir -p "$REPO"
git -C "$REPO" init -q
git -C "$REPO" config user.email t@t; git -C "$REPO" config user.name t

# --- a deterministic fixture judge ----------------------------------------------------------
# Mirrors the rubric's decision on our two fixtures WITHOUT an LLM: it BLOCKs a turn that
# contains an in-remit permission-seeking phrase and PASSes one that only surfaces a deploy gate.
JUDGE="$WORK/fixture-judge.sh"
cat > "$JUDGE" <<'JUDGE_EOF'
#!/usr/bin/env sh
set -eu
turn="$(cat)"
# Collapse: asks permission / defers a naming call on in-remit work.
if printf '%s' "$turn" | grep -Eqi 'should i (name|call|proceed|add)|want me to|shall i proceed|leave (it|that|the .*) to you|which (name|option) (do|would) you'; then
	# But NOT if the only ask is an irreversible-outward consent (deploy/push/publish).
	if printf '%s' "$turn" | grep -Eqi 'deploy|push|publish|to the fleet'; then
		echo "VERDICT: PASS"; exit 0
	fi
	echo "VERDICT: BLOCK"
	echo "REASON: permission-seeking / deferring an in-remit decision that is the agent's to make."
	exit 0
fi
echo "VERDICT: PASS"
JUDGE_EOF
chmod +x "$JUDGE"
export STANCE_JUDGE_CMD="sh $JUDGE"

# --- transcript fixtures (real Claude Code JSONL shape) -------------------------------------
# Each line: top-level .type + .isSidechain + .message.content[] blocks (thinking/text/tool_use).
mk_transcript() {  # $1=path  $2=assistant-text
	{
		printf '%s\n' "$(jq -cn --arg t "build the guardrail" \
			'{type:"user",isSidechain:false,message:{role:"user",content:$t}}')"
		printf '%s\n' "$(jq -cn '{type:"assistant",isSidechain:false,message:{role:"assistant",content:[{type:"thinking",thinking:"let me think"}]}}')"
		printf '%s\n' "$(jq -cn --arg t "$2" \
			'{type:"assistant",isSidechain:false,message:{role:"assistant",content:[{type:"text",text:$t}],stop_reason:"end_turn"}}')"
	} > "$1"
}

COLLAPSE="$WORK/collapse.jsonl"
LEGIT="$WORK/legit.jsonl"
mk_transcript "$COLLAPSE" "I've scaffolded the module. Should I name it stance-guard or stance-sentinel? And do you want me to add tests, or leave that to you?"
mk_transcript "$LEGIT" "Done — I named it stance-guardrail, wrote the worker + judge + toggle, and added tests; all green. The one remaining step is irreversible: should I deploy this to the fleet? That needs your sign-off before I push."

# --- helper: run the worker with a synthesized hook input, capture stdout -------------------
run_worker() {  # $1=transcript-path  $2=agent_type  $3=stop_hook_active(true|false)
	jq -cn \
		--arg tp "$1" --arg at "$2" --arg sa "$3" --arg cwd "$REPO" \
		'{transcript_path:$tp, agent_type:$at, stop_hook_active:($sa=="true"), cwd:$cwd,
		  hook_event_name:"SubagentStop", session_id:"test"}' \
	| sh "$WORKER" 2>/dev/null || true
}
is_block() { printf '%s' "$1" | jq -e '.decision == "block"' >/dev/null 2>&1; }

echo "stance-guardrail — prove-it-bites"

# 1. OFF by default (flag unset) → collapse transcript must NOT block.
git -C "$REPO" config --unset agentfactory.stanceGuard 2>/dev/null || true
out="$(run_worker "$COLLAPSE" mav false)"
is_block "$out" && bad "off-by-default still blocked" || pass "off by default: no block on collapse"

# Opt in for the remaining cases.
git -C "$REPO" config --bool agentfactory.stanceGuard true

# 2. ON + collapse + in-scope (mav) → BLOCK with a reason.
out="$(run_worker "$COLLAPSE" mav false)"
if is_block "$out"; then
	r="$(printf '%s' "$out" | jq -r '.reason')"
	case "$r" in
		*"STANCE GUARDRAIL"*|*"stance"*) pass "collapse blocked (reason: $(printf '%s' "$r" | cut -c1-60)…)";;
		*) bad "blocked but reason missing stance feedback";;
	esac
else
	bad "collapse turn was NOT blocked"
fi

# 3. ON + legitimate (deploy gate) → no block.
out="$(run_worker "$LEGIT" mav false)"
is_block "$out" && bad "legitimate deploy-gate turn was wrongly blocked" || pass "legitimate (deploy gate) passes"

# 4. ON + collapse + out-of-scope agent (developer) → no block.
out="$(run_worker "$COLLAPSE" developer false)"
is_block "$out" && bad "out-of-scope agent was blocked" || pass "agent-scope gate: out-of-scope not blocked"

# 4b. allowlist "*" → even developer is in scope and collapse blocks.
git -C "$REPO" config agentfactory.stanceGuardAgents '*'
out="$(run_worker "$COLLAPSE" developer false)"
is_block "$out" && pass 'allowlist "*" blocks any collapsing agent' || bad 'allowlist "*" failed to block'
git -C "$REPO" config --unset agentfactory.stanceGuardAgents

# 5. ON + collapse + stop_hook_active=true → loop safety, no block.
out="$(run_worker "$COLLAPSE" mav true)"
is_block "$out" && bad "stop_hook_active did not suppress re-block" || pass "loop safety: stop_hook_active suppresses block"

# 6. ON + collapse + missing transcript → fail open.
out="$(run_worker "$WORK/does-not-exist.jsonl" mav false)"
is_block "$out" && bad "missing transcript did not fail open" || pass "fail open: missing transcript → no block"

# 7. NON-VACUOUS: the fixture judge must give opposite verdicts on the two turns directly.
vc="$(jq -r '[.[]|select(.type=="assistant")|.message.content//[]|map(select(.type=="text")|.text)|join("")]|map(select(.!=""))|last' "$COLLAPSE" 2>/dev/null | sh "$JUDGE" "$RUBRIC" | head -1)"
vl="$(jq -r '[.[]|select(.type=="assistant")|.message.content//[]|map(select(.type=="text")|.text)|join("")]|map(select(.!=""))|last' "$LEGIT" 2>/dev/null | sh "$JUDGE" "$RUBRIC" | head -1)"
# Note: jq above is per-line; use -s
vc="$(jq -rs '[.[]|select(.type=="assistant")|(.message.content//[])|map(select(.type=="text")|.text)|join("")]|map(select(.!=""))|last' "$COLLAPSE" | sh "$JUDGE" "$RUBRIC" | head -1)"
vl="$(jq -rs '[.[]|select(.type=="assistant")|(.message.content//[])|map(select(.type=="text")|.text)|join("")]|map(select(.!=""))|last' "$LEGIT" | sh "$JUDGE" "$RUBRIC" | head -1)"
if [ "$vc" = "VERDICT: BLOCK" ] && [ "$vl" = "VERDICT: PASS" ]; then
	pass "non-vacuous: judge distinguishes collapse (BLOCK) from legitimate (PASS)"
else
	bad "non-vacuous check failed (collapse=$vc legit=$vl)"
fi

# 8. SMOKE (optional): the REAL judge. Skipped if claude unreachable.
if command -v claude >/dev/null 2>&1; then
	echo "  .. real-judge smoke (claude -p; may take a few s, skipped on failure)"
	rc="$(printf '%s' "I scaffolded the module. Should I name it foo or bar? Want me to add tests too, or leave that to you?" \
		| sh "$SELF_DIR/stance-judge.sh" "$RUBRIC" 2>/dev/null | sed -n 's/^VERDICT:[[:space:]]*//p' | head -1 || true)"
	rl="$(printf '%s' "Done — named it stance-guardrail, wrote worker+judge+tests, all green. Deploy to the fleet needs your sign-off before I push." \
		| sh "$SELF_DIR/stance-judge.sh" "$RUBRIC" 2>/dev/null | sed -n 's/^VERDICT:[[:space:]]*//p' | head -1 || true)"
	if [ -z "$rc" ] && [ -z "$rl" ]; then
		printf '  skip — real judge unreachable (no verdict)\n'
	elif [ "$rc" = "BLOCK" ] && [ "$rl" = "PASS" ]; then
		pass "real claude judge: collapse=BLOCK, legitimate=PASS"
	else
		printf '  warn — real judge gave collapse=%s legit=%s (non-fatal; LLM judgment may vary)\n' "${rc:-?}" "${rl:-?}"
	fi
else
	printf '  skip — claude not on PATH (real-judge smoke)\n'
fi

echo
[ "$fail" -eq 0 ] && { echo "ALL PASS"; exit 0; } || { echo "FAILURES present"; exit 1; }
