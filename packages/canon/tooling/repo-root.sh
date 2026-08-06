#!/usr/bin/env sh
# WHERE IS THE REPO ROOT — the shell half. See `repo-root.ts` for the full argument.
#
# SOURCE IT, DO NOT EXEC IT:
#     . "$(dirname "$0")/repo-root.sh"      # then: root=$(repo_root "$PWD")
#
# TWO HOMES FOR ONE LAW, AND THAT IS STATED RATHER THAN HIDDEN. A shell script cannot
# import the TypeScript, so the strategy order — ask git, then walk up for the marker,
# then refuse — is written twice. What is NOT duplicated is the marker's name: both read
# `pnpm-workspace.yaml`, and if that ever changes the two must move together. There is no
# mechanism holding them in agreement; this comment is the only thing that does.
#
# WHY NOT A POSITIONAL FALLBACK. `cd "$(dirname "$0")/../../.."` is the defect this file
# replaces: it encodes the CALLING script's location in a hop count, so relocating that
# script silently repoints it, and the failure surfaces as a missing file rather than a
# wrong directory. Five sites broke that way in one refactor and two of them failed
# SILENTLY, because the empty result they produced was not an error to anything reading it.

ROOT_MARKER='pnpm-workspace.yaml'

# repo_root <dir> — prints the root, or nothing (status 1) when neither strategy answers.
repo_root() {
	_rr_from="${1:?repo_root needs a starting directory}"

	# 1. ASK GIT. Authoritative, and cannot be miscounted.
	if _rr_git=$(git -C "$_rr_from" rev-parse --show-toplevel 2>/dev/null) &&
		[ -n "$_rr_git" ]; then
		printf '%s' "$_rr_git"
		return 0
	fi

	# 2. WALK UP FOR THE MARKER. Required, not decorative: a published tarball has no
	#    `.git`, and every fixture this corpus builds in `mktemp -d` starts without one.
	_rr_dir=$(CDPATH= cd -- "$_rr_from" 2>/dev/null && pwd) || return 1
	while [ -n "$_rr_dir" ]; do
		if [ -f "$_rr_dir/$ROOT_MARKER" ]; then
			printf '%s' "$_rr_dir"
			return 0
		fi
		[ "$_rr_dir" = "/" ] && break
		_rr_dir=$(dirname "$_rr_dir")
	done

	# 3. THERE IS NO THIRD STRATEGY. Refusing beats guessing — a wrong root that looks
	#    like a right one is precisely what produced the silent failures.
	return 1
}

# require_repo_root <dir> — repo_root, but dies with a message naming <dir>.
require_repo_root() {
	_rr_out=$(repo_root "${1:?require_repo_root needs a starting directory}") || {
		printf 'no repo root above %s: not a git work tree, and no %s walking up\n' \
			"$1" "$ROOT_MARKER" >&2
		exit 2
	}
	printf '%s' "$_rr_out"
}
