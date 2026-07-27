import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';

export const createAgent: Skill = {
  name: 'create-agent',
  description: `author a custom agent as a dimension-selection vector — pick each dimension's value from the canonical catalog (closed enums + generalized open sets), compose the agent/<name>.md vector, then resolve → verify → deploy; knows the dimension anatomy. Can interview a non-engineer in plain language (one question per dimension, recommending the fittest) when a human is driving.`,
  formalBlock: `A               ≜ the agent under construction
O               ≜ the dimension set @ SOUL \`##\` anatomy sections
catalog         ≜ the canonical value store per dimension @ \`agent-forge catalog\` ⟨live · never embedded⟩
openness        : O → { enum, open, coined }
enum            ≜ a closed, model-native value-set
open, coined    ≜ an extensible value-set
arity           : O → { scalar, set }
scalar          ≜ one value
set             ≜ a subset
definiens(o, v) ≜ v's one-line bound @ catalog
fit(v)          ⇔ v suits A's purpose
fittest(o)      ≜ the best-fitting v ∈ catalog(o)
value(o)        ≜ the selected member(s) of catalog(o) by fit
vector(A)       ≜ ⊕{ o ↦ value(o) | o ∈ O }
instance-bound  ≜ provenance⟨lineage-mark⟩ ∧ substrate⟨model/runtime⟩ ⟨auto-set · fresh mark · substrate ↦ claude · ∉ catalog⟩
human-project   ≜ downstream human projection @ signify

∀ o ∈ O : value(o) ∈ catalog(o)
openness(o) = enum ⇒ | value(o) | = 1
arity(o) = set ⇒ value(o) ⊆ catalog(o)
gap(o) ⇔ ∄ v ∈ catalog(o) : fit(v)
gap(o) ⇒ catalog := exemplify(catalog) @ owner ⟨¬ inline · ¬ wizard⟩
verify(A) ⇔ PASS gate ∧ gate_agent_dimension_refs clean
gate            ≜ the FULL corpus suite (\`pnpm test\`) as the shard-completion gate : per-agent PASS ≠ corpus PASS ∴ run the whole suite, ¬ the dimension-ref check alone
green           ≜ ∀ gate PASS reached by fixing → the FITTEST value ⟨gap(o) → exemplify catalog(o)⟩, never by degrading fit to appease a gate ⟨gate = a fit registry, ¬ a cap⟩
interview = human-project ⟨the human-driver elicitation⟩
human-driver ⇒ ∀ o : present ⟨catalog(o) · definiens(o, ·)⟩ ∧ recommend fittest(o)
boundary ≜ dimensions-only · domain-skills @ create-skill

create-agent ≜ fix(name, purpose) → ( ∀ o : select value(o) ) → assemble vector(A) → write(A) → resolve → verify(A) → iterate-until-green → deploy
write(A)     ≜ ⟨ front-matter \`kind: agent\` · H1 ≜ name · body ≜ the \`dimension <value>\` lines ⟨multi: \`dimension { <a> · <b> }\`⟩ ⟩ @ agent/<name>.md` as SkillExpression,
  composition: () => [],
};
