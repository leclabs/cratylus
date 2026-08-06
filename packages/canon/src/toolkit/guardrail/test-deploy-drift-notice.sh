#!/usr/bin/env sh
# test-deploy-drift-notice — prove the advisory RE-ARMS mid-session without
# becoming the thing it was built to avoid.
#
# The cell was bound to `session.start` alone, and the question it answers expires:
# a projection landing DURING a session left the rest of that session running the
# superseded copy with no further signal. `prompt.submit` re-asks it. That re-arm
# is only admissible if the silence survives it, so these legs are three claims
# that must hold TOGETHER — any two of them are satisfiable by a worker that is
# simply broken in the third direction:
#
#   1. MID-SESSION. The render tree moves under a session that already ran the
#      hook; the SAME session is told, without waiting for a next start.
#   2. SILENCE WHEN CLEAN. A synced host produces NOTHING — and, since empty
#      stdout is also what a worker that compared nothing produces, every silent
#      leg is paired with a mutation of the same fixture that must make it speak.
#   3. CHANGE, NOT STATE. The same drift, still standing, is silent on the next
#      prompt; a DIFFERENT drift in the same session is not. The trigger is the
#      verdict CHANGING, never the verdict being non-empty.
#
# THE COMPARATOR IS REAL — the built forge CLI, shimmed into the fixture corpus's
# `node_modules/.bin`, never a stub. The whole claim of this cell is that it runs
# the existing comparison; a stubbed comparator would prove only that sh can print.
#
# HERMETIC: its own corpus, its own deployed host (`$HOME`), and its own `$TMPDIR`,
# which is where the worker's per-session verdict record lives. Nothing here reads
# or writes the developer's real deployment or their real session records.
#
# POSIX sh. Depends on jq and a built `packages/forge/dist`. Exit 0 = all pass.

set -eu

SELF_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SELF_DIR/../../../../.." && pwd)"
WORKER="${DRIFT_WORKER:-$SELF_DIR/deploy-drift-notice.sh}"
[ -f "$WORKER" ] || { echo "FAIL: no worker at $WORKER"; exit 1; }

command -v jq >/dev/null 2>&1 || { echo "SKIP: jq not available"; exit 0; }
command -v node >/dev/null 2>&1 || { echo "SKIP: node not available"; exit 0; }

# The comparator's entry, read out of forge's OWN manifest — the same key npm obeys,
# so this test follows a renamed bin without being edited.
FORGE_ENTRY="$REPO_ROOT/packages/forge/$(node -e 'const p=require(process.argv[1]);process.stdout.write(Object.values(p.bin)[0])' "$REPO_ROOT/packages/forge/package.json")"
[ -f "$FORGE_ENTRY" ] || { echo "SKIP: forge is not built ($FORGE_ENTRY) — run pnpm build"; exit 0; }

# The name the WORKER will look for. Read off the worker's own resolved line rather
# than spelled here: the projector substitutes it, and a second spelling would be a
# second home for the one fact the cell went to some trouble to stop repeating.
DEPLOY_TOOL="$(sed -n 's/^DEPLOY_TOOL=\(.*\)$/\1/p' "$WORKER" | head -1)"
[ -n "$DEPLOY_TOOL" ] || { echo "FAIL: the worker declares no DEPLOY_TOOL"; exit 1; }
HOOKS_FILE="$(sed -n 's/^HARNESS_HOOKS_FILE=\(.*\)$/\1/p' "$WORKER" | head -1)"
HARNESS_HOME=".$(sed -n 's/^HARNESS=\(.*\)$/\1/p' "$WORKER" | head -1)"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
fail=0
pass() { printf '  ok   — %s\n' "$1"; }
bad()  { printf '  FAIL — %s\n' "$1"; fail=1; }

CORPUS="$WORK/corpus"
HOST="$WORK/home"
TREE="$CORPUS/.render-ts"
DEPLOYED="$HOST/$HARNESS_HOME/agents"

AXIOM='FIRST PRINCIPLE: names are natural, never conventional'
SUPERSEDED='FIRST PRINCIPLE: a name is whatever we agreed to call it'
SECOND_AXIOM='SECOND PRINCIPLE: a shard is a self-contained execution specification'

mkdir -p "$TREE/agents" "$TREE/skills" "$DEPLOYED" "$CORPUS/node_modules/.bin" "$WORK/tmp"
# the corpus marker — the file `deploy` itself reads, and therefore the one the
# worker walks up for
printf '// fixture corpus\n' > "$CORPUS/agents.config.ts"
# the render tree, by SHAPE: agents/ + skills/ + THIS harness's hooks file
printf '{}\n' > "$TREE/$HOOKS_FILE"
printf 'name: nico\n%s\n' "$AXIOM" > "$TREE/agents/nico.md"
# …and a host deployed from it, in sync to start with
printf 'name: nico\n%s\n' "$AXIOM" > "$DEPLOYED/nico.md"
# the comparator, real, where the worker looks for it
printf '#!/usr/bin/env sh\nexec %s %s "$@"\n' \
	"$(command -v node)" "$FORGE_ENTRY" > "$CORPUS/node_modules/.bin/$DEPLOY_TOOL"
chmod +x "$CORPUS/node_modules/.bin/$DEPLOY_TOOL"

# `prompt <session-id>` — one firing of the hook, as the harness delivers it. The
# payload is identical at session.start and prompt.submit in every field this worker
# reads, which is why one event could re-arm the other at all.
prompt() {
	printf '{"session_id":"%s","cwd":"%s"}' "$1" "$CORPUS" | env \
		HOME="$HOST" \
		TMPDIR="$WORK/tmp" \
		CRATYLUS_CORPUS= \
		CRATYLUS_RENDER_TREE= \
		CRATYLUS_DEPLOY_CHECK= \
		CLAUDE_PROJECT_DIR= \
		sh "$WORKER" 2>&1
}

# `project <axiom>` — what `cratylus project` does to the fixture: the RENDER TREE
# moves and the host does not. That is the mid-session event under test, and it is
# modelled on the tree rather than on the host deliberately — a cell edited and
# re-projected is how drift actually begins here.
project() { printf 'name: nico\n%s\n' "$1" > "$TREE/agents/nico.md"; }
# `deploy` — the converging half, so a repair can be told from a repeat.
deploy() { cp "$TREE/agents/nico.md" "$DEPLOYED/nico.md"; }
# `host <axiom>` — put the DEPLOYED copy back to a given doctrine, which is how a
# drift already seen once is reconstructed byte for byte.
host() { printf 'name: nico\n%s\n' "$1" > "$DEPLOYED/nico.md"; }

echo "deploy-drift-notice — the re-arm"

# ── 0. the BINDING — the half of this repair that is not in the worker ─────────
# Every leg below drives the worker, and the worker was never why a mid-session
# projection went unreported: it was WHEN the harness ran it. The re-arm is a fact
# about the CELL, asserted where it is authored, or the rest of this file proves
# only that a script nobody runs would have spoken.
CELL="$REPO_ROOT/packages/canon/src/hooks/deploy-drift-notice.ts"
bound="$(tr -d '\n ' < "$CELL" | sed -n 's/.*events:\[\([^]]*\)\].*/\1/p')"
case "$bound" in
*"'session.start'"*)
	case "$bound" in
	*"'prompt.submit'"*) pass "the cell re-arms on prompt.submit, not session.start alone" ;;
	*) bad "the cell binds only [$bound] — nothing re-arms it mid-session" ;;
	esac
	;;
*) bad "the cell no longer binds session.start: [$bound]" ;;
esac

# ── 1. the floor: a synced host is silent, and the silence is not vacuous ───────
out="$(prompt sess-A)"
[ -z "$out" ] && pass "in sync -> NOTHING (the mandatory silence)" \
	|| bad "in sync but spoke: $out"

# ── 2. a projection lands MID-SESSION: the same session is told ────────────────
# No new session.start intervenes. This is the whole shard: before this, the run
# above was the only question ever asked and the answer below was never reached.
project "$SUPERSEDED"
out="$(prompt sess-A)"
case "$out" in
*"DEPLOY DRIFT"*)
	case "$out" in
	*"$SUPERSEDED"*) pass "a projection landing mid-session wakes the SAME session" ;;
	*) bad "spoke without naming the doctrine now in force" ;;
	esac
	;;
*) bad "a mid-session projection left the session unwarned: '$out'" ;;
esac
# and the report is the tool's own, reaching the tree — not a count and not a stub
case "$out" in
*"rendered file(s) compared"*) pass "it relayed a REAL comparison of the tree" ;;
*) bad "no comparison in the report — the check may have been dark" ;;
esac
# an advisory, whatever it found
case "$out" in
*'"decision"'*) bad "the advisory emitted a block decision" ;;
*) pass "advisory only — no block decision" ;;
esac

# ── 3. the SAME drift on the next prompt says nothing ──────────────────────────
# The re-arm's own hazard. Repeated every prompt, the advisory would train the
# reader to skip it — which is the exact failure silence-when-clean exists to
# prevent, re-entering through the door the re-arm opened.
out="$(prompt sess-A)"
[ -z "$out" ] && pass "the same standing drift does NOT re-notify" \
	|| bad "re-notified an unchanged verdict: $out"

# ── 4. a DIFFERENT drift in the same session speaks again ──────────────────────
# The control for leg 3, and it is not optional: a worker that simply never spoke
# twice would satisfy leg 3 and would have stopped being a hook after its first
# report. The trigger is the verdict CHANGING, not a one-shot latch.
project "$SECOND_AXIOM"
out="$(prompt sess-A)"
case "$out" in
*"$SECOND_AXIOM"*) pass "a CHANGED verdict speaks again in the same session" ;;
*) bad "a second, different drift was swallowed: '$out'" ;;
esac

# ── 5. a repair is silent, and a RECURRENCE is not ─────────────────────────────
# Converging the host must produce no all-clear (silence-when-clean is
# unconditional) — and must not leave the drift verdict standing as the last thing
# recorded, or the identical drift returning would match it and be swallowed.
deploy
out="$(prompt sess-A)"
[ -z "$out" ] && pass "a repaired host gets no all-clear" \
	|| bad "spoke on a repaired host: $out"
# the very same drift as leg 4, reconstructed: the tree still renders SECOND_AXIOM
# and the host is put back to what it ran then, so the verdict is byte-identical to
# the one this session was already told once.
host "$AXIOM"
out="$(prompt sess-A)"
case "$out" in
*"DEPLOY DRIFT"*) pass "drift RETURNING after a repair is audible again" ;;
*) bad "the returning drift was swallowed by a stale record: '$out'" ;;
esac

# ── 6. the record belongs to ONE session ───────────────────────────────────────
# Silence means "in sync" and is borrowed by nothing. A second session has been
# told nothing yet, so a standing drift is news to it however often the first was
# told about it.
out="$(prompt sess-B)"
case "$out" in
*"DEPLOY DRIFT"*) pass "a fresh session is told about standing drift" ;;
*) bad "a fresh session inherited another session's silence: '$out'" ;;
esac

# ── 7. no session identity ⇒ no suppression ────────────────────────────────────
# Without an id there is nothing to suppress against. Repeating under real drift is
# noise one deploy ends; suppressing would hand out the silence that means in-sync.
anon() {
	printf '{"cwd":"%s"}' "$CORPUS" | env \
		HOME="$HOST" TMPDIR="$WORK/tmp" CRATYLUS_CORPUS= CRATYLUS_RENDER_TREE= \
		CRATYLUS_DEPLOY_CHECK= CLAUDE_PROJECT_DIR= sh "$WORKER" 2>&1
}
first="$(anon)"; second="$(anon)"
if [ -n "$first" ] && [ -n "$second" ]; then
	pass "an unidentified session is never silenced"
else
	bad "an unidentified session was suppressed: '$first' / '$second'"
fi

# ── 8. and it still exits 0, always ────────────────────────────────────────────
# An advisory that ever exits non-zero has stopped being one.
rc=0
printf '{"session_id":"sess-C","cwd":"%s"}' "$CORPUS" | env \
	HOME="$HOST" TMPDIR="$WORK/tmp" CRATYLUS_CORPUS= CRATYLUS_RENDER_TREE= \
	CRATYLUS_DEPLOY_CHECK= CLAUDE_PROJECT_DIR= sh "$WORKER" >/dev/null 2>&1 || rc=$?
[ "$rc" -eq 0 ] && pass "exit 0 on the drift path" || bad "the advisory exited $rc"

[ "$fail" -eq 0 ] && echo "ALL PASS" || echo "FAILURES"
exit "$fail"
