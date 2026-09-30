import { primePrinciple } from '../../genus/prime-principle.js';
import type { Skill, SkillExpression } from '../../manifest.js';
import { conceptualize } from '../conceptualize/skill.js';
import { signify } from '../signify/skill.js';

export const formalize: Skill = {
  name: 'formalize',
  description: `use this skill to convert prose — especially of a process or skill — into a self-sufficient set-builder block under self-sufficient-formalism: conceptualize the prose to its entities/operations/laws, name each as a symbol (a core agent dimension name or value by its signify anchor, minted or boundary-bound; any other term as the industry's own), and emit declarations-above / laws-below with no explanatory prose; accept only on round-trip equivalent-or-better.`,
  formalBlock: `prose ≜ the source text
E ≜ entities(prose) ; O ≜ operations(prose) ; L ≜ laws(prose)

T ≜ the declared notation table @ src/operator-lexicon.ts
η : E ∪ O ⇀ symbols ⟨core agent dimension names and values @ signify · every other term the industry's own⟩
β ≜ { s | s imported, its anchor cited once in adjacent notation }
ι ≜ { s | s resolved from invocation context }

B ≜ formalize(prose) such that :
    ∀ e ∈ E      : signature(η(e)) ∈ B
    ∀ o ∈ O ∪ L  : law(η(o)) ∈ B

Dfn ≜ { s | a line of B defines s }
closed(B)   ⇔ symbols(B) ⊆ T ∪ Dfn ∪ β ∪ ι
complete(B) ⇔ ∀ b ∈ behavior(prose) : ∃ line ∈ B : line ⊨ b
ordered(B)  ⇔ ∀ s ∈ Dfn : definition(s) precedes use(s)
self-sufficient(B) ⇔ closed(B) ∧ complete(B) ∧ ordered(B)
gloss(B) ≜ prose of B beyond β ∪ ι ; gloss(B) ≠ ∅ ⇒ ¬complete(B)
¬self-sufficient(B) ⇒ ⊥

s ∉ T ⇒ extend T with s ; ¬ degrade the notation to a weaker one already in T ⟨llm-native · a block's notation answers to no cold decode⟩

reconstruct(B) ≽ prose
reconstruct(B) ⋡ prose ⇒ ⊥` as SkillExpression,
  composition: () => [conceptualize, signify],
  preamble: primePrinciple,
};
