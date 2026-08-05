# `cratylus project` never cleans `--out` — a deleted cell's artifact outlives it

> Found by the executor of `t-build-steps-proxy-the-cli` **while refusing to paper over it**, and
> that refusal is why it is a filed finding rather than an `rm -rf` buried in a root script.

## Symptom

`writeRenderTree` only ever writes files. It removes nothing, and `runProject` does not clear the
render tree first. Demonstrated on the live tree, independently reproduced:

```sh
touch packages/canon/.render-ts/agents/ZOMBIE.md && pnpm canon:project
# → ZOMBIE.md SURVIVES the reprojection
```

The deleted `project-cli.ts` **did** clean — `rmSync(out, { recursive: true, force: true })` before
every run. So the capability existed in the private duplicate and does not exist in the shipped
command. Deleting the duplicate is still correct; this is the one thing it knew that `forge`
does not.

## Why it did not move the oracle, and why that is the dangerous part

On a **fresh** tree the output is byte-identical, which is why
`fe084dd1d531948979dc386713c3f688c96088ab` held and the byte-identity proof stands.

It diverges on an **incremental** one. Rename or delete a cell and its old artifact stays on disk;
`canon:deploy` then ships it, so a retired agent or skill keeps reaching the host. The failure is
invisible in exactly the case the oracle is run in, and live in exactly the case a developer works
in — and the oracle's own reproducibility now quietly depends on someone having `rm -rf`'d the render
dirs first.

This is the projection's version of the defect the corpus already has a shard for: a correction that
lands in the source and never reaches the surface that gets read.

## The ruling owed — a design decision, which is why this is filed and not fixed

Three admissible cuts, and they are not equivalent:

1. **`runProject` cleans unconditionally.** Matches the deleted CLI, matches the mental model that a
   render tree is a pure function of the corpus. Costs: it makes `--out` a directory the command
   will happily destroy, which is a sharp edge pointed at a consumer's `--out .`.
2. **A `--clean` flag, default off.** Safe by default, and therefore wrong by default — the stale
   artifact is the silent case, so the safe default preserves the defect.
3. **Prune to the manifest** — write the tree, then remove anything under `--out` the projection did
   not emit. Most precise, and the only one that is safe with an unexpected `--out`, because it
   removes only what it can account for.

`REGENERABLE` (`MODEL.md:68`) says a Target is `deploy-owned` and `¬hand-edit`. A file the projector
will not remove and does not know about is neither. That argues for (3) and against (2).

## Acceptance

- Reprojecting after deleting a cell leaves **no** artifact for the deleted cell under either render
  root, proven by a control that creates a stale file, reprojects, and asserts its absence.
- The oracle is reproducible **without** a manual `rm -rf` first — the command's own contract.
- Whatever the cut, a consumer passing an unexpected `--out` cannot lose files the projection never
  wrote. State explicitly what the command may delete.

## ▶ RULING 2026-08-05 — the WRITER owns cleaning, by prune-to-manifest

**Not a new design — it is `deploy`'s, one stage upstream.** `forge/src/deploy/manifest.ts` already
implements exactly this for the harder root: record what you wrote → `staleFiles` → `applyPrune` →
a `contained()` path-escape guard → an `unattributable()` list **no caller may delete**. Its header
argues down attribution-by-naming-convention explicitly, and its bootstrap bound (no manifest ⇒
establish only, prune nothing) is what makes a consumer's `--out .` safe. Re-deriving it in
`project` would be a second home for a solved problem.

- **The CLI is refused** on `REGENERABLE` (`MODEL.md:68`): a default-off `--clean` flag makes
  non-convergence the default and the stale artifact the silent case.
- **The writer, not the caller**: `write.ts` self-declares _"THE ONE WRITER"_. Convergence is union
  **and** subtract at one seam — `deploy` puts its prune in `deployLocal`, not in `runDeploy`.
- **The oracle is already carrying the workaround**: `render-oracle.sh:68` is `rm -rf` inside
  `compute()`, so its reproducibility is a _caller's_ property — the "stated only in prose" defect
  the oracle exists to catch, reappearing inside the oracle.

**Order matters, and the oracle moves if you get it wrong.** `render-oracle.sh:72` hashes
`find -type f`, which picks up dotfiles, so a manifest under `--out` would enter the hash.
(a) narrow the find to exclude `.forge/` — a bookkeeping record is not projected bytes, so the
baseline stays valid and this is **not** a re-baseline; (b) land the prune; (c) delete `rm -rf`
from `compute()`.

**One integration check owed**: the printed deploy hint passes `--hooks-dir <out>`, so the hooks
placer will now see `<out>/.forge/` — verify it reads named subdirs only. And note `.render-ts*`
are gitignored, so CI is always cold and **the prune path is never exercised by the oracle** — the
control test is load-bearing, not ceremonial.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** corpus-rename · **wave** 0
- **depends on** `t-soul-to-target-in-forge` · `t-manifest-file-basename`
- **writes** `packages/forge/src/project/write.ts` · `packages/canon/src/toolkit/render-oracle/**`
- **compiles against** `packages/forge/src/cli/commands/project.ts`
- **evidence** `packages/forge/src/project/write.ts` · `packages/canon/src/toolkit/render-oracle/render-oracle.sh`
- **dispatchable** no ruling owed
