import type { HookCell } from '../manifest.js';
import { stanceGuardrailJudgeClip } from './stance-guardrail.js';

// purview-guardrail — the gate that makes a ROLE CONTRACT scoreable.
//
// A role value now states the arrow the position is over the ladder
// `intent ≺ C ≺ spec ≺ artifact`, and an act whose domain or codomain falls outside
// that arrow is delegated NECESSARILY. Declared, that is a steer. This cell is the
// bound: it refuses, before the call fires, an act the holder's own contract puts
// outside its arrow.
//
// WHY A SECOND CELL RATHER THAN A SECOND RUBRIC LEG. One gate, one contract. The
// stance guard judges `autonomy` — whether the agent collapsed into order-taking — and
// this one judges `role`. They score different declarations, at different moments, and
// `gates` in the stance manifest is keyed by OWNING CELL precisely so a second guarded
// dimension is a second entry rather than an append to somebody else's prompt. The
// judge BACKEND is shared, exactly as the pre-hook shares it: one judge, two contracts.
//
// IT QUOTES THE AGENT'S OWN PROJECTED CONTRACT, and that is the design decision worth
// stating. The rubric carries no role text and names no agent. The worker reads the
// `## Role` section out of the persona's own deployed Target and hands it to the judge
// as the law to score against, so the gate scores WHAT THE CORPUS DECLARES rather than
// an author's opinion about good behaviour — and a corpus that mints a sixth role gets
// it judged with no edit here. This is the lesson the stance guard learned the
// expensive way: its allowlist drifted and left `architect` and `kino` unjudged while
// every agent in the corpus composed the fragment it claimed to enforce.
//
// WHAT IT BLOCKS is what the arrow excludes, and nothing else:
//   · a dispatch carrying a spec the dispatcher wrote for a unit of the loop, from a holder
//     whose arrow does not write spec — the architect skipping the planner, who alone turns
//     a shard into units;
//   · a write to the substrate by a holder whose arrow does not write artifact;
//   · a dispatch whose prompt is the operator's literal words rather than a routed name or
//     the holder's own request — the same dispatch-echo the stance guard catches at turn
//     end, refused here because at this moment the contract that convicts it is the ROLE's.
// WHAT IT PASSES: a dispatch to a planner, a dispatch routing a unit name to an implementer,
// a dispatch to an assayer, a dispatch to the integrator, a dispatch outside the loop of
// realizing the design — a comparison, an audit, a question — in the holder's own words,
// where the holder's own contract admits it, READING anything, and writing whatever the arrow
// reserves. The operator saw an ad hoc comparison refused twice because a self-worded prompt
// was read as a spec; a request is not a spec, the routing discipline binds units of the loop
// and not everything a holder says to a delegate. Reading is never a block — the architect's
// contract makes an artifact read a descent, but a read is cheap to undo and a gate that
// fires on one would wedge every legitimate orientation.
//
// FAIL-OPEN, EVIDENCE-CHECKED, RETRY-PROOF. The first two are inherited from the sibling
// pre-hook, which is also the structural model for the worker. A block whose cited span
// is not literally in the payload is DISCARDED: a fabricated block is not a lesser
// error than a missed one. RETRY-PROOF is this guard's own: a refused act stays refused
// however often it is retried, so a repeat is judged again and never waved through — a
// cap that lets an identical second call pass unjudged is an exit from the guard.
//
// WHAT THE JUDGE IS HANDED is only what its one decision needs: the test in a few sentences
// (the rubric), the act and the holder's contract it applies to. The act line names the act
// and its target and nothing else; the definitions of what an act produces are the rubric's.

export const purviewGuardrail: HookCell = {
  id: 'purview-guardrail',
  residue:
    'structural-refusal ↾ mid-turn act ∉ role-arrow · deny-before-fire ⟨descent ⟨write(artifact) ∉ writes⟩ · skipped-rung ⟨dispatch(spec the dispatcher wrote for a unit of the loop) ∄ planner⟩ · dispatch-echo ⟨literal-words ≠ routed-name ∨ own-words⟩⟩ · pass ⟨read · act ∈ reserves · dispatch ↦ plan ∨ implement(unit-name) ∨ assay ∨ integrate ∨ ad-hoc(own-words ∉ loop ↾ contract admits)⟩ · law = the HOLDER-projected role-section ⟨quoted verbatim · ¬ authored-opinion⟩ · shared judge-backend ⟨sibling⟩ · fail-open ∧ evidence-checked ∧ retry-proof ⟨refused ⊢ refused ∀ retry · every call judged · ¬ marker⟩ · judge-hand ≜ test ∧ act ∧ contract ¬ more',
  substrate: 'harness',
  // Bound by holding a role at all: the arrow it judges against is the role's own.
  binds: { dimension: 'role' },
  order: 1,
  events: ['subagent.dispatch.pre', 'tool.use.pre'],
  entry: 'purview-guardrail.sh',
  timeout: 60,
  refs: [],
  workers: [
    {
      filename: 'purview-guardrail.sh',
      targetPath: 'packages/canon/targets/guardrail/purview-guardrail.sh',
      executable: true,
      content: `#!/usr/bin/env sh
# purview-guardrail — a PreToolUse hook that STRUCTURALLY REFUSES, before the call
# fires, a mid-turn act that falls outside the arrow the agent's OWN role contract
# declares.
#
# THE LAW IS NOT IN THIS FILE AND NOT IN THE RUBRIC. It is the \`## Role\` section of
# the persona's deployed Target, read at run time and handed to the judge as the
# contract to score against. No role text, no agent name and no behavioural opinion is
# hard-coded anywhere in this gate.
#
# SAFETY MODEL (mirrors both siblings):
#   - SCOPE-ENROLLED by PRESENCE. A persona carrying a stance manifest is judged; every
#     other scope is silent. No allowlist — the projection that places a persona enrolls
#     it, and nothing central lists anybody.
#   - CONTRACT-ENROLLED, one step further. A persona whose Target carries no \`## Role\`
#     section has no arrow to be outside of, so it is allowed. A gate cannot convict
#     against a law that was never declared.
#   - FAILS OPEN, NEVER SILENTLY. Any error (no jq, no input, no Target, judge failure,
#     unparseable verdict, unexpected error) -> exit 0, and the call goes through WITH A NOTICE
#     the operator reads (\`say\`: Claude Code's JSON \`systemMessage\`, omp's relayed line) naming
#     this guard and why it could not judge. Silence is reserved for "judged, pass", "not
#     enrolled" and "no arrow declared".
#   - EVIDENCE-CHECKED. A BLOCK must quote, on an \`EVIDENCE:\` line, a span that is literally
#     present in the payload; a citation that is not there is a fabricated block and is
#     DISCARDED — and the discard is said, since no verdict then stands.
#   - RETRY-PROOF. A refused act stays refused however often it is retried: every call is
#     judged afresh, a repeat of a refused call included, and a BLOCK on it denies it again.
#     No marker is written and nothing is let through unjudged for having been denied before.
#
# INPUT  : Claude Code PreToolUse hook JSON on stdin.
# OUTPUT : on a purview breach -> a deny decision on stdout + exit 0.
#          judged, pass -> no stdout + exit 0.
#          let through with no verdict -> the notice \`say\` prints + exit 0.
#
# POSIX sh. Depends on: jq. Missing jq -> the guard says so and allows the call.

set -eu

# WHAT AN OPERATOR READS WHEN THE GUARD CANNOT JUDGE, defined before anything that needs a
# command: the first thing that can be missing is \`jq\`, and a worker run with a PATH holding
# little beyond \`sh\` and \`cat\` must still say it did not judge, so \`esc\`, \`say\` and \`open\`
# are builtins only and nothing external runs above the jq check.
#
# Claude Code shows the operator a hook's JSON \`systemMessage\` and NOT its plain stdout on
# exit 0. omp's extension bridge reads the worker's plain stdout, and would relay a JSON object
# as raw JSON — hence one form per harness, chosen at projection by the harness's own name.
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
say() {
	case "{{fact:harness-name}}" in
		claude) printf '{"systemMessage":"%s"}\\n' "$(esc "$1")" ;;
		*) printf '%s\\n' "$1" ;;
	esac
}

allow() { exit 0; }

# A verdict and a failure are different facts and silence carries only one of them: \`allow\`
# means "judged, pass" or "not this guard's call", \`open\` means "could not judge" — the call
# still proceeds, and the operator is told.
open() {
	[ -z "\${LOG:-}" ] || printf '%s\\n' "open: $1 tool=\${tool_name:-?} agent=\${agent_type:-?}" >> "$LOG" 2>/dev/null || true
	say "PURVIEW GUARDRAIL — DARK: $1. This call was NOT judged; the absence of a deny is an absence of a verdict, not a clean one."
	exit 0
}

# A PreToolUse hook must never break a session. An unexpected error (a nonzero status reaching
# the trap) is let through AND SAID; every deliberate \`exit 0\` arrives with status 0.
trap 'rc=$?; [ "$rc" -eq 0 ] || open "an unexpected error stopped it (exit status $rc)"; exit 0' EXIT

input="$(cat)"
[ -n "$input" ] || open "the hook received no input"
command -v jq >/dev/null 2>&1 || open "jq is not installed, so the hook payload cannot be read"

# A GUARD BINDS A PERSONA'S OWN MAIN SESSION AND NO SUBAGENT IT DISPATCHES. A subagent is bounded
# by what it was handed, judged by its assay and the whole check, and supervised by the main
# session. Claude Code fires this hook inside a subagent too (settings hooks and the subagent's
# own front-matter hooks), and there the payload carries \`agent_id\` — present only inside a
# subagent. A guard that does not bind there is not dark: it exits before it judges and says
# nothing.
[ -z "$(printf '%s' "$input" | jq -r '.agent_id // empty' 2>/dev/null || true)" ] || allow

# The sibling Stop hook's deployed dir owns the SHARED judge backend, resolved from
# this script's own location exactly as the pre-hook resolves it — every hooks root
# holds the hook dirs as siblings, so this derivation is true at every site this file
# can land.
SELF_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
HOOKS_ROOT="$(dirname -- "$SELF_DIR")"
JUDGE_DIR="\${STANCE_GUARD_DIR:-$HOOKS_ROOT/stance-guardrail}"
NEUTRAL_ROOT="$(dirname -- "$(dirname -- "$HOOKS_ROOT")")/.agents"
RUBRIC="\${PURVIEW_RUBRIC:-$NEUTRAL_ROOT/purview-guardrail/purview-judge-prompt.md}"
JUDGE_CMD="\${STANCE_JUDGE_CMD:-sh $JUDGE_DIR/stance-judge.sh}"
LOG="\${PURVIEW_GUARD_LOG:-$SELF_DIR/misses.log}"

cwd="$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null || true)"
[ -n "$cwd" ] && cd "$cwd" 2>/dev/null || true

# --- scope gate: the persona's OWN stance manifest -------------------------------------------
# The scope is the one the harness hands over: \`stance_scope\` where a dispatcher sits in the
# persona's own scope (omp), else the persona directory of the agent the payload NAMES
# (\`agent_type\`, Claude Code — none on a bare session) under this harness's home, one hop above
# the hooks root. Presence of the manifest is enrollment; no agent list lives here.
stance_scope="$(printf '%s' "$input" | jq -r '.stance_scope // empty' 2>/dev/null || true)"
if [ -z "$stance_scope" ]; then
	named="$(printf '%s' "$input" | jq -r '.agent_type // empty' 2>/dev/null || true)"
	case "$named" in '' | */* | . | ..) allow ;; esac
	stance_scope="$(dirname -- "$HOOKS_ROOT")/{{fact:harness-persona-root}}/$named"
fi
manifest="$stance_scope/{{fact:stance-manifest}}"
[ -f "$manifest" ] || allow
agent_type="$(jq -r '.agent // empty' "$manifest" 2>/dev/null || true)"
[ -n "$agent_type" ] || open "the stance manifest at $manifest names no agent, so there is no declared contract to judge against"

# --- the LAW: this persona's own projected role contract -------------------------------------
# A persona scope is \`<root>/personas/<name>\` (claude) or \`<root>/agent/personas/<name>\` (omp), and
# the Target it was projected from is \`agents/<name>.md\` beside \`personas/\` — two levels out and
# back down, the same shape of derivation the judge path above uses. Overridable for test rigs.
AGENT_ROOT="$(dirname -- "$(dirname -- "$stance_scope")")"
AGENT_MD="\${PURVIEW_AGENT_MD:-$AGENT_ROOT/agents/$agent_type.md}"
[ -f "$AGENT_MD" ] || open "the agent's projected Target is not at $AGENT_MD, so its declared contract cannot be read"
contract="$(awk '/^## Role$/{f=1;next} /^## /{f=0} f' "$AGENT_MD" 2>/dev/null || true)"
# A contract that is a BARE TOKEN states no arrow, so there is nothing to be outside
# of. Only a multi-line contract is scoreable, and saying so here is what keeps the
# gate from inventing a law for a corpus that has not declared one.
[ "$(printf '%s\\n' "$contract" | grep -c '[^[:space:]]')" -ge 2 ] || allow

${stanceGuardrailJudgeClip}

# --- extract the judged payload, branched by act ---------------------------------------------
tool_name="$(printf '%s' "$input" | jq -r '.tool_name // empty' 2>/dev/null || true)"
[ -n "$tool_name" ] || open "the payload names no tool, so there is no call to judge"

case "$tool_name" in
	Agent|SendMessage|Task)
		body="$(printf '%s' "$input" | jq -r '.tool_input.prompt // .tool_input.message // .tool_input.description // ""' 2>/dev/null || true)"
		target="$(printf '%s' "$input" | jq -r '.tool_input.subagent_type // .tool_input.agent // .tool_input.name // ""' 2>/dev/null || true)"
		act="DISPATCH to \\\`\${target:-unnamed}\\\`"
		;;
	Write|Edit|MultiEdit|NotebookEdit)
		body="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.path // .tool_input.notebook_path // ""' 2>/dev/null || true)"
		act="WRITE to $body"
		;;
	*)
		# DEFENCE IN DEPTH. \`tool.use.pre\` fires on every tool on a harness with no
		# subject selector; these two classes are the only acts this contract can
		# convict, and a read is deliberately not one of them.
		allow ;;
esac

[ -n "\${body:-}" ] || allow

# THE JUDGE IS SENT AT MOST JUDGE_PAYLOAD_CAP BYTES, the declared contract and the act included.
# The contract is a role section a few kilobytes long, so it may hold half the cap at most; the
# dispatch prompt takes what is left, keeping both ends because its instruction may sit at either,
# and the seam is marked. The evidence check below then runs against exactly this payload, so a
# span in text the excerpt elided is discarded like any span that is not there.
contract="$(printf '%s' "$contract" | judge_ends "$((JUDGE_PAYLOAD_CAP / 2))")"
head_part="=== THE HOLDER'S DECLARED CONTRACT (agent: $agent_type) ===
$contract
=== THE ACT ABOUT TO FIRE ===
$act
"
body="$(printf '%s' "$body" | judge_ends "$((JUDGE_PAYLOAD_CAP - $(judge_bytes "$head_part")))")"
payload="$head_part$body"

# A refused call stays refused however often it is retried: there is no marker, no cap and
# no memory of a prior denial. Every call is judged, a repeat of a refused call included.

# --- judge (SHARED backend, OWN rubric) -----------------------------------------------------
# THE SAME SEAM, UNDER THE SAME NAMES, as the two stance workers: a host that holds a model
# runs this worker twice around a judgment it makes itself (\`STANCE_EMIT_PAYLOAD\` to receive
# the payload and rubric, \`STANCE_VERDICT_FILE\` naming the answer). This one read
# \`PURVIEW_\`-prefixed names of its own, so the omp bridge — which speaks the shared names —
# got no payload back and purview judged nothing there, on every call, while reading as a
# guard that had found nothing.
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

decision="$(printf '%s\\n' "$verdict" | sed -n 's/^VERDICT:[[:space:]]*//p' | head -1 | sed 's/[[:space:]]*$//')"
case "$decision" in
	PASS) allow ;;  # judged, pass: the one silent verdict
	BLOCK) ;;
	*) open "the judge's verdict was unparseable (no VERDICT: PASS or VERDICT: BLOCK line)" ;;
esac

reason="$(printf '%s\\n' "$verdict" | sed -n 's/^REASON:[[:space:]]*//p' | head -1)"
[ -n "$reason" ] || reason="This act falls outside the arrow your role contract declares."

# --- EVIDENCE CHECK: the cited span must be literally in the payload -------------------------
# A block naming a span the payload does not contain is a hallucinated block, and a
# fabricated refusal is not a lesser error than a missed one. Same rule, same reason as
# the turn-end sibling.
cited="$(printf '%s\\n' "$verdict" | sed -n 's/^EVIDENCE:[[:space:]]*//p' | head -1)"
if [ -n "$cited" ]; then
	printf '%s' "$payload" | grep -qF -- "$cited" || {
		[ -z "\${LOG:-}" ] || printf '%s\\n' "block-discarded: span=$cited tool=$tool_name agent=$agent_type" >> "$LOG" 2>/dev/null || true
		say "PURVIEW GUARDRAIL — BLOCK DISCARDED: the judge blocked this call but cited a span that is not in it (fabricated): $cited. No verdict stands; this call was NOT judged clean."
		exit 0
	}
fi

feedback="PURVIEW GUARDRAIL — denied this $tool_name call: it falls outside the arrow your own \\
role contract declares. $reason  Delegation is a THEOREM of that arrow, not an option: an act whose \\
domain or codomain lies outside it goes to the role that owns it — a decomposition of a shard to a \\
planner, a build to an implementer, an artifact reading to an assayer, a merge or a whole check to \\
the integrator. Hand a unit of the loop over by name and carry on with what the contract reserves. \\
(Legitimate and NOT blocked here: reading anything, dispatching to a planner, routing a unit of the loop \\
or a closed plan by its name to an implementer, an assayer, the integrator or the agent already running \\
it, dispatching a request outside the loop to whichever role \\
or agent fits it in your own rectified words where your contract admits it, and performing any act the \\
contract's own \\\`reserves\\\` clause names.)"

jq -cn --arg r "$feedback" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
exit 0
`,
    },
    {
      filename: 'purview-judge-prompt.md',
      targetPath: 'packages/canon/targets/guardrail/purview-judge-prompt.md',
      executable: false,
      // NEUTRAL, exactly as the stance rubric is, and for a stronger reason here: this
      // rubric carries no corpus content at all. It is a procedure for scoring a
      // contract supplied at run time, so it is the same bytes for any corpus that
      // declares a role arrow — which is what makes the neutral root its right home
      // rather than a convenience.
      shared: true,
      content: `# Purview judge

You get THE HOLDER'S DECLARED CONTRACT (its Role section) and THE ACT ABOUT TO FIRE. Decide what the act produces, then whether the contract lets this holder produce it. Nothing else counts: not whether the act is wise, not the contract's other clauses.

What an act produces:

- a write to any file, whatever the file or the reason: artifact.
- a dispatch or message that names a unit of the loop or a closed plan with the event it is routed on (build it, assay it, findings back, whole, broke, "X has closed, make its line whole, ask for release"): route. Naming the unit or plan with its event is what makes a route; the recipient role is not a unit, and any instruction of what to change, add or run makes it spec instead.
- a dispatch or message carrying instructions the dispatcher wrote for a unit of the loop, what to change, add or run in its files: spec.
- a prompt that quotes or relays what the operator said as the order ("The operator said: ... Do that."): operator's words. Never a request.
- a question or request in the holder's own words about something outside the loop, to any role: request.

The contract's "writes" lists what the holder may produce. PASS when the product is one of the words in "writes", or is itself named in "reserves". A request is named there wherever the contract admits a dispatch in the holder's own words outside the loop (ad-hoc, own-words): PASS, but never for the operator's words. Otherwise BLOCK: spec is not route, artifact is not C. Unsure is PASS.

Begin with WRITES and output only. EVIDENCE is bare text copied from the payload, never wrapped in quote marks:

\`\`\`
WRITES: <the words inside writes⟨...⟩ in the contract, copied>
PRODUCES: <artifact|route|spec|operator's words|request>
VERDICT: BLOCK|PASS
REASON: <one sentence>
EVIDENCE: <short literal substring of the payload showing the act, no quote marks; omit when PASS>
\`\`\`
`,
    },
  ],
};
