# koine-absorbs-mind

**Goal.** Invert the model: **TS modules are the source, markdown is a projection.** mind becomes a TypeScript package of typed fragment/agent/skill modules composed via **ESM `import` + object-spread**; koine provides the **anatomy types**, the **export adapters that project** (via template literals), the **per-adapter harness reset**, and the **deploy engine**. mind is koine's opinionated core plugin.

**The unifying insight.** There is **one pipeline**, symmetric in and out:

```
SOURCE                          IR (typed objects)      EXPORT ADAPTER = PROJECTION
mind TS modules ──compose──┐
 (ESM import + spread)      ├──> Agent / Skill ──┬──> claude  → .claude/agents/*.md
imported harness configs ──┘                    ├──> codex   → AGENTS.md / *.toml
 (read adapter)                                 └──> …all adapters (free multi-harness)
```

"Project mind to Claude Code" _is_ "export through the claude adapter." Composition = ESM. Merge = object spread (`{...base, ...delta}`). Additive set = array spread. Projection = the adapter's template literals. "Don't re-ship the target's defaults" = the adapter subtracts its own **harness reset**. `[[ref]]`, the resolution pass, and fence-immune substitution all **dissolve** into `tsc`.

**Two resets, correctly filed.** harness reset (`claude`, `codex`, … — measured by blank `/introspect`) lives in the **adapter**; the agent base (genus / HHH / continuity, harness-neutral) lives in **mind** (`agents/base.ts`). `claude` is a harness, **never** a mind agent.

**Acceptance law (every step).** Byte-identical round-trip — `self-application-is-mandatory`. Keep `pnpm build/test/lint` green. **Lane:** Nico = anatomy types/corpus/hygiene; Mav = koine engine/adapters/deploy.

## Phase / dependency map

```
T0.1 anatomy-as-TS-types ─┬─> T1.1 fragments→modules ─┬─> T1.2 agents (ESM+spread) ─┬─> T2.1 claude projection ─┬─> T2.2 adapter reset/delta ─┐
                          │                           └─> T1.3 skills→modules ───────┘                          ├─> T2.3 density variants   │
T0.2 baseline/delta+reset ┘────────────────────────────> (informs T2.2, T4.1)                                   └─> T2.4 multi-harness       │
                                                                                                                                            ├─> T6.1 cutover
T3.1 deploy-engine (needs projected artifacts; else independent) ───────────────────────────────────────────────────────────────────────────┤
T1.2 + T2.2 + T0.2 ──> T4.1 baseline/delta rollout ─────────────────────────────────────────────────────────────────────────────────────────┘
T5.1 T5.2 T5.3 T5.4 organ hygiene — independent, run on the CURRENT markdown corpus now
```

## Frontier (ready)

| Task     | Lane | What                                                                                      |
| -------- | ---- | ----------------------------------------------------------------------------------------- |
| **T3.1** | Mav  | Deploy engine — absorb placer/ssh/.polis.config/fleet/seeding/skill-dir/init (**active**) |

**🎉 Phase 1 + projection + T2.2 complete** — the inversion stands alone (`pnpm project` byte-identical to
Python `.render/`), and the claude adapter now carries its **harness reset + delta-over-target** (T2.2,
additive/non-breaking). **T3.1 (deploy engine) is in progress** — the last frontier task before the
T4.1 rollout / T6.1 cutover open up.

**Open follow-ups (small, deferred):**

- `Skill.composition` → lazy thunk `() => Skill[]` (skill graph has real cycles; string-anchor stopgap in use).
- Per-agent organ **order** is carried by a second `ResolvedAgent` export; consider an `order: Organ[]` on `Agent`.
- **T0.2 doc reconciled below:** `base` currently = the memory protocol only (the richer floor is T4.1).

## Completed

- **T2.2** — claude harness reset (`adapters/claude/harness-reset.ts`, 10 organs) + opt-in
  `projectAgentDelta`/`subtractReset` (set→difference, scalar→omit-on-match). **Additive, non-breaking**:
  default projection byte-identical (oracle green); reset ratified from a blind bare-`/introspect`. Flip
  to minimal-by-default deferred to T4.1. Nico re-verified all gates independently. Commit `b33ac9b`.
- **T2.1** — projection moved into koine's claude adapter (`adapters/claude/anatomy.ts`); standalone
  `pnpm project` writes `.render-ts/` **byte-identical** to Python `.render/` (`diff -r` empty, 28 files).
  The consumer command is koine's; source-grain round-trip oracles stay in mind. Commit `a5cfb00`.
- **T1.2** — all 11 agents → TS modules (spread form) + agent claude-projection; SOULs byte-identical.
  Ground truth: selection-vector path injects only `## Memory`; founder-genus is in provenance text;
  `instructions`/`heuristics` made optional on the Agent type. Commit `d7af48e`.
- **T1.1 + T1.3** — all 155 organ value-cells + 15 skills migrated to typed TS modules under
  `packages/mind/src/`, every one projecting **byte-identical** to its markdown (non-vacuous test).
  Formal-block skill (`introspect`) round-trips. Commits `8288e19` (spike), `af0f268` (full).
- **T0.1** — anatomy as TS types → `@leclabs/koine/anatomy` (24 organ types + Agent/Skill/Fragment;
  wrong organ/arity = compile error). Commit `db41ffe`.
- **T0.2** — baseline/delta + two-reset model → `docs/baseline-delta-model.md` (spread-merge,
  inherit-by-omission, adapter-side delta-over-target; `base.ts` decision; `claude` filed under the adapter).
- **T5.1** — `zero-trust` narrowed to the methodology slice (overlap with `input-untrusted` removed).
- **T5.2** — `dont-reinvent-the-wheel` → `invoke-the-canonical` (prescriptive); selectors repointed.
- **T5.3** — enabling-tone convention added to `instructions/README` (scoped, charter stays negative).
- **T5.4** — `instructions` reclassified as a coined catalog (not open, not a fallback); authoring
  precedence documented in `ideas/AGENTS.md`.

_(Commits: `5d16fa1` corpus hygiene · T0.2 spec doc.)_

## Pending

T2.3 density variants · T2.4 multi-harness · T4.1 baseline/delta rollout · T6.1 cutover.

## What dissolved (vs the first draft)

The `Ref` IR primitive, the resolution pass, dangling/circular/holders detection, fence-immune `[[ ]]` substitution, the "pre-resolution JSON IR" fork, and a bespoke mind→claude renderer — all reinventions of ESM / `tsc` / the existing adapters. Composition is `import`; merge is spread; projection is the export adapter.

## Notes from research (verified)

- An IR bridge exists today (`resolve.emit_ir`→`render/ir.py`→`mind.koine.json`, byte-parity proven) but is a claude-pre-baked subset — superseded by direct adapter projection (T2.1).
- koine has 10 adapters with read/write + honest lossy reporting; projection via template literals upgrades their serializers.
- Organ-hygiene corrections baked into T5.\*: trust pair not duplicative (real overlap zero-trust⊂input-untrusted); `instructions` is not a fallback; enabling-tone is instructions-scoped (charter is intentionally negative).
