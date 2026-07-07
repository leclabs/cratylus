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

## Reader-binding — PER-FIELD, not per-file ("exempt" was the wrong framing; Operator, definitive)

**Reader-binding is a property of each authored FIELD, not the cell/file.** There is no "σ\* cell with an exempt
field" — the description is not an EXCEPTION to a σ\* rule, it is a σ_human\* field.

- **σ\*** (formal, model-read) — the PAYLOAD fields: organ value · skill `formalBlock` · agent `persona`.
- **σ_human\*** (human-text, selection-read) — the SELECTION-LINE fields: skill `description` · agent `description`.

The old FILE-level framing was an artifact: an organ cell carries a SINGLE field (the value), which is σ\*, so
"the organ file is σ\*" read as true — but the real statement is "the organ VALUE FIELD is σ\*." Skills/agents
carry MULTIPLE fields with different bindings; that is where the altitude broke. σ\* is fixed at reader=LLM (no
`σ*_R` parameter); σ_human\* is a separate fixed fn (human-facing surfaces: READMEs · commit-msgs · chat · the
skill/agent description). **Net:** the description is σ_human\* (NOT residue-gated — not "exempt", just a
different field-binding); `formalBlock`/persona are σ\* (gated). The `SkillExpression` brand types the σ\* payload.

**⚠ AGENT DEFECT (same problem, one level up — Operator).** Agents have NO `description` field, yet
`agent-forge/src/adapters/claude/anatomy.ts agentFrontMatter` maps **`persona` → the SOUL frontmatter
`description:`** (`description = emoji + a.persona`). So the σ\* `persona` ships as the σ_human\* selection line
the subagent-router reads — identical to the skill bug. **FIX: add `agent.description` (σ_human\*, → SOUL
frontmatter `description`); `persona` stays σ\* (→ SOUL body `## Persona`); drop the persona→description map.**
Evidence: well-formed agents in the harness roster carry "Use this agent when…" (σ_human\*) descriptions; nico/mav
show only the archetype line — the persona leaking through.

_History note: the last session WRONGLY reverted D14's correct `description`=σ_human\* during the E0/D15 unwind
and rebuilt the inverse (description residue-gated as σ\*); the E0 flame was about the deployed σ\* PAYLOAD, never
the description. Do not re-litigate this axis._

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
