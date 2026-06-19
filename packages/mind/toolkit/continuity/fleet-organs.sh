#!/usr/bin/env sh
# fleet-organs — keep an agent's agent-global organs (SELF, MEMORY, EPISODIC) as
# ONE logical store across the whole fleet ([[memory]] ## Portability).
#
# Mechanism: a dedicated git repo (the "organ store") holds, per agent,
#   <agent>/{SELF,MEMORY}.md and EPISODIC (.md pre-migration, .jsonl after)
# A host ADOPTS the store by symlinking each live organ file
#   ~/.claude/agents/<agent>/SELF.md  ->  <store>/<agent>/SELF.md
# so git operates directly on the real organ content (true history + real merge
# conflict surfacing), while the live path the agent protocol resolves
# (~/.claude/agents/<agent>/SELF.md) keeps working unchanged. No copy step, so
# no drift between "the file" and "the tracked file".
#
# Portability: the store's PHYSICAL path is derived per host from $HOME at adopt
# time; the LOGICAL store is one git remote. Nothing host-absolute is ever
# written INTO an organ — host-specific facts are knowledge the agent holds and
# belong in MEMORY content, not per-host files (the gate this tool protects).
#
# "Sync" is plain git: pull (fast-forward; merge surfaces conflicts), then push.
#
#   fleet-organs.sh init [REMOTE]        create/clone the store at $ORGAN_STORE
#   fleet-organs.sh adopt <agent>...     symlink live organs -> store (idempotent)
#   fleet-organs.sh sync                 git pull --ff-only then push the store
#   fleet-organs.sh status               show store + per-agent adoption state
#   fleet-organs.sh release <agent>...   un-adopt: copy store->live, drop symlinks
#
# Config (env overrides):
#   ORGAN_STORE   store working dir         (default: $HOME/.claude/agents-organs)
#   AGENTS_DIR    live agent sidecar root   (default: $HOME/.claude/agents)
#
# Reversible by construction: `release` restores a host to plain local files;
# the store repo is independent and can be deleted once every host has released.

set -e

ORGAN_STORE="${ORGAN_STORE:-$HOME/.claude/agents-organs}"
AGENTS_DIR="${AGENTS_DIR:-$HOME/.claude/agents}"
# EPISODIC is mid-migration markdown -> JSONL (plans/memory-model-redesign,
# migrate-live-episodic). Listing both extensions makes the sync transition-safe:
# the [ -e ]/[ -L ] guards below skip whichever an agent does not yet have, so a
# pre-migration agent (.md) and a migrated agent (.jsonl) both sync correctly.
ORGANS="SELF.md MEMORY.md EPISODIC.md EPISODIC.jsonl"

die() {
	printf 'fleet-organs: %s\n' "$1" >&2
	exit "${2:-1}"
}

require_store() {
	[ -d "$ORGAN_STORE/.git" ] || die "no store at $ORGAN_STORE — run: fleet-organs.sh init [remote]" 2
}

cmd_init() {
	remote="$1"
	if [ -d "$ORGAN_STORE/.git" ]; then
		printf 'store already present: %s\n' "$ORGAN_STORE"
		return 0
	fi
	if [ -n "$remote" ]; then
		git clone "$remote" "$ORGAN_STORE"
		printf 'cloned organ store: %s -> %s\n' "$remote" "$ORGAN_STORE"
	else
		mkdir -p "$ORGAN_STORE"
		git -C "$ORGAN_STORE" init -q
		printf '# agent-global organ store\n\nOne logical store of every agent-global organ (SELF, MEMORY, EPISODIC),\nsynced to every host. See packages/mind/toolkit/continuity/fleet-organs.sh.\n' \
			>"$ORGAN_STORE/README.md"
		git -C "$ORGAN_STORE" add README.md
		git -C "$ORGAN_STORE" commit -q -m "chore(organs): found the agent-global organ store"
		printf 'initialized empty organ store: %s\n' "$ORGAN_STORE"
		printf '  next: add a remote, then `fleet-organs.sh adopt <agent>...`\n'
	fi
}

# Move a live organ into the store (first host) or align to it (later hosts),
# then replace the live file with a symlink into the store. Idempotent.
adopt_one() {
	agent="$1"
	live_dir="$AGENTS_DIR/$agent"
	store_dir="$ORGAN_STORE/$agent"
	[ -d "$live_dir" ] || die "no live agent dir: $live_dir" 2
	mkdir -p "$store_dir"
	for f in $ORGANS; do
		live="$live_dir/$f"
		store="$store_dir/$f"
		if [ -L "$live" ]; then
			continue
		fi
		if [ -e "$store" ]; then
			if [ -e "$live" ] && ! cmp -s "$live" "$store"; then
				mv "$live" "$live.pre-adopt.bak"
				printf '  %s/%s: live differed from store, kept backup %s.pre-adopt.bak\n' "$agent" "$f" "$f"
			else
				[ -e "$live" ] && rm -f "$live"
			fi
		elif [ -e "$live" ]; then
			mv "$live" "$store"
		else
			continue
		fi
		ln -s "$store" "$live"
	done
	git -C "$ORGAN_STORE" add "$agent" >/dev/null 2>&1 || true
	printf 'adopted: %s -> %s\n' "$agent" "$store_dir"
}

cmd_adopt() {
	require_store
	[ "$#" -gt 0 ] || die "adopt needs at least one agent name" 2
	for agent in "$@"; do adopt_one "$agent"; done
	if ! git -C "$ORGAN_STORE" diff --cached --quiet 2>/dev/null; then
		git -C "$ORGAN_STORE" commit -q -m "chore(organs): adopt $* on $(hostname -s)"
		printf 'committed adoption to store (push with: fleet-organs.sh sync)\n'
	fi
}

cmd_sync() {
	require_store
	if ! git -C "$ORGAN_STORE" diff --quiet 2>/dev/null || \
		[ -n "$(git -C "$ORGAN_STORE" ls-files --others --exclude-standard)" ]; then
		git -C "$ORGAN_STORE" add -A
		git -C "$ORGAN_STORE" commit -q -m "chore(organs): sync local edits from $(hostname -s)"
		printf 'committed local organ edits\n'
	fi
	if git -C "$ORGAN_STORE" remote get-url origin >/dev/null 2>&1; then
		branch="$(git -C "$ORGAN_STORE" branch --show-current)"
		git -C "$ORGAN_STORE" fetch -q origin
		if git -C "$ORGAN_STORE" rev-parse -q --verify "origin/$branch" >/dev/null 2>&1; then
			# remote branch exists: ff-only pull surfaces a real divergence as a conflict.
			git -C "$ORGAN_STORE" merge --ff-only "origin/$branch" \
				|| die "not fast-forward — two hosts diverged; resolve in $ORGAN_STORE then re-sync"
			git -C "$ORGAN_STORE" push origin "$branch"
		else
			# first sync against this remote: create the branch upstream.
			git -C "$ORGAN_STORE" push -u origin "$branch"
		fi
		printf 'synced with origin\n'
	else
		printf 'no origin remote set — local store only (set one to sync across hosts)\n'
	fi
}

cmd_status() {
	require_store
	printf 'store:  %s\n' "$ORGAN_STORE"
	url=$(git -C "$ORGAN_STORE" remote get-url origin 2>/dev/null || echo "(no remote)")
	printf 'remote: %s\n' "$url"
	printf 'live:   %s\n\n' "$AGENTS_DIR"
	for store_dir in "$ORGAN_STORE"/*/; do
		[ -d "$store_dir" ] || continue
		agent=$(basename "$store_dir")
		[ "$agent" = ".git" ] && continue
		linked=0
		total=0
		for f in $ORGANS; do
			[ -e "$store_dir/$f" ] || continue
			total=$((total + 1))
			[ -L "$AGENTS_DIR/$agent/$f" ] && linked=$((linked + 1))
		done
		[ "$total" -eq 0 ] && continue
		state="adopted"
		[ "$linked" -eq 0 ] && state="in-store-only"
		[ "$linked" -gt 0 ] && [ "$linked" -lt "$total" ] && state="partial"
		printf '  %-24s %s (%d/%d organs linked)\n' "$agent" "$state" "$linked" "$total"
	done
}

cmd_release() {
	require_store
	[ "$#" -gt 0 ] || die "release needs at least one agent name" 2
	for agent in "$@"; do
		live_dir="$AGENTS_DIR/$agent"
		store_dir="$ORGAN_STORE/$agent"
		for f in $ORGANS; do
			live="$live_dir/$f"
			store="$store_dir/$f"
			[ -L "$live" ] || continue
			rm -f "$live"
			[ -e "$store" ] && cp "$store" "$live"
		done
		printf 'released: %s now uses plain local files (store untouched)\n' "$agent"
	done
}

cmd="${1:-status}"
[ "$#" -gt 0 ] && shift || true
case "$cmd" in
init) cmd_init "$@" ;;
adopt) cmd_adopt "$@" ;;
sync) cmd_sync "$@" ;;
status) cmd_status "$@" ;;
release) cmd_release "$@" ;;
*)
	printf 'usage: fleet-organs.sh {init [remote]|adopt <agent>...|sync|status|release <agent>...}\n' >&2
	exit 2
	;;
esac
