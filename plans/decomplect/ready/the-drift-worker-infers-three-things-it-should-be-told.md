# The drift worker infers three things nothing tells it

> Filed by the integrator landing `drift-is-checkable-but-nothing-checks-it`. Its agent
> reported all three against its own work, having declined to reach outside its writes to
> close any of them. Each mitigation it shipped is correct and stays until this lands.

## Why this is ONE shard and not three

It was filed as three, and the plan's own law rejected that: `∀ n < m : |wave(n)| = 1 ⇒
slices mis-cut`. Three shards produced `wave(0)` and `wave(1)` as singletons — because all
three rewrite `packages/canon/src/hooks/deploy-drift-notice.ts` and its byte-locked target
`packages/canon/src/toolkit/guardrail/deploy-drift-notice.sh`. The worker is the contention
set. Anything that edits it serializes against everything else that edits it, so splitting
by concern bought three sequential shards and no parallelism — a chain wearing a cut's
clothes. The concerns below stay distinct in the prose; the cut is one because the artifact
is one.

## (a) The bin name — the worker spells a literal

`DEPLOY_TOOL=cratylus`, in a cell carrying the constraint _"declares the capability; does
not name a path or a command."_

Not a shortcut. `git grep "cratylus" -- packages/forge/src packages/runtime/src` returns
**nothing**: the forge CLI's own executable name has no home in any TypeScript module. It
exists once, in `packages/forge/package.json`'s `bin` key, where no cell can import it.

The mechanism already exists — `ProjectionFact` in `packages/schema/src/hook-cell.ts`, whose
doc says adding a member _"costs the projector one entry and nothing else."_ That estimate
is wrong here in the part that matters: `runtime-bin` has a value to bind (`RUNTIME_BIN` in
`packages/runtime/src/bin-name.ts`, a module existing solely to be that home). `deploy-bin`
has none, so this **mints one**, and that is a signification decision:

- Where does it live? Runtime's precedent says a dedicated module — but the deploy bin is
  forge's, and forge already depends on runtime, so the reverse edge is unavailable.
- Which way does truth flow? Either `package.json`'s `bin` is generated from the constant,
  or the constant is checked against it. `bin-name-single-home.test.ts` is the existing
  answer for the runtime bin and the obvious model — but a check is not a derivation, and
  the two are not the same claim.

Already caught, not merely noted: the landing agent extended `bin-name-single-home.test.ts`
to capture the worker's spelling and compare it to forge's manifest key, with a fixture that
rewrites the value stale and asserts the predicate reddens, plus a leg asserting a worker
naming no tool reads _absent_ rather than _drifted_. The drift is safe. The duplication is
what remains.

## (b) The harness — the worker checks a sibling's deployment

The worker identifies the render tree by SHAPE (`agents/` + `skills/` + the hooks file).
Shape is the right instrument — `--out` is an operator's choice and must not be assumed —
but the shape it matches is the **claude** adapter's, so a codex session compares the claude
deployment.

Never a _false_ report: the relayed header names the root it read. But it can be about a
deployment other than the one governing the session, and a codex session with a stale codex
tree and a fresh claude one is told nothing — the original failure wearing a different hat.

The pair it needs, ⟨`home`, `hooksFile`⟩, lives on the `HarnessAdapter` port and nothing
carries it across. A shell-side copy of the adapter table would put the harness registry in
two homes, one uncompilable and unreachable from the adapter that owns it — a worse trade
than the limitation, which is why the agent recorded it instead. This is the same channel as
(a): projection is the only thing that knows which adapter it is rendering for.

**Every hook worker on every harness has this blindness.** This cell is only the first whose
job made it visible, because it is the first that has to LOOK at the deployed tree rather
than merely run in it.

## (c) The verdict — the worker parses output because the exit code won't say

`cratylus deploy --check` exits **1** both when the host is stale and when the check itself
failed. Those demand opposite responses, and relaying the second as the first fabricates a
drift claim from a crash.

So the worker discriminates by parsing the command's own closing verdict line, searched only
within `tail -n 3` — itself a considered defence, since an artifact's quoted content
(including this worker's own bytes, when _it_ is the stale file) never lands in the last
three lines. It works. It also couples a hook worker to the comparator's output FORMAT
because its exit CONTRACT cannot carry the distinction: reformat the report and the advisory
silently reclassifies drift as a broken tool.

Fix is a third code — `0` in sync · `1` drift · `2` could not run — named in one place
rather than repeated at each `process.exit`. Do NOT reach for `--json` instead: that trades
an exit-code contract for a parsing contract, the same coupling one layer down, while every
existing caller keeps reading the code anyway.

## Acceptance

- The forge CLI's executable name has exactly one authored home; that home and
  `package.json`'s `bin` key cannot disagree — by derivation if possible, by a gate if not,
  and the choice argued in the source.
- `ProjectionFact` carries the facts (a) and (b) need; `projectionFacts()` binds them. The
  cell asks by name and spells no literal and no path. The byte-locked target is
  REGENERATED, never hand-edited.
- `deploy --check` distinguishes drift from its own failure by exit code, with a convicting
  fixture asserting the two paths produce DIFFERENT codes — each proven to reach the branch
  it claims before the codes are read.
- A codex session reports on the codex deployment. Convicting fixture: project the same cell
  for both adapters and assert the two workers resolve DIFFERENT trees, proven by planting
  drift in one and confirming the other stays silent — so the leg cannot pass by both
  reading the same root.
- The `bin-name-single-home` leg added for (a) stays green or is replaced by something
  strictly stronger; it must not be deleted merely because the literal moved.
- The advisory's existing legs — the paired silence/speech mutations, `REFUSES` on a broken
  comparator, `REFUSES` on an absent one — stay green throughout.
- The KNOWN LIMITATION note in the cell is deleted in the same change that makes it false.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** deploy-surface · **wave** 0
- **depends on** `drift-is-checkable-but-nothing-checks-it`
- **writes** `packages/schema/src/hook-cell.ts` · `packages/forge/src/project/index.ts` · `packages/forge/src/cli/commands/deploy.ts` · `packages/forge/test/deploy/check.test.ts` · `packages/canon/src/hooks/deploy-drift-notice.ts` · `packages/canon/src/toolkit/guardrail/deploy-drift-notice.sh` · `packages/canon/test/deploy-drift-notice.test.ts` · `packages/canon/test/bin-name-single-home.test.ts`
- **compiles against** `packages/runtime/src/bin-name.ts` · `packages/forge/src/core/harness-adapter.ts`
- **evidence** `packages/schema/src/hook-cell.ts` · `packages/runtime/src/bin-name.ts` · `packages/forge/package.json`
- **dispatchable** no ruling owed
