# organ-catalog

**Goal.** Make the organ value catalog **richer** and **discoverable by the builder skill**, so
`create-agent` has more — and always-current — values to compose from. Two halves: (1) widen the
value-sets (more real distinctions per organ); (2) kill the drift between the builder's option-space and
the live corpus by single-sourcing + enumerating the catalog instead of hand-embedding it.

**Why now.** The inversion (`koine-absorbs-mind`) made the catalog typed TS organ modules
(`packages/mind/src/organs/<organ>/*.ts`) and made koine the tooling layer. But `create-agent` still
carries a **hand-maintained catalog table in its skill body** — a static snapshot that drifts the moment
a value is added. Enriching the catalog (C1/C2) without fixing discovery (C3) means editing that table by
hand every time. Fix discovery first, then enrichment is purely additive.

**Substrate (done, in `koine-absorbs-mind`).** Catalog = typed `Fragment` modules; anatomy = koine types
(24 organ types); projection + deploy = koine. This plan builds on that, does not redo it.

**Acceptance discipline (every value).** A new value is a corpus mutation via the pipeline
(conceptualize → signify → verify PASS), not a paste. Each `definiens` is **R=LLM-dense** (one firing
clause, never the human explanatory paragraph — prose-bloat = wrong-anchor signal). MECE against existing
values (a new value must carve a genuinely distinct distinction, not duplicate one). Round-trip /
byte-identical projection holds. Lane: Nico = catalog content + create-agent contract; Mav = `koine catalog` CLI.

## Frontier (ready)

**C3 + C1 done.** C2 is the remaining task.

## Pending

- **C2** — **organ-library robustness**: blind-introspection round (the `canonical-organ-values`
  methodology) over the OPEN organs; widen genuinely-sparse value-sets so `create-agent` has fuller
  option-spaces. Mint only real gaps (no bloat); each value R=LLM-dense + MECE + gated. **Carry-in from
  C1:** evaluate `human-in-command` (the HATL/governance axis) as a possible **charter** value vs the
  existing `human-oversight` / `scope-of-authority` / `accountability` — a different organ than `address`.

## Completed

- **C3** — `koine catalog` enumeration verb (type-derived `ANATOMY` descriptor, drift-proof) +
  `create-agent` rewritten to discover via it (embedded table gone). The builder's option-space now tracks
  the corpus with zero drift. Commits `4b5dca0` + `8f457b9` (koine) · `b3576e6` (skill).
- **C1** — **negative result**: the blind σ\*\_LLM/MECE gate rejected both candidates from `address`
  (`human-beside-the-loop` collapses into on-the-loop; `human-above-the-loop` is off-axis = governance /
  human-in-command). Enum stays `in/on/out`; the governance axis was folded into the sharpened
  `human-out-of-the-loop` definiens (`ab2a84f`) and carried to C2 as a charter question.

## Notes

- C3 is the **enabling** task — land it (or at least the single-sourcing half) before C1/C2 so the
  builder's option-space tracks the corpus automatically and enrichment never touches a hand-maintained list.
- `koine catalog` keeps koine **doctrine-agnostic**: koine owns the _mechanism_ (read a typed organ-module
  corpus → emit `organ → [{slug, definiens}]`), mind owns the _data_ (the values). Mirrors T3.1's
  "deploy consumes a render tree, not the corpus."
