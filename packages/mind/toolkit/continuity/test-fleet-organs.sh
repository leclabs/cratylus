#!/usr/bin/env sh
# test-fleet-organs — hermetic fixture proof of the fleet organ-sync mechanism.
#
# Simulates two hosts under DIFFERENT home roots (/Users/lex vs /Users/lcaraccioli)
# sharing one bare-repo "organ store", and asserts the objective gates:
#   G1 an organ edit on host A is present on host B after a sync cycle
#   G2 no absolute home path leaks into any synced (tracked) organ
#   G3 divergent edits on both hosts are refused, not silently lost
#   G4 release is reversible (symlink -> regular file, store untouched)
#   G5 an adopted (symlinked) organ reads as PRESENT to the deploy seeder
#
# Touches NO live sidecar; runs entirely in a throwaway temp dir. Exit 0 = all pass.

set -e
HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SCRIPT="$HERE/fleet-organs.sh"
LAB=$(mktemp -d "${TMPDIR:-/tmp}/fleet-organs-test.XXXXXX")
trap 'rm -rf "$LAB"' EXIT

fail() { printf 'FAIL: %s\n' "$1" >&2; exit 1; }
ok() { printf 'ok: %s\n' "$1"; }

HOMEA="$LAB/hostA/Users/lex"
HOMEB="$LAB/hostB/Users/lcaraccioli"
A() { ORGAN_STORE="$HOMEA/.claude/agents-organs" AGENTS_DIR="$HOMEA/.claude/agents" sh "$SCRIPT" "$@"; }
B() { ORGAN_STORE="$HOMEB/.claude/agents-organs" AGENTS_DIR="$HOMEB/.claude/agents" sh "$SCRIPT" "$@"; }

git init -q --bare "$LAB/remote.git"
mkdir -p "$HOMEA/.claude/agents/scratchy" "$HOMEB/.claude/agents/scratchy"
printf '# scratchy — self\n## Who I am\nscratch agent.\n' > "$HOMEA/.claude/agents/scratchy/SELF.md"
printf '# scratchy — memory\n## Facts\n- multi-host.\n' > "$HOMEA/.claude/agents/scratchy/MEMORY.md"
printf '# scratchy — episodic\n## Stream\n- born A\n' > "$HOMEA/.claude/agents/scratchy/EPISODIC.md"

A init "$LAB/remote.git" >/dev/null 2>&1
A adopt scratchy >/dev/null
A sync >/dev/null 2>&1

# B has stale local copies; adopt must defer to the store (A's content wins).
printf '# scratchy — self\n## stale B\n' > "$HOMEB/.claude/agents/scratchy/SELF.md"
printf '# stale\n' > "$HOMEB/.claude/agents/scratchy/MEMORY.md"
printf '# stale\n' > "$HOMEB/.claude/agents/scratchy/EPISODIC.md"
B init "$LAB/remote.git" >/dev/null 2>&1
B adopt scratchy >/dev/null
grep -q "scratch agent" "$HOMEB/.claude/agents/scratchy/SELF.md" \
  || fail "adopt: store did not win over stale B copy"
[ -f "$HOMEB/.claude/agents/scratchy/SELF.md.pre-adopt.bak" ] \
  || fail "adopt: divergent B copy not backed up"
ok "adopt defers to store and backs up divergent local copy"

# G1: edit on A -> present on B after a sync cycle.
printf -- '- A-EDIT-MARKER\n' >> "$HOMEA/.claude/agents/scratchy/MEMORY.md"
A sync >/dev/null 2>&1
B sync >/dev/null 2>&1
grep -q "A-EDIT-MARKER" "$HOMEB/.claude/agents/scratchy/MEMORY.md" \
  || fail "G1: A's edit did not propagate to B"
ok "G1 edit on host A is present on host B after sync"

# G2: no home-root path in any tracked organ.
if git -C "$HOMEA/.claude/agents-organs" grep -nE "/Users/(lex|lcaraccioli)" \
     -- ':*/SELF.md' ':*/MEMORY.md' ':*/EPISODIC.md' >/dev/null 2>&1; then
  fail "G2: absolute home path leaked into a tracked organ"
fi
git -C "$HOMEA/.claude/agents-organs" ls-files | grep -q "^scratchy/SELF.md$" \
  || fail "G2: store does not track relative organ paths"
ok "G2 no home-root leak; store tracks relative paths only"

# G3: divergent edits on both hosts -> refused, both preserved.
printf -- '- A-only\n' >> "$HOMEA/.claude/agents/scratchy/SELF.md"
printf -- '- B-only\n' >> "$HOMEB/.claude/agents/scratchy/SELF.md"
A sync >/dev/null 2>&1
if B sync >/dev/null 2>&1; then fail "G3: divergence was not refused"; fi
grep -q "B-only" "$HOMEB/.claude/agents/scratchy/SELF.md" \
  || fail "G3: B's edit lost after refused sync"
ok "G3 divergence refused; both edits preserved for manual merge"

# G4: release is reversible.
[ -L "$HOMEA/.claude/agents/scratchy/SELF.md" ] || fail "G4 pre: organ not a symlink"
A release scratchy >/dev/null
[ -L "$HOMEA/.claude/agents/scratchy/SELF.md" ] && fail "G4: still a symlink after release"
grep -q "Who I am" "$HOMEA/.claude/agents/scratchy/SELF.md" \
  || fail "G4: content not restored on release"
[ -z "$(git -C "$HOMEA/.claude/agents-organs" status --porcelain)" ] \
  || fail "G4: store mutated by release"
ok "G4 release restores plain local files, store untouched"

# G5: deploy seeder sees an adopted (symlinked) organ as PRESENT (no clobber).
A adopt scratchy >/dev/null
[ -e "$HOMEA/.claude/agents/scratchy/SELF.md" ] \
  || fail "G5: symlinked organ not seen as existing (seeder would clobber)"
ok "G5 adopted organ reads PRESENT to the deploy seeder"

printf '\nALL GATES PASS (G1-G5)\n'
