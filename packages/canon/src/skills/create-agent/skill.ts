import type { Skill, SkillExpression } from '../../manifest.js';

export const createAgent: Skill = {
  name: 'create-agent',
  description: `author a custom agent as a factor-selection vector — pick each factor's values, each at its enforcement level, from the canonical catalog (the model's own latent sets, per-agent open ones, the corpus's curated ones and the design's fixed lists), compose the agent cell, then resolve → verify → deploy; knows the factor manifest and the groups it files factors in. Can interview a non-engineer in plain language (one question per factor, recommending the fittest) when a human is driving.`,
  formalBlock: `A               ≜ the agent under construction
O               ≜ the factor set @ \`cratylus catalog\` ⟨each o ∈ O filed in one group(o)⟩
G               ≜ the factor groups ⟨ordered by first appearance @ catalog⟩
group           : O → G
catalog         ≜ the canonical value store per factor @ \`cratylus catalog\` ⟨live · never embedded⟩
repertoire      : O → { latent, open, curated, fixed } ⟨who owns the value-set⟩
latent          ≜ a value-set the MODEL owns ⟨read out, ¬ authored⟩
open            ≜ a value-set the AGENT owns ⟨named per-agent⟩
curated         ≜ a closed catalog the CORPUS assembled
fixed           ≜ a closed list the DESIGN fixes
arity           : O → { scalar, set, slots, attribute }
scalar          ≜ one value
set             ≜ a subset
slots           ≜ exactly one value per named slot(o) ⟨in slot order⟩
attribute       ≜ no field on A ⟨its values are attributes of the values A holds⟩
projection      : O → { text, binding }
text            ≜ rendered into A's Target ⟨\`##\` group(o) · \`###\` o · one line per entry⟩
binding         ≜ never text ⟨compiled to the agent harness's tool · dispatch · model-role settings⟩
level           ≜ the enforcement-level factor's values { advisory, firm, fixed } ⟨arity attribute⟩
default(o)      ≜ o's level @ catalog ⟨∅ ⇒ none applies⟩
entry(o, v)     ≜ ⟨ v, level, slot ⟨arity slots⟩, note ⟨a qualifier the design states⟩ ⟩
O_A             ≜ { o ∈ O | arity(o) ≠ attribute } ⟨the fields A holds⟩
definiens(o, v) ≜ v's one-line bound @ catalog
fit(v)          ⇔ v suits A's purpose
fittest(o)      ≜ the best-fitting v ∈ catalog(o)
value(o)        ≜ the selected entries of catalog(o) by fit
vector(A)       ≜ ⊕{ o ↦ value(o) | o ∈ O_A }
identity(A)     ≜ ⟨ name, description, mark : emoji·hue, key ≜ ∅ ⟩ ⟨authored per-agent · ∉ catalog ∴ ∉ O · never shared across agents · key reserved for ipseic agents⟩
human-project   ≜ downstream human projection @ llm-native

∀ o ∈ O_A : value(o) ⊆ catalog(o)
arity(o) = scalar ⇒ | value(o) | = 1
arity(o) = slots ⇒ ∀ s ∈ slots(o) : | { e ∈ value(o) | slot(e) = s } | = 1
required(o) ⇒ value(o) ≠ ∅
∀ e ∈ value(o) : level(e) ≜ the stated level ∨ default(o)
gap(o) ⇔ ∄ v ∈ catalog(o) : fit(v)
gap(o) ⇒ catalog := exemplify(catalog) @ owner ⟨¬ inline · ¬ wizard · repertoire(o) = fixed ⇒ owner ≜ the design⟩
verify(A) ⇔ PASS gate ∧ gate_agent_dimension_refs clean
gate            ≜ the FULL corpus suite (\`pnpm test\`) as the shard-completion gate : per-agent PASS ≠ corpus PASS ∴ run the whole suite, ¬ the dimension-ref check alone
green           ≜ ∀ gate PASS reached by fixing → the FITTEST value ⟨gap(o) → exemplify catalog(o)⟩, never by degrading fit to appease a gate ⟨gate = a fit registry, ¬ a cap⟩
interview = human-project ⟨the human-driver elicitation⟩
human-driver ⇒ ∀ o ∈ O_A : present ⟨catalog(o) · definiens(o, ·) · default(o)⟩ ∧ recommend fittest(o)
boundary ≜ factors-only · domain-skills @ create-skill

create-agent ≜ fix(identity(A), purpose) → ( ∀ o ∈ O_A : select value(o) ) → assemble vector(A) → write(A) → resolve → verify(A) → iterate-until-green → deploy
write(A)     ≜ the cell ⟨class ↦ agent⟩ : identity(A) · one field per o ∈ O_A ↦ value(o) as entries ⟨[] ≜ held empty⟩ ⟨path ∧ front-matter ∈ deploy ; its Target ≜ \`# <mark> <name>\` · description · \`##\` group · \`###\` text factor ⟨binding ∉ Target body⟩ ; REGENERABLE ∴ ¬ hand-edit⟩` as SkillExpression,
  composition: () => [],
};
