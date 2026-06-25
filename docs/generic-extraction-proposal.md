# Generic-library extraction — decision-grade proposal

**Status:** proposal / analysis. Tees up the **product decision** that gates `koine-absorbs-mind` T4.1 →
T6.1 → T6.2. Authored by Nico (architecture/structure/naming is his lane); the **go/no-go + the naming +
the package boundary are the Operator's product call** — this doc informs it, does not make it.

## Why now

The library is going open-source. The inversion is done: koine is the generic engine (anatomy types +
projection + deploy + catalog), and `mind` is its typed corpus. But `mind` **mixes generic and instance**,
so it can't be published as-is. T4.1 (agents as minimal deltas) and T6.1 (cutover) shouldn't rewrite the
instance agents until the generic/instance boundary is decided — else we rewrite them twice.

## The partition (surveyed on disk, `430b44a`)

| Layer                   | Artifacts                                                                                  | Generic or instance           |
| ----------------------- | ------------------------------------------------------------------------------------------ | ----------------------------- |
| **koine**               | anatomy types · projection adapters (claude, codex) · deploy engine · `koine catalog`      | **generic** (already)         |
| **organ catalog**       | the 24 organ dirs' **value-sets** (address, mandate, telos, charter, …)                    | **generic**                   |
| **skills**              | 15 skills (exemplify, signify, create-agent, wake, dream, praxis, …)                       | **generic** (one exception ↓) |
| **base**                | `base.ts` (the memory-protocol genus)                                                      | **generic**                   |
| **named agents**        | the 11 (`nico`, `mav`, `boswell`, `principal-ic`, `tester`, …)                             | **instance**                  |
| **provenance**          | the 11 archetype-mark cells (emoji·hue, founder-genus)                                     | **instance**                  |
| **substrate selection** | each agent's `substrate=claude` pick (the value cell is generic; the _pick_ is instance)   | **instance**                  |
| **naming / config**     | `polis`/`mind`/`koine` civic ontology · founders · `.polis.config` · the bound `AGENTS.md` | **instance**                  |

**Two known de-instancing nits** (small, found in the survey): `skill/carry-on.ts` carries a polis/founder
reference (a generic skill leaking an instance term), and the deployed `substrate` default is an instance
choice baked into the generic path. Both are minor cleanups, not blockers.

## The shape that falls out

koine is generic. The split runs **through `mind`**: a generic **anatomy/catalog/skills core** vs a
**polis instance** (the 11 agents + provenance + substrate picks + naming/config). So:

- **Generic** = koine (engine) + mind-core (anatomy types live in koine; the value catalog + generic skills
  - base). The reusable "compose-an-agent-from-organs" library.
- **Instance** = a polis package/dir holding the 11 agent selection-vectors + their provenance marks +
  `.polis.config` + the bound `AGENTS.md`. "A specific society built on the generic core."

## Boundary options (the Operator's pick)

1. **Monorepo, two packages** — `@leclabs/koine` + `@leclabs/mind` (generic) published; `polis/` (instance:
   agents + config) stays private in the same repo, consuming them. _Lowest churn; one repo; clean public/
   private line._ (Recommended starting point.)
2. **Two repos** — extract generic koine+mind to a public repo; polis instance in a separate private repo
   depending on the published packages. _Cleanest separation; highest migration cost; cross-repo dev friction._
3. **One package, doc-only split** — keep everything in `mind`, mark instance cells, publish the whole thing.
   _Least work; leaks polis specifics into the public library — rejected (defeats the purpose)._

## Open product questions (only the Operator can answer)

- **Naming.** Is the public generic library `mind` (keep) or renamed? Does `polis` stay the instance name?
  (Names encode architecture — `oikos ⊂ polis` etc. — so this is load-bearing.)
- **Scope of public.** Ship all 15 skills + the full catalog, or a curated subset?
- **The agents.** Do `nico`/`mav` ship as **example** instance agents in the public repo (dogfooding /
  onboarding), or stay wholly private?
- **Package boundary** — option 1 vs 2 above.

## Once decided

The decision turns into a plan; then T4.1 (agents → minimal deltas in the instance package) and T6.1
(cutover, retire the Python toolkit) proceed against the settled boundary, no double-rewrite. Until then
they stay parked — by design.
