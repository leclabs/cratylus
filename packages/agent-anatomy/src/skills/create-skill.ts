import type { SkillCell } from '../toolkit/skill-cell.js';

export const createSkill: SkillCell = {
  name: 'create-skill',
  description: `skill-cell ≜ ⟨description · trigger · verb-H1 · composition-formula ∧ Bindings · body ⟨declarations ≺ laws⟩⟩ ↾ R=LLM · self-sufficient ∧ verify-gates ⇒ first-resolve-green`,
  composition: ['formalize'],
  body: `

# create-skill

create-skill ≜ author a \`skill/<verb>.md\` cell that passes verify on the first resolve: well-formed front-matter, a verb H1, a prose-≜ composition formula, and a self-sufficient set-builder block at \`σ*_LLM\` density.

Bindings: composes formalize.

Reader is the LLM (\`σ*_LLM\`). A skill is a **self-sufficient** unit: the formal block stands alone (every term defined in-cell); only live **sibling skills** are named, in prose, never restated. Symbol table: \`src/toolkit/operator-lexicon.ts\`.

## Conventions (each maps to a verify gate)

- **Front-matter** — \`kind: skill\`; \`description:\` a reconstruction-grade one-liner (this + the name are ALL that is in context at skill-selection, so the description carries the trigger-weight — say what it is and when to reach for it); \`trigger: /verb\` (read verbatim → host \`skills/<verb>/SKILL.md\`); optional \`skill_description:\` for host-side discovery copy.
- **H1 = the skill name, a VERB.** Progressive disclosure puts only name + description in context at selection, so the name must fire on its own. ⚠ All body **before the first H1 is silently dropped** by the composer — never put content above it.
- **Composition formula** — the **first prose \`≜\` line** is consumed as the formula. Boundary-bind dependencies with a prose **\`Bindings: composes <a> · <b>.\`** line — never write \`X ≜ <cell>\` in prose. A skill whose only \`≜\` is fenced math composes **EMPTY provenance** (a \`NOTE\`, legitimate only for a genuinely standalone skill; otherwise add a Bindings line).
- **Formal block** — author it via formalize: declarations **above** a \`=== … ===\` divider (every entity/operation/law named here), laws **below** (no prose). Dense, symbolic, anchor-bearing.
- **Symbols** — every glyph inside a fence must be in the symbol table ∪ the cell's definienda ∪ exemptions (Greek, subscripts, box-drawing, em-dash); an undeclared glyph FAILs the SYMBOLS gate with its codepoint.
- **Cross-reference by bare anchor** — a sibling or corpus concept is cited by its bare \`σ*_LLM\` anchor (\`formalize\`, \`signify\`); the wikilink form is retired. Inside a fence a cross-reference is a bare symbol; in prose it is the bare anchor, cited once.
- **Operative** — ≥1 operative element (a numbered step, a fenced block, or substantive prose) beyond the heading + formula, or the OPERATIVE gate FAILs.

## Procedure

1. Name the skill as a **verb**; write the \`kind: skill\` front-matter (description + trigger).
2. Write the H1, then the first prose \`≜\` formula; add a \`Bindings:\` line iff it composes sibling skills.
3. Author the self-sufficient formal block via formalize (declarations-above / laws-below); keep every fenced glyph in the symbol table or β-bound in adjacent prose.
4. Resolve → verify; the cell must PASS **schema + references + fences + symbols + verbatim-ref-free + operative + provenance**. Iterate until green; then deploy as a skill.

## Boundary

Authors the **skill cell**; the deep prose→set-builder conversion is formalize's; agent organ-vectors are create-agent's. Mints no organ values.
`,
};
