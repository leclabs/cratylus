#!/usr/bin/env sh
# stance-guard-toggle — opt this repo in/out of the stance guardrail (principal-stance P4).
#
# TWO things must be true for the guardrail to fire, and this toggle manages BOTH:
#   1. The opt-in flag  git config --bool polis.stanceGuard true   (in .git/config, never
#      checked in — a fresh clone is opted out by default).
#   2. A Stop + SubagentStop hook registered in .claude/settings.local.json (gitignored —
#      local to this clone, so installing here NEVER changes any other host's behavior).
# The worker re-checks the git-config flag at runtime, so `uninstall` (which clears the flag)
# disables it even if the settings hook entry lingers.
#
# Usage:  stance-guard-toggle.sh {install|uninstall|status} [agent...]
#   install [agents] : set the flag, write the hook, set the agent allowlist (default: nico mav).
#   uninstall        : clear the flag (guardrail goes dormant; settings entry left for re-enable).
#   status           : show flag + allowlist + whether the settings hook is present.
#
# POSIX sh. Depends on jq (settings.json edit).

set -eu

cmd="${1:-status}"
[ $# -gt 0 ] && shift || true

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
	printf 'stance-guard: not in a git repo.\n' >&2; exit 2
}
SETTINGS_DIR="$REPO_ROOT/.claude"
SETTINGS="$SETTINGS_DIR/settings.local.json"
WORKER='packages/mind/toolkit/guardrail/stance-guardrail.sh'
# Absolute command so the hook works regardless of the harness cwd at fire time.
HOOK_CMD="sh \"\$CLAUDE_PROJECT_DIR/$WORKER\""

require_jq() { command -v jq >/dev/null 2>&1 || { printf 'stance-guard: jq required.\n' >&2; exit 2; }; }

write_hook() {
	require_jq
	mkdir -p "$SETTINGS_DIR"
	[ -f "$SETTINGS" ] || printf '{}\n' > "$SETTINGS"
	# Add our worker to BOTH Stop and SubagentStop, idempotently (skip if already present).
	tmp="$(mktemp)"
	jq --arg cmd "$HOOK_CMD" '
		def ensure(event):
			.hooks[event] = ((.hooks[event] // [])
				| if any(.hooks[]?; .command == $cmd) then .
				  else . + [ { "hooks": [ { "type": "command", "command": $cmd, "timeout": 60 } ] } ]
				  end);
		.hooks = (.hooks // {})
		| ensure("Stop")
		| ensure("SubagentStop")
	' "$SETTINGS" > "$tmp" && mv "$tmp" "$SETTINGS"
}

remove_hook() {
	require_jq
	[ -f "$SETTINGS" ] || return 0
	tmp="$(mktemp)"
	jq --arg cmd "$HOOK_CMD" '
		def strip(event):
			if (.hooks[event]?) then
				.hooks[event] |= ( map( .hooks |= map(select(.command != $cmd)) )
					| map(select((.hooks | length) > 0)) )
			else . end;
		strip("Stop") | strip("SubagentStop")
	' "$SETTINGS" > "$tmp" && mv "$tmp" "$SETTINGS"
}

case "$cmd" in
install | on | true)
	git config --bool polis.stanceGuard true
	agents="${*:-}"
	[ -n "$agents" ] && git config polis.stanceGuardAgents "$agents" || true
	write_hook
	allow="$(git config polis.stanceGuardAgents 2>/dev/null || echo 'nico mav')"
	printf 'stance-guard: ENABLED for this repo (polis.stanceGuard=true).\n'
	printf '  Stop + SubagentStop hook written to .claude/settings.local.json (gitignored, local-only).\n'
	printf '  Agent allowlist: %s   (set "*" for all agents)\n' "$allow"
	printf '  A turn that collapses out of the intent-driven-expert stance is BLOCKED with corrective feedback.\n'
	;;
uninstall | off | false)
	git config --unset polis.stanceGuard 2>/dev/null || true
	printf 'stance-guard: DISABLED (polis.stanceGuard unset → default off; worker is now dormant).\n'
	printf '  The settings.local.json hook entry is left in place; run "install" to re-enable, or\n'
	printf '  "purge" to also remove the hook entry.\n'
	;;
purge)
	git config --unset polis.stanceGuard 2>/dev/null || true
	remove_hook
	printf 'stance-guard: PURGED (flag cleared + hook entry removed from settings.local.json).\n'
	;;
status)
	state="$(git config --bool polis.stanceGuard 2>/dev/null || echo false)"
	allow="$(git config polis.stanceGuardAgents 2>/dev/null || echo 'nico mav (default)')"
	present=no
	if [ -f "$SETTINGS" ] && command -v jq >/dev/null 2>&1; then
		jq -e --arg cmd "$HOOK_CMD" '
			[ (.hooks.Stop // [])[], (.hooks.SubagentStop // [])[] ]
			| any(.hooks[]?; .command == $cmd)
		' "$SETTINGS" >/dev/null 2>&1 && present=yes
	fi
	printf 'stance-guard: %s (polis.stanceGuard=%s)\n' \
		"$([ "$state" = true ] && echo ENABLED || echo 'disabled (default)')" "$state"
	printf '  agent allowlist : %s\n' "$allow"
	printf '  settings hook   : %s (%s)\n' "$present" "$SETTINGS"
	;;
*)
	printf 'usage: stance-guard-toggle.sh {install|uninstall|purge|status} [agent...]\n' >&2
	exit 2
	;;
esac
