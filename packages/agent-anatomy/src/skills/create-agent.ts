import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';

export const createAgent: Skill = {
  name: 'create-agent',
  description: `author a custom agent as an organ-selection vector — pick each organ's value from the canonical catalog (closed enums + generalized open sets), compose the agent/<name>.md vector, then resolve → verify → deploy; knows the organ anatomy. Can interview a non-engineer in plain language (one question per organ, recommending the fittest) when a human is driving.`,
  formalBlock: `DECLARATIONS
A              — the agent under construction
O              — the organ set : the SOUL \`##\` anatomy sections
catalog        — the canonical value store per organ, enumerated via \`agent-forge catalog\` (never embedded — the live corpus, so this skill never drifts from it)
kind(o)        ∈ { enum, open, coined }                  — enum: closed model-native (pick one member) ; open/coined: extensible (pick the fittest)
arity(o)       ∈ { scalar, set }                         — scalar: one value ; set: a subset
definiens(o,v) — a value's one-line bound, read from the catalog
value(o)       — the selected value(s) for organ o, chosen from catalog(o) by fit to A's purpose
vector(A)      ≜ ⊕{ o ↦ value(o) | o ∈ O }               — an agent IS an organ-selection vector, not prose
instance-bound — provenance (lineage mark) ∧ substrate (model/runtime) : auto-set (mint a fresh mark; substrate ↦ claude), never a catalog pick
ρ              — reader binding : the emitted vector is ρ=LLM (σ*_LLM anchors, \`organ <value>\` lines, no explanatory prose); the interview channel alone is ρ=human

LAWS
∀ o ∈ O : value(o) ∈ catalog(o)                          -- pick from the catalog; a genuine gap ⇒ corpus mutation via exemplify by the owner, NEVER an inline mint / wizard answer
kind(o) = enum ⇒ | value(o) | = 1                        -- closed enum: exactly one member
arity(o) = set ⇒ value(o) ⊆ catalog(o)                   -- set organ: any subset
create-agent ≜ fix(name, purpose) → ( ∀ o : select value(o) ) → assemble vector(A) → write agent/<name>.md → resolve → verify → deploy
write(A)       — front-matter \`kind: agent\`; H1 = the name; body the \`organ <value>\` lines (multi as \`organ { <a> · <b> }\`)
verify(A)      ⇔ PASS gate ∧ gate_agent_organ_refs clean  -- else ⊥
human-driver ⇒ ∀ o : present options(o) with definiens(o,·) ∧ recommend the fittest   -- the enumerated catalog doubles as the plain-language script
boundary       = organs-only                             -- configures organs from the catalog; mints no values; domain skills are create-skill's job` as SkillExpression,
  composition: () => [],
};
