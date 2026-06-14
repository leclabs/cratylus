#!/usr/bin/env sh
# continuity-hook — opt this repo in/out of the post-commit continuity ritual.
#
# The opt-in flag is a per-repo git config (polis.continuity) living in .git/config,
# which is NOT checked in — so opting in is local to your clone and a fresh clone is
# opted out by default. The .husky/post-commit dispatcher reads this flag.
#
#   pnpm run continuity:install     → set polis.continuity true
#   pnpm run continuity:uninstall   → unset (back to default off)
#   pnpm run continuity:status      → show current state
#
# Usage:  continuity-hook.sh {install|uninstall|status}

set -e

cmd="${1:-status}"

case "$cmd" in
install | on | true)
	git config --bool polis.continuity true
	printf 'continuity: ENABLED for this repo (polis.continuity=true).\n'
	printf '  Commits touching plans/**/{pending,ready,active,completed}/ now print a /praxis re-mirror reminder.\n'
	;;
uninstall | off | false)
	git config --unset polis.continuity 2>/dev/null || true
	printf 'continuity: DISABLED for this repo (polis.continuity unset → default off).\n'
	;;
status)
	state=$(git config --bool polis.continuity 2>/dev/null || echo "false")
	printf 'continuity: %s (polis.continuity=%s)\n' \
		"$([ "$state" = "true" ] && echo ENABLED || echo "disabled (default)")" "$state"
	;;
*)
	printf 'usage: continuity-hook.sh {install|uninstall|status}\n' >&2
	exit 2
	;;
esac
