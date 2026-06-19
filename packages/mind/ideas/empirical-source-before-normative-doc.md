---
kind: principle
delineation: When a real codebase already practises the target API, existing usages are a higher-fidelity source than reference docs — they carry the project's actual conventions and known-good combinations; read empirical-first (grep the practised cases), fall back to normative docs only for the gaps the grep leaves (genuinely new, unprecedented APIs).
---

# Empirical Source Before Normative Doc

1. Grep the practised cases first — that is the ground truth for this codebase's norms.
2. Consult authoritative docs only for the gaps the grep leaves (props the repo doesn't yet exercise); there it is mandatory.

## See also

- [[verify-at-the-source-not-the-projection]] — the verification-side twin: trust the artifact that realizes the behaviour over a description of it.
- [[adopt-the-commons]] — the normative standard is still the answer for a genuinely unprecedented, solved domain.
