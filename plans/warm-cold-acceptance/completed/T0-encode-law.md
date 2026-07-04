# T0 · encode-law

**Wave** 0 · **Deps** none · **State** ready

## Objective

Author the **warm≡cold acceptance criterion** as a single self-sufficient project rule fragment,
in agent-factory's own formal register (declarations-above / laws-below set-notation). This fragment
becomes the project's _written acceptance test for operating on its own source_ — the law all
subsequent phases enforce. It must itself satisfy the law it states (test case #0).

## Shared definitions (canonical — this task MINTS them; downstream tasks reference)

```
R_cold(f)   ≜ decode of fragment f by a naive, ISOLATED LLM — from f's own signifiers (+ inline ≜)
              ALONE, zero project context. The party-invariant ORACLE.
truth(f)    ≜ R_cold(f)                                  -- a fragment's meaning IS its cold-blind decode
K           ≜ the loaded project context (the warm corpus)
decode_warm(f | K) ≜ f's reading by an LLM with K loaded (a warm agent-factory session)
parties P   = { operator, nico-outside, nico-inside }    -- the human + both agent faces

DESIGN-CRITERION   : ∀ f ∈ corpus . decode_warm(f | K) ≡ truth(f)
                     -- loading project context CONFIRMS a fragment's self-sufficient meaning,
                        never overrides it. Warm is where this matters MOST (context masquerades
                        as authority).
NOISE-DETECTOR     : decode_warm(f | K) ≢ truth(f)  ⇒  PROJECT DEFECT, exactly one of:
     m1  ¬self-sufficient(f)          → fix f (carry its meaning inline)
     m2  ∃ n ⊆ K . contradicts(n, f)  → hunt & DELETE n (a DRY/MECE second, competing home)
CORRECTION         : realign the PROJECT toward truth(f). NEVER bend f toward K.
                     corpus = defendant · R_cold = oracle.
COMMUTUAL-UNDERSTANDING ≜ ∀ p ∈ P . ∀ f . interp_p(f) ≡ R_cold(f)
                     -- all parties agree by each equalling the oracle (transitive through the
                        fixed point), never by pairwise negotiation.
```

## Steps

1. Locate the project's canonical home for load-bearing principles/laws (rules or engineering-
   principle fragments). Do NOT read unrelated corpus fragments — only the rule-home's structure.
2. Author the fragment in the canonical register: declarations above, laws below, no explanatory
   prose, R=LLM density. Include the definitions above verbatim as the law's body.
3. Bind it as a first-class project law (the acceptance criterion for source operations), not a
   comment or a doc aside.

## Acceptance (falsifier)

- FAIL if the fragment cannot be cold-blind decoded to the intent above by an isolated reader
  (run it through T1's oracle once T1 lands; until then, an isolated `claude -p "explain:\n\n<fragment>"`
  from a scratch dir OUTSIDE the repo). A decode that omits the noise-detector, the correction
  DIRECTION (project→truth, never f→K), or the oracle-as-arbiter ⇒ FAIL.
- FAIL if the fragment relies on any surrounding prose to carry its meaning (¬self-sufficient).
- FAIL if it is filed as non-load-bearing (a comment/aside rather than an enforced law).

## Return

The fragment's final path + the fragment text + the isolated cold-blind decode transcript proving
`R_cold(fragment) ≡ intent`.

---

## Outcome — PASS via Ts adoption (2026-07-03)

Pre-completed: the warm session already minted the law as
`packages/agent-anatomy/src/organs/engineering-principles/cold-decode-oracle.ts`. Re-gated by the T1
oracle (Ts·GateA): R_cold recovers oracle-as-arbiter + m1/m2 + correction-direction — `R_cold(fragment) ≡ intent`.
Adopted as-is. The fragment is LEANER than this task's suggested verbatim-definitions method (omits the
`parties P`/COMMUTUAL-UNDERSTANDING block) — deliberately: the oracle falsifier is decode≡intent (PASS), and
parsimony/DRY favor the lean law; parties-commutation is ratified at T4, not restated in the deployed fragment.
