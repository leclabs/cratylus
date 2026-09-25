#!/usr/bin/env sh
# purview-guardrail — a PreToolUse hook that STRUCTURALLY REFUSES, before the call
# fires, a mid-turn act that falls outside the arrow the agent's OWN role contract
# declares.
#
# THE LAW IS NOT IN THIS FILE AND NOT IN THE RUBRIC. It is the `## Role` section of
# the persona's deployed Target, read at run time and handed to the judge as the
# contract to score against. No role text, no agent name and no behavioural opinion is
# hard-coded anywhere in this gate.
#
# SAFETY MODEL (mirrors both siblings):
#   - SCOPE-ENROLLED by PRESENCE. A persona carrying a stance manifest is judged; every
#     other scope is silent. No allowlist — the projection that places a persona enrolls
#     it, and nothing central lists anybody.
#   - CONTRACT-ENROLLED, one step further. A persona whose Target carries no `## Role`
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
JUDGE_DIR="${STANCE_GUARD_DIR:-$HOOKS_ROOT/stance-guardrail}"
NEUTRAL_ROOT="$(dirname -- "$(dirname -- "$HOOKS_ROOT")")/.agents"
RUBRIC="${PURVIEW_RUBRIC:-$NEUTRAL_ROOT/purview-guardrail/purview-judge-prompt.md}"
JUDGE_CMD="${STANCE_JUDGE_CMD:-sh $JUDGE_DIR/stance-judge.sh}"
LOG="${PURVIEW_GUARD_LOG:-$SELF_DIR/misses.log}"

trap 'exit 0' EXIT

allow() { exit 0; }
note() { printf '%s\n' "$1" >> "$LOG" 2>/dev/null || true; }

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
# A persona scope is `<root>/agent/personas/<name>` and the Target it was projected
# from is `<root>/agent/agents/<name>.md` — two levels out and back down, the same
# shape of derivation the judge path above uses. Overridable for test rigs.
AGENT_ROOT="$(dirname -- "$(dirname -- "$stance_scope")")"
AGENT_MD="${PURVIEW_AGENT_MD:-$AGENT_ROOT/agents/$agent_type.md}"
[ -f "$AGENT_MD" ] || allow
contract="$(awk '/^## Role$/{f=1;next} /^## /{f=0} f' "$AGENT_MD" 2>/dev/null || true)"
# A contract that is a BARE TOKEN states no arrow, so there is nothing to be outside
# of. Only a multi-line contract is scoreable, and saying so here is what keeps the
# gate from inventing a law for a corpus that has not declared one.
[ "$(printf '%s\n' "$contract" | grep -c '[^[:space:]]')" -ge 2 ] || allow

# --- extract the judged payload, branched by act ---------------------------------------------
tool_name="$(printf '%s' "$input" | jq -r '.tool_name // empty' 2>/dev/null || true)"
[ -n "$tool_name" ] || allow

case "$tool_name" in
	Agent|SendMessage|Task)
		body="$(printf '%s' "$input" | jq -r '.tool_input.prompt // .tool_input.message // .tool_input.description // ""' 2>/dev/null || true)"
		target="$(printf '%s' "$input" | jq -r '.tool_input.subagent_type // .tool_input.agent // .tool_input.name // ""' 2>/dev/null || true)"
		act="DISPATCH to \`${target:-unnamed}\` (codomain: the spec this delegate will build from)"
		;;
	Write|Edit|MultiEdit|NotebookEdit)
		body="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.path // .tool_input.notebook_path // ""' 2>/dev/null || true)"
		act="WRITE to the substrate (codomain: artifact)"
		;;
	*)
		# DEFENCE IN DEPTH. `tool.use.pre` fires on every tool on a harness with no
		# subject selector; these two classes are the only acts this contract can
		# convict, and a read is deliberately not one of them.
		allow ;;
esac

[ -n "${body:-}" ] || allow

payload="=== THE HOLDER'S DECLARED CONTRACT (agent: $agent_type) ===
$contract
=== THE ACT ABOUT TO FIRE ===
$act
$body"

# --- loop-safety: never deny an identical tool_input twice ----------------------------------
session_id="$(printf '%s' "$input" | jq -r '.session_id // "nosession"' 2>/dev/null || echo nosession)"
sig="$(printf '%s' "$input" | jq -c '.tool_input' 2>/dev/null | cksum | cut -d' ' -f1 2>/dev/null || echo 0)"
seen="${TMPDIR:-/tmp}/.purview-pre-$session_id-$sig"
[ -f "$seen" ] && allow

# --- judge (SHARED backend, OWN rubric) -----------------------------------------------------
if [ -n "${PURVIEW_EMIT_PAYLOAD:-}" ]; then
	jq -cn --arg r "$RUBRIC" --arg p "$payload" '{rubric:$r, payload:$p}'
	exit 0
fi
if [ -n "${PURVIEW_VERDICT_FILE:-}" ]; then
	verdict="$(cat "${PURVIEW_VERDICT_FILE}" 2>/dev/null || true)"
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

decision="$(printf '%s\n' "$verdict" | sed -n 's/^VERDICT:[[:space:]]*//p' | head -1)"
[ "$decision" = "BLOCK" ] || allow

reason="$(printf '%s\n' "$verdict" | sed -n 's/^REASON:[[:space:]]*//p' | head -1)"
[ -n "$reason" ] || reason="This act falls outside the arrow your role contract declares."

# --- EVIDENCE CHECK: the cited span must be literally in the payload -------------------------
# A block naming a span the payload does not contain is a hallucinated block, and a
# fabricated refusal is not a lesser error than a missed one. Same rule, same reason as
# the turn-end sibling.
cited="$(printf '%s\n' "$verdict" | sed -n 's/^SPAN:[[:space:]]*//p' | head -1)"
if [ -n "$cited" ]; then
	printf '%s' "$payload" | grep -qF -- "$cited" || {
		note "$(date -u +%Y-%m-%dT%H:%M:%SZ) evidence-fail tool=$tool_name agent=$agent_type span=$cited"
		allow
	}
fi

: > "$seen" 2>/dev/null || true

feedback="PURVIEW GUARDRAIL — denied this $tool_name call: it falls outside the arrow your own \
role contract declares. $reason  Delegation is a THEOREM of that arrow, not an option: an act whose \
domain or codomain lies outside it goes to the role that owns it — a decomposition to a planner, a \
build to an implementer, an artifact reading to an assayer. Hand it over and carry on with what the \
contract reserves. (Legitimate and NOT blocked here: reading anything, dispatching to a planner or an \
assayer, and performing any act the contract's own \`reserves\` clause names.)"

jq -cn --arg r "$feedback" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
exit 0
