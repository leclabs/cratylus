#!/usr/bin/env sh
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
#                   (no plan bound, cratylus or jq missing, a plan show answer this does
#                   not know): the worktree is made as the harness would have made it,
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
	printf 'line-worktree: %s\n' "$*" >&2
	exit 1
}

note() {
	printf 'line-worktree: %s\n' "$*" >&2
}

# ── WHAT PROJECTION TOLD US ────────────────────────────────────────────────────
RUNTIME=cratylus
HARNESS=claude
HARNESS_SETTINGS=settings.json

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
		sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\([^\"\\]*\)\".*/\1/p" | sed -n 1p
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
	first="$(printf '%s\n' "$answer" | sed -n 1p)"
	case "$first" in
	'plan '*' at '*:*)
		# "plan <name> (<state>) at <commit>: <counts>". More than one plan reads "plans".
		commit="$(printf '%s\n' "$first" | sed -n 's/^plan .* at \([0-9a-f][0-9a-f]*\): .*$/\1/p')"
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
	for f in \
		"$top/.$HARNESS/${HARNESS_SETTINGS%.json}.local.json" \
		"$top/.$HARNESS/$HARNESS_SETTINGS" \
		"${HOME:-/nonexistent}/.$HARNESS/$HARNESS_SETTINGS"; do
		[ -f "$f" ] || continue
		set_to="$(jstr baseRef <"$f" 2>/dev/null || true)"
		if [ -n "$set_to" ]; then
			base="$set_to"
			break
		fi
	done
	if [ "$base" != "head" ]; then
		if remote="$(git -C "$top" symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null)"; then
			printf '%s\n' "$remote"
			return 0
		fi
	fi
	printf 'HEAD\n'
}

# ── WHERE FROM? the line, for the implementer's, if the runtime says there is one ──
start=""
if [ "$implementer" = yes ]; then
	if [ "$have_jq" = no ]; then
		note "jq is not installed: the implementer's worktree is made as the harness would make it, not from a plan's line"
	elif start="$(line_tip)" && [ -n "$start" ]; then
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
mkdir -p "${path%/*}" || die "cannot create the directory for '$path'"
git -C "$top" worktree add -q -b "$branch" "$path" "$start" >&2 || die "git could not create the worktree '$path' on branch '$branch' from '$start'"

printf '%s\n' "$path"
