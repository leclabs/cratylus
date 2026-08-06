# t-src-dangling-references

**Wave 0.** Every dangling reference in `packages/forge/src` and `packages/memory/src`.
Outputs are those two source trees ONLY — disjoint from `t-test-dangling-references`
(all of `packages/*/test`), `t-invoke-coverage-claim` (`ARCHITECTURE.md`) and
`t-drift-notice-timing` (`packages/canon/src/hooks`).

## Intent

A dangling reference is a citation whose referent no reader can reach. Two sub-classes live
in these trees, and they take the SAME repair, so they are one shard:

**(a) Dead document + section.** 26 citations at HEAD, of which **24 name `NORTH-STAR §N`**,
plus one `DESIGN.md §N` and one `decisions/0003-shard-layout`. Measured, not inherited — the
filing that raised this said 31.

**(b) The untracked-but-present trap, which is why (a) is worse than a deletion.**
`NORTH-STAR.md` is NOT deleted. It sits at `.scratchpad/architecture/NORTH-STAR.md`, and
`git ls-files .scratchpad` returns **0 files**. So the reference resolves for whoever authored
it and dangles for a fresh clone, for CI, and for every other agent. An `existsSync` oracle
run on the authoring host would call it LIVE and pass. **Tracked ≠ present**, and only the
tracked set is shared.

## The repair, and it is not re-pointing

Same doctrine `f958d9b9` ruled and `df3aad73` applied: **the claim must stand on its own.**
Inline what the cited section SAYS, or withdraw the claim. Re-pointing a citation at
`.scratchpad/` is forbidden — it would make the dangle permanent and invisible.

## Inputs

- `git grep -nE "NORTH-STAR|DESIGN\\.md *§|decisions/[0-9]{4}" -- 'packages/forge/src' 'packages/memory/src'`
  — re-run it; do not trust the count above without reproducing it.
- `git log --all --diff-filter=D --name-only` for the deleted `DESIGN.md` / `decisions/` content.
- `.scratchpad/architecture/NORTH-STAR.md` — readable on this host, for recovering the cargo
  to inline. Reading it is correct; CITING it is the defect.
- `df3aad73` — the precedent repair and its inline-or-withdraw doctrine.

## Constraints

- **Re-census before repairing.** The roster in this file is a claim with a timestamp.
- **`.scratchpad/` is untracked and MUST NOT become a citation target**, nor be added to git
  as a side effect of this shard. If a section's cargo is worth keeping, it moves into a
  tracked governing doc under its own commit — that is a separate decision, not this repair.
- A reference inside a closed record (`fixtures/turn-*.txt`, a captured banner) is exempt:
  it is a MENTION of what was said, not a USE.

## Deps

(none — wave 0)

## Outputs

- `packages/forge/src/**`
- `packages/memory/src/**`

## Accept

1. `git grep -cE "NORTH-STAR|DESIGN\\.md *§|decisions/[0-9]{4}" -- 'packages/forge/src' 'packages/memory/src'`
   returns **0**.
2. The sweep PRINTS ITS DENOMINATOR — how many files were walked — so "found nothing" and
   "could not look" are distinguishable. A bare exit code does not satisfy this.
3. No file under `packages/*/src` gains a reference to `.scratchpad/`.
4. `pnpm verify` green; the render oracle moves only if a projected cell changed, and any move
   is argued in the commit.
