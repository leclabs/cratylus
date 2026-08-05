#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# THE RENDER ORACLE — the projected corpus's regression hash, with one home.
#
# Every plan shard in this repository carries an acceptance line of the form
# "render oracle unmoved at <hash>, or a deliberate re-baseline argued in the
# commit". Until now that hash lived ONLY in prose: in shard bodies, in commit
# messages, and in whoever last ran the command by hand. Nothing checked it.
#
# That is the defect ARCHITECTURE already names one level up — "a property
# stated only in prose is a property that drifts silently" — applied to the
# oracle that is supposed to catch drift. A projection change could ship with a
# green suite, because the suite never rendered anything.
#
# So the expected value lives in ONE file (`.render-oracle`, beside this
# package's source) and this script is the only thing that reads or writes it.
#
#   check   recompute and compare. Non-zero on mismatch. This is the gate.
#   update  RE-BASELINE. Writes the new value. Deliberate by construction:
#           it is a separate verb, and the change shows up as a tracked diff
#           that a reviewer must accept.
#   print   recompute and echo, changing nothing.
#
# BOTH TARGETS OR IT IS HALF A PROOF. The claude and codex renders are hashed
# together: the codex adapter drifted once and shipped SESSIONLESS runtime shims
# to every codex-projected skill for the life of the divergence, precisely
# because only one target was being watched.
#
# THE OUT DIRS ARE REMOVED FIRST. `cratylus project` does not clean its
# `--out` (see plans/decomplect/pending/project-never-cleans-its-out-dir.md), so
# a deleted cell's artifact outlives it and an incremental render is not a
# render of the corpus — it is a render of the corpus plus its ghosts.
# ─────────────────────────────────────────────────────────────────────────────

set -eu

repo_root=$(cd "$(dirname "$0")/../../../../.." && pwd)
cd "$repo_root"

canon="packages/canon"
expected_file="$canon/.render-oracle"
claude_out="$canon/.render-ts"
codex_out="$canon/.render-ts-codex"

compute() {
  rm -rf "$claude_out" "$codex_out"
  pnpm canon:project >/dev/null 2>&1
  pnpm canon:project:codex >/dev/null 2>&1
  find "$claude_out" "$codex_out" -type f | sort | xargs shasum | shasum | awk '{print $1}'
}

read_expected() {
  [ -f "$expected_file" ] || { echo "no baseline at $expected_file" >&2; exit 2; }
  # Ignore comment lines so the file can explain itself.
  grep -v '^#' "$expected_file" | tr -d '[:space:]'
}

case "${1:-check}" in
  print)
    compute
    ;;
  update)
    actual=$(compute)
    {
      echo "# The render oracle: shasum of every file in .render-ts + .render-ts-codex."
      echo "# Written ONLY by \`render-oracle.sh update\`. A diff here is a deliberate"
      echo "# re-baseline and must be argued in the commit that carries it."
      echo "$actual"
    } > "$expected_file"
    echo "re-baselined: $actual"
    ;;
  check)
    expected=$(read_expected)
    actual=$(compute)
    if [ "$actual" = "$expected" ]; then
      echo "render oracle OK: $actual"
    else
      echo "RENDER ORACLE MOVED" >&2
      echo "  expected: $expected" >&2
      echo "  actual:   $actual" >&2
      echo "" >&2
      echo "If nothing was intended to change the projected bytes, this is a defect." >&2
      echo "If the change was intended, re-baseline deliberately:" >&2
      echo "  pnpm oracle:update    # then argue it in the commit message" >&2
      exit 1
    fi
    ;;
  *)
    echo "usage: render-oracle.sh [check|update|print]" >&2
    exit 64
    ;;
esac
