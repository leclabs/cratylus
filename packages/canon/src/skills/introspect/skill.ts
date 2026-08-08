import type { Skill, SkillExpression } from '../../manifest.js';

export const introspect: Skill = {
  name: 'introspect',
  description: `use this skill when an agent needs to self-audit — compare each dimension's defined value against the value actually in effect this session, and name the cause of every divergence.`,
  formalBlock: `A          ≜ the agent introspecting itself
O          ≜ enumerate(## sections @ A's live Target) ⟨READ · ¬ recalled · ∄ fixed-list ∵ corpus declares its own catalog⟩
|O|        ≜ |enumerate(## sections @ A's live Target)| ⟨the DENOMINATOR⟩
V          ≜ the fragment value-space { one-value · value-set · unobservable }
src_def    ≜ A's in-prompt ## Target sections ∪ agent/<A>.md ⟨one selected value per dimension⟩
src_rt     ≜ runtime sources observed this session { live tool/action-set · live model · system-prompt-as-given · autonomy-mode + transient-elevation · deployed front-matter⟨color · mark⟩ · env · granted-permissions }
addresses  : O → concept @ A's archetype ∪ each dimension's role ⟨the concept the fragment must express⟩

def        : O → V @ src_def
rt         : O → V @ src_rt
decode     : O → concept ≜ decode_cold(def(o)) ⟨isolated tool-less read of the declared sign · its own priors · zero project-causes⟩
why        : div → causes

harness-override    ≜ runtime substituted the value ⟨tool-gating · model-pin · env⟩
deploy-drift        ≜ deployed def ≠ source vector ⟨stale ∨ partial deploy⟩
profile-projection  ≜ def projected at a reader/profile that reshaped the value
transient-elevation ≜ a session act flipped it ⟨carry-on : autonomy human-on-the-loop ↦ human-out-of-the-loop⟩
composer-dropped    ≜ projection dropped a facet ⟨the color/mark regression class⟩
env-conditioned     ≜ a host/env fact changed the effective value
unobservable        ≜ runtime value ¬ inspectable ∴ report-as-such ∧ ¬ guess
misnomer            ≜ def faithfully in effect yet the wrong sign for its concept ⟨match(o) ∧ ¬ signifies(o) · a signification defect at def, ¬ a configuration one; the class that hides when rt conforms to a def that is itself mis-signified⟩
K_cfg      ≜ { harness-override · deploy-drift · profile-projection · transient-elevation · composer-dropped · env-conditioned · unobservable }
causes          ≜ K_cfg ∪ { misnomer }

∀ o ∈ O : rt(o) @ src_rt
¬ ( rt ≜ def )
match(o)     ≜ def(o) ≅ rt(o)
signifies(o) ≜ decode(o) ≅ addresses(o)
sound(o)     ≜ match(o) ∧ signifies(o)
div          ≜ { o ∈ O | ¬ sound(o) }
¬ match(o)                ⇒ why(o) ∈ K_cfg
match(o) ∧ ¬ signifies(o) ⇒ why(o) = misnomer
why(o)       ∈ causes , o ∈ div
row(o)       ≜ ⟨ o, def(o), rt(o), match(o), signifies(o), why(o) ↾ o ∈ div ⟩
summary      ≜ { ⟨ o, why(o) ⟩ | o ∈ div }
report       ≜ ⟨ |O|, { row(o) | o ∈ O }, summary ⟩ ⟨|O| STATED⟩
introspect(A) ≜ report
|{ row(o) }| ≠ |O| ⇒ ⊥
rt(o) ⊨ EXERCISED ⟨¬ inferred-from-absence⟩
¬ exercised(o) ⇒ why(o) = unobservable ∧ why(o) ≠ harness-override

¬ edit(agent/<A>.md) ∧ ¬ redeploy ∧ ¬ mint(V)
why(o) ∈ K_cfg            ⇒ reconcile @ { create-agent · deploy }
why(o) = misnomer         ⇒ reconcile @ signify ≺ { create-agent · deploy }
O · causes        @ live-anatomy` as SkillExpression,
  composition: () => [],
};
