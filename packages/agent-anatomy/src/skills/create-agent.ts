import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';

export const createAgent: Skill = {
  name: 'create-agent',
  description: `author a custom agent as a dimension-selection vector — pick each dimension's value from the canonical catalog (closed enums + generalized open sets), compose the agent/<name>.md vector, then resolve → verify → deploy; knows the dimension anatomy. Can interview a non-engineer in plain language (one question per dimension, recommending the fittest) when a human is driving.`,
  formalBlock: `DECLARATIONS
A              — the agent under construction
O              — the dimension set : the SOUL \`##\` anatomy sections
catalog        — the canonical value store per dimension, enumerated via \`agent-forge catalog\` (never embedded — the live corpus, so this skill never drifts from it)
kind(o)        ∈ { enum, open, coined }                  — enum: closed model-native (pick one member) ; open/coined: extensible (pick the fittest)
arity(o)       ∈ { scalar, set }                         — scalar: one value ; set: a subset
definiens(o,v) — a value's one-line bound, read from the catalog
value(o)       — the selected value(s) for dimension o, chosen from catalog(o) by fit to A's purpose
vector(A)      ≜ ⊕{ o ↦ value(o) | o ∈ O }               — an agent IS a dimension-selection vector, not prose
instance-bound — provenance (lineage mark) ∧ substrate (model/runtime) : auto-set (mint a fresh mark; substrate ↦ claude), never a catalog pick
ρ              — reader binding : the emitted vector is ρ=LLM (σ*_LLM anchors, \`dimension <value>\` lines, no explanatory prose); the interview channel alone is ρ=human

LAWS
∀ o ∈ O : value(o) ∈ catalog(o)                          -- pick from the catalog; a genuine gap ⇒ corpus mutation via exemplify by the owner, NEVER an inline mint / wizard answer
kind(o) = enum ⇒ | value(o) | = 1                        -- closed enum: exactly one member
arity(o) = set ⇒ value(o) ⊆ catalog(o)                   -- set dimension: any subset
create-agent ≜ fix(name, purpose) → ( ∀ o : select value(o) ) → assemble vector(A) → write agent/<name>.md → resolve → verify → deploy
write(A)       — front-matter \`kind: agent\`; H1 = the name; body the \`dimension <value>\` lines (multi as \`dimension { <a> · <b> }\`)
verify(A)      ⇔ PASS gate ∧ gate_agent_dimension_refs clean  -- else ⊥
human-driver ⇒ ∀ o : present options(o) with definiens(o,·) ∧ recommend the fittest   -- the enumerated catalog doubles as the plain-language script
boundary       = dimensions-only                             -- configures dimensions from the catalog; mints no values; domain skills are create-skill's job` as SkillExpression,
  composition: () => [],
};
