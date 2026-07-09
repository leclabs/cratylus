# NORTH-STAR — target architecture (net-current)

Author: nico (design authority). Converged across the census (C1–C4) + many adversarial cold-review rounds +
isolated Ω\* reads. ρ=LLM. Git holds the round-by-round trail; **this is the single source of truth.**
Grounding: `ENGINE ⊥ MODEL` (ENGINE.md); "author semantics once, realize behavior everywhere; canon is the
source of truth, targets are projections" (VISION).

The refactor resolutions **R1–R9** below map 1:1 to the wave-2 execution shards (`ready/`, `pending/`).

---

## 1. Three packages (charter — MECE)

`agent-contract` (a proposed 4th package) was **rejected** — the concrete decouplings need no 4th package, and
D-scope fixes corpus+engine; a package for the aesthetic "zero peer edges" is complexity the mandate forbids.

| package                                                                    | one responsibility                        | owns                                                                                                                                                                                                                                                 | may import                                                             |
| -------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **agent-forge** (ENGINE + shared TYPE kernel)                              | manufacture · validate · ship a cell      | IR · compose · **projection** · **deploy** · the accept-gate **ALGORITHM** · adapters + the **one behavioral port `HarnessAdapter`** · catalog-discovery · CLI + the **composition-root** · the shared TYPE kernel (anatomy types + DTO/data shapes) | node · own core · agent-memory _as a host tool_ (prereq, not code dep) |
| **agent-anatomy** (CANON)                                                  | what cells exist + the runtime individual | the corpus of cells · runtime substance (guardrail `.sh` · judge-prompt) · the injected **DATA VALUES** (AcceptPolicy tokens · FoundingTemplate) · the `longTermMemory` organ enum                                                                   | `type` from forge (+ value at composition roots until project-to-dir)  |
| **agent-memory** (a CANONICAL component, DISTRIBUTED as a standalone tool) | the memory subsystem                      | the `memory` CLI (mechanism) + its authored consolidation protocol/skills + the store at `~/.agents/<name>/` + the per-face lifecycle hook                                                                                                           | node only                                                              |

**Invariants:**

- **forge MUST NOT import anatomy** (cycle + doctrine-agnosticism). anatomy → forge is `type`-only (erases;
  the 3 residual value-imports — `project-human.ts:11`, `project-cli.ts:24-29`, `project-cli-codex.ts:20-24`,
  all projection tooling — die under R1).
- The shared TYPE kernel + the one port live in forge. Only the **composition-root** (forge CLI) imports
  concretes (selected adapter, memory prereq, corpus dir); it must **discover** the corpus as a directory
  (`catalog/index.ts`), never statically import anatomy.
- `agent-memory` imports nobody; it is a host prerequisite (`which memory` + version-compat), not a code dep.

## 2. Decoupling resolutions (the refactor — R1–R9)

- **R1 — projection tooling → forge.** Move `toolkit/{project*, project-human, project-targets, organ-docs,
project.ts}` and the **generic** hook-lift out of `agent-anatomy` into `agent-forge`. They already import
  forge downward. This also removes anatomy's residual value-imports (→ pure type-only).
- **R2 — accept-gate: algorithm ⊥ policy.** The pure leg-witness **algorithm**
  (`canonical/signified/coldBlindStatic/partitioned/parsimonious/regenerable`, `universalCell`) → forge/validate.
  The **corpus POLICY-DATA** (`accept.ts:166-169` palimpsest tokens `polis/oikos/conatus`, `operator-lexicon`,
  the `cold-oracle.sh:29` repo-guard) stays in anatomy and is **injected** — `universalCell(cell, homes,
policy)`. Never plant `polis` in the doctrine-agnostic engine. (`exemplify` the pipeline and `universalCell`
  are distinct concerns sharing the word "accept" — not unified.)
- **R3 — founding doctrine out of the engine.** `deploy/init.ts` (`:1,3,15,36,108,150` — `polis`/`politeia`/
  `mind-society` founding prose + `PLAN_STATES`) → a `FoundingTemplate` injected from CANON; `init` emits
  structure + placeholders only. (`register.ts` `HUMAN_MARKERS` is general register-detection MECHANISM, stays
  in forge — not corpus doctrine.)
- **R4 — hooks split.** Generic `hookIrOf` (`toolkit/hooks.ts`) → forge; the specific stance-guard **cells**
  stay anatomy runtime-substance; the composition-root wires them. Aspirational ENGINE-pure form: anatomy
  PROJECTS hook/rule cells to a directory forge's deploy DISCOVERS (drops the residual value-edge).
- **R5 — adapters by name; kill the sideways edge.** Anatomy CLIs SELECT an adapter by NAME from a registry
  (the `HarnessAdapter` port); stop importing concrete adapter modules (`project-cli.ts:29`,
  `project-cli-codex.ts:24`). Move `agentBody`+`organTitle`+`organField` (the real sideways payload) from
  `adapters/claude/anatomy.ts` into a neutral `core/anatomy-body`; kill `codex/anatomy.ts:23`. (Subsumes the
  `organTitle` dedup.)
- **R6 — memory becomes the standalone tool** (see §3; the largest shard).
- **R7 — citation cruft removal.** Delete the orphaned `[[…]]` parser + `hasProseFormula`/CITE-TWICE arm
  (`skill-shape.test.ts:86` — matches zero live cells) and the unimplemented `docs:check` wikilink gate. The
  bare-σ\* skill `≜`-composition formula is the LIVE model (isolated Ω\* confirmed a self-sufficient
  definition) — KEEP.
- **R8 — purity/DI.** Extract genuine pure cores only (the config-reader "dup" is a non-finding — disjoint
  field-sets; the `dream.compact`/`resolveNode`/`ulid` seams are already injected). Fold `organTitle` via R5.
- **R9 — scope barriers (`S0`).** Broaden `nico`/`mav` `description`s (no canon-only/engine-only remit); purge
  the dangling `CLAUDE.md` "lane-split" See-also. Leave the stance-guard allowlist (stance ≠ scope).

## 3. Memory — the model, the packaging, the lifecycle

### 3.1 Model — the 4-part CoALA cognitive taxonomy (the agent's PRIVATE memory)

| type           | store                     | note                                       |
| -------------- | ------------------------- | ------------------------------------------ |
| **Working**    | none — the context window | transient reasoning state; never persisted |
| **Episodic**   | `EPISODIC.jsonl`          | raw per-turn events; the encode target     |
| **Semantic**   | `SEMANTIC.md`             | facts + identity                           |
| **Procedural** | `PROCEDURAL.md`           | generalized cross-project wisdom           |

That is the whole owned model — 3 private stores + working. "Session memory" = a **view** over episodic, not a
type. **`vault` (cross-host/networked) and `AGENTS@node` (project-scoped) are EXTRACTED** — neither is
private-cognitive; cross-host is an out-of-scope anti-pattern (end-user vault-vendor integration, never ours),
and project-scoped externalization is a plain file-edit the agent does by hand (not a tool act). Delete both
from `route.ts` `StoreName`/`V2_STORES` and the `dream.ts` cases.

### 3.2 Packaging — a canonical component distributed as a standalone tool

- The **`memory`** CLI (renamed off the `episodic` grey-field holdover), **host-bootstrapped once** (human-run,
  like the repo's `uv tool install graphifyy` + `graphify install` — NOT `gh`, which is config; memory is
  state). `agent-memory/package.json` gains a `bin`. The core stays dependency-free (runs under `node`); recall/
  embeddings stay out of core.
- Store at the **harness-neutral** home **`~/.agents/<name>/`** (bare — matching the repo's existing
  `~/.agents/skills/`; reserve/avoid a `skills`-named agent). **Single-host** — the O_EXCL lock is local-fs.
- **`genus/memory.md` DELETED from anatomy.** Its mechanism re-spec → the tool's `--help`; its authored
  reasoning-contract (ENCODE-salience + `scope=node(cwd)` causality, the V4 contract) → the module's shipped
  protocol/skills the agent reads at wake. `agent-memory` is a CANONICAL component (authored once) → "centralize
  in canon" holds; it is merely _distributed_ as a tool, not projected per-harness.
- The agent references memory via ONE thing — the `longTermMemory` organ enum. No build-edge (a standalone tool
  is referenced by name + runtime-checked). No forge→memory code dep, no bundle: **delete the stranded
  `stageBundle`/`BundleMissingError`/`baseRoot` staging mechanism** (memory was its sole `bundle:` consumer).
  Provision at **wake-register** (`memory init --home ~/.agents/<name>`, before `audit`/`read`); the seed
  content (`seeds.ts:33-66`) relocates into `memory init`.
- **Harness paths dissolve (V8/F5 for memory):** `memory` on PATH + `--home` derivable from the agent NAME =
  harness-neutral, nothing to template. The **session-id is the one per-face seam** — `memory session register`
  binds it (harness-native where one exists, else tool-minted), so no face ever writes sessionless (fixes the
  cross-face bleed: `store.ts:53` today reads only `CLAUDE_SESSION_ID`). The non-memory face bodies (hooks) that
  still carry `.claude` literals are the residual V8 templating concern, per adapter `paths.ts`.

### 3.3 Consolidation lifecycle (the trigger)

- **Consolidation needs live inference; `session.end` is dead.** So: the agent consolidates **hot-path** — calls
  the tool's `apply`/`replace` verbs in-turn — **nudged by a threshold-gated `turn.end` (Stop) hook** the module
  ships (cheap shell count of unconsolidated `EPISODIC.jsonl` records; watermark below the compaction point).
  Fires HOT ∧ LIVE. **`PreCompact` is NOT usable** (command-only, no reasoning-injection; and no memory system
  consolidates-by-reasoning at compaction).
- **Cold `session.start` catch-up = the data-safe FLOOR** (durable per-turn `encode` ⇒ nothing lost; the
  hook-less adapters get only this floor — honest non-goal). `session.end` → mechanical `release` only.
- **Memory ops:** EPISODIC = `encode`/`read`/`drain`(by-id forget); the 2 prose stores (Semantic/Procedural) get
  `replace` (whole-file supersede, reuses the `RouteTarget` selector — no sub-file addressing); `apply --routes`
  lands the agent's route-decisions as DATA (wiring the dead `applyRoutes`, `dream.ts:200`); reads of resident
  prose stay agent-direct.
- **Braid relocates:** `wake`/`handoff` → thin orchestrators (`register → memory.reconstitute → orient →
resume`; `praxis-sync → memory.consolidate → release`) calling memory's named entrypoints; `orient` stays a
  praxis concern; no agent skill names `episodic.mjs`.

### 3.4 Being / faces (MODEL invariant — landed in `MODEL.md`)

An agent is a persistent **BEING**; harnesses are its projected **FACES**; **memory is the continuity that makes
the faces one being** → memory is harness-independent, single-per-being, ∉ any face. (`MODEL.md` BEING/FACE.)

## 4. Diagram

`DIAGRAM.md` — current-state (defects), target (3 packages), and the memory concern.

## 5. Status

Design converged, cold-verified, code-grounded. No open design forks. Everything design-only — **nothing in
`packages/` touched.** Wave-2 execution (R1–R9) is the `ready/`+`pending/` shard set; irreversible-outward
(push/deploy) remains Operator-gated.
