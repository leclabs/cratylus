# plugin-cli

**The plan.** Make the canon **distributable + extensible** without breaking the VISION law ("author semantics
once, realize behavior everywhere; the canon is the source of truth, targets are projections"): a
**package-manager + merge-resolver over a config-cascade graph** (ESLint-flat lineage) where nodes are `fragments`
(dimension-values) and `presets` (agents/skills), npm is distribution, and every artifact is a projection of the
resolved graph. The design is **LOCKED** — the single source of truth is [`NORTH-STAR.md`](./NORTH-STAR.md)
(verification record: [`DESIGN-BRIEF.md`](./DESIGN-BRIEF.md)); this file mirrors execution state. Owner: this
session.

## Design → execution (why now)

`design ≠ execution-spec`: the architecture was exploratory/convergent (census → NORTH-STAR → cold-review →
coherence-hardening ×3) and correctly lived as prose until it LOCKED. These P-shards are authored AFTER the lock,
CITING NORTH-STAR §8, each census-grounded against the live `packages/` tree (`census-not-format`) — not
hand-authored from the outline. Execution touches `packages/` (real code) + will need push (Operator-reserved).

## Shards (MECE — one concern each, census-grounded)

| shard                           | seam                              | concern                                                                                  | state  |
| ------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------- | ------ |
| P1 anatomy-as-plugin            | forge core + anatomy pkg          | mint `defineAgentPlugin` contract; make anatomy the first (publishable) plugin           | done   |
| P2 resolver + patch primitives  | `forge/src/resolve/`              | `resolve()` — the ordered-fold merge core (replace/append/merge/force · loud validation) | active |
| P3 object-import addressing     | `forge/src/catalog` + resolve     | multi-plugin discovery + late-bound binding identity + acyclicity                        | ready  |
| P4 config loader + init/add     | `forge` config + CLI              | `agents.config.ts` (config-is-code) loader · `init`(zero-config)/`add` · `--dry-run`     | ready  |
| P5 explain + provenance         | `forge` CLI                       | `explain <agent>` provenance + first-class `catalog` discovery                           | ready  |
| P6 founding restructure + vocab | `found`/founding-template surface | `found`→`init`-via-defaults; absorbs vocab Stream-B API-identifier rename                | ready  |
| P7 re-signify `--as-plugin`     | `compile` + claude bundle         | free "plugin" for the authoring unit: `--as-plugin` → `--as-claude-bundle`               | done   |

## Dependencies (R) + waves

```
P1 ─┬─▶ P2 ─┬─▶ P4 ─▶ P6
    │       └─────────┐
    └──▶ P3 ──────────┴─▶ P4
    P2 ──▶ P5
P7  (independent)
```

Edges: `P2←P1 · P3←P1 · P4←P2,P3 · P5←P2 · P6←P4 · P7 —`. Dispatch schedule (topo strata):

- **wave 0 (frontier):** `P1` · `P7` — dispatch concurrently.
- **wave 1:** `P2` · `P3` (both ←P1).
- **wave 2:** `P4` (←P2,P3) · `P5` (←P2).
- **wave 3:** `P6` (←P4).

## Notes

- Each shard is blind-dispatchable: self-contained `static` (censused file list) · `scope` · falsifiable `accept`
  (grep + a new unit test + typecheck + cold Ω\* read) · `dep`. Prefer touching the forge CORE
  (doctrine-agnostic) — the anatomy plugin is a peer, not the corpus.
- **Surfaced forks (census-caught, resolved-at-execution):** P4 — the existing `.agent-factory.config` JSON
  (`loadConfig`, deploy topology) vs the new `agents.config.ts` (plugin-extends); recommend `agents.config.ts`
  subsumes it. P3 — the `organ→dimension` rename is `vocab-depalimpsest/C2`, SEQUENCED AFTER this plan; pin the
  current `ORGAN_NAMES` symbols, let C2 sweep.
- push/deploy remain Operator-reserved.
