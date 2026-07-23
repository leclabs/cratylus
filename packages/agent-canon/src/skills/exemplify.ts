import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { conceptualize } from './conceptualize.js';
import { materialize } from './materialize.js';
import { signify } from './signify.js';

const FORMAL_BLOCK = `-- Concept-contract --
Concept     ≜ ⟨ gloss , anchor? , factorization? ⟩
produce     : D → Concept                                 -- conceptualize: fills gloss   (cut at meaning joints)
name        : Concept → Concept                           -- signify:       fills anchor  (each concept → its σ*)
realize     : Concept → Concept                           -- materialize:   fills factorization (bipartite normal form)
realized(k) ⇔ factorization(k) ≠ ⊥

-- Reader binding --
readers(k)  — the realized artifact's operative consumers ; reader-binding home: signify
ρ(k)        ≜ human ⇔ readers(k) = {human} ; LLM otherwise
register(k) — the register the realized body is authored in
conform(k)  ⇔ register(k) = ρ(k)

-- Cold-decode gate --
R_cold(f)   ≜ the isolated cold-blind decode of fragment f (a naive reader, zero project-K, from f's signifiers + inline ≜ alone) ; instrument home: cold-decode-oracle
coldpass(k) ⇔ R_cold(body(k)) ≅ gloss(k)  ∧  decode_warm(body(k) | K) ≅ R_cold(body(k))

-- Canonical-semantic-factorization --
REC_R(k)    — reconstruction from anchors: by value if primitive, by reference if composite
valid(k)    ⇔ REC_R(k) ≽ k  ∧  minimal(k)  ∧  conform(k)  ∧  coldpass(k)

-- No-permissive-defaults --
s = ∅ ⇒ ⊥

-- The pipeline --
F(D)         ≜ realize( name( produce(D) ) )
exemplify(D) ≜ accept( F(D) )

accept      — the gate ; self-applied to every cell : the corpus's own test, no anchor grandfathered
accept(k)   ≜ ⊥          ,  ¬realized(k)
accept(k)   ≜ k          ,  valid(k)
accept(k)   ≜ ⊥          ,  ¬valid(k)

manifest    — R3 routing manifest, emitted on accept : .manifests/<source>.json, one entry per concept c ∈ C_R, keyed by fragment_digest (NFC + whitespace-collapse + trim) ; each c in routes[] (α · reuse | mint) XOR delta[] ; an unrouted concept is the dropped idea R3 catches
manifest    ≜ { source , exemplified_at , reader , routes[⟨fragment_digest, idea_gloss, home_slug, disposition, rank⟩] , delta[⟨fragment_digest, idea_gloss⟩] }
∀ c ∈ C_R : c ∈ routes ⊻ c ∈ delta` as SkillExpression;

export const exemplify: Skill = {
  name: 'exemplify',
  description: `optimize a context corpus into a canonical semantic factorization — compose produce → name → realize over the one concept-contract record, then gate on accept; emits the R3 routing manifest that catches the dropped idea.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [conceptualize, signify, materialize],
};
