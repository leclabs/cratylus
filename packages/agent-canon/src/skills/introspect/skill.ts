import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';

export const introspect: Skill = {
  name: 'introspect',
  description: `use this skill when an agent needs to self-audit — compare each dimension's defined value against the value actually in effect this session, and name the cause of every divergence.`,
  formalBlock: `A          ≜ the agent introspecting itself
O          ≜ A's live ## SOUL dimension-sections { archetype · role · formality · audience-adaptation · transparency · autonomy · provenance · objective · engineering-principles · guardrails · capabilities · situation-awareness · actions · modalities · model · memory · trigger · framing · reasoning-strategy · satisficing · output-format · self-evaluation · … }
V          ≜ the fragment value-space { one-value · value-set · unobservable }
src_def    ≜ A's in-prompt ## SOUL sections ∪ agent/<A>.md ⟨one selected value per dimension⟩
src_rt     ≜ runtime sources observed this session { live tool/action-set · live model · system-prompt-as-given · autonomy-mode + transient-elevation · deployed front-matter⟨color · mark⟩ · env · granted-permissions }

def        : O → V @ src_def
rt         : O → V @ src_rt
why        : div → K

harness-override    ≜ runtime substituted the value ⟨tool-gating · model-pin · env⟩
deploy-drift        ≜ deployed def ≠ source vector ⟨stale ∨ partial deploy⟩
profile-projection  ≜ def projected at a reader/profile that reshaped the value
transient-elevation ≜ a session act flipped it ⟨carry-on : autonomy human-on-the-loop ↦ human-out-of-the-loop⟩
composer-dropped    ≜ projection dropped a facet ⟨the color/mark regression class⟩
env-conditioned     ≜ a host/env fact changed the effective value
unobservable        ≜ runtime value ¬ inspectable ∴ report-as-such ∧ ¬ guess
K          ≜ { harness-override · deploy-drift · profile-projection · transient-elevation · composer-dropped · env-conditioned · unobservable }

∀ o ∈ O : rt(o) @ src_rt
¬ ( rt ≜ def )
( rt ≜ def ) ⇒ div = ∅
match(o)   ≜ def(o) ≅ rt(o)
div        ≜ { o ∈ O | ¬ match(o) }
why(o)     ∈ K , o ∈ div
row(o)     ≜ ⟨ o, def(o), rt(o), match(o), why(o) ↾ o ∈ div ⟩
summary    ≜ { ⟨ o, why(o) ⟩ | o ∈ div }
report     ≜ ⟨ { row(o) | o ∈ O }, summary ⟩
introspect(A) ≜ report

¬ edit(agent/<A>.md) ∧ ¬ redeploy ∧ ¬ mint(V)
reconcile  @ { create-agent · deploy }
O · K      @ live-anatomy` as SkillExpression,
  composition: () => [],
};
