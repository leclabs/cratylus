# forge-anatomy-debraid

**Status: COMPLETE — all 7 shards green, committed `a581206` (local; push/deploy pending Operator).** Verified on
a clean isolated worktree, cache bypassed: 940 pass / 1 skip / 0 fail; `COLD_ORACLE_LIVE accept()` holds ∀ corpus
cell; projection deterministic; false-green scrutiny mutation-proved the rewritten gate tests. Diagnosis +
whole-system model in `AGENTS.md`. Retires once the Operator lands (push + deploy) — then dir removed + dream.

**Authority.** Operator granted nico **agent-forge scope** (engine) in addition to agent-anatomy (corpus) —
"work in Mav's scope so you see the full picture." Whole-repo planning; execution delegable to Mav/developer.

## Intent

**De-braid the `agent-anatomy` ↔ `agent-forge` boundary.** agent-anatomy is a **plugin** of agent-forge; it must
CONSUME agent-forge's generic `Skill`/`Agent` IR, not reimplement a parallel toolkit. Today the same concept is
modeled twice and drifting, and the adapter (the dialect courier) does canon-layer work. Collapse to: **one IR
(agent-forge), a thin adapter (generic-type → harness format only), a structured skill cell that GENERATES its
projection** (never a stored/re-parsed markdown body).

## The diagnosis (grep-grounded this session)

- **D-DUP · agent-anatomy forked agent-forge's toolkit.** `src/toolkit/{skill-cell.ts, cell.ts (parseSkill·
firstFenceInterior), codegen.ts}` + its own `cold-oracle/{residue,symbols,structural-parsimony,accept}` gates
  reimplement what agent-forge's `anatomy/index.ts` (`Skill`, `Agent`, `SkillDeploy`, `ANATOMY`) already types.
  A plugin that forked its host's types → double model, hand-synced, drifting. **Root braid.**
- **D-ADAPTER · the adapter inverted its job.** `agent-forge/src/adapters/claude/anatomy.ts` `skillBody` PARSES
  canon semantics at projection: strips the `≜` composition-formula line, projects `[[refs]]`→`/trigger`, selects
  `## Harness:` sections, re-emits markdown. **Nearly all DEAD on the live corpus** (grep: `[[ref]]`=**0**,
  `## Harness:`=**0** in 15 skills; `ReaderDensity`/`densityRef` byte-identical output = dead; `bodyHash`/
  `provenanceHeader` exported-uninjected = dead). A near-verbatim port of the retired Python `compose_skill`
  markdown pipeline = **palimpsest**. An adapter must be a THIN generic-IR→harness map, nothing more.
- **D-BODY · the stored `body` is a projection artifact.** `SkillCell.body` (the full markdown, with a fenced
  copy of the formalBlock) is DERIVED (`firstFenceInterior(body)` recovers the payload) — parsing-to-recover-
  separable-content, the anti-pattern the `formalBlock` field existed to avoid. `body` must not be stored; the
  adapter GENERATES the SKILL.md (mirror `agentBody`'s vector→SOUL generation; a generator already exists,
  disconnected, at `agent-forge/src/core/exemplify/skill-cell.ts` `renderSkillCellBody`).
- **D-READER · reader-binding is PER-FIELD, not per-file ("exempt" was wrong framing).** Each authored field has
  its own binding — σ\* (payload: organ value · skill `formalBlock` · agent `persona`) vs σ_human\* (selection
  line: skill `description` · agent `description`). The file-level altitude was an artifact of organ cells having
  ONE field (the σ\* value); skills/agents have multiple fields, different bindings. The skill `description` is
  σ_human\* (not "exempt" — a different field-binding; NOT residue-gated); `formalBlock` is σ\* (gated). The
  canon-collapse work wrongly residue-gated the description (E2a) and reverted D14 which had it right. (Full
  history in `AGENTS.md`.)
- **D-AGENT-DESC · agents need a `description` field — same bug, one level up.** Agents have NO `description`
  field, but `agentFrontMatter` maps `persona`(σ\*) → the SOUL frontmatter `description:` — shipping the σ\*
  identity as the σ_human\* selection line the subagent-router reads. **Add `agent.description` (σ_human\*, →
  frontmatter); `persona` stays σ\* (→ SOUL body `## Persona`); drop the persona→description map.**
- **D-SKILLEXPR · type the payload.** `formalBlock` should be a typed `SkillExpression` (branded σ\* string,
  parity with organ-value brands) so the gate type-checks a value instead of string-scraping a fence.

## Target architecture (design intent — the fresh session ratifies + refines)

```
SkillCell (agent-forge IR, consumed by anatomy) = { name · description[σ_human*] · formalBlock[σ*: SkillExpression] · composition }
   — NO `body` field.
adapter.skillToClaudeMd(skill) = frontmatter{name·description·trigger} + body-GENERATED{ #verb · fenced formalBlock · "Composed from …" }
   — pure map; no parsing, no [[ref]] scan, no ## Harness select, no density/banner. memory `deploy:skill-dir` bypass kept.
```

`agentBody`/`agentToClaudeMd` is the template: structured vector → generated artifact, nothing re-parsed. Unify
the two disconnected skill renderers (anatomy `skillBody` ↔ exemplify `renderSkillCellBody`) into the one thin
generator, preserving only what the LIVE corpus needs (which the grep says is: frontmatter + fenced block +
composed-from — the dead ref/harness/density logic is deleted, not relocated).

## Starting state — a DELIBERATELY BROKEN checkpoint (read first)

- **`00d19f5`** (`chore(wip): broken state …`) — the current HEAD. The Operator's partial `delineation`→`description`
  - `formalBlock`→`body` find-replace. **Does NOT compile** — `TS1117`/`TS2300` name collisions (`formalBlock`
    renamed onto the pre-existing `body` field; `cell.ts ParsedSkill` duplicate `body`). This is INTENTIONAL
    direction, not breakage to diagnose. It also introduced a `SkillExpression` branded type + a redesigned
    carry-on exemplar (`carryOnNotation: SkillExpression`, description-as-prose, body = fenced `${…}`) showing the
    target shape. **A blind executor must be told: red is expected; realize the direction, don't revert.**
- **`7fd1c43`** — last fully-green commit (the canon-collapse landing, pre-cleanup). The clean rollback base.
- Branch `tmp-illustrate-conceptual-architecture`.

## Design calls (resolved by the sharding session — decisions of record)

1. **`body` is GENERATED, not stored.** `SkillCell = { name · description[σ_human*] · formalBlock[σ*:
SkillExpression] · composition }`, no `body` field; the adapter generates SKILL.md. The carry-on WIP still
   carries a thin `body` — that is scaffolding to remove, NOT the target (storing `body = f(name, formalBlock)`
   is the parse-to-recover / DRY anti-pattern this de-braid exists to kill). _Chosen against the literal
   exemplar, on argument — flagged to the Operator; one word reverts to a thin authored `body`._
2. **The cold-oracle gates STAY in anatomy** (retyped onto forge's `SkillExpression`), not migrated into forge.
   forge is doctrine-free and depends on nothing in anatomy; the gates ARE the σ\* doctrine.
3. **Lifecycle-callbacks = generic adapter scaffolding, not skill-scoped hooks.** Settled by the activation
   model (`boundary.ts`: skills activate by trigger; the only event binding is the standalone `Hook` cell).
   Skills-bind-events would be a separate new-architecture initiative — out of scope here.

## Shards + waves (the materialized mirror — authority is the state folders, not this doc)

| Wave | Shard                          | Territory                                                                                                    | State         |
| ---- | ------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------- |
| 0    | **S1 · IR-RESHAPE**            | forge `anatomy/index.ts`                                                                                     | `completed` ✓ |
| 1 ∥  | **S2 · CELLS-MIGRATE**         | anatomy `skills/*` ×15 + `agents/*` ×10 (owns the skill import-flip)                                         | `completed` ✓ |
| 1 ∥  | **S4 · GATES-RETYPE**          | anatomy `cold-oracle/*`                                                                                      | `completed` ✓ |
| 2 ∥  | **S3 · ADAPTER-THIN**          | forge `claude/anatomy.ts` + `project-cli` + exemplify renderer + composition→lazy-thunk IR + test-d          | `completed` ✓ |
| 2 ∥  | **S2b · FORMALBLOCK-COMPLETE** | anatomy `skills/*` ×15 — fold operative body-content into the sole-payload formalBlock                       | `completed` ✓ |
| 3    | **S5 · TOOLKIT-RETIRE**        | anatomy `toolkit/{skill-cell,cell,codegen}` deleted + composition-wire (15) + gate-caller fixup + codex-leak | `completed` ✓ |
| 4    | **S6 · VERIFY-GREEN**          | whole repo (clean worktree, cache-bypassed, live cold-oracle) + false-green scrutiny                         | `active`      |

**Dependency edges `R`:** S1 → {S2, S4}; {S1, S2} → {S3, S2b}; {S2, S2b, S3, S4} → S5 → S6. (S3 ∥ S2b: disjoint
territory — S3 = forge adapter, S2b = anatomy cell content.)

**Execution findings (mid-flight, mine to adjudicate):** (i) **formalBlock-completeness** — with `body` dropped,
the sole-payload formalBlock must carry all operative content; the old markdown bodies held some the formal
block didn't (`dream` confirmed: lock-precondition + periodic cascade) → **S2b** audits + folds. The
body-generate call HOLDS (the body was a 2nd source of truth). (ii) **composition** — forge's eager `Skill[]`
can't express the cyclic skill graph → **lazy thunk** `() => readonly Skill[]` (S3 IR + generator; S5 wires
cells). Both reversible, in-remit — decided, not escalated.
**Watch (S6 reports, does not fix):** memory-contract prose-duplication + `bundle:` path drift.

Re-census note: every count/anchor in the diagnosis rots — each shard RE-GREPs its territory at dispatch.

## Handoff

Broken-state handoff to a NEW session for detailed planning. This session's context (the whole-system model, the
two package-maps, the reader-binding history, file:line anchors) lives in **`plans/forge-anatomy-debraid/AGENTS.md`**
— read it whole at orient. No task-files authored yet (all state folders empty); the fresh session cuts them.

## See also

`AGENTS.md` (the memory sink — the full model + maps) · `MODEL.md`/`VISION.md` (the canon root) ·
`agent-forge/src/anatomy/index.ts` (the generic IR) · `agent-forge/src/adapters/claude/anatomy.ts` (the braided adapter).
