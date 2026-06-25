#!/usr/bin/env sh
# praxis-advance-nudge — the repo-level continuity ritual, as a post-commit reminder.
#
# WHAT IT DOES (and deliberately does NOT do):
#   When a commit moves plan task-files between their state folders
#   (plans/**/{pending,ready,active,completed}/), PLAN.md — the hand-authored
#   mirror of that folder-state — may now be stale. This script DETECTS that and
#   PRINTS A REMINDER to re-mirror via /praxis. It never edits PLAN.md: the mirror
#   is hand-authored prose; auto-rewriting it is out of scope (a future "mechanized
#   PLAN.md generation" task). Detect → remind, never edit. (doc-mirrors-runtime-truth:
#   the folders are the truth; this only flags that the mirror lagged.)
#
# SCOPE: praxis-advance is the ONE repo-level continuity ritual. encode/dream are
#   per-AGENT sidecar-memory operations (~/.claude/agents/<name>/*) — not repo state,
#   a git hook can't meaningfully fire them — so they are out of this hook's scope.
#
# OPT-IN: this runs only when `git config --bool polis.continuity` is true. A fresh
#   clone is opted out, so default commit behavior is unchanged. See continuity-hook.sh.
#
# POSIX sh; no deps beyond git. Exits 0 always — a reminder must never fail a commit.

set -e

# The commit just made (post-commit runs after HEAD has advanced).
git rev-parse HEAD >/dev/null 2>&1 || exit 0

# Files changed by HEAD. For a root commit (no parent) diff against the root.
if git rev-parse --verify --quiet HEAD^ >/dev/null 2>&1; then
	changed=$(git diff-tree --no-commit-id --name-only -r HEAD 2>/dev/null) || exit 0
else
	changed=$(git diff-tree --no-commit-id --name-only -r --root HEAD 2>/dev/null) || exit 0
fi

# Did this commit touch any plan state-folder? Match the four canonical states under
# any plans/ subtree (works whether or not a tasks/ or {concern} wrapper is present).
touched=$(printf '%s\n' "$changed" \
	| grep -E '^plans/.*/(pending|ready|active|completed)/' || true)

[ -z "$touched" ] && exit 0

# Which plan dirs were touched (dedup to the plan root: plans/<plan>/).
plans=$(printf '%s\n' "$touched" \
	| sed -E 's#^(plans/[^/]+)/.*#\1#' | sort -u)

printf '\n'
printf 'continuity · praxis-advance — plan state changed in this commit:\n'
printf '%s\n' "$plans" | sed 's/^/    /'
printf '\n'
printf '  PLAN.md mirrors the task-folder state; it may now be stale.\n'
printf '  Re-mirror with /praxis (advance the task, re-sync PLAN.md), then amend or follow-up commit.\n'
printf '  (This is a reminder only — nothing was edited. Disable: pnpm run continuity:uninstall)\n'
printf '\n'

exit 0
