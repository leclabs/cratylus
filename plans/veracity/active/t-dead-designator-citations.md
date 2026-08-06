# t-dead-designator-citations

**Wave 0.** Repair every live source that cites a retired plan's shard designator as
warrant. Outputs are `packages/*/src` and `packages/*/README.md` only — disjoint from
`t-ground-row-truth`, which owns `ARCHITECTURE.md`.

## Intent

A comment saying "`depalimpsest-ir-intake S6` removed nine verbs" hands the reader a
warrant they cannot follow: the plan was deleted at `70cc84d0` and the designator
resolves to nothing. `command-veracity.test.ts`'s PLAN-PATH law cannot see this class —
there is no `plans/` token to match, and no `existsSync` oracle for a designator.

The repair is **never** to re-point the citation. It is the ruling the corpus has already
made twice in prose and once in a commit subject (`f958d9b9` — "a shard id stops standing
in for a concept"): **the claim must stand on its own.** Inline the cargo — say what the
change WAS — or withdraw the claim. In every `memiso-*` instance repaired at `4e6b023a`
the surrounding prose already named the concept and the id was decoration on top of it.

## Inputs

- `packages/canon/test/command-veracity.test.ts` — the sibling law, its header, and its
  stated repair doctrine (`lines ~57-62`, and the header's use/mention argument).
- Commit `4e6b023a` message — the precedent repair, and the filing this shard discharges.
- Commit `f958d9b9` — the ruling in its subject line.
- Git history is the ONLY way to learn what a dead designator referred to:
  `git log --all --diff-filter=D --name-only -- 'plans/<plan>/*'`.

## Constraints

- **Re-census before repairing. Do not trust the roster below.** It was measured at
  `5c8ccecc` by two sweeps that disagreed with each other and with the filing that
  preceded them; the filing itself was wrong twice. Enumerate by PATTERN over the tree,
  not by this list.
- **Not every `[A-Z][0-9]` token is a dead shard designator.** `SPEC D2/D4/D5` in
  `packages/memory/src/{record,cli,dream}.ts` cite a SPEC document, and `D13`/`D3` in
  `canon/src/manifest.ts` and `forge/src/project/index.ts` may name something live.
  Establish what each token refers to before touching it; a wrong repair here destroys
  a working citation and reads as diligence.
- A designator inside a **recorded turn** (`.../fixtures/turn-*.txt`, capture banner) is
  a closed record and MUST NOT be edited — the same exemption the plan-path law makes.
  `canon/src/hooks/stance-guardrail.ts:787,821` quotes an operator turn; treat quoted
  speech as a record, not as the corpus's own claim.
- The file that must cite a dead designator in order to TEST for one is exempt by
  use/mention — but only where the citation is the test's subject.
- No behaviour change. Comments and docstrings only. The oracle must not move.

## Deps

∅ — wave 0.

## Outputs

Measured at `5c8ccecc`; **the executor re-derives this set and reports the delta.**

- `packages/forge/src/deploy/seeds.ts` (2 sites — `scoped-memory-v2 D1`, `D5`)
- `packages/forge/src/cli/index.ts`, `packages/forge/src/cli/commands/init.ts`
- `packages/forge/src/adapters/claude/{index,render,hooks}.ts`
- `packages/forge/src/adapters/codex/{index,render}.ts`
- `packages/forge/src/adapters/registry/index.ts`
- `packages/forge/src/catalog/index.ts`, `packages/forge/src/project/runtime-shim.ts`
- `packages/memory/src/{seeds,cli,plugin,verb-port}.ts`, `packages/memory/README.md`
- `packages/canon/src/toolkit/cold-oracle/sweep.mjs`,
  `packages/canon/src/toolkit/structural-parsimony.ts`

Plus a written roster: every token examined, its verdict (dead designator / live
reference / closed record), and the evidence for that verdict. The roster is the
deliverable `t-sigil-citation-prohibition` consumes.

## Accept

1. A sigil sweep over `packages/*/src` and `packages/*/README.md` returns zero dead
   designators, **and prints the denominator** — how many candidate tokens were examined.
   "Found nothing" and "could not look" must be distinguishable in the output.
2. Every repaired site reads correctly with **zero project knowledge**: the reason is on
   the page, not behind a reference. Verify by reading the resulting prose, not the diff.
3. No token surviving the sweep is a dead designator; each survivor has a stated,
   evidenced reason (live reference, closed record, or use/mention).
4. `pnpm verify` and `pnpm typecheck:test` green; the render oracle unmoved.

**Pre.** Fails today: the sweep returns ≥ 12 named-plan sites plus a bare-designator tail.
