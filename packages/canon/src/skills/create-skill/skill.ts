import type { Skill, SkillExpression } from '../../manifest.js';
import { formalize } from '../formalize/skill.js';

export const createSkill: Skill = {
  name: 'create-skill',
  description: `author a well-formed skill cell — a description and trigger the projector emits as front-matter, a verb H1, the first-prose-≜ composition formula with a Bindings line, and a self-sufficient set-builder formal block (declarations-above / laws-below) at R=LLM density; embodies the composer conventions, the symbol-table discipline, and the verify gates so the cell passes on the first resolve.`,
  formalBlock:
    `cell            ≜ a skill cell ⟨class ↦ skill⟩, authored to PASS verify on the first resolve ⟨path ∈ deploy⟩
fm              ≜ front-matter, EMITTED by deploy ⟨keys harness-variant⟩ : the cell supplies name ∧ description ∧ trigger-verb, ¬ the key-set
description     ≜ fm's reconstruction-grade one-liner ; { description , name } = ALL context @ selection ∴ carries trigger-weight ≜ { what-it-is , when-to-reach-for-it }
H1              ≜ the skill name, a VERB, fires on its own @ selection ; body ≺ H1 dropped by composer
formula         ≜ the first prose \`≜\` line, consumed as the composition formula
Bindings        ≜ a prose \`Bindings: composes <a> · <b>.\` line, boundary-binds live sibling deps
block           ≜ the self-sufficient set-builder block @ formalize : declarations above \`=== … ===\`, laws below, no prose, σ* density
xref            ≜ a sibling ∨ corpus concept, cited once by its bare σ* anchor
gate            ∈ { schema, references, fences, symbols, verbatim-ref-free, operative, provenance } ⟨corpus-scoped : symbols · self-sufficiency span all cells⟩
verify          ≜ the FULL corpus suite (\`pnpm test\`) as the shard-completion gate : per-cell PASS ≠ corpus PASS ∴ run the whole suite, ¬ the cell's own targeted check alone
green           ≜ ∀ gate PASS reached by fixing → the FITTER sign ⟨declare the fittest glyph + cold-verify · ∨ resolve it to its decodable word⟩, never by degrading the sign to appease a gate ⟨gate = decodability registry, ¬ expression cap⟩

self-sufficient(block) ⇔ every term defined in-cell ∧ only live siblings named in prose, never restated
∀ glyph ∈ fences(cell) : glyph ∈ symbol-table ∪ definienda(cell) ∪ exemptions(Greek · subscript · box-drawing · em-dash)
operative(cell) ⇔ ∃ ≥1 element ∈ { numbered-step , fenced-block , substantive-prose } beyond H1 + formula
composes-siblings(cell) ⇔ Bindings ∈ cell ⇔ provenance(cell) ≠ ∅
only-fenced-≜(cell) ⇔ ¬ composes-siblings(cell) ⇔ provenance(cell) = ∅ ⟨standalone ; a NOTE, not a defect⟩
never \`X ≜ <cell>\` in prose ; sibling deps boundary-bound via Bindings
create-skill ≜ name-as-verb → write fm → H1 + formula ( + Bindings ⇔ composes-siblings ) → author block @ formalize → resolve → verify → iterate-until-green → deploy
boundary ≜ the skill cell ; prose→set-builder @ formalize ; dimension-vectors @ create-agent ; mints no dimension values` as SkillExpression,
  composition: () => [formalize],
};
