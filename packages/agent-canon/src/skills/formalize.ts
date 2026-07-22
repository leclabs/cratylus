import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { conceptualize } from './conceptualize.js';
import { signify } from './signify.js';

export const formalize: Skill = {
  name: 'formalize',
  description: `use this skill to convert prose — especially of a process or skill — into a self-sufficient set-builder block under self-sufficient-formalism: conceptualize the prose to its entities/operations/laws, signify each as a symbol (minting or boundary-binding to an anchor), and emit declarations-above / laws-below with no explanatory prose; accept only on round-trip equivalent-or-better.`,
  formalBlock: `P ≜ the source prose
E ≜ entities(P) ; O ≜ operations(P) ; L ≜ laws(P)

T ≜ the declared notation table (src/toolkit/operator-lexicon.ts)
η : E ∪ O ⇀ symbols              signify : mint a symbol, or bind an imported one to its anchor
β ≜ { η(x) | x imported }        boundary-bound : its anchor named in adjacent prose, cited once
ι ≜ { s | s resolved from invocation context }

σ* ≜ signify's fittest sign — the densest name circumscribing a concept at R = LLM ; boundary-bound to signify, cited once

B ≜ formalize(P) such that :
    ∀ e ∈ E      : signature(η(e)) ∈ B        declarations above
    ∀ o ∈ O ∪ L  : law(η(o)) ∈ B              comprehensions and laws below
    ∀ line ∈ B : line = σ*(its concept)     B is the σ* of P

-- self-sufficient(B) : closed ∧ complete ∧ ordered ; prose beyond β ∪ ι is a defect
S ≜ symbols(B) ; Dfn ≜ { s | a line of B defines s }
closed(B)   ⇔ S ⊆ T ∪ Dfn ∪ β ∪ ι
complete(B) ⇔ ∀ b ∈ behavior(P) : ∃ line ∈ B : line ⊨ b
ordered(B)  ⇔ ∀ s ∈ Dfn : definition(s) precedes use(s)
self-sufficient(B) ⇔ closed(B) ∧ complete(B) ∧ ordered(B)
gloss(B) ≜ prose of B beyond β ∪ ι ; gloss(B) ≠ ∅ ⇒ ¬complete(B)
¬self-sufficient(B) ⇒ ⊥

-- T is a decodability REGISTRY, not an expression cap ⟨llm-native⟩ : the fittest sign wins
σ*(c) ∉ T ⇒ extend T with σ*(c) ⟨cold-verify⟩ ; ¬ degrade c to a weaker α ∈ T ∵ α ≠ σ*(c)

-- accept gate : the round-trip reconstructs P equivalent-or-better
reconstruct(B) ≽ P                            input-typed ≽ terminus ; accept
reconstruct(B) ⋡ P ⇒ ⊥                        repair the block, never prop it with prose` as SkillExpression,
  composition: () => [conceptualize, signify],
};
