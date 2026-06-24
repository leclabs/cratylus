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

## Frontier (ready — fan out concurrently)

| Task     | Lane     | What                                                                                             |
| -------- | -------- | ------------------------------------------------------------------------------------------------ |
| **T0.1** | Mav+Nico | The anatomy as TS types (organ types + Agent/Skill/Fragment) — the contract                      |
| **T0.2** | Nico     | Baseline/delta + the two resets (agent-base in mind, harness reset in adapter); spread semantics |
| **T5.1** | Nico     | Resolve `zero-trust` ⊂ `input-untrusted`                                                         |
| **T5.2** | Nico     | `dont-reinvent-the-wheel` → `invoke-the-canonical`                                               |
| **T5.3** | Nico     | Enabling-tone convention, scoped to `instructions`                                               |
| **T5.4** | Nico     | Precedence doc; correct "instructions = fallback"; reconcile `ideas/AGENTS.md:22`                |

## Pending

T1.1 fragments→modules · T1.2 agents (ESM+spread) · T1.3 skills→modules · T2.1 claude projection · T2.2 adapter reset/delta · T2.3 density variants · T2.4 multi-harness · T3.1 deploy-engine · T4.1 baseline/delta rollout · T6.1 cutover.

## What dissolved (vs the first draft)

The `Ref` IR primitive, the resolution pass, dangling/circular/holders detection, fence-immune `[[ ]]` substitution, the "pre-resolution JSON IR" fork, and a bespoke mind→claude renderer — all reinventions of ESM / `tsc` / the existing adapters. Composition is `import`; merge is spread; projection is the export adapter.

## Notes from research (verified)

- An IR bridge exists today (`resolve.emit_ir`→`render/ir.py`→`mind.koine.json`, byte-parity proven) but is a claude-pre-baked subset — superseded by direct adapter projection (T2.1).
- koine has 10 adapters with read/write + honest lossy reporting; projection via template literals upgrades their serializers.
- Organ-hygiene corrections baked into T5.\*: trust pair not duplicative (real overlap zero-trust⊂input-untrusted); `instructions` is not a fallback; enabling-tone is instructions-scoped (charter is intentionally negative).
