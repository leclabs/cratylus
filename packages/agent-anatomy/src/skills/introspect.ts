import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';

export const introspect: Skill = {
  name: 'introspect',
  description: `use this skill when an agent needs to self-audit — compare each dimension's defined value against the value actually in effect this session, and name the cause of every divergence.`,
  formalBlock: `DECLARATIONS

A          — the agent introspecting itself
O          — A's dimension set: the SOUL anatomy \`##\` sections —
             { archetype · role · formality · audience-adaptation · transparency ·
               autonomy · provenance · objective · engineering-principles · guardrails ·
               capabilities · situation-awareness · actions · modalities · model ·
               memory · trigger · framing · reasoning-strategy · satisficing ·
               output-format · self-evaluation · … }
V          — the fragment space : one value · a value-set · \`unobservable\`

src_def    — DEFINITION sources : A's in-prompt SOUL (\`##\` sections) ∪ the canonical dimension-vector agent/<A>.md (one selected value per dimension)
src_rt     — RUNTIME sources, observed THIS session, INDEPENDENT of src_def : the live tool/action set · the live model (\`model\` dimension) · the system prompt as given · the autonomy mode + any transient elevation · the deployed def front-matter (color · mark) · env · granted permissions

def        — def : O → V          the value dimension o is DEFINED to hold (from src_def)
rt         — rt  : O → V          the value actually IN EFFECT (from src_rt)
match      — match : O → bool
div        — the divergent dimensions
K          — the divergence-cause taxonomy
why        — why : div → K        a cause assigned to each divergence

-- K members --
harness-override    — runtime substituted a value (tool gating · model pin · env)
deploy-drift        — stale/partial deploy : deployed def differs from source vector
profile-projection  — def projected at a reader/profile that reshaped the value
transient-elevation — a session act flipped it (e.g. carry-on : autonomy human-on-the-loop ↦ human-out-of-the-loop)
composer-dropped    — projection lost a facet (the color/mark regression class)
env-conditioned     — a host/env fact changed the effective value
unobservable        — runtime value not inspectable ; report as such, never guess

=== introspect : (A) → report ===

observe-independently — rt(o) read from src_rt ALONE ; rt(o) ≜ def(o) FORBIDDEN (vacuous — hides every divergence)

def(o)   ∈ V                                  , o ∈ O
rt(o)    ∈ V                                  , o ∈ O    -- OBSERVED, never inferred
match(o) ≜ ( def(o) = rt(o) )                            -- equal in EFFECT, not in spelling
div      ≜ { o ∈ O | ¬ match(o) }
why(o)   ∈ K                                  , o ∈ div  -- honest \`unobservable\` allowed

row(o)   ≜ ( o, def(o), rt(o), match(o), why(o) when o ∈ div )
report   ≜ ( { row(o) | o ∈ O } , summary(div, why) )

-- emit one row per dimension ; the summary lists only the MATERIAL divergences + causes

boundary — read-only self-audit : introspect REPORTS ∧ ¬edit(dimension-vector) ∧ ¬redeploy ∧ ¬mint(V)   -- reconciling drift is create-agent's / deploy's, never introspect's ; O ∧ K are read from the live anatomy` as SkillExpression,
  composition: () => [],
};
