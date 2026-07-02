# root-cause — why reader=LLM degrades to reader=human

**Task 1 (frontier).** Identify the root cause(s) of the recurring degradation: R=LLM artifacts (SOULs,
organ definiens, genus blocks) drift to R=human prose despite reader=LLM being the invariant default.
**Diagnose, do not remediate.** Output feeds the gate + formalization tasks.

## Inputs (read these — blind-dispatchable)

- Projector: `packages/agent-forge/src/adapters/claude/anatomy.ts` — `fragmentInlineBody`, `readerListItem`,
  `agentBody` (how a SOUL body is composed; where density does/doesn't apply).
- Genus (verbatim): `packages/agent-anatomy/ideas/memory.md`, `ideas/persona.md`, `src/agents/base.ts`.
- A projected SOUL to measure: `packages/agent-anatomy/.render-ts/agents/nico.md` (body vs protocol bytes).
- Agent vectors + candidate organs: `src/agents/{nico,mav}.ts`; `src/organs/output-format/*`;
  `src/organs/engineering-principles/llm-native.ts`.
- Formalism reference: σ\*\_R / `llm-native` in the `signify` cell + `references/formal-symbolic-notation.md`.

## Leading hypotheses — confirm or refute against ground truth (zero-trust; read the inputs above)

1. **Unenforced bodies.** R=LLM is enforced on the naming axis (THE INVARIANT / `signify`) and on skill
   cells, but NOT on organ definiens or genus bodies — no reader-density gate on bodies; the projector
   inlines definiens **verbatim** (`fragmentInlineBody`), and the `strong-llm-lean` reader-density axis is
   **inert on inlined bodies** (verified 2026-07-01 — it only tunes resolved-`[[anchor]]` list-items).
2. **`verbatim` category error.** `render: verbatim` (`ideas/memory.md`, `ideas/persona.md`) exempts the
   genus from any density discipline → carries R=human prose whole (~44% of a SOUL's bytes).
3. **Anatomy gap.** nico/mav carry `llm-native` as an engineering-**principle** (a disposition), but no
   operative output-contract organ forces R=LLM; `output-format` = visualization / code, not a reader-density.
4. **No agent↔agent discipline.** Delegation prompts + subagent returns default to prose (nico's own included).

## Acceptance

- Each hypothesis **confirmed or refuted** against ground truth (adapter code + value cells + a projected SOUL).
- The dominant cause(s) named, each with the fix-class it implies (gate · anatomy · skill · verbatim-retire).
- Blind test: a fresh reader acts on the diagnosis without re-deriving it.

## Deliverable (accepted 2026-07-01; verdicts re-verified by judge)

- **H1 CONFIRMED (stronger).** No density enforcement on ANY body surface. `densityRef`
  (`agent-forge/src/adapters/claude/anatomy.ts:77`) has ZERO production callers (export + tests only);
  `fragmentBody` inlines definiens verbatim (anatomy.ts:123); acceptance bar is structural only. Naming
  axis gated (THE INVARIANT); bodies never. ⇒ fix_class **gate** (rank 1). Do NOT build on `densityRef`
  as a live mechanism.
- **H3 CONFIRMED + contradiction.** No operative R organ; `output-format` axis = artifact-type, and
  `natural-language.ts` binds "for a human reader" — `principal-ic` carries `llm-native` ∧
  `natural-language` simultaneously (intra-vector contradiction; corpus type-checks it). `llm-native` =
  disposition on 3/11 agents only. ⇒ fix_class **anatomy** (rank 2); gate should add cross-organ
  consistency, not density only.
- **H2 CONFIRMED.** `render: verbatim` (`ideas/{memory,persona}.md`) read as density-immunity; genus =
  4488/10172 B = **44.1%** of nico's SOUL, R=human register throughout. ⇒ fix_class **verbatim-retire**
  (rank 3): retire the immunity reading, keep ship-whole composition; re-author both protocols at R=LLM.
- **H4 CONFIRMED (exhaustive absence).** No delegation-prompt/return register contract anywhere in
  `src/organs/` + `src/skills/`; discipline exists only when hand-retyped per dispatch. ⇒ fix_class
  **skill** + anatomy rider on `delegation` definiens (rank 4).
- **Surprise — calibration set:** the 4 uncommitted densified definiens are before/after exemplar pairs
  for the gate; drift enters silently at authoring, densification costs manual edits — the asymmetry the
  gate inverts.
