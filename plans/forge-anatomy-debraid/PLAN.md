# forge-anatomy-debraid

**Status: BOOTSTRAP — awaiting detailed decomposition by a fresh planning session.** This session diagnosed the
mess + captured the whole-system model (`AGENTS.md`, the memory sink); it did NOT author the shards. The next
session wakes here, reads `AGENTS.md`, and cuts the MECE slices/waves.

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
- **D-READER · skill `description` = σ_human\*, not σ\*.** Operator-definitive: the `description` is the
  human-readable selection line (σ_human\*, register-exempt), NOT the σ\* payload. The canon-collapse work
  wrongly residue-gated it (E2a scope) and reverted D14 which had it right. `formalBlock` is the σ\* payload
  (LLM-read). Un-gate the description; keep `formalBlock` gated. (Full reader-binding history in `AGENTS.md`.)
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

## Coarse slices (a SKETCH for the fresh session — not the final cut)

1. **IR-UNIFY** — anatomy consumes agent-forge's `Skill`/`Agent` IR; retire the forked toolkit types.
2. **ADAPTER-THIN** — strip the adapter to a generic-IR→harness map; delete the dead palimpsest.
3. **SKILL-SHAPE** — delete `body`; `formalBlock: SkillExpression` sole payload; adapter generates SKILL.md.
4. **READER-FIX** — `description` = σ_human\* (un-gate E2a; register-exempt); carry-on composites `${humanOutOfTheLoop}`.
5. **GATES** — relocate/align the residue·symbols·parsimony·accept gates to the unified IR (are they anatomy's or forge's?).
6. **(watch, maybe out-of-scope)** — memory-contract prose-duplication + `bundle:` rename drift (investigator flags in `AGENTS.md`).

The fresh session must verify the MECE cut, the R (dep) edges, and the wave schedule — and re-census every claim
against the live tree (this doc's counts/anchors rot).

## Handoff

Broken-state handoff to a NEW session for detailed planning. This session's context (the whole-system model, the
two package-maps, the reader-binding history, file:line anchors) lives in **`plans/forge-anatomy-debraid/AGENTS.md`**
— read it whole at orient. No task-files authored yet (all state folders empty); the fresh session cuts them.

## See also

`AGENTS.md` (the memory sink — the full model + maps) · `MODEL.md`/`VISION.md` (the canon root) ·
`agent-forge/src/anatomy/index.ts` (the generic IR) · `agent-forge/src/adapters/claude/anatomy.ts` (the braided adapter).
