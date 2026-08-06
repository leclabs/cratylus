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

## VERDICT — verified 2026-08-06

**Defect REAL. Repair SOUND. Shard NOT fully discharged.**

Every sampled designator resolved to a deleted `plans/.retired/` file. The `119` count
reconciles exactly (129 tokens on 110 removed lines, minus 9 bracketed research keys, minus
one `E3.S2` counted once) — it was measured, not quoted forward. Doctrine was followed: 88 of
110 removed lines inline the referent (`"P4's load step"` -> ``"the `agents.config.ts` loader"``),
22 strip decoration from self-standing claims. No site was left with the designator as its
only warrant, and nothing working was destroyed.

The shard's own caution was itself wrong: it warned that `SPEC D2/D4/D5` in `packages/memory`
cite a live SPEC document. No tracked `SPEC.md` exists — the referent was
`plans/.retired/close-out/SPEC.md`, deleted. Those citations were dead too.

**What survived, and is repaired ahead of this note:**

- `packages/forge/src/project/runtime-shim.ts:55` carried `runtime/S7` **inside the template
  literal that IS the projected shim body**, so the dead designator was emitted into every
  deployed shim artifact. The pre-image carried it on lines 11 and 55; only line 11 was
  repaired.
- `packages/forge/tsup.config.ts:8` carried `depalimpsest-ir-intake S6`. Already in the
  existing gate's scope (`TEXT` extensions, not under `/test/`); missed because this shard's
  stated output scope was `packages/*/src` + READMEs, and a root config is neither.

**Deliverables not produced** — recorded because a downstream shard depends on one:

- Accept 1, "a sigil sweep that **prints the denominator**" — no sweep artifact exists.
  "Found nothing" and "could not look" remain indistinguishable.
- Outputs, "**a written roster**: every token examined, its verdict, and the evidence" —
  exists only as prose in `df3aad73`'s commit message.
  `t-designator-citation-prohibition` names that roster as its calibrating **Input**.
