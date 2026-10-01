#!/usr/bin/env sh
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
	printf 'line-worktree: %s\n' "$*" >&2
	exit 1
}

# ── WHAT PROJECTION TOLD US ────────────────────────────────────────────────────
RUNTIME=cratylus
HARNESS=claude
HARNESS_SETTINGS=settings.json

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
first="$(printf '%s\n' "$answer" | sed -n 1p)"

case "$first" in
'no plan '*)
	# NO PLAN BOUND: make the worktree as the harness would have.
	base="fresh"
	for f in \
		"$top/.$HARNESS/${HARNESS_SETTINGS%.json}.local.json" \
		"$top/.$HARNESS/$HARNESS_SETTINGS" \
		"${HOME:-/nonexistent}/.$HARNESS/$HARNESS_SETTINGS"; do
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
	commit="$(printf '%s\n' "$first" | sed -n 's/^plan .* at \([0-9a-f][0-9a-f]*\): .*$/\1/p')"
	[ -n "$commit" ] || die "$RUNTIME plan show names no commit for the bound plan's line: $first"
	start="$(git -C "$top" rev-parse --verify --quiet "$commit^{commit}")" || die "the bound plan's line stands at '$commit', which this repository does not resolve"
	;;
*)
	die "$RUNTIME plan show answered in a shape this does not know, so whether a plan is bound cannot be known: $first"
	;;
esac

# ── THE WORKTREE ───────────────────────────────────────────────────────────────
mkdir -p "${path%/*}" || die "cannot create the directory for '$path'"
git -C "$top" worktree add -q -b "$branch" "$path" "$start" >&2 || die "git could not create the worktree '$path' on branch '$branch' from '$start'"

printf '%s\n' "$path"
