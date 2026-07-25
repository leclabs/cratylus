# agent-runtime — decomplect build-host from runtime-host (runtime-plugin architecture) · mirror

> Runtime folder-state is authority; this doc is a derived mirror. Owner: `5e12e138` (`.owner`). Reader = LLM.

> **STATUS — COMPLETE (2026-07-23).** S1–S8 + S10 landed + integrated + green; the runtime-plugin architecture is delivered and dogfood-proven end-to-end (project → deploy+install → deployed thin-shim invokes `agent-runtime memory`/`tap` → verified, hermetic). **S9 (unified CLI brand, FORK-4) BLOCKED → `plans/discipline-anchor`** (same question as install-parity S4; consolidated to one home 2026-07-25) — the runtime bin `agent-runtime` suffices; S10's real deps reframed to {S7,S8}. Commits: `521ee2d` plan · `0058841`/`b6f6b2d` w0 · `2b6f293` w1 · `961cc4a`/`55f9af8` w2 · S10 (this). Two integration defects the unit tests hid were caught by the REAL dogfoods (S7 VerbArgs↔signature; S10 `tap`-word routing) — both fixed. Baseline reds E7/S10 + E10/S7 (docs tripwires) are pre-existing, out of scope. FLEET redeploy + push RESERVED (operator).

## Intent

Introduce the missing **runtime host**. Today `agent-forge` is a BUILD host only (project→deploy); deployed skill scripts reach capabilities two incompatible ways — T4 dep-free bundles vs bare `memory` shell-out. Decomplect (Vite two-pipeline model): `@leclabs/agent-runtime` = the per-host **runtime host** owning capability port CONTRACTS + a runtime loader + ONE branded host bin; capability packages (`agent-memory`, `event-tap`) are **runtime plugins** implementing those ports; a projected skill script is a **thin shim → `agent-runtime <capability> <verb>`**. Deploy guarantees the per-host runtime install (dissolves the memory-on-PATH gate). Operator-concurred design; supersedes skills-refactor T4 and reshapes event-tap E2.

## Target DAG (acyclic)

```
agent-runtime  (leaf: capability ports + RuntimePlugin contract + loader + host bin)
   ▲     ▲
   │     └── agent-memory   (RuntimePlugin: MemoryStrategy; drops `memory` bin; owns seed templates)
   │     └── event-tap      (RuntimePlugin: EventTapHost; harness adapter as capability impl)
agent-forge    (BUILD host; deps agent-runtime; projects THIN SHIMS against runtime ports; stops seeding)
   ▲
agent-canon    (content AgentPlugin: agents/skills/dimensions)
```

## Census findings (path:line, grounded 2026-07-23)

- **AgentPlugin is BUILD-only** — `resolve/plugin.ts:39` declares `{name, fragments?, agents?, skills?, adapters?}` (dir-scan + harness adapters). NO capability/runtime seam. ⇒ the `RuntimePlugin` contract is net-new; it lives in `agent-runtime`, distinct from `AgentPlugin`. A capability package (memory) wears BOTH faces (build AgentPlugin for seeds/adapters ⊕ RuntimePlugin for the strategy) — Vite's one-plugin-two-pipelines.
- **event-tap port couples to forge** — `runtime/event-tap/port.ts` `LifecycleEvent = CanonicalEvent` (forge/core); `claude.ts` reuses `serializeClaudeHooksReport`/`mergeJsonKeys`/`claudeToCanonical` (forge adapters). Moving the port to runtime forces the **canonical lifecycle-event taxonomy** to move too (FORK-1).
- **DAG today** — `agent-memory` deps ∅, `private:true`, `bin:{memory}`; `agent-canon` deps `@leclabs/agent-forge`; `agent-forge` bin `agent-forge`, CLI on `cac`, publishable. Seed templates mislocated in `agent-forge/deploy/seeds.ts:75-77` (memory's business).
- **Just-landed c13e911** — `requireHome` env-override + `memory home` verb + deploy seed-target→`~/.agents` + wake/handoff `--name <self>`. This resolution logic BECOMES the MemoryStrategy's, invoked `agent-runtime memory home`; the deploy seed-target work is subsumed by the runtime install (S7).
- **Existing plans** — skills-refactor: T1/T2/T3 completed, T4/T5 pending (T4 REVERSES to thin-shim). event-tap: T1/T2 ready, T3/T4/T5 pending (RESHAPED — event-tap becomes a runtime capability). No E3 plan exists (E3 = "move projection-engine out of canon" intent; ORTHOGONAL, not absorbed here).

## Forks surfaced (need resolution — mostly in-shard, FORK-3 is operator)

- **FORK-1 · event taxonomy home** — the canonical lifecycle-event vocabulary (`CanonicalEvent`) moves to `agent-runtime` (runtime owns lifecycle events; forge deps runtime for it) vs stays in forge (runtime deps forge — inverts DAG, rejected). Resolution: **move to runtime** (S1); forge re-imports. Confirm no other forge/core consumer breaks (S1 census leg).
- **FORK-2 · dual-face plugin shape** — a capability package exposing both `AgentPlugin` (build) and `RuntimePlugin` (runtime): one object with both hook-sets vs two named exports (`buildPlugin`, `runtimePlugin`). Lean: **two named exports** (clean separation, each pipeline imports its face). Settled in S1 contract.
- **FORK-3 · publish/install strategy (OPERATOR)** — the runtime + capability plugins must be installable per-host. Public npm (`npx @leclabs/agent-runtime`) vs private registry vs monorepo-bundled tarball. Ties to the earlier npx/pnpm-continuity discussion. `agent-memory` currently `private:true`. Operator call — feeds S7.
- **FORK-4 · binary brand (signify)** — the one branded dispatcher bin: reuse `agent-forge` vs a new brand vs `af`. Capabilities are subcommands; NEVER a generic bin. Derive the anchor via signify in S9.

## Slices (MECE vertical, one concern end-to-end) + R

| id      | slice                                                                                                                                                                                                       | concern     | deps        | wave | state   |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------- | ---- | ------- |
| **S1**  | `runtime-contract` — new `@leclabs/agent-runtime` pkg skeleton; `RuntimePlugin` contract + capability port ifaces (`MemoryStrategy`, `EventTapHost`); move canonical event taxonomy (FORK-1); settle FORK-2 | contract    | —           | 0    | ready   |
| **S2**  | `plan-reconcile` — supersede skills-refactor T4→thin-shim (retire dep-free-bundle) + T5 re-cut; reshape/park event-tap E2 under the runtime shape; de-palimpsest both PLAN.mds                              | doc         | —           | 0    | ready   |
| **S3**  | `runtime-kernel` — the runtime loader + dispatcher (`agent-runtime <cap> <verb>` → loaded RuntimePlugin) + branded bin skeleton (cac)                                                                       | runtime     | S1          | 1    | pending |
| **S4**  | `memory-capability` — agent-memory impl `MemoryStrategy`; DROP `memory` bin; own seed templates; fold c13e911 resolution → `agent-runtime memory <verb>`                                                    | capability  | S1          | 1    | pending |
| **S5**  | `event-tap-capability` — event-tap as RuntimePlugin impl `EventTapHost`; claude adapter as capability impl; `agent-runtime tap <verb>`                                                                      | capability  | S1          | 1    | pending |
| **S6**  | `forge-build-integration` — forge deps agent-runtime; projection emits THIN SHIMS for skill `runtime:{capability}` (reverses T4); STOP seeding (moved to S4)                                                | build       | S1          | 1    | pending |
| **S7**  | `deploy-runtime-install` — deploy guarantees per-host `agent-runtime` + capability-plugin install (FORK-3); dissolves memory-on-PATH                                                                        | deploy      | S3,S4,S5,S6 | 2    | pending |
| **S8**  | `skills-rewire` — wake/handoff/memory-touching skills → `agent-runtime memory …`; reproject; fold c13e911's `--name` shims                                                                                  | skills      | S4,S6       | 2    | pending |
| **S9**  | `unified-cli-brand` — one branded dispatcher bin (build→forge, runtime→runtime); derive brand (FORK-4, signify)                                                                                             | cli         | S3,S6       | 2    | pending |
| **S10** | `integrate-smoke` — e2e: project → deploy(+runtime install) → deployed skill invokes `agent-runtime memory`/`tap` on host → verify; clean-worktree gate (fleet RESERVED)                                    | integration | S7,S8,S9    | 3    | pending |

`R = {(S3,S1),(S4,S1),(S5,S1),(S6,S1),(S7,S3),(S7,S4),(S7,S5),(S7,S6),(S8,S4),(S8,S6),(S9,S3),(S9,S6),(S10,S7),(S10,S8),(S10,S9)}`
waves `{S1,S2} → {S3,S4,S5,S6} → {S7,S8,S9} → {S10}` · frontier fan-out wave0=2, wave1=4.

## Relation to the effort chain

Supersedes **skills-refactor T4** (dep-free-bundle → thin-shim) and re-cuts **T5**; reshapes **event-tap E2** (its mechanism becomes S5, its skill-cell becomes an S8 thin-shim). **E3** (projection-engine relocation) stays ORTHOGONAL — not in scope. The c13e911 home-resolution work is preserved and folded into S4 (as the MemoryStrategy) + S7 (install subsumes the seed-target).
