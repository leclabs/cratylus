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

| Task   | Lane     | What                                                                                                                                                             |
| ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C3** | Nico+Mav | **De-drift the builder**: single-source the catalog; `koine catalog` enumeration verb; `create-agent` discovers via it (drop the embedded table). ENABLES C1/C2. |
| **C1** | Nico     | **Address autonomy-ladder enrichment**: add `human-beside-the-loop` + `human-above-the-loop` (blind-verified, MECE vs the existing 3).                           |

## Pending

- **C2** — **organ-library robustness**: blind-introspection round (the `canonical-organ-values`
  methodology) over the OPEN organs; widen genuinely-sparse value-sets so `create-agent` has fuller
  option-spaces. Mint only real gaps (no bloat); each value R=LLM-dense + MECE + gated.

## Notes

- C3 is the **enabling** task — land it (or at least the single-sourcing half) before C1/C2 so the
  builder's option-space tracks the corpus automatically and enrichment never touches a hand-maintained list.
- `koine catalog` keeps koine **doctrine-agnostic**: koine owns the _mechanism_ (read a typed organ-module
  corpus → emit `organ → [{slug, definiens}]`), mind owns the _data_ (the values). Mirrors T3.1's
  "deploy consumes a render tree, not the corpus."
