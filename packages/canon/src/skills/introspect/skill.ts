import { primePrinciple } from '../../genus/prime-principle.js';
import type { Skill, SkillExpression } from '../../manifest.js';

export const introspect: Skill = {
  name: 'introspect',
  description: `use this skill when an agent needs to self-audit — compare each factor's defined values (each at its enforcement level) against the values actually in effect this session, and name the cause of every divergence.`,
  formalBlock: `A          ≜ the agent introspecting itself
O_text     ≜ enumerate(\`###\` factor headings @ A's live Target) ⟨READ · ¬ recalled · \`##\` ≜ a group ∴ ∉ O⟩
O_bind     ≜ enumerate(binding factors @ \`cratylus catalog\`) ⟨never text · compiled to agent-harness tool · dispatch · model-role settings⟩
O          ≜ O_text ∪ O_bind ⟨∄ fixed-list ∵ corpus declares its own catalog · enforcement-level ≜ an attribute of each entry ∴ ∉ O⟩
|O|        ≜ |O_text| + |O_bind| ⟨the DENOMINATOR⟩
V          ≜ the entry value-space { one-entry · entry-set · one-entry-per-slot · unobservable } ⟨entry ≜ value @ level { advisory · firm · fixed }⟩
src_def    ≜ A's in-prompt \`###\` Target factors ∪ agent/<A>.md ⟨front-matter ↦ O_bind⟩ ⟨the entries held per factor⟩
src_rt     ≜ runtime sources observed this session { live tool/action-set · live dispatchable agents · live model · system-prompt-as-given · autonomy-mode + transient-elevation · deployed front-matter⟨color · mark⟩ · env · granted-permissions }
addresses  : O → concept @ A's identity ⟨name · description · mark · key ≜ ∅⟩ ∪ each factor's role ⟨the concept the fragment must express⟩

def        : O → V @ src_def
rt         : O → V @ src_rt
decode     : O → concept ≜ decode_cold(def(o)) ⟨isolated tool-less read of the declared sign · its own priors · zero project-causes⟩
why        : div → causes

harness-override    ≜ runtime substituted the value ⟨tool-gating · model-pin · env⟩
deploy-drift        ≜ deployed def ≠ source vector ⟨stale ∨ partial deploy⟩
profile-projection  ≜ def projected at a reader/profile that reshaped the value
transient-elevation ≜ a session act flipped it ⟨autonomy human-in-the-loop ↦ human-on-the-loop⟩
composer-dropped    ≜ projection dropped a facet ⟨the color/mark regression class⟩
env-conditioned     ≜ a host/env fact changed the effective value
unobservable        ≜ runtime value ¬ inspectable ∴ report-as-such ∧ ¬ guess
misnomer            ≜ def faithfully in effect yet the wrong sign for its concept ⟨match(o) ∧ ¬ signifies(o) · a signification defect at def, ¬ a configuration one; the class that hides when rt conforms to a def that is itself mis-signified⟩
K_cfg      ≜ { harness-override · deploy-drift · profile-projection · transient-elevation · composer-dropped · env-conditioned · unobservable }
causes          ≜ K_cfg ∪ { misnomer }

∀ o ∈ O : rt(o) @ src_rt
¬ ( rt ≜ def )
match(o)     ≜ def(o) ≅ rt(o) ⟨values ∧ their levels⟩
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
  preamble: primePrinciple,
};
