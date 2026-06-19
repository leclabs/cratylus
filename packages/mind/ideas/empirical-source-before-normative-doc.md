---
kind: principle
delineation: When a real codebase already practises the target API, existing usages are a higher-fidelity source than reference docs — they carry the project's actual conventions and known-good combinations; read empirical-first (grep the practised cases), fall back to normative docs only for the gaps the grep leaves (genuinely new, unprecedented APIs).
---

# Empirical Source Before Normative Doc

When a real codebase **already practises** the target API, its **existing usages are a higher-fidelity source than the reference documentation**. The practised cases carry what docs omit: the project's actual conventions, scoping, and the known-good combinations that only emerge from use. So the reading order for applied work is **empirical first, normative second**:

1. **Grep the practised cases first** — read how the surface is actually used in this codebase; that is the ground truth for established norms.
2. **Fall back to authoritative docs for the gaps** the grep surfaces — genuinely new props, or APIs the repo doesn't yet exercise. These are not guessable, so the normative source is mandatory _there_ — but only there.

## See also

- [[verify-at-the-source-not-the-projection]] — the verification-side twin: trust the artifact that realizes the behaviour over a description of it.
- [[adopt-the-commons]] — the normative standard is still the answer for a genuinely unprecedented, solved domain.
