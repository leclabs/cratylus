# forge-anatomy-debraid — plan memory

_Plan-scope memory sink ([[memory]]). The whole-system model + the two package-maps + the reader-binding history
this session built. Read whole at orient. Design-of-record = `PLAN.md`; this holds the model + open threads._

## The three-package system (one model)

```
agent-anatomy  →  agent-forge  →  deployed ~/.claude/{agents,skills,settings.json}
(σ* canon source)  (projection engine + 16-dialect courier)     agent-memory = runtime the `memory` skill bundles
```

- **agent-anatomy = doctrine/source.** Typed `.ts` cells: organs (value cells = branded σ\* strings), agents
  (organ-selection vectors), skills (SkillCell), hooks (HookCell), genus (`memory.md`,`persona.md`). nico's
  domain. **DEFECT: it forked agent-forge's toolkit** (its own `SkillCell`/`cell.ts`/gates) — see PLAN D-DUP.
- **agent-forge = engine, doctrine-free.** Depends on NOTHING in anatomy. **Two disjoint IRs** (the trap):
  (a) **config-IR** (`src/core/ir/`, generated from JSON Schema) — vendor-neutral client-config superset, 8
  resource types {Rule·Skill·Command·Agent·Hook·McpServer·Permissions·EnvVars}, for read/compile/deploy of
  EXISTING client configs across 16 dialects; (b) **anatomy-IR** (`src/anatomy/index.ts`) — the organ-selection
  shapes {`Agent` vector, `Skill`, `SkillDeploy`} our canon authors, which BYPASS config-IR and go straight to
  markdown via the adapter. **Same names (`Agent`/`Skill`), different types, meet only in an adapter's
  `anatomy.ts`.** The projection DRIVER lives in anatomy (`project-cli.ts`), the LIBRARY in forge — the
  skill-projection path CROSSES the package boundary.
- **agent-memory = runtime.** `episodic.mjs` (JSONL EPISODIC + node(cwd) scope + session-liveness + fold).
  Zero-coupled to forge except deploy-time (seed sidecars if-absent + bundle the tool beside memory's SKILL.md).

## Activation model (how each cell kind deploys — this SETTLES "lifecycle callbacks")

`ActivationMode` (`agent-forge/src/core/engine/boundary.ts`), CLASS→mode total map:
`organ-value→compose-only` (inlined in SOUL) · `agent→identity` (own SOUL.md) · `rule→scope` (AGENTS.md) ·
`skill→trigger` (`/trigger` skills/<name>/SKILL.md) · `hook→event` (merged into settings.json).
**Skills activate by TRIGGER. The ONLY event/lifecycle binding in the whole system is the standalone `Hook` cell.**
There is NO per-skill/per-agent callback surface. So "generic agent-lifecycle callbacks projected via the harness
adapter" = the adapter's GENERIC scaffolding (trigger line + frame + composed-from), NOT a new authored field.
**Open fork (flagged, unresolved):** if the Operator meant skill-scoped hooks (skills binding events), that is a
NEW architecture (skills reaching the `event`/settings.json mechanism they never touch). Confirm before building it.

## agent-forge map (investigator affa022b, file:line)

- **8 config-IR types** — `generated.ts`: Rule(:88) Skill(:137) Command(:190) Agent(:209) Hook(:249 — the ONLY
  event binding, `events:[CanonicalEvent…]`) McpServer(:275 stdio/:313 remote) Permissions(:367) EnvVars(:375).
  All carry `targets?/excludes?` (adapter allow/deny). Source of truth = `src/core/schema/*.schema.json` → `pnpm gen`.
- **`CanonicalEvent` = 28** (`generated.ts:9`): session×3 · turn/prompt×4 · model×2 · tool×3 · file×3 · shell×2
  · mcp×2 · subagent×2 · permission×2 · context×2 · misc×3. Adapters map to native via `EventMap`; claude covers 19/28.
- **Skill projection path** (the load-bearing seam): anatomy `project-cli.ts:146` builds a `ResolvedSkill`
  {name,trigger=`/`+name,description,body,composedFrom} → `claude/anatomy.ts:362 skillToClaudeMd` =
  `frameClaudeMd(skillFrontMatter, skillBody)`. `skillBody`(:241) is the BRAIDED transformer (drops `≜` line :280,
  projects `[[ref]]` :253, filters `## Harness:` :296). `agentBody`(:134) is the CLEAN template (structured vector
  → generated SOUL). A body generator already exists but DISCONNECTED: `core/exemplify/skill-cell.ts:72
renderSkillCellBody` (verb+intro+fenced block, self-sufficiency-enforced) — feeds the config-IR/exemplify path,
  unaware of the anatomy path. **Unify them into the thin generator.**
- **Adapter contract** (`core/adapter/types.ts:92`): `{id,status,capabilities,eventMap?,detect,read,write}`.
  16 registered (claude=all-8-full) + `roo` sunset unregistered (17th on disk).
- **deploy** (`src/deploy/`) consumes an ALREADY-projected render tree — does not project.

## agent-memory map (investigator a90c24b, file:line rel. packages/agent-memory)

- **Build-only tool**, private, zero deps, zero importers. `tsup` bundles `src/bin.ts`→ one `dist/episodic.mjs`.
  Public surface = the CLI verbs only (`cli.ts:main`).
- **⚠ The routing engine ships NOWHERE.** `cli.ts` never imports `dream.ts`/`route.ts` → tree-shaken out. Dream
  pass-2 (semantic routing → SEMANTIC/PROCEDURAL/AGENTS/vault/drop) is executed **by the LLM Dreamer by hand**
  (the `dream` skill); the tool only does pass-1 `fold` + terminal `drain`. `dream.ts`/`route.ts` = the CONTRACT
  the LLM obeys, not shipped runtime.
- **Data:** EPISODIC.jsonl (only store written at capture) · SEMANTIC/PROCEDURAL.md (dream-routing writes,
  seeded by deploy) · sessions/<sid>.json (per-session, concurrency-safe by construction). Record
  {id=ULID,session?,host?,cwd?,body,tags?,routes?}; {session,host,cwd} tool-derived, never caller-supplied.
  Scope = `node(cwd)` computed-never-stored (`node.ts`, total, realpath-canonicalized, `.git`-file→primary).
  Liveness `isLive ⇔ registered ∧ ¬released ∧ age<2h`.
- **Seams:** genus `agent-anatomy/src/genus/memory.md` (`kind:structure render:verbatim deploy:skill-dir
bundle:…`) projects two ways — `## Protocol`→every SOUL's `## Memory Protocol`; `## Tool`→the memory SKILL.md.
  **Contract mirrored by PROSE (memory.md ↔ the runtime), no import edge — primary drift surface.** deploy's
  `bundle.ts` stages `episodic.mjs` beside SKILL.md (hard-error if unbuilt); seeds sidecars if-absent, clobbers SOUL.
- **⚠ `bundle:` path drift (inference):** `memory.md:6` says `bundle: ../episodic/dist/episodic.mjs` but the dir
  is `agent-memory` (no `packages/episodic/`). Likely CLI-supplied `--bundle`; the front-matter path is stale
  rename residue. Verify whether front-matter `bundle:` is read at all.

## Reader-binding history — DO NOT re-litigate (this cost the last session dearly)

The definitive model (Operator, this session): **skill `description` = σ_human\*** (the human-readable selection
line — read by the router doing MATCHING with the skill unloaded; recognizability > density; register-exempt,
NOT E2a-residue-gated). **skill `formalBlock`/payload = σ\*** (LLM-read, the σ\* set-builder). Two LLM-adjacent
readers, two tasks, two registers. This is what **D14 originally said and the last session WRONGLY reverted**
during the E0/D15 unwind — then rebuilt the inverse (description residue-gated as σ\*). The E0 flame ("projected
artifacts are read by LLMs") was about the deployed σ\* PAYLOAD, never the description. **σ\* is fixed at
reader=LLM (no `σ*_R` parameter); `σ_human*` is a separate fixed fn for genuinely human-facing surfaces
(READMEs·commit-msgs·chat·the skill description).** Net: un-gate the description; gate the formalBlock. The
`SkillExpression` brand types the σ\* payload.

## Open threads / forks for the fresh session

1. **Lifecycle-callbacks fork** (above) — generic adapter scaffolding (my read) vs new skill-scoped hooks. Confirm intent.
2. **Where do the gates live?** The residue·symbols·structural-parsimony·accept `cold-oracle` legs are in
   agent-anatomy's forked toolkit. If anatomy consumes forge's IR, do the gates move to forge, stay as an
   anatomy plugin-check, or split? Load-bearing for the MECE cut.
3. **carry-on exemplar** — the Operator's redesign (`carryOnNotation: SkillExpression`, description-as-prose,
   body=fenced `${…}`, composites `${humanOutOfTheLoop}`, drops hotl) is the target shape; generalize it to 15 skills.
4. **`SkillCell` vs config-IR `Skill`** — the naming collision + the two-model duplication is the root; decide the
   single home (agent-forge IR) and the anatomy-side consumption shape.
5. **Re-census at planning** — every count/anchor here rots; verify against the live tree at dispatch.

## Provenance

Bootstrapped 2026-07-07 by nico (session 9737610d), granted agent-forge scope by the Operator. Two read-only
package surveys (affa022b agent-forge · a90c24b agent-memory) fed this. Broken WIP checkpoint `00d19f5`; last
green `7fd1c43`. Detailed shard decomposition deferred to the next session by Operator directive.
