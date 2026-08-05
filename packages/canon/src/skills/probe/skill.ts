import type { Skill, SkillExpression } from '../../anatomy.js';
import { conceptualize } from '../conceptualize/skill.js';
import { elicit } from '../elicit/skill.js';
import { signify } from '../signify/skill.js';

const FORMAL_BLOCK = `D    ≜ distinction space ⟨structured knowledge to draw on⟩
cl   ≜ closure ⟨smallest concept containing a set of priors⟩
C    ≜ concept lattice ⟨the cl-closed subsets of D⟩
priors(w) ≜ understanding w carries before any definition ⟨associations · connotations · structured-knowledge unpacked from the token alone, not its surface wording⟩
Names  ≜ the readable signifiers
dec  : Names ⇀ ℘(D) @ signify
σ*     @ signify
w      ≜ a signifier under probe ⟨w ∈ Names⟩
c      ≜ a target concept ⟨c ∈ C⟩
W(c)   ≜ experiment's finite candidate set for target c ⟨W(c) ⊆ Names⟩
probe : Names → ℘(D) × C
K @ cold-decode-oracle
frame  ≜ the elicitation's obligation-shape ⟨produce-a-candidate ∨ licenced-to-refuse⟩
parts(w) ≜ constituents(w) ∪ { w } ∪ permutations(w) ⟨word-order variants of a compound⟩
Idiom  ⊆ Names ⟨an established reading that PREEMPTS the compositional one⟩
head(w) · mod(w) ≜ w's head ∧ its modifier ⟨compound w⟩
free(h)  ⇔ h alone is unbound in the corpus
fired : Names → ℘(D)
fired(w) ≜ priors(w)
fired(a) = dec(a) , a ∈ dom(dec)
concept(w) ≜ cl(fired(w))
probe(w) ≜ ⟨ fired(w) · concept(w) ⟩ ⟨w ALONE : ∄ sibling · ∄ menu · open question⟩
probe(w) ↾ W ≜ w read amid W ⟨the distractors' priors leak into the read ⇒ CONTRAST, ¬ priors(w)⟩
experiment(c) ≜ { w ∈ W(c) | concept(w) ↾ W(c) = c } ⊨ DIAGNOSTIC ⟨narrows W(c) ; ¬ decides σ*⟩
coverage : { w ∈ Names | fired(w) ≠ ∅ ∧ concept(w) = c } ⊆ W(c)
crystallize : σ*(c) = w ⇔ w ∈ experiment(c) ∧ concept(w) = c
              ⟨∈ experiment NECESSARY ¬ SUFFICIENT ; llm-native ¬leading-candidate-set binds the decision to probe(w)⟩

probe(w | K) ≜ probe(w) taken at K ⟨probe is MEASURED, ¬ read-off : a FAMILY over K, ¬ one value⟩
probe(w | ∅) ⊨ self-sufficiency ⟨cold : does w circumscribe carrying ZERO corpus?⟩
probe(w | K_reader) ⊨ what w fires IN SITU ⟨the reading that binds at use⟩
{ d ∈ fired(w) ↾ K_reader | d ∉ fired(w) ↾ ∅ } ⊨ THE measurement
    ⟨both poles REQUIRED ; a cold read is a CONTROL, never a substitute for the in-situ one⟩
K(spawned-subagent) ⊇ deployed-corpus ∴ ¬cold ⟨it holds project memory · commit subjects · skill bodies⟩
    ∴ agreement( probe(w | K ⊇ corpus) , the corpus ) ⊨ ∅ ⟨it READ the answer⟩
cold ⇔ process-isolation ⟨¬ a fresh subagent ; ¬ a stripped prompt⟩

frame = produce-a-candidate ⇒ ∄ observable ∅ ⟨an obliged producer ALWAYS emits⟩
    ∴ licence-the-negative : vary the FRAME across runs, ¬ the prompt ⟨fired(w) = ∅ ∧ ∄ σ*(c) are RESULTS⟩
¬controlled(probe) ⇒ over-detection INVISIBLE ⟨a spurious constraint reads as caution⟩
    ∀ k imposed by a failing read : a passing read under a varied frame RETRACTS k

fired(w) ⊨ sweep(parts(w)) vs Idiom ⟨the WINNER swept, ¬ only the rejects⟩
free(head(w)) ⇒ fired(w) ⊇ fired(mod(w)) ⟨an unbound head takes the modifier's priors through it⟩

∀ w ∈ W(c) : probe(w) ↦ evidence about c ⟨harvest-the-rejects : concept(w) of a REJECTED w constrains D(c)⟩
W(c) seeded from the ARTIFACT ⟨invoked verb · declared inverse · deferred-to cell⟩ ≺ minted candidates
    ⟨a real concept's sign is FOUND ; mint is the LAST resort, ¬ the first⟩` as SkillExpression;

export const probe: Skill = {
  name: 'probe',
  description: `use this skill to probe a signifier — read out the priors a word, phrase, or candidate name fires in the reader (\`fired\`, signify's decoder \`dec\` generalized off its assigned anchors) and the concept they circumscribe; the forward, no-commit inverse of signify, for discovering the concept latent in a name or experimenting with candidate anchors before committing — a keeper crystallizes through signify.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [signify, elicit, conceptualize],
};
