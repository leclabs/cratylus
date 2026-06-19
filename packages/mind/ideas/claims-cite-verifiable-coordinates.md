---
kind: principle
delineation: Require every agent claim to carry a re-verifiable artifact coordinate — file:line, function name, the exact import — so the assertion is grounded at write-time and hallucination is exposed on the spot (you cannot cite what you did not read), turning each claim into its own retrieval lineage.
---

# Claims Cite Verifiable Coordinates

Require an agent to attach a **re-verifiable coordinate** to every claim it makes: `read X.vue (lines 1–150)`, `imports Y for Z`, the exact symbol — not the ungrounded summary `this handles job-posting creation`. The constraint does two things at once: it **forces grounding in the artifact** at write-time, and it **exposes hallucination on the spot**, because an agent cannot cite a coordinate it did not actually read. The citation _is_ the retrieval lineage — the claim and the evidence for it travel together.

This is the claim-grain discipline of the corpus's source-over-projection stance: a claim's coordinate points back at the artifact that realizes it ([[verify-at-the-source-not-the-projection]]), so any reader (or a later pass) can re-open that coordinate and confirm. A claim without a coordinate is an assertion to be trusted; a claim with one is a pointer to be checked.

## See also

- [[verify-at-the-source-not-the-projection]] — the coordinate points at the realized artifact; this is its claim-level instance.
- [[cite-dont-copy]] — a coordinate is a pointer into the one canonical home, never a restatement of it.
- [[empirical-source-before-normative-doc]] — the practised source you cite the coordinate from is the higher-fidelity ground.
