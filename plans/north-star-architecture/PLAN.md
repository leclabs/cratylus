# north-star-architecture

**Initiative.** Re-establish a clean whole-system architecture under `ENGINE ⊥ MODEL` (ENGINE.md): MODEL
fixes invariants, ENGINE realizes them + owns `boundary-projection ≜ {deploy, project-human}`; every runtime
target is a projection of the canon, never its author (VISION). Remove nico/mav scope barriers, census the
violations, ratify ONE north-star with ≥3 adversarial mav reviews, then refactor to it. Owner: session
`1b8801a9`. Mirror is derived — the state folders are authority.

## Provenance / starting state (blind-executor-told)

- `nico.role: curate → build` in the working tree is **intentional** (Operator, this session).
- Uncommitted WT = the Operator's `[[x]]→`x``"shotgun, directionally correct" — to be **superseded** by
E3, not preserved. Also WT:`.manifests/\*.json`, `CONCEPT.md`, `README.md`deleted;`plans/heartbeat-organ/`
  untracked (unrelated).
- Hard invariant: dep direction is `agent-anatomy → agent-forge` (type-only); **forge MUST NOT import
  anatomy** (cycle). agent-memory couples only by a filesystem bundle-path (no code import).

## Dependency graph (R)

```
S0  (scope barriers)          — independent
C1,C2,C3 (censuses)           — independent, COMPLETE
D1  ⟵ C1,C2,C3                 — synthesis + mav debate (join)
E1..E4 ⟵ D1                    — execution (design-dependent, fan-out)
```

## Waves (dispatch schedule)

- **wave 0** — `S0` ∥ `C1` ∥ `C2` ∥ `C3` (censuses done; S0 ready)
- **wave 1** — `D1` (north-star synthesis + ≥3 mav adversarial reviews → ratified target → Operator sign-off)
- **wave 2** — `E1` ∥ `E2` ∥ `E3` ∥ `E4` (refactor, MECE along the ratified boundaries; specced at D1)

## State

| task                                               | state                                     | concern                                                                        |
| -------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------ |
| C1 census — package boundaries (toolkit placement) | completed                                 | ANATOMY vs FORGE concern; toolkit relocation candidates                        |
| C2 census — forge & memory                         | completed                                 | dup/concern-mix/purity/dep-direction; the forge⊥memory D4 seam                 |
| C3 census — citation + memory prose                | completed                                 | dead `[[…]]` cruft vs live successor; genus prose-vs-tool dup                  |
| S0 — scope barriers                                | ready                                     | broaden nico/mav vision; purge dangling lane-split                             |
| D1 — north-star synthesis + mav debate             | completed (CONVERGED — 6 cold rounds; §5) | design clean+code-verified; `agent-contract` DROPPED (3 pkgs); de-palimpsested |
| D2 — memory decomposition (Operator-driven)        | active (design converging)                | standalone `memory` tool + being/faces + session-lifecycle; see below          |
| E — execution slices (E1..E4)                      | pending                                   | design-dependent; specced after D1/D2 sign-off                                 |

## Census results (durable inputs for D1)

- `census/C1-package-boundaries.md` · `census/C2-forge-memory.md` · `census/C3-citation-memory-prose.md`
- `census/C4-harness-genericity.md` (Operator-prompted) · `NORTH-STAR.md` · `DIAGRAM.md` (Mermaid)

## Confirmed violations (from census — the refactor targets)

1. **Concern-mix:** `deploy/seeds.ts` authors memory-store CONTENT (memory doctrine in the placement layer). [B1]
2. **Deep cause:** forge can't import memory ⇒ memory doctrine (filenames, v1-retirement, seed prose)
   COPIED into forge/deploy instead of imported. [D4 → A2,A3]
3. **Invisible coupling:** real inter-package edges are path/string contracts the compiler can't enforce. [D3]
4. **Forge-concern in anatomy:** `toolkit/` hosts projection/deploy/accept-gate tooling; `guardrail/*.sh`
   are the only clean runtime residents. [C1]
5. **Prose double-maintains tool logic:** `genus/memory.md` + `dream.ts` re-specify scope/liveness/lock/
   drain/audit that `agent-memory` already encodes deterministically. [C3-Inv2]
6. **Citation cruft:** orphaned `REF_RE` parser + unimplemented docs:check gate; distinct from the LIVE
   bare-anchor skill-composition successor (fork to resolve cold). [C3-Inv1]
7. **Impurity/dup:** clock-in-template seeds, `dream.compact`, `loadNodeConfig`; `organTitle` dup; codex→claude
   sideways adapter edge. [C2 §C/§D]

## D2 — memory decomposition (Operator-driven; FOLDED into §6/§7 + MODEL; reviewer-converged round-2)

Landed this session: **§6** (memory-as-standalone-tool) + **§7** (the 4-part CoALA memory MODEL) + a `MODEL.md`
**BEING/FACE** invariant. Both §6/§7 ran the cold-review loop. Net decisions:

1. **Memory is a standalone module/tool** (`memory`, renamed from `episodic`-the-grey-field-holdover),
   installed once per host like `graphify`/`gh` (`memory install`) — NOT bundled per-harness.
2. **Being/faces ontology:** an agent is a persistent BEING; harnesses are projected FACES; **memory is the
   continuity** that makes the faces one being ⇒ memory lives at a **harness-neutral** home `~/.agents/<name>/`
   (XDG-aware), reachable identically from every face. (Being/faces itself → MODEL.md, not memory-internal.)
3. **`genus/memory.md` = palimpsest → DELETE.** The boundary test: if changing where the module stores data
   forces an edit to an anatomy "doctrine" file, the module isn't encapsulated. The agent references memory via
   ONE thing — the `longTermMemory` organ σ\* enum. Memory module owns tool + skills + store + protocol.
4. **F5/V8 harness-path-templating DISSOLVES** — memory tool on PATH + generic `$AGENT_HOME` + generic
   `$AGENT_SESSION_ID` (retires `CLAUDE_SESSION_ID`) means face bodies are harness-neutral; only the FACE
   artifacts still land per-harness (adapter `paths.ts`, unchanged). Coupling removed, not templated.
5. **Session-lifecycle / consolidation trigger** — see `SESSION-LIFECYCLE.md` v2 (converged, 2 cold reviewers):
   consolidation = agent hot-path (`apply`/`replace` in-turn) nudged by a threshold-gated `turn.end` (Stop)
   hook; cold `session.start` catch-up = data-safe floor; `session.end` = mechanical `release` only; PreCompact
   REJECTED (command-only, no reasoning-injection; against all industry convergence). Sleep-time sidecar DEFERRED.
6. **Braid relocates:** `wake`/`handoff` → thin orchestrators calling memory's named entrypoints
   (`reconstitute`/`consolidate`); no agent skill names `episodic.mjs`; `orient` stays praxis.
7. **§6 round-2 reviewer fixes:** FLAW-A (cross-face session bleed, `store.ts:53` claude-only) → `register`
   binds a session id (harness-native or tool-minted). Doctrine-split reconciled (V4 + VISION): **agent-memory
   = a CANONICAL component distributed as a standalone tool** (mechanism + authored protocol authored-once); the
   V4 reasoning-contract RELOCATES into the module's shipped protocol, not deleted. Distribution = human
   host-bootstrap (`uv tool install` + `memory install`, like graphify — NOT `gh`); `~/.agents/<name>` BARE (not
   XDG); version-compat check; the stranded `stageBundle`/`BundleMissingError` mechanism (memory = sole `bundle:`
   consumer) deleted same wave.
8. **§7 — the 4-part CoALA taxonomy is the memory MODEL** (Working=context/no-store · Episodic · Semantic ·
   Procedural). **`vault` EXTRACTED** (cross-host/networked = out-of-scope anti-pattern, Operator prior epoch);
   this RETRACTS my own FLAW-B "cross-host via vault" (self-inflicted anti-pattern preservation). **Single-host
   is the model.** `AGENTS@node` **EXTRACTED from the memory module** (decided — shared/project-scoped, not
   private cognitive; a plain file-edit, not a tool act): module owns EXACTLY Episodic/Semantic/Procedural
   (+ Working). Project-scoped externalization stays a behavior (agent writes to the project `AGENTS.md` by hand),
   not a store. `replace` now covers 2 prose stores not 4. Session-memory = a view over episodic.

**Forward (next session):** (a) marker-debt: a few §5/§2 ledger rows still lack per-site §6/§7 supersede markers
(§6 lists them; not yet inline). (b) the doc is large (§0–§7 + satellites) → an eventual de-palimpsest rewrite to
net-current. (c) spec wave-2 E-shards (incl. `episodic`→`memory` rename, `bin`+bootstrap, relocate genus+seed into
module, **delete BOTH `vault` and `AGENTS` from `route.ts`/`dream.ts`**, register-mint session-id, per-face
`turn.end` nudge hook). No open design forks remain — nothing in `packages/` touched; design-only, Operator-gated.
