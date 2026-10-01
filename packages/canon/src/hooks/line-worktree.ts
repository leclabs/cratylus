import type { HookCell } from '../manifest.js';

// line-worktree — the creation of the worktree an agent runs in, cut from the tip of the
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
// place it is decided: while a plan is bound, the worktree is cut on a new branch from
// the tip of that plan's line, and the agent's first commit already runs from the line.
//
// WHICH PLAN, AND WHERE ITS LINE IS, IS THE RUNTIME'S TO SAY. The cell does not know
// that plans exist, what a line is called or where it lives: it asks the host's
// `cratylus plan show`, the way `deploy-drift-notice` asks `deploy --check`, and takes
// from the answer the one fact it needs — the commit the bound plan's line stands at. It
// spells no plan name, no branch and no path the runtime does not give it, so a rename of
// the line's branch, or of the plan lifecycle's states, leaves it untouched.
//
// WITH NO PLAN BOUND the hook does what Claude Code's own creation does, because it has
// replaced that creation for every worktree on the host and owes the same behaviour for
// every one it is not cutting from a line: a worktree at `<project>/.<harness>/worktrees/
// <name>` on a branch `worktree-<name>`, cut from origin's default branch, or from the
// session's HEAD where the host's `worktree.baseRef` is `head`. A host with no origin
// gets HEAD, since there is no default branch to cut from.
//
// IT NEVER FALLS BACK TO THE MAIN CHECKOUT. A creation it cannot make fails loudly — a
// message on stderr, a non-zero exit, no path on stdout, no worktree on disk — and
// Claude Code then fails to start the agent. The alternative, answering with the
// checkout the session is already in, is a worktree that isolates nothing and reads as
// one, which is the defect above in a quieter form. So the runtime being unreachable, or
// answering in a shape the cell does not know, is a failure and not "no plan bound": the
// cell cannot tell the two apart, and guessing the safe one cuts a unit from main.
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
    'creation-moment ↦ WorktreeCreate ⟨hook PERFORMS the creation ¬ observes it · prints path ∧ nothing else⟩ · plan bound ⇒ cut(copy, tip(plan-integration)) ⟨new branch ∉ ⟨main · integration⟩ · tip ↦ runtime-answer ¬ spelled · ∄ plan-name ∧ ∄ branch-name ∧ ∄ path ∉ runtime⟩ · ¬plan bound ⇒ create as host would ⟨origin-default ∨ HEAD ↾ baseRef · <project>/.<harness>/worktrees/<name>⟩ · runtime unreachable ∨ answer unknown ∨ creation impossible ⇒ FAIL LOUD ⟨stderr ∧ non-zero ∧ ∅ path ∧ ∅ copy⟩ ⟨¬ fall back to main checkout ∵ isolates nothing ∧ reads as isolation⟩ · removal ≜ kept ⟨∄ WorktreeRemove ∵ copy holds the unit’s commits⟩ · ∄ speech',
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
# This hook REPLACES the harness's own worktree creation: the harness gives it the
# worktree's name, takes the one path it prints on stdout, and uses that directory as
# the agent's working copy. A hook that prints none fails the creation.
#
# CONTRACT:
#   - PLAN BOUND  : the worktree is cut, on a new branch, from the commit the bound
#                   plan's line stands at, so the agent's first commit runs from it.
#   - NO PLAN     : the worktree is made as the harness would have made it — from the
#                   origin's default branch, or from HEAD where the host's
#                   worktree.baseRef is "head", or where there is no origin.
#   - NEVER THE MAIN CHECKOUT. A worktree this cannot make is a failure: a message on
#                   stderr, a non-zero exit, no path on stdout, nothing on disk. The
#                   runtime being unreachable or answering in a shape this does not
#                   know is such a failure, not "no plan bound" — the two cannot be
#                   told apart, and guessing the second cuts a unit from main.
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

# ── WHAT PROJECTION TOLD US ────────────────────────────────────────────────────
RUNTIME={{fact:runtime-bin}}
HARNESS={{fact:harness-name}}
HARNESS_SETTINGS={{fact:harness-hooks-file}}

command -v jq >/dev/null 2>&1 || die "jq is required to read the worktree request, and is not installed"
command -v git >/dev/null 2>&1 || die "git is required to create a worktree, and is not installed"

# ── THE REQUEST ────────────────────────────────────────────────────────────────
input="$(cat)"
cwd="$(printf '%s' "$input" | jq -r '.cwd // ""' 2>/dev/null)" || die "the worktree request is not JSON"
name="$(printf '%s' "$input" | jq -r '.name // ""' 2>/dev/null)" || die "the worktree request is not JSON"

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

# ── WHERE FROM? the bound plan's line, if the runtime says there is one ─────────
command -v "$RUNTIME" >/dev/null 2>&1 || die "$RUNTIME is not installed, so whether a plan is bound cannot be known"
answer="$(cd "$top" && "$RUNTIME" plan show 2>/dev/null)" || die "$RUNTIME plan show failed, so whether a plan is bound cannot be known"
first="$(printf '%s\\n' "$answer" | sed -n 1p)"

case "$first" in
'no plan '*)
	# NO PLAN BOUND: make the worktree as the harness would have.
	base="fresh"
	for f in \\
		"$top/.$HARNESS/\${HARNESS_SETTINGS%.json}.local.json" \\
		"$top/.$HARNESS/$HARNESS_SETTINGS" \\
		"\${HOME:-/nonexistent}/.$HARNESS/$HARNESS_SETTINGS"; do
		[ -f "$f" ] || continue
		set_to="$(jq -r '.worktree.baseRef // ""' "$f" 2>/dev/null || true)"
		if [ -n "$set_to" ]; then
			base="$set_to"
			break
		fi
	done
	start="HEAD"
	if [ "$base" != "head" ]; then
		# The harness's own default: origin's default branch, where there is one.
		if remote="$(git -C "$top" symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null)"; then
			start="$remote"
		fi
	fi
	;;
'plan '*' at '*:*)
	# A PLAN IS BOUND: the commit its line stands at is in the first line, as
	# "plan <name> (<state>) at <commit>: <counts>". More than one plan reads "plans".
	commit="$(printf '%s\\n' "$first" | sed -n 's/^plan .* at \\([0-9a-f][0-9a-f]*\\): .*$/\\1/p')"
	[ -n "$commit" ] || die "$RUNTIME plan show names no commit for the bound plan's line: $first"
	start="$(git -C "$top" rev-parse --verify --quiet "$commit^{commit}")" || die "the bound plan's line stands at '$commit', which this repository does not resolve"
	;;
*)
	die "$RUNTIME plan show answered in a shape this does not know, so whether a plan is bound cannot be known: $first"
	;;
esac

# ── THE WORKTREE ───────────────────────────────────────────────────────────────
mkdir -p "\${path%/*}" || die "cannot create the directory for '$path'"
git -C "$top" worktree add -q -b "$branch" "$path" "$start" >&2 || die "git could not create the worktree '$path' on branch '$branch' from '$start'"

printf '%s\\n' "$path"
`,
    },
  ],
};
