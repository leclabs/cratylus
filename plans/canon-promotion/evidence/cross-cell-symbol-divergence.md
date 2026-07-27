# Measured: 26 cross-cell divergent symbols in the live skill corpus

Census run 2026-07-27 over `src/skills/*/skill.ts`, using the gate's own
`obligationsOf()` extractor. **308 declared symbols; 26 are declared in ≥2 cells with ≥2
distinct assigned concepts.**

## Why this is a defect and not a curiosity

`signify` declares `α : C ↣ Names` **injective**, and states the law outright:

```
α(cᵢ) = α(cⱼ) ⇒ D(cᵢ) = D(cⱼ)
```

One name ⇔ one concept, corpus-wide. But `symbol-probe-gate.ts` keys every obligation
`${cell}␟${symbol}` — **per cell**. So a sign assigned concept A in cell X and concept B in
cell Y raises two independent obligations, each of which round-trips green on its own,
while together they violate injectivity. The gate cannot see it by construction.

This is the `altitude` law: a sign taken at another altitude **in the same corpus** is still
a collision. It is also exactly what bit this session — `register` already means _artifact
register_ (`signify:25`, `σ* ∨ human`), which killed the anchor `register-relative-decode`
before it was ever authored.

## The 26

```json
["A","C","D","K","Names","O","P","S","boundary","c","cl","concept-record","dec","dream",
 "gate","green","intent","kind","memory","prim(c)","read","realize","release","resume","σ*","≺"]
```

Worst case measured — `K`, one sign across four concepts:

| cell        | assigned concept                                     |
| ----------- | ---------------------------------------------------- |
| materialize | the closed kind set                                  |
| introspect  | `K_cfg ∪ { misnomer }`                               |
| exemplify   | project-K, the warm knowledge a reader already holds |
| elicit      | the live candidate set ; `K ⊆ C`                     |

Others with genuinely distinct senses: `intent` (praxis: the stated goal / introspect: the
concept a fragment addresses) · `kind` · `S` · `O` · `gate` (dream: the audit verb / create-agent:
the test suite) · `read` · `release` · `green` · `boundary` · `c` · `cl` · `realize` · `dream` ·
`resume` · `memory` · `P` · `≺` · `concept-record`.

## The false-positive class — why a naive gate must NOT ship

`C · D · Names · σ* · dec · A · prim(c)` are **deliberate cross-cell references**, not
collisions: `probe` re-declares them with a short gloss and an `@ signify` pointer. Same
concept, shorter gloss. A gate that flagged those would be wrong on 7 of 26 — and a gate
that cries wolf on legitimate shared vocabulary trains every future agent to ignore it,
which is worse than no gate.

**∴ the mechanizable leg is DETECTION; the classification (shared-reference vs collision)
is an agent judgment**, exactly like the gate's existing `needs-probe` verdict. Build it
that way or not at all.

## Shape the gate should take

1. Detect divergence mechanically (this census IS the detector — ~20 lines).
2. Require every divergence to carry an explicit recorded classification; an unclassified
   one routes to `needs-classification` and does **not** pass.
3. Ratchet shrink-only, per `cratylism.test.ts`: a divergence that gets resolved must be
   REMOVED from the ledger, and a pin that stops diverging FAILS — so debt only goes down.
4. Calibrate on a known-failing artifact before trusting it (`apparatus-under-zero-trust`).

The 26 are visible debt and a worklist, not a reason to weaken the assertion.
