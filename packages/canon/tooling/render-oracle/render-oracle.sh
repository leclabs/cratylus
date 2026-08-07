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
claude_out="$repo_root/.cratylus/claude"
codex_out="$repo_root/.cratylus/codex"

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
# THE COMMAND SHIPS FROM THE HUB. `forge` is a library and declares no bin, so this
# read the manifest npm reads and got `undefined`. Select the BUILD command BY NAME —
# the hub declares two, and `Object.values(...)[0]` would be a coin flip between
# `cratylus` and `cratylus-run`.
cli() {
  node -e 'const p=require("./packages/cli/package.json");process.stdout.write(p.bin[p.name])'
}

compute() {
  entry="packages/cli/$(cli)"
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
  # PATHS ARE HASHED RELATIVE TO THE TREE ROOT, and that is the second half of the same
  # lesson the LC_ALL note below records. `xargs shasum` prints `<digest>  <path>`, so the
  # PATH is an input to the final digest — which meant the oracle's value was a function of
  # WHERE the render tree happened to live. Moving the tree out of `packages/canon/` and into
  # the repo root changed the hash while `diff -r` proved the two trees byte-identical: the
  # message said the corpus had moved and nothing in the corpus had.
  #
  # An oracle that varies with its environment accuses the corpus for what the shell did.
  # Locale was one such variable; the tree's own location was another. `cd` to the parent and
  # emit relative paths, so an intra-tree move is still caught — a file changing place inside
  # the render IS a real change — while relocating the whole tree is not.
  cd "$(dirname "$claude_out")" || return 1
  find "$(basename "$claude_out")" "$(basename "$codex_out")" -name .forge -prune -o -type f -print |
  # LC_ALL=C IS THE DIFFERENCE BETWEEN AN ORACLE AND A LOCAL OPINION.
  #
  # `sort` collates by LOCALE. This ran under a developer's `en_US.UTF-8` on macOS and under
  # `C` on the Linux runner, so the same corpus hashed two different ways and CI reported
  # `RENDER ORACLE MOVED` on a tree nobody had touched. The message points at the corpus;
  # the cause was the shell. An oracle whose entire claim is byte-identity was itself not
  # reproducible across machines, and it would have been red for every contributor whose
  # locale is not C — permanently, and with a message accusing the wrong thing.
  #
  # Pinned rather than documented: the ordering is an INPUT to the hash, so it belongs to
  # the oracle rather than to whoever happens to run it.
    LC_ALL=C sort | xargs shasum | shasum | awk '{print $1}'
}

# UNATTRIBUTABLE FILES — present in the render tree, absent from the manifest the writer
# left behind. `cratylus project` records every file it wrote in `<out>/.forge/render-manifest.json`
# and prunes what a PRIOR run of itself left; a file in neither set was written by something
# else, or by a projection that predates the manifest, and the prune path cannot account for it.
#
# WHY THIS EXISTS AND `rm -rf` STILL DOES NOT. Removing the out dirs would make the hash
# reproducible by never taking the prune path at all — the exact workaround this file's header
# argues was the defect wearing the oracle's clothes. This asks a different question: not
# "is the tree clean" but "can the writer ACCOUNT for what is in it". The prune stays
# exercised, and an unaccountable tree becomes loud instead of silently hashable.
unattributable() {
	out="$1"
	man="$out/.forge/render-manifest.json"
	[ -f "$man" ] || { echo "$out (no render manifest)"; return; }
	find "$out" -name .forge -prune -o -type f -print |
		sed "s|^$out/||" | sort > "$TMP_ON_DISK"
	tr ',' '\n' < "$man" | sed -n 's/.*"\([^"]*\)".*/\1/p' |
		grep -v '^files$' | grep -v '^version$' | sort -u > "$TMP_IN_MAN"
	comm -23 "$TMP_ON_DISK" "$TMP_IN_MAN"
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
    # RE-BASELINE ONLY WHAT THE WRITER CAN ACCOUNT FOR. Measured: a projected cell was
    # edited, `update` ran against a render tree carrying leftovers, and it wrote back the
    # SAME sha it already held — a re-baseline that could not see the edit it was
    # baselining. Only a manual `rm -rf` of the render dir surfaced the real hash. `check`
    # already prints advice about this case; `update` asked nothing at all, which is the
    # worse of the two because its output is a fact other people then trust.
    TMP_ON_DISK=$(mktemp) TMP_IN_MAN=$(mktemp)
    trap 'rm -f "$TMP_ON_DISK" "$TMP_IN_MAN"' EXIT
    actual=$(compute)
    strays=$( { unattributable "$claude_out"; unattributable "$codex_out"; } | grep -c . || true)
    if [ "$strays" -gt 0 ]; then
      echo "REFUSING to re-baseline: $strays file(s) the projector cannot account for" >&2
      { unattributable "$claude_out"; unattributable "$codex_out"; } | sed 's/^/  /' >&2
      echo "  clear the render tree and retry: rm -rf $repo_root/.cratylus" >&2
      exit 2
    fi
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
