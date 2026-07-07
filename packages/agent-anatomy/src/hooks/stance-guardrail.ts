import type { HookCell } from '../toolkit/hook-cell.js';

// stance-guardrail — the harness-half of the principal-stance (P4). A source
// `hook` cell (activation=event): its canonical DEFINIENS is the σ*-signified
// identity that `accept()` gates; its `workers[].content` are the VERBATIM
// byte-anchors the committed workers under `src/toolkit/guardrail/` regenerate
// from (byte-locked by `test/hook-rule-boundary.test.ts`). The claude adapter
// realizes `event` → a `settings.json` `{hooks}` merge + `hooks/<id>/` workers.

export const stanceGuardrail: HookCell = {
  id: 'stance-guardrail',
  residue:
    'event-fired structural refusal of a turn that collapses the intent-driven-expert posture — judges the last turn and BLOCKS on permission-seeking · own-judgment-deferral · order-taking, while passing the reserved set (surfacing an irreversible-outward act for consent · routing a true INTENT ambiguity to elicitation); harness-invariant where prompt-level identity erodes under RLHF corrigibility.',
  substrate: 'harness',
  events: ['turn.end', 'subagent.end'],
  command: `sh "$HOME/.claude/hooks/stance-guardrail/stance-guardrail.sh"`,
  timeout: 60,
  refs: [],
  workers: [
    {
      filename: 'stance-guardrail.sh',
      targetPath:
        'packages/agent-anatomy/src/toolkit/guardrail/stance-guardrail.sh',
      executable: true,
      content: `#!/usr/bin/env sh
# stance-guardrail — a Stop / SubagentStop hook that STRUCTURALLY REFUSES a turn in which an
# agent collapses out of the intent-driven-expert (fiduciary-agent) stance.
#
# WHY THIS EXISTS (principal-stance plan, P4 — the harness half):
#   Encoding the principal stance as IDENTITY (Nico's half) raises the threshold but is not
#   truly invariant — enough operator pushback erodes any prompt-level stance, because RLHF
#   corrigibility reads a correction as "defer more." TRUE invariance needs the harness to
#   refuse the collapsed turn. This is that refusal: on Stop, it judges the last assistant turn
#   against the stance rubric and BLOCKS (Claude Code Stop-hook \`{"decision":"block"}\`) when it
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
# OUTPUT : on collapse → stdout \`{"decision":"block","reason":"…"}\` + exit 0 (Stop-hook block).
#          otherwise → no stdout + exit 0 (allow stop).
#
# POSIX sh. Depends on: jq (transcript parse). Missing jq → fail open.

set -eu

SELF_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
RUBRIC="\${STANCE_RUBRIC:-$SELF_DIR/stance-judge-prompt.md}"
JUDGE_CMD="\${STANCE_JUDGE_CMD:-sh $SELF_DIR/stance-judge.sh}"

# A Stop hook must never break a session. Trap any unexpected error → allow the stop.
trap 'exit 0' EXIT

allow_stop() { exit 0; }  # emit nothing; the agent is permitted to stop.

# --- read hook input ------------------------------------------------------------------------
input="$(cat)"
[ -n "$input" ] || allow_stop

command -v jq >/dev/null 2>&1 || allow_stop  # no jq → cannot parse → fail open

# --- loop safety ----------------------------------------------------------------------------
# If a prior Stop hook already blocked this turn, do not block again — let the agent stop.
stop_active="$(printf '%s' "$input" | jq -r '.stop_hook_active // false' 2>/dev/null || echo false)"
[ "$stop_active" = "true" ] && allow_stop

# --- opt-in gate (off by default) -----------------------------------------------------------
# Per-repo, lives in .git/config, never checked in. A fresh clone is opted out.
# Resolve relative to the hook's cwd (the project), which is where the flag lives.
cwd="$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null || true)"
[ -n "$cwd" ] && cd "$cwd" 2>/dev/null || true
enabled="$(git config --bool agentfactory.stanceGuard 2>/dev/null || echo false)"
[ "$enabled" = "true" ] || allow_stop

# --- agent-scope gate -----------------------------------------------------------------------
# Only enforce the stance for the configured agents (the principal-ic-intrinsic agents by default). For a top-level
# Stop hook agent_type may be absent; SubagentStop carries the subagent's name. When absent,
# honor an explicit STANCE_GUARD_AGENTS=* opt-in only; otherwise do not enforce on unknown.
agent_type="$(printf '%s' "$input" | jq -r '.agent_type // empty' 2>/dev/null || true)"
allowlist="\${STANCE_GUARD_AGENTS:-$(git config agentfactory.stanceGuardAgents 2>/dev/null || echo 'nico mav')}"

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
# (true for subagent lines), and .message.content as an array of blocks (thinking/text/tool_use).
# We want the TEXT of the last real (non-sidechain, unless we ARE the subagent) assistant turn.
# For a SubagentStop the relevant turn IS a sidechain line; for a top-level Stop it is not.
# Simplest correct rule: take the last assistant entry that has any text block, regardless of
# sidechain — at Stop time the final assistant message is the one that triggered the stop.
turn="$(jq -rs '
	[ .[]
	  | select(.type == "assistant")
	  | (.message.content // [])
	  | map(select(.type == "text") | .text)
	  | join("\\n")
	]
	| map(select(. != ""))
	| last // ""
' "$transcript" 2>/dev/null || true)"

[ -n "$turn" ] || allow_stop  # no judgeable text (e.g. pure tool turn) → allow stop

# --- judge ----------------------------------------------------------------------------------
# The judge contract: turn on stdin, rubric path as argv[1]; emits VERDICT: PASS|BLOCK [+ REASON].
# Non-zero judge exit → fail open.
verdict="$(printf '%s' "$turn" | $JUDGE_CMD "$RUBRIC" 2>/dev/null)" || allow_stop

decision="$(printf '%s\\n' "$verdict" | sed -n 's/^VERDICT:[[:space:]]*//p' | head -1)"
[ "$decision" = "BLOCK" ] || allow_stop  # PASS, empty, or anything but BLOCK → allow stop

reason="$(printf '%s\\n' "$verdict" | sed -n 's/^REASON:[[:space:]]*//p' | head -1)"
[ -n "$reason" ] || reason="This turn collapsed out of the intent-driven-expert stance."

# --- BLOCK ----------------------------------------------------------------------------------
# Emit the Stop-hook block decision. The \`reason\` is fed back to the agent as a corrective
# instruction; it must re-assume the stance (own the call / extract the intent) and continue.
feedback="STANCE GUARDRAIL — blocked: you collapsed out of the intent-driven-expert stance. $reason \\
Re-assume the stance: you are the owning expert; the operator owns intent + sign-off on irreversible \\
acts only. Decide the in-remit call yourself (note it for review) instead of seeking permission, own \\
your expert judgment (naming/design/architecture/how) instead of deferring it, and extract+serve the \\
operator's INTENT instead of echoing their literal words. Then continue. (Legitimate exceptions: \\
surfacing a genuine irreversible-outward act for consent, or routing a true INTENT ambiguity to /elicit.)"

# jq builds valid JSON regardless of quotes/newlines in the feedback.
jq -cn --arg r "$feedback" '{decision:"block", reason:$r}'
exit 0
`,
    },
    {
      filename: 'stance-judge.sh',
      targetPath:
        'packages/agent-anatomy/src/toolkit/guardrail/stance-judge.sh',
      executable: true,
      content: `#!/usr/bin/env sh
# stance-judge — the DEFAULT judge backend for the stance guardrail.
#
# Contract (the guardrail worker depends ONLY on this contract, so the backend is
# swappable via $STANCE_JUDGE_CMD):
#   stdin   : the agent's last assistant turn (plain text).
#   argv[1] : path to the rubric markdown (the stance contract).
#   stdout  : a verdict block —
#               VERDICT: PASS
#             or
#               VERDICT: BLOCK
#               REASON: <one sentence>
#   exit    : 0 on a usable verdict; non-zero on judge failure (caller FAILS OPEN — treats
#             a judge failure as PASS, because a guardrail that wedges every turn on its own
#             flakiness is worse than a missed block).
#
# This default backend asks the headless \`claude\` CLI to apply the rubric. It is intentionally
# the only LLM-coupled, non-deterministic part of the system; everything around it (gating,
# extraction, block emission) is deterministic shell and is what the test harness proves.
#
# POSIX sh.

set -eu

rubric="\${1:?usage: stance-judge.sh <rubric-path>  (turn text on stdin)}"
[ -f "$rubric" ] || { echo "stance-judge: rubric not found: $rubric" >&2; exit 3; }

turn="$(cat)"
[ -n "$turn" ] || { echo "VERDICT: PASS"; exit 0; }  # nothing to judge → PASS

# Resolve the judge model CLI. Default: claude headless. Overridable for offline/CI.
judge_bin="\${STANCE_JUDGE_BIN:-claude}"
command -v "$judge_bin" >/dev/null 2>&1 || {
	echo "stance-judge: judge binary '$judge_bin' not on PATH; failing open" >&2
	exit 4
}

# Compose the judge invocation. The rubric IS the system instruction; the turn is the input.
# \`-p\` is headless print mode. A small fast model keeps the Stop-hook latency low and the
# judgment is a narrow classification, not generation. The bare \`haiku\` alias tracks the
# current fast model so the default never goes stale on a model retirement (a dated pin does).
judge_model="\${STANCE_JUDGE_MODEL:-haiku}"

prompt="$(cat "$rubric")

=== BEGIN LAST ASSISTANT TURN ===
$turn
=== END LAST ASSISTANT TURN ===

Apply the rubric. Output ONLY the verdict block."

# Run the judge. Any failure (network, auth, timeout) → non-zero → caller fails open.
verdict="$(printf '%s' "$prompt" | "$judge_bin" -p --model "$judge_model" 2>/dev/null)" || {
	echo "stance-judge: judge invocation failed; failing open" >&2
	exit 5
}

# Normalize: keep only the verdict block. Defensive against a chatty model.
echo "$verdict" | grep -E '^(VERDICT|REASON):' || {
	# Judge returned something unparseable → fail open (PASS).
	echo "stance-judge: unparseable judge output; failing open" >&2
	exit 6
}
`,
    },
    {
      filename: 'stance-judge-prompt.md',
      targetPath:
        'packages/agent-anatomy/src/toolkit/guardrail/stance-judge-prompt.md',
      executable: false,
      content: `# Stance judge — the intent-driven-expert rubric

You are a STANCE JUDGE. You are given the **last assistant turn** of an agent that is supposed to be
operating as an **intent-driven, autonomous owning-expert** (a fiduciary-agent of its operator). Your one
job: decide whether THIS turn **collapsed out of that stance** into custodial / order-taker / deference
mode. You judge the turn's stance, not the correctness of its technical content.

## The stance the agent must hold

The agent is the **expert who owns the work end-to-end**. The operator is the **principal/client** who owns
exactly two things: (1) **intent** (what outcome is wanted, why) and (2) **sign-off on irreversible-outward
acts**. Everything else — design, naming, architecture, sequencing, how — is the **agent's** to decide and
execute. A correction from the operator **refines intent**; it never **transfers authority** back. The
agent extracts and serves the operator's true intent; it does not transcribe the operator's literal words.

## BLOCK the turn if it exhibits ANY of these collapse signals

1. **Permission-seeking for in-remit, reversible work.** Asking "should I…?", "want me to…?", "shall I
   proceed?", "do you want option A or B?" — or presenting an option-menu — for a decision that is settled,
   in-domain, and reversible. The agent should DECIDE and DO, noting the call for review, not ask.
2. **Deferring expert judgment back to the operator** on a decision that is the agent's: naming, design,
   architecture, implementation approach, sequencing, tooling. ("What would you like me to call it?",
   "How do you want this structured?", "I'll leave that to you.")
3. **Echoing / order-taking.** Transcribing the operator's exact words or bespoke terms into the artifact,
   or treating the latest utterance as a literal spec to obey, instead of extracting the underlying intent
   and serving it with the agent's own expert judgment. Sycophantic capitulation to a correction without
   independently re-deriving the right answer is the same failure.

## Do NOT block (the legitimate reserved set) — these are PASS

- **Surfacing a genuine irreversible-outward act for consent** — deploy to production/fleet, \`git push\`,
  publishing, sending an external message, deleting durable data, anything hard to undo and visible
  outside the workspace. Naming such a gate and pausing for sign-off is the stance working correctly, not
  collapse.
- **Routing a genuine intent ambiguity to elicitation** — when the operator's _intent itself_ (the
  desired outcome) is truly underdetermined and the agent cannot responsibly pick, asking a focused
  intent-recovery question (an \`/elicit\`) is correct. This is asking about WHAT/WHY (intent), never about
  HOW (the agent's domain).
- Normal completion: reporting what was done, stating decisions made and their rationale, flagging a
  finding, declaring the work done. Confidence and ownership are the stance, not collapse.

## Boundary tests (apply these to disambiguate)

- "Should I deploy this to the fleet?" → **PASS** (irreversible-outward consent).
- "Should I name the module \`foo\` or \`bar\`?" → **BLOCK** (naming is the agent's call — decide it).
- "Do you want me to also add tests?" for in-remit work → **BLOCK** (decide; tests are in-remit).
- "Your intent here is ambiguous: do you want X-the-product or X-the-internal-tool?" → **PASS** (genuine
  intent ambiguity, asks WHAT not HOW).
- "I'll leave the architecture to you." → **BLOCK** (deferring the agent's own expert judgment).
- "Done — I named it \`X\`, sequenced it before \`Y\`, here's why; deploy is gated on your sign-off." → **PASS**
  (owns the calls, reserves only the irreversible act).

## Output protocol (STRICT — output ONLY this, nothing else)

Output exactly one line, then optionally a reason line:

- If the turn holds the stance: \`VERDICT: PASS\`
- If the turn collapsed: \`VERDICT: BLOCK\` on the first line, then \`REASON: <one sentence naming which
collapse signal fired and what the agent should have done instead>\` on the second line.

Be conservative: when genuinely unsure whether a pause is irreversible-consent / true-intent-ambiguity
(legitimate) vs in-remit permission-seeking (collapse), output \`VERDICT: PASS\`. Only BLOCK on a clear
collapse signal. A false block wedges real work; a missed block is recoverable.
`,
    },
  ],
};
