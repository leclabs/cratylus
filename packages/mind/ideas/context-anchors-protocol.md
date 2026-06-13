---
kind: process
delineation: Counter context-drift by re-installing durable anchors mid-session — surface the agent's believed context (a cognizant dump), diff against canon, re-point each divergence to its canonical home, persist out-of-band; re-anchor, don't re-load.
---

# Context-Anchors Protocol

**Context-drift**: over a long session an agent's grounding decays — early instructions lose salience, the working model diverges from canon, corrective patches accrete. It is [[context-pathologies]] (Attention Dilution + Corrective Spiral) observed over time; gradual and self-masking. This protocol is the **intervention**.

1. **Surface.** Trigger a [[cognizant]] dump — the agent states verbatim the instructions/goals/constraints it believes are in force. Drift shows as omissions, mutations, or invented constraints.
2. **Diff against canon.** Compare to the load-bearing sources (CLAUDE.md, the plan, the task spec); each divergence is a drift point.
3. **Re-install anchors.** Restate each canonical anchor as a short, high-salience pointer — not a re-explanation ([[cite-dont-copy]]).
4. **Persist out-of-band** so a compaction or fresh session re-hydrates from canon, not the drifted set.

**Re-anchor, don't re-load.** Re-pasting the whole spec re-bloats context and re-triggers the dilution; an anchor is the minimum token that re-raises salience and routes back to canon.

## See also

- [[cognizant]] — produces the diagnostic dump that seeds step 1.
- [[context-pathologies]] — drift is Attention Dilution + Corrective Spiral over time.
- [[context-not-prose]] — an anchor points; it never restates.
