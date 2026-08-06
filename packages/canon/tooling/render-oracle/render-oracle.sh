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
# THE OUT DIRS ARE NOT REMOVED FIRST, AND MUST NOT BE. `cratylus project` now
# converges its own `--out`: it writes the tree and prunes what a prior run of
# the same command left behind (`forge/src/project/write.ts`). So an incremental
# render IS a render of the corpus, and this script needs no `rm -rf`.
#
# It used to have one, and that was the defect this file exists to catch wearing
# the oracle's own clothes. The command's contract — "the render tree is a pure
# function of the corpus" — was stated in prose and upheld by a CALLER, so the
# only thing keeping the hash reproducible was that this script happened to
# scrub first. Every other caller, including a developer running `canon:project`
# by hand, got the ghosts. Deleting the workaround is what makes the property
# the command's, and re-adding it here would hide the regression again: with the
# dirs wiped, the prune path is never taken and its failure is invisible. The
# prune has its own control (`forge/test/project/write-prune.test.ts`) precisely
# because `.cratylus/` is gitignored and CI is therefore always cold.
# ─────────────────────────────────────────────────────────────────────────────

set -eu

# DEPTH-INDEPENDENT ON PURPOSE. This was `cd "$(dirname "$0")/../../../../.."` — five
# levels, counted for a home under `src/toolkit/`. Moving the script one level shallower
# broke it into "no baseline", which reads as a missing file rather than as a miscounted
# path. A relative hop encodes the script's own location in its body, so relocating the
# file silently changes what it points at; asking git removes the coupling entirely, and
# the `cd` fallback keeps it working in a tarball with no `.git`.
. "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/../../../tooling/src/repo-root.sh"
repo_root=$(require_repo_root "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)")
cd "$repo_root"

canon="packages/canon"
expected_file="$canon/.render-oracle"
claude_out="$canon/.cratylus/claude"
codex_out="$canon/.cratylus/codex"

# The build-time CLI's entry, read out of forge's OWN manifest.
#
# NOT `node_modules/.bin/cratylus`. The installer creates a workspace bin symlink only if
# the TARGET FILE EXISTS AT INSTALL TIME — verified by A/B on a clean tree: with
# `dist/` present the link appears, with `dist/` absent it silently does not. A
# real cold clone runs checkout -> install -> build, so at install time `dist/`
# has never been built and the link is never created. This gate is the one thing
# that MUST work on a cold clone, because that is exactly what CI is.
#
# Reading `bin` from the manifest keeps one home for the entry — the same key npm
# reads — and makes the gate independent of install ORDER.
# NOTE: this script does NOT build. `pnpm verify` builds once, up front, and the
# turbo task graph builds for any other caller. Building here as well meant two
# builds interleaved inside one `verify` — tsup emits content-hashed chunks and
# runs with `clean: true`, so a rebuild landing while another task had already
# resolved `main.js` left it pointing at a chunk that no longer existed. The
# failure was intermittent, which is the worst kind: it passed, then failed, on
# identical input.
cli() {
  node -e 'const p=require("./packages/forge/package.json");process.stdout.write(Object.values(p.bin)[0])'
}

compute() {
  entry="packages/forge/$(cli)"
  node "$entry" project --harness claude --out "$claude_out" >/dev/null 2>&1
  node "$entry" project --harness codex  --out "$codex_out"  >/dev/null 2>&1
  # PROJECTED BYTES ONLY. `-type f` picks up dotfiles, and the render root also
  # carries `.forge/` — the writer's prune RECORD, bookkeeping about the render
  # rather than a rendered artifact. Hashing it would make the oracle's value a
  # function of the record's own format, so a change to how convergence is
  # RECORDED would read as a change to what the corpus PROJECTS.
  #
  # Excluding it is not a re-baseline: verified by A/B on a tree with no `.forge/`
  # present, both forms yield the same hash, so the baseline this narrowing was
  # landed against still stands.
  find "$claude_out" "$codex_out" -name .forge -prune -o -type f -print |
    sort | xargs shasum | shasum | awk '{print $1}'
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
      echo "# The render oracle: shasum of every file under .cratylus/."
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
      echo "" >&2
      echo "On a LOCAL tree only: an artifact left by a projection that predates the" >&2
      echo "writer's prune record is unattributable and will never be pruned — the" >&2
      echo "command removes only what it can account for having written. CI is always" >&2
      echo "cold so it cannot hit this. Clear it once, by hand:" >&2
      echo "  rm -rf $claude_out $codex_out" >&2
      exit 1
    fi
    ;;
  *)
    echo "usage: render-oracle.sh [check|update|print]" >&2
    exit 64
    ;;
esac
