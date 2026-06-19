---
kind: classification
delineation: The named failure modes of context bloat — each a symptom-cause-fix triple that turns "this context is weak" into a diagnosis with a specific rewrite operator; the diagnostic complement to the density principles, and the same lens reads agent-context, user-facing docs, and any artifact whose merit is meaning-per-token.
---

# Context Pathologies

[[densest-faithful-point]] and [[precise-circumscription]] state the optimum; this names the departures. A pathology is a recurring shape of surplus an author adds while believing it adds precision. As a `classification`, the test that decides which pathology you are looking at _is_ the membership criterion; each row points to the principle it violates.

The canonical taxonomy of context-bloat failure modes:

- **Specification Bloat** — instructions accrete and never retract; the same content is restated across three files instead of homed once. Cause: additive editing with no consolidation pass. Fix: one canonical home ([[cite-dont-copy]]); collapse the restatements.
- **Edge Case Cascade** — a rule grows a tail of special-case exceptions until the exceptions outweigh the rule. Cause: patching the symptom per-incident instead of re-circumscribing the rule. Fix: find the name whose priors already cover the cases ([[precise-circumscription]]); enrich the type, don't relax it.
- **Attention Dilution** — a 40-line diagram or wall of detail buries the one load-bearing fact. Cause: completeness mistaken for clarity. Fix: drop what does not raise fidelity ([[densest-faithful-point]]); keep the diagram to its invariant.
- **Redundant Framing** — re-explaining a relationship the reader's priors already carry ("Navigator works with Flow" where "Navigator _is_ the engine" suffices). Cause: inking the delta the anchor already loads. Fix: name it once at full strength; delete the framing.
- **Premature Elaboration** — speculative fallbacks, defensive guards, and "just in case" branches that no real requirement demands. Cause: hedging dressed as robustness. Fix: build the one job ([[minimalism]]); a "primary + fallback" pair is a smell until the fallback is shown real.
- **Defensive Prohibition** — a growing list of "don't do X" that crowds out the positive instruction. Cause: corrections phrased as bans. Fix: rewrite each "don't X" as "do Y" — state the prescription, not the prohibition.
- **Corrective Spiral** — each correction adds a rule and none retracts one, so the rule corpus ratchets monotonically past the point where inference (which needs slack to recombine priors) gives way to checklist-execution. Cause: corrections that are net-positive on the rule count. Fix: carry the **delta**, not the cumulative — a correction should be net-zero or net-negative on the rule set, the way mission-command issues a brief, not a procedure list.

The taxonomy is open-by-extension; further confirmed rows:

- **Artefact Supremacy** — once a high-fidelity artifact exists, work attaches to polishing _it_ instead of re-deriving from the goal it was meant to serve; the artifact has eaten the goal. Goodhart at the artifact grain ([[metric-is-a-guide-not-a-target]]): the proxy displaced the target.
- **Per-Unit Agent Loop** — looping an agent per file/per component turns a 30-component module into ~150 turns, and a redundant fetch survives into a compiled prompt that already holds the resource. Cache hit-rate without a productive-token denominator hides it. Fix: measure overhead ratio (productive tokens / total), keep the inflation-prone section above the cache boundary, prune the instruction the data already satisfies.

Two properties make the taxonomy load-bearing rather than decorative:

- **Diagnose, then rewrite.** Every row is a symptom→cause→fix triple, never a bare "avoid this." The fix is a concrete operator (home-once, enrich-the-type, drop-the-derivable, prescribe-not-prohibit, carry-the-delta), so "the context is weak" becomes an addressable edit. The shape itself is reusable: name the pathology, supply the rewrite.
- **The same lens reads every artifact class.** Found in agent context, the pathologies apply unchanged to user-facing docs (READMEs, positioning prose, ARCHITECTURE.md), to leadership communication (activity-narration over decision-yield), and to any artifact whose merit is meaning-per-token. The artifact class is a substrate delta; the taxonomy is the universal. Running it as a per-pathology editing pass over a doc is the same operation as running it over a prompt.

## See also

- [[densest-faithful-point]] — the optimum these are departures _from_; its named anti-density patterns (filler, hedging, qualifiers) are the prose-grain rows of this taxonomy.
- [[precise-circumscription]] — Edge Case Cascade and Redundant Framing are failures to find the circumscribing name.
- [[minimalism]] — Premature Elaboration is the speculative-fallback smell this principle forbids.
- [[cite-dont-copy]] — the fix for Specification Bloat: one canonical home, reference don't restate.
- [[metric-is-a-guide-not-a-target]] — Artefact Supremacy is its Goodhart twin at the artifact grain.
- [[anchor-to-the-readers-priors]] — the human-comms reading: activity-narration is the surplus this taxonomy prunes per register.
- [[net-zero-correction]] — the full discipline behind the Corrective-Spiral fix: carry the delta, not the cumulative.
- [[prohibitions-to-prescriptions]] — the full discipline behind the Defensive-Prohibition fix: rewrite "don't X" as "do Y".
