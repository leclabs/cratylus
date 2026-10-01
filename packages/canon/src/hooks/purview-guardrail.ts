import { contestShell, judgeClipShell } from '../guard-shell.js';
import type { HookCell } from '../manifest.js';

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
// FAIL-OPEN, EVIDENCE-CHECKED, JUDGED-AGAIN. The first two are inherited from the sibling
// pre-hook, which is also the structural model for the worker. A block whose cited span
// is not literally in the payload is DISCARDED: a fabricated block is not a lesser
// error than a missed one. JUDGED-AGAIN is this guard's own: a retry is judged afresh and
// refused again on a BLOCK, never waved through, and a refusal never strands the agent: it
// names the way on, and an agent that holds it wrong contests it by writing why into the
// file the refusal names, whereupon that call proceeds unjudged and the contest is logged
// for the operator (`contestShell`, the one fragment every guard worker shares).
//
// WHAT THE JUDGE IS HANDED is only what its one decision needs: the test in a few sentences
// (the rubric), the act and the holder's contract it applies to. The act line names the act
// and its target and nothing else; the definitions of what an act produces are the rubric's.

export const purviewGuardrail: HookCell = {
  id: 'purview-guardrail',
  residue:
    'structural-refusal ↾ mid-turn act ∉ role-arrow · deny-before-fire ⟨descent ⟨write(artifact) ∉ writes⟩ · skipped-rung ⟨dispatch(spec the dispatcher wrote for a unit of the loop) ∄ planner⟩ · dispatch-echo ⟨literal-words ≠ routed-name ∨ own-words⟩⟩ · pass ⟨read · act ∈ reserves · dispatch ↦ plan ∨ implement(unit-name) ∨ assay ∨ integrate ∨ ad-hoc(own-words ∉ loop ↾ contract admits)⟩ · law = the HOLDER-projected role-section ⟨quoted verbatim · ¬ authored-opinion⟩ · shared judge-backend ⟨sibling⟩ · fail-open ∧ evidence-checked ∧ judged-again ⟨retry ↦ judged afresh ∧ refused again on BLOCK · every call judged · ¬ marker⟩ · refusal ↦ way-forward ⟨act on reason ∨ contest ≜ state why ↦ contested call proceeds unjudged ∧ contest logged ↦ operator review⟩ · judge-hand ≜ test ∧ act ∧ contract ¬ more',
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
# purview-guardrail — denies a mid-turn act outside the arrow the agent's own \`## Role\` contract declares. Needs jq.

set -eu
GUARD_ID=purview-guardrail
GUARD_NAME="PURVIEW GUARDRAIL"

# Builtins only until jq is checked: a PATH of little but \`sh\` must still be able to say so.
esc() {
	_i="$1"; _o=""; _n="$(printf '\\nx')"; _n="\${_n%x}"; _t="$(printf '\\t')"; _r="$(printf '\\r')"
	while [ -n "$_i" ]; do
		_s="\${_i#?}"; _c="\${_i%"$_s"}"
		case "$_c" in '\\') _c='\\\\' ;; '"') _c='\\"' ;; "$_n") _c='\\n' ;; "$_t") _c='\\t' ;; "$_r") _c='\\r' ;; esac
		_o="$_o$_c"; _i="$_s"
	done
	printf '%s' "$_o"
}
say() {
	case "{{fact:harness-name}}" in
		claude) printf '{"systemMessage":"%s"}\\n' "$(esc "$1")" ;;
		*) printf '%s\\n' "$1" ;;
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
RUBRIC="\${PURVIEW_RUBRIC:-$NEUTRAL_ROOT/purview-guardrail/purview-judge-prompt.md}"
JUDGE_CMD="\${STANCE_JUDGE_CMD:-sh \${STANCE_GUARD_DIR:-$HOOKS_ROOT/stance-guardrail}/stance-judge.sh}"

cd "$(field '.cwd // empty')" 2>/dev/null || true

# Enrolled by the persona's stance manifest: \`stance_scope\` (omp) or \`agent_type\` (Claude Code).
stance_scope="$(field '.stance_scope // empty')"
if [ -z "$stance_scope" ]; then
	named="$(field '.agent_type // empty')"
	case "$named" in '' | */* | . | ..) allow ;; esac
	stance_scope="$(dirname -- "$HOOKS_ROOT")/{{fact:harness-persona-root}}/$named"
fi
manifest="$stance_scope/{{fact:stance-manifest}}"
[ -f "$manifest" ] || allow
GUARD_AGENT="$(jq -r '.agent // empty' "$manifest" 2>/dev/null || true)"
[ -n "$GUARD_AGENT" ] || open "the stance manifest at $manifest names no agent"

AGENT_MD="\${PURVIEW_AGENT_MD:-$(dirname -- "$(dirname -- "$stance_scope")")/agents/$GUARD_AGENT.md}"
[ -f "$AGENT_MD" ] || open "the agent's Target is not at $AGENT_MD, so its contract cannot be read"
contract="$(awk '/^## Role$/{f=1;next} /^## /{f=0} f' "$AGENT_MD" 2>/dev/null || true)"
# A bare-token contract states no arrow.
[ "$(printf '%s\\n' "$contract" | grep -c '[^[:space:]]')" -ge 2 ] || allow

${judgeClipShell}
GUARD_ACT="$(field '.tool_name // empty')"
[ -n "$GUARD_ACT" ] || open "the payload names no tool"

case "$GUARD_ACT" in
	Agent|SendMessage|Task)
		body="$(field '.tool_input.prompt // .tool_input.message // .tool_input.description // ""')"
		target="$(field '.tool_input.subagent_type // .tool_input.agent // .tool_input.name // ""')"
		act="DISPATCH to \\\`\${target:-unnamed}\\\`"
		;;
	Write|Edit|MultiEdit|NotebookEdit)
		body="$(field '.tool_input.file_path // .tool_input.path // .tool_input.notebook_path // ""')"
		# Writing the contest file is never refused.
		case "$body" in */../* | */..) ;; "\${TMPDIR:-/tmp}/guardrail-contest/"*) allow ;; esac
		act="WRITE to $body"
		;;
	*) allow ;;
esac
[ -n "\${body:-}" ] || allow

GUARD_SESSION="$(field '.session_id // empty')"
GUARD_CALL="$(printf '%s' "$input" | jq -c '.tool_input' 2>/dev/null || true)"
${contestShell}
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
if [ -n "\${STANCE_EMIT_PAYLOAD:-}" ]; then
	jq -cn --arg r "$RUBRIC" --arg p "$payload" '{rubric:$r,payload:$p}'
	exit 0
fi
if [ -n "\${STANCE_VERDICT_FILE:-}" ]; then
	verdict="$(cat "$STANCE_VERDICT_FILE" 2>/dev/null || true)"
	[ -n "$verdict" ] || open "the judge did not answer"
else
	verdict="$(printf '%s' "$payload" | $JUDGE_CMD "$RUBRIC" 2>/dev/null)" || open "the judge did not answer"
fi

said() { printf '%s\\n' "$verdict" | sed -n "s/^$1:[[:space:]]*//p" | head -1; }
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
