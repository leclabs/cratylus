import type { HookCell } from '../manifest.js';

// line-worktree — the creation of the implementer's worktree, cut from the tip of the
// bound plan's line.
//
// THE GAP IT CLOSES. The implementer declares that it runs in a worktree of its own
// (`Agent.isolation`), and Claude Code honours that by making one. But Claude Code cuts
// that worktree from origin's default branch, or from the HEAD of the session that
// dispatched it — and the dispatcher runs in the main checkout on main. So the
// implementer started in a worktree that was isolated and was nowhere near the plan's
// line: its first commit ran from main, and moving it onto the line was left to
// whatever care the agent had. A rule that depends on the agent remembering to follow it
// is the rule that was broken in the first place. The agent definition has no base ref
// to give, and a worktree's base is not the agent's to choose: it is the creation's.
//
// THE HOOK PERFORMS THE CREATION. `WorktreeCreate` is not a notification. Claude Code
// hands the hook the new worktree's `name`, takes the absolute path the hook prints, and
// uses that directory as the agent's working copy; a hook that prints none fails the
// creation. So the cell is where the worktree's base can be decided, and this is the one
// place it is decided: for the implementer's worktree, while a plan is bound, the
// worktree is cut on a new branch from the tip of that plan's line, and the agent's
// first commit already runs from the line.
//
// IT ACTS FOR THE IMPLEMENTER'S WORKTREE AND FOR NO OTHER. The plan places a unit's
// worktree off its plan's line and says nothing about any other worktree, yet the hook is
// registered on the host and Claude Code fires `WorktreeCreate` for every worktree it
// makes there: a `claude --worktree` session, a background session isolated in a worktree
// (`bridge-<id>`), and every subagent that declares `isolation: worktree`. Cutting an
// architect's background session from a plan's line, or failing a session's creation
// because `cratylus` is not installed, is the cell reaching past what the plan placed.
// The input names no subagent — its `agent_type` is the dispatcher's — so the worker tells
// the implementer's worktree by the name Claude Code gives a subagent's: `agent-a` and
// 7 or 16 hex digits. In this corpus only the implementer declares `isolation: worktree`,
// so that name is the implementer's; a worktree whose name is not that one is not the
// implementer's, and where the worker cannot tell it passes through.
//
// WHICH PLAN, AND WHERE ITS LINE IS, IS THE RUNTIME'S TO SAY. The cell does not know
// that plans exist, what a line is called or where it lives: it asks the host's
// `cratylus plan show`, the way `deploy-drift-notice` asks `deploy --check`, and takes
// from the answer the one fact it needs — the commit the bound plan's line stands at. It
// spells no plan name, no branch and no path the runtime does not give it, so a rename of
// the line's branch, or of the plan lifecycle's states, leaves it untouched.
//
// EVERYTHING ELSE IS LEFT AS THE HARNESS WOULD DO IT. For every worktree that is not the
// implementer's, and for the implementer's when there is no line to cut from — no plan
// bound, `cratylus` missing, a `plan show` answer the worker does not recognise
// (`with nothing committed yet`) — the worker creates what Claude Code's own creation
// would: a worktree at `<project>/.<harness>/worktrees/<name>` on a branch
// `worktree-<name>`, cut from origin's default branch, or from the session's HEAD where
// the host's `worktree.baseRef` is `head` or where there is no origin, and prints its
// path. The hook has replaced that creation for every worktree on the host, so it owes
// the same behaviour for every one it is not cutting from a line, and it never fails one
// for want of a line. It says on stderr when the implementer's was made without one.
//
// `jq` IS NOT WHAT THE LINE NEEDS. It reads the request and the host's `baseRef`, and
// where it is not installed the worker reads the one flat string each holds with `sed`;
// finding the line's tip asks the runtime and uses no `jq`, so a host without `jq` still
// has the implementer's worktree cut from the line.
//
// WHAT IT STILL REFUSES is a creation Claude Code's would refuse as well: a request that
// names no readable `cwd` or an unusable `name`, a `cwd` inside no repository, a path that
// is taken, a `git worktree add` that fails. There is no creation to pass through to, and
// answering with the checkout the session is already in is a worktree that isolates
// nothing and reads as one. That failure is a message on stderr, a non-zero exit, no path
// on stdout and no worktree on disk.
//
// REMOVAL IS NOT BOUND, AND THAT IS THE CHOICE. With a `WorktreeCreate` hook and no
// `WorktreeRemove` hook Claude Code keeps the worktree when the agent is done and says so.
// The worktree holds the unit's commits, and a removal hook would have to decide whether
// they are safe to discard; the unit's work is landed by recording its commit, and the
// worktree outliving the agent is what keeps that commit reachable until it is. A
// removal binding that deleted exactly what this cell created would be a second
// mechanism owning a judgement the operator's `git worktree remove` already makes.
//
// THE WORKER SPEAKS NOTHING. Its stdout is the path and nothing else — Claude Code takes
// the whole of it as the path — so everything it has to say goes to stderr.
//
// `workers[].content` is the TEMPLATE the committed worker at `targetPath` regenerates
// from, byte-locked by `test/hook-rule-boundary.test.ts`. EDIT THE CELL AND REGENERATE
// (`pnpm canon:project:targets`) — never the committed `.sh` alone.

export const lineWorktree: HookCell = {
  id: 'line-worktree',
  residue:
    'creation-moment ↦ WorktreeCreate ⟨hook PERFORMS the creation ¬ observes it · prints path ∧ nothing else⟩ · acts ↾ implementer-copy ⟨name ≜ agent-a⟨hex⁷ ∨ hex¹⁶⟩ ¬ agent_type ∵ input names the dispatcher⟩ ∧ plan bound ⇒ cut(copy, tip(plan-integration)) ⟨new branch ∉ ⟨main · integration⟩ · tip ↦ runtime-answer ¬ spelled · ∄ plan-name ∧ ∄ branch-name ∧ ∄ path ∉ runtime⟩ · ∀ other copy ∨ ∀ failure ⟨∄ plan bound · runtime missing · answer unknown⟩ ⇒ create as host would ⟨origin-default ∨ HEAD ↾ baseRef · <project>/.<harness>/worktrees/<name> · ¬ fail⟩ · creation impossible ⟨¬ cwd · ¬ name · ¬ repository · path taken · git refuses⟩ ⇒ FAIL LOUD ⟨stderr ∧ non-zero ∧ ∅ path ∧ ∅ copy⟩ ⟨¬ fall back to main checkout ∵ isolates nothing ∧ reads as isolation⟩ · removal ≜ kept ⟨∄ WorktreeRemove ∵ copy holds the unit’s commits⟩ · ∄ speech',
  substrate: 'harness',
  events: ['worktree.create'],
  entry: 'line-worktree.sh',
  timeout: 60,
  refs: [],
  workers: [
    {
      filename: 'line-worktree.sh',
      targetPath: 'packages/canon/targets/guardrail/line-worktree.sh',
      executable: true,
      content: `#!/usr/bin/env sh
# line-worktree — creates the worktree an agent runs in, and prints its path.
#
# This hook REPLACES the harness's own worktree creation for every worktree the harness
# makes on the host: the harness gives it the worktree's name, takes the one path it
# prints on stdout, and uses that directory as the agent's working copy. A hook that
# prints none fails the creation.
#
# CONTRACT:
#   - THE IMPLEMENTER'S WORKTREE, WITH A PLAN BOUND: the worktree is cut, on a new
#                   branch, from the commit the bound plan's line stands at, so the
#                   agent's first commit runs from it. The implementer's is the one the
#                   harness names agent-a<7 or 16 hex digits>; the input names no
#                   subagent, so the name is what there is to tell it by.
#   - EVERY OTHER WORKTREE, AND THE IMPLEMENTER'S WHEN THERE IS NO LINE TO CUT FROM
#                   (no plan bound, cratylus missing, a plan show answer this does not
#                   know): the worktree is made as the harness would have made it,
#                   at <project>/.<harness>/worktrees/<name> from the origin's default
#                   branch, or from HEAD where the host's worktree.baseRef is "head", or
#                   where there is no origin. This never fails one for want of a line.
#   - NEVER THE MAIN CHECKOUT. A worktree the harness's own creation could not make
#                   either (no usable cwd or name, no repository, a path that is taken,
#                   a git refusal) is a failure: a message on stderr, a non-zero exit,
#                   no path on stdout, nothing on disk.
#   - STDOUT IS THE PATH AND NOTHING ELSE. Every other word goes to stderr.
#   - NOT REMOVED. No removal hook is bound, so the harness keeps the worktree when the
#                   agent is done: it holds the unit's commits until they are landed.
#
# WHICH PLAN IS BOUND, AND WHERE ITS LINE STANDS, IS THE RUNTIME'S ANSWER. This names no
# plan, no branch and no path the runtime does not give it.
#
# INPUT  : WorktreeCreate hook JSON on stdin (cwd, name, session_id, ...).
# OUTPUT : the new worktree's absolute path, on stdout, and nothing else.

set -eu

die() {
	printf 'line-worktree: %s\\n' "$*" >&2
	exit 1
}

note() {
	printf 'line-worktree: %s\\n' "$*" >&2
}

# ── WHAT PROJECTION TOLD US ────────────────────────────────────────────────────
RUNTIME={{fact:runtime-bin}}
HARNESS={{fact:harness-name}}
HARNESS_SETTINGS={{fact:harness-hooks-file}}

command -v git >/dev/null 2>&1 || die "git is required to create a worktree, and is not installed"

have_jq=no
if command -v jq >/dev/null 2>&1; then
	have_jq=yes
fi

# jstr KEY — the string KEY holds in the JSON on stdin, empty where it holds none. jq
# reads it where jq is installed; without jq, the one flat string a request or a settings
# file states plainly (a value with an escape in it is not read, and reads as empty).
jstr() {
	if [ "$have_jq" = yes ]; then
		jq -r --arg k "$1" '[.. | objects | select(has($k)) | .[$k] | strings] | first // ""'
	else
		sed -n "s/.*\\"$1\\"[[:space:]]*:[[:space:]]*\\"\\([^\\"\\\\]*\\)\\".*/\\1/p" | sed -n 1p
	fi
}

# ── THE REQUEST ────────────────────────────────────────────────────────────────
input="$(cat)"
cwd="$(printf '%s' "$input" | jstr cwd 2>/dev/null)" || die "the worktree request is not JSON"
name="$(printf '%s' "$input" | jstr name 2>/dev/null)" || die "the worktree request is not JSON"

[ -n "$cwd" ] && [ -d "$cwd" ] || die "the worktree request names no existing cwd (got '$cwd')"
# THE NAME BECOMES A PATH AND A BRANCH, so it is examined before it is used: plain
# path segments only, none empty, none leading with a dash, none climbing out.
case "$name" in
'' | -* | /* | */ | *//* | *[!A-Za-z0-9._/-]* | *..*)
	die "refusing the worktree name '$name': it must be plain path segments, none empty or climbing out"
	;;
esac

top="$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null)" || die "'$cwd' is not inside a git repository"
path="$top/.$HARNESS/worktrees/$name"
branch="worktree-$name"
[ ! -e "$path" ] || die "'$path' already exists"

# ── IS IT THE IMPLEMENTER'S? the name the harness gives a subagent's worktree ─────
h='[0-9a-f]'
implementer=no
case "$name" in
agent-a$h$h$h$h$h$h$h | agent-a$h$h$h$h$h$h$h$h$h$h$h$h$h$h$h$h) implementer=yes ;;
esac

# line_tip — the commit the bound plan's line stands at, or nothing and a non-zero status
# where the runtime cannot say: it is not installed, it fails, no plan is bound, or its
# answer is in a shape this does not know.
line_tip() {
	command -v "$RUNTIME" >/dev/null 2>&1 || return 1
	answer="$(cd "$top" && "$RUNTIME" plan show 2>/dev/null)" || return 1
	first="$(printf '%s\\n' "$answer" | sed -n 1p)"
	case "$first" in
	'plan '*' at '*:*)
		# "plan <name> (<state>) at <commit>: <counts>". More than one plan reads "plans".
		commit="$(printf '%s\\n' "$first" | sed -n 's/^plan .* at \\([0-9a-f][0-9a-f]*\\): .*$/\\1/p')"
		[ -n "$commit" ] || return 1
		git -C "$top" rev-parse --verify --quiet "$commit^{commit}"
		;;
	*) return 1 ;;
	esac
}

# harness_start — what the harness cuts a worktree from: origin's default branch, where
# there is one, or HEAD where the host's worktree.baseRef is "head".
harness_start() {
	base="fresh"
	for f in \\
		"$top/.$HARNESS/\${HARNESS_SETTINGS%.json}.local.json" \\
		"$top/.$HARNESS/$HARNESS_SETTINGS" \\
		"\${HOME:-/nonexistent}/.$HARNESS/$HARNESS_SETTINGS"; do
		[ -f "$f" ] || continue
		set_to="$(jstr baseRef <"$f" 2>/dev/null || true)"
		if [ -n "$set_to" ]; then
			base="$set_to"
			break
		fi
	done
	if [ "$base" != "head" ]; then
		if remote="$(git -C "$top" symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null)"; then
			printf '%s\\n' "$remote"
			return 0
		fi
	fi
	printf 'HEAD\\n'
}

# ── WHERE FROM? the line, for the implementer's, if the runtime says there is one ──
start=""
if [ "$implementer" = yes ]; then
	if start="$(line_tip)" && [ -n "$start" ]; then
		:
	else
		start=""
		note "no plan's line to cut the implementer's worktree from: it is made as the harness would make it"
	fi
fi
if [ -z "$start" ]; then
	start="$(harness_start)"
fi

# ── THE WORKTREE ───────────────────────────────────────────────────────────────
mkdir -p "\${path%/*}" || die "cannot create the directory for '$path'"
git -C "$top" worktree add -q -b "$branch" "$path" "$start" >&2 || die "git could not create the worktree '$path' on branch '$branch' from '$start'"

printf '%s\\n' "$path"
`,
    },
  ],
};
