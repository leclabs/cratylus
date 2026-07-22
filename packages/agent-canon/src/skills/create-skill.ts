import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { formalize } from './formalize.js';

export const createSkill: Skill = {
  name: 'create-skill',
  description: `author a well-formed skill cell — kind:skill front-matter (description + trigger), a verb H1, the first-prose-≜ composition formula with a Bindings line, and a self-sufficient set-builder formal block (declarations-above / laws-below) at R=LLM density; embodies the composer conventions, the symbol-table discipline, and the verify gates so the cell passes on the first resolve.`,
  formalBlock: `DECLARATIONS
cell           — a skill cell : \`skill/<verb>.md\`, authored to PASS verify on the first resolve
fm             — front-matter : \`kind: skill\` ∧ \`description\` (reconstruction-grade one-liner — this + the name are ALL that is in context at selection, so it carries the trigger-weight: what it is ∧ when to reach for it) ∧ \`trigger: /verb\` ∧ optional \`skill_description\`
H1             — the skill name, a VERB (fires on its own at selection ; body BEFORE the first H1 is silently dropped by the composer)
formula        — the first prose \`≜\` line, consumed as the composition formula
Bindings       — a prose \`Bindings: composes <a> · <b>.\` line — boundary-binds sibling deps ; never write \`X ≜ <cell>\` in prose
block          — the self-sufficient set-builder block, authored via formalize : declarations above a \`=== … ===\` divider, laws below (no prose), at σ*_LLM density
xref           — a sibling / corpus concept cited by its bare σ*_LLM anchor (the wikilink form is retired), cited once
gate           ∈ { schema, references, fences, symbols, verbatim-ref-free, operative, provenance }   — the verify gate-set

LAWS
self-sufficient(block) ⇔ every term defined in-cell ∧ only live siblings named (in prose), never restated   -- reader = LLM (σ*_LLM)
∀ glyph ∈ fences(cell) : glyph ∈ symbol-table ∪ definienda(cell) ∪ exemptions(Greek · subscript · box-drawing · em-dash)   -- else the SYMBOLS gate FAILs with its codepoint
operative(cell) ⇔ ∃ ≥1 operative element (a numbered step ∨ a fenced block ∨ substantive prose) beyond heading + formula   -- else OPERATIVE FAILs
only-fenced-≜(cell) ⇒ EMPTY provenance (a NOTE)          -- legitimate only for a genuinely standalone skill ; else add a Bindings line
create-skill ≜ name-as-verb → write fm → H1 + formula ( + Bindings iff it composes siblings ) → author block via formalize → resolve → verify( ∀ gate : PASS ) → iterate-until-green → deploy
boundary       = the skill cell ; the deep prose→set-builder conversion is formalize's ; dimension-vectors are create-agent's ; mints no dimension values` as SkillExpression,
  composition: () => [formalize],
};
