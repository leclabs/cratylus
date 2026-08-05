import type { HookCell } from '../manifest.js';

// praxis-continuity — the repo-level post-commit reminder. A scope-activated source
// cell on the GIT substrate: `vcs.commit.post` is an ordinary member of this
// corpus's `CANONICAL_EVENTS` carrying `substrate: 'git'`, so it is routed rather
// than refused — the `.husky/post-commit` dispatcher runs the committed worker
// directly and nothing reaches `settings.json`. Its `workers[].content` are the
// byte-anchors the committed `src/toolkit/continuity/` workers regenerate from
// (byte-locked).
//
// THE REVIEW THIS CELL WAS FLAGGED FOR IS CLOSED. The note read "not in FORGE's
// `CanonicalEvent` taxonomy" — stale by one package before it was stale by two, and
// it asked for either an addition to the taxonomy or a named exception. Neither was
// owed: the event was never exceptional, only unliterable, because the taxonomy was
// a closed union in `schema` that a git moment had no member to be. The vocabulary
// now lives where signification lives, `EventName` is open, and this cell names its
// moment exactly as a harness cell names its own.

export const praxisContinuity: HookCell = {
  id: 'praxis-continuity',
  residue:
    'post-commit detector ⟨task-file crosses state-folder ⇒ plan-mirror stale⟩ · nudge re-mirror · ¬edit · opt-in ↾ clone · exit-0 ⟨reminder ¬fail-commit⟩',
  substrate: 'git',
  events: ['vcs.commit.post'],
  // git substrate: the entry is still named, never spelled as a path. Which
  // directory git invokes it from is git's projection to make, not this cell's.
  entry: 'praxis-advance-nudge.sh',
  refs: [],
  workers: [
    {
      filename: 'continuity-hook.sh',
      targetPath: 'packages/canon/src/toolkit/continuity/continuity-hook.sh',
      executable: true,
      content: `#!/usr/bin/env sh
# continuity-hook — opt this repo in/out of the post-commit continuity ritual.
#
# The opt-in flag is a per-repo git config (agentfactory.continuity) living in .git/config,
# which is NOT checked in — so opting in is local to your clone and a fresh clone is
# opted out by default. The .husky/post-commit dispatcher reads this flag.
#
#   pnpm run continuity:install     → set agentfactory.continuity true
#   pnpm run continuity:uninstall   → unset (back to default off)
#   pnpm run continuity:status      → show current state
#
# Usage:  continuity-hook.sh {install|uninstall|status}

set -e

cmd="\${1:-status}"

case "$cmd" in
install | on | true)
	git config --bool agentfactory.continuity true
	printf 'continuity: ENABLED for this repo (agentfactory.continuity=true).\\n'
	printf '  Commits touching plans/**/{pending,ready,active,completed}/ now print a /praxis re-mirror reminder.\\n'
	;;
uninstall | off | false)
	git config --unset agentfactory.continuity 2>/dev/null || true
	printf 'continuity: DISABLED for this repo (agentfactory.continuity unset → default off).\\n'
	;;
status)
	state=$(git config --bool agentfactory.continuity 2>/dev/null || echo "false")
	printf 'continuity: %s (agentfactory.continuity=%s)\\n' \\
		"$([ "$state" = "true" ] && echo ENABLED || echo "disabled (default)")" "$state"
	;;
*)
	printf 'usage: continuity-hook.sh {install|uninstall|status}\\n' >&2
	exit 2
	;;
esac
`,
    },
    {
      filename: 'praxis-advance-nudge.sh',
      targetPath:
        'packages/canon/src/toolkit/continuity/praxis-advance-nudge.sh',
      executable: true,
      content: `#!/usr/bin/env sh
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
# OPT-IN: this runs only when \`git config --bool agentfactory.continuity\` is true. A fresh
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
touched=$(printf '%s\\n' "$changed" \\
	| grep -E '^plans/.*/(pending|ready|active|completed)/' || true)

[ -z "$touched" ] && exit 0

# Which plan dirs were touched (dedup to the plan root: plans/<plan>/).
plans=$(printf '%s\\n' "$touched" \\
	| sed -E 's#^(plans/[^/]+)/.*#\\1#' | sort -u)

printf '\\n'
printf 'continuity · praxis-advance — plan state changed in this commit:\\n'
printf '%s\\n' "$plans" | sed 's/^/    /'
printf '\\n'
printf '  PLAN.md mirrors the task-folder state; it may now be stale.\\n'
printf '  Re-mirror with /praxis (advance the task, re-sync PLAN.md), then amend or follow-up commit.\\n'
printf '  (This is a reminder only — nothing was edited. Disable: pnpm run continuity:uninstall)\\n'
printf '\\n'

exit 0
`,
    },
  ],
};
