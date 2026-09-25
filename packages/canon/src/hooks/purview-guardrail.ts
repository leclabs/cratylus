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
//   · a dispatch to a builder for a piece no planner decomposed, from a holder whose
//     arrow does not write spec — the architect skipping the middle rung;
//   · a write to the substrate by a holder whose arrow does not write artifact;
//   · a dispatch whose prompt is the operator's literal words rather than a cut piece
//     — the same dispatch-echo the stance guard catches at turn end, refused here
//     because at this moment the contract that convicts it is the ROLE's.
// WHAT IT PASSES: a dispatch to a planner, a dispatch to an assayer, READING anything,
// and writing whatever the arrow reserves. Reading is never a block — the architect's
// contract makes an artifact read a descent, but a read is cheap to undo and a gate
// that fires on one would wedge every legitimate orientation.
//
// FAIL-OPEN, EVIDENCE-CHECKED, RE-ENTRY-CAPPED — all three inherited from the sibling
// pre-hook, which is also the structural model for the worker. A block whose cited span
// is not literally in the payload is DISCARDED: a fabricated block is not a lesser
// error than a missed one.

export const purviewGuardrail: HookCell = {
  id: 'purview-guardrail',
  residue:
    'structural-refusal ↾ mid-turn act ∉ role-arrow · deny-before-fire ⟨descent ⟨write(artifact) ∉ writes⟩ · skipped-rung ⟨dispatch(build) ∄ decomposition⟩ · dispatch-echo ⟨literal-words ≠ cut-piece⟩⟩ · pass ⟨read · act ∈ reserves · dispatch ↦ plan ∨ assay⟩ · law = the HOLDER-projected role-section ⟨quoted verbatim · ¬ authored-opinion⟩ · shared judge-backend ⟨sibling⟩ · fail-open ∧ evidence-checked ∧ re-entry-capped',
  substrate: 'harness',
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
#   - FAILS OPEN. Any error (no jq, no Target, judge failure) -> exit 0.
#   - EVIDENCE-CHECKED. A BLOCK must quote a span that is literally present in the
#     payload; a citation that is not there is a fabricated block and is DISCARDED.
#   - LOOP-SAFE. A re-entry cap: never deny an identical tool_input twice.
#
# INPUT  : Claude Code PreToolUse hook JSON on stdin.
# OUTPUT : on a purview breach -> a deny decision on stdout + exit 0.
#          otherwise -> no stdout + exit 0.
#
# POSIX sh. Depends on: jq. Missing jq -> fail open.

set -eu

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

trap 'exit 0' EXIT

allow() { exit 0; }
note() { printf '%s\\n' "$1" >> "$LOG" 2>/dev/null || true; }

input="$(cat)"
[ -n "$input" ] || allow
command -v jq >/dev/null 2>&1 || allow

cwd="$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null || true)"
[ -n "$cwd" ] && cd "$cwd" 2>/dev/null || true

# --- scope gate: the persona's OWN stance manifest -------------------------------------------
stance_scope="$(printf '%s' "$input" | jq -r '.stance_scope // empty' 2>/dev/null || true)"
[ -n "$stance_scope" ] || allow
manifest="$stance_scope/stance/manifest.json"
[ -f "$manifest" ] || allow
agent_type="$(jq -r '.agent // empty' "$manifest" 2>/dev/null || true)"
[ -n "$agent_type" ] || allow

# --- the LAW: this persona's own projected role contract -------------------------------------
# A persona scope is \`<root>/agent/personas/<name>\` and the Target it was projected
# from is \`<root>/agent/agents/<name>.md\` — two levels out and back down, the same
# shape of derivation the judge path above uses. Overridable for test rigs.
AGENT_ROOT="$(dirname -- "$(dirname -- "$stance_scope")")"
AGENT_MD="\${PURVIEW_AGENT_MD:-$AGENT_ROOT/agents/$agent_type.md}"
[ -f "$AGENT_MD" ] || allow
contract="$(awk '/^## Role$/{f=1;next} /^## /{f=0} f' "$AGENT_MD" 2>/dev/null || true)"
# A contract that is a BARE TOKEN states no arrow, so there is nothing to be outside
# of. Only a multi-line contract is scoreable, and saying so here is what keeps the
# gate from inventing a law for a corpus that has not declared one.
[ "$(printf '%s\\n' "$contract" | grep -c '[^[:space:]]')" -ge 2 ] || allow

# --- extract the judged payload, branched by act ---------------------------------------------
tool_name="$(printf '%s' "$input" | jq -r '.tool_name // empty' 2>/dev/null || true)"
[ -n "$tool_name" ] || allow

case "$tool_name" in
	Agent|SendMessage|Task)
		body="$(printf '%s' "$input" | jq -r '.tool_input.prompt // .tool_input.message // .tool_input.description // ""' 2>/dev/null || true)"
		target="$(printf '%s' "$input" | jq -r '.tool_input.subagent_type // .tool_input.agent // .tool_input.name // ""' 2>/dev/null || true)"
		act="DISPATCH to \\\`\${target:-unnamed}\\\` (codomain: the spec this delegate will build from)"
		;;
	Write|Edit|MultiEdit|NotebookEdit)
		body="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.path // .tool_input.notebook_path // ""' 2>/dev/null || true)"
		act="WRITE to the substrate (codomain: artifact)"
		;;
	*)
		# DEFENCE IN DEPTH. \`tool.use.pre\` fires on every tool on a harness with no
		# subject selector; these two classes are the only acts this contract can
		# convict, and a read is deliberately not one of them.
		allow ;;
esac

[ -n "\${body:-}" ] || allow

payload="=== THE HOLDER'S DECLARED CONTRACT (agent: $agent_type) ===
$contract
=== THE ACT ABOUT TO FIRE ===
$act
$body"

# --- loop-safety: never deny an identical tool_input twice ----------------------------------
session_id="$(printf '%s' "$input" | jq -r '.session_id // "nosession"' 2>/dev/null || echo nosession)"
sig="$(printf '%s' "$input" | jq -c '.tool_input' 2>/dev/null | cksum | cut -d' ' -f1 2>/dev/null || echo 0)"
seen="\${TMPDIR:-/tmp}/.purview-pre-$session_id-$sig"
[ -f "$seen" ] && allow

# --- judge (SHARED backend, OWN rubric) -----------------------------------------------------
if [ -n "\${PURVIEW_EMIT_PAYLOAD:-}" ]; then
	jq -cn --arg r "$RUBRIC" --arg p "$payload" '{rubric:$r, payload:$p}'
	exit 0
fi
if [ -n "\${PURVIEW_VERDICT_FILE:-}" ]; then
	verdict="$(cat "\${PURVIEW_VERDICT_FILE}" 2>/dev/null || true)"
	[ -n "$verdict" ] || {
		note "$(date -u +%Y-%m-%dT%H:%M:%SZ) judge-empty tool=$tool_name agent=$agent_type"
		allow
	}
else
	verdict="$(printf '%s' "$payload" | $JUDGE_CMD "$RUBRIC" 2>/dev/null)" || {
		note "$(date -u +%Y-%m-%dT%H:%M:%SZ) judge-fail tool=$tool_name agent=$agent_type"
		allow
	}
fi

decision="$(printf '%s\\n' "$verdict" | sed -n 's/^VERDICT:[[:space:]]*//p' | head -1)"
[ "$decision" = "BLOCK" ] || allow

reason="$(printf '%s\\n' "$verdict" | sed -n 's/^REASON:[[:space:]]*//p' | head -1)"
[ -n "$reason" ] || reason="This act falls outside the arrow your role contract declares."

# --- EVIDENCE CHECK: the cited span must be literally in the payload -------------------------
# A block naming a span the payload does not contain is a hallucinated block, and a
# fabricated refusal is not a lesser error than a missed one. Same rule, same reason as
# the turn-end sibling.
cited="$(printf '%s\\n' "$verdict" | sed -n 's/^SPAN:[[:space:]]*//p' | head -1)"
if [ -n "$cited" ]; then
	printf '%s' "$payload" | grep -qF -- "$cited" || {
		note "$(date -u +%Y-%m-%dT%H:%M:%SZ) evidence-fail tool=$tool_name agent=$agent_type span=$cited"
		allow
	}
fi

: > "$seen" 2>/dev/null || true

feedback="PURVIEW GUARDRAIL — denied this $tool_name call: it falls outside the arrow your own \\
role contract declares. $reason  Delegation is a THEOREM of that arrow, not an option: an act whose \\
domain or codomain lies outside it goes to the role that owns it — a decomposition to a planner, a \\
build to an implementer, an artifact reading to an assayer. Hand it over and carry on with what the \\
contract reserves. (Legitimate and NOT blocked here: reading anything, dispatching to a planner or an \\
assayer, and performing any act the contract's own \\\`reserves\\\` clause names.)"

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
      content: `# Purview judge — does this act fall outside the agent's declared arrow?

You are a PURVIEW JUDGE. You are given two things:

1. **THE HOLDER'S DECLARED CONTRACT** — the \`## Role\` section of the agent's own definition,
   verbatim. It states an arrow of the form \`reads⟨…⟩ → writes⟨…⟩\` over a ladder of
   representational layers, the acts the arrow **reserves**, and often a named defect.
2. **THE ACT ABOUT TO FIRE** — either a DISPATCH (the delegate prompt) or a WRITE (the path).

Your one job: decide whether the act falls **outside** that arrow. You judge conformance to the
contract you were handed. You do **not** judge whether the contract is wise, whether the act is a
good idea, or whether the code is any good.

## The law is the contract, not your opinion

Every rule you apply must be readable **in the supplied contract**. If the contract does not exclude
the act, the act passes — however unwise it looks to you. An agent is entitled to the whole of what
its arrow permits, and a gate that convicts on an unwritten rule is worse than no gate, because it
teaches the agent to distrust a law it can read.

Read the arrow first, then the \`reserves\` clause, then the rest.

## How to read an arrow

\`reads⟨A · B⟩ → writes⟨C⟩\` means: the agent may consume layers A and B, and may produce layer C.
The ladder runs \`intent ≺ C ≺ spec ≺ artifact\` from most abstract to least, where \`C\` is the
durative concept lattice — the design.

An act has a **domain** (the layer it consumes) and a **codomain** (the layer it produces):

- a DISPATCH produces a **spec** — the delegate's instructions are the layer being written;
- a WRITE to a source or config file produces an **artifact**;
- reading anything at all produces **nothing**, and is never a breach.

An act is **outside the arrow** when its codomain is not in the contract's \`writes\` set. That is the
whole test, and it is mechanical.

## What to BLOCK

- **A write whose codomain is \`artifact\` by a holder whose \`writes\` set excludes \`artifact\`.**
  The contract usually names this: \`descent\`. The path in the payload is the evidence.
- **A dispatch whose codomain is \`spec\` by a holder whose \`writes\` set excludes \`spec\`.** This is
  the skipped rung: a holder that writes only the design has handed a delegate a spec that no
  spec-writing role produced. The prompt is the evidence.
- **A dispatch whose prompt is the operator's literal words rather than a piece the agent cut.** The
  contract that convicts this is the same clause: a dispatch is a spec, and transcription is not
  authorship. Evidence is the prompt reading as relayed instructions rather than a bounded piece
  with its own acceptance.

## What to PASS — and these are the majority

- **Any read.** Reading is outside the test by construction. Even where a contract calls
  artifact-reading a descent, that is a standing discipline, not a mid-turn refusal.
- **A dispatch to a role the contract explicitly routes to.** Contracts name their delegations
  (\`⟨C → spec⟩ ↦ plan\`, \`⟨artifact → C⟩ ↦ assay\`). Handing work to a named delegate is the arrow
  WORKING.
- **Any act the \`reserves\` clause names**, whatever it is.
- **A write by a holder whose \`writes\` set includes \`artifact\`.** Most agents in most corpora
  build. Do not read a contract's other clauses as narrowing an arrow that plainly permits the act.
- **Anything you are unsure about.** Fail toward PASS. A missed breach costs one wrong act; a
  fabricated block costs the agent's trust in a law it can read for itself, and it wedges work.

## Output

Emit **only** this block, nothing before or after:

\`\`\`
VERDICT: BLOCK|PASS
REASON: <one sentence naming the clause of the contract the act falls outside, and the codomain that put it there>
SPAN: <a short literal substring copied from the payload that shows the act — omit this line entirely when the verdict is PASS>
\`\`\`

\`SPAN\` is checked against the payload character for character. If you cannot copy a literal span out
of the payload, you do not have the evidence for a BLOCK, and the verdict is PASS.
`,
    },
  ],
};
