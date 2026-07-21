# plugin-cli — NORTH-STAR (target architecture, net-current)

Author: nico (design authority). Grounded in the 2026-07 surface + σ\*/catalog census; the E1 recharacterization
verified by isolated cold reads (`DESIGN-BRIEF.md`). ρ=LLM. **This is the single source of truth for the plugin
architecture.** Remaining gate before sharding: cold-review (§8).

Grounding law (VISION): "author semantics once, realize behavior everywhere; the canon is the source of truth,
targets are projections." The plugin architecture makes the canon **distributable + extensible** without breaking
that law.

## 1. The shape in one line

A **package-manager + merge-resolver over a config-cascade graph** (ESLint-flat-config lineage — cold-verified),
where the nodes are namespaced semantic **fragments** (organ-values) and **composites** (agents/skills), npm is the
distribution layer, and every runtime artifact is a deterministic projection of the resolved graph.

## 2. Distribution — the 3 packages become CLI-core + plugins (grounded in the package census)

| package           | role                                                                                                   | change from today                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **agent-forge**   | the CLI core + resolver + IR + adapters. `npx agent-forge`.                                            | already publishable (bin, exports, zero cross-deps). ADD `forge/src/resolve/` + the plugin-loader; keep it doctrine-agnostic. |
| **agent-anatomy** | **the default PLUGIN** — the baseline catalog + golden example (2.a/2.b) + zero-config defaults (2.c). | make PUBLISHABLE: drop `private`, add `exports` + a `definePlugin` default export + `files`. Stays a peer, not the corpus.    |
| **agent-memory**  | the standalone `memory` tool (unchanged by this work).                                                 | none.                                                                                                                         |

`npx agent-forge init` with no config = the **agent-anatomy plugin through the normal resolver with empty
overrides** (defaults-are-a-package, never special-cased). Consumers `npm i @leclabs/agent-anatomy` (or a
third-party plugin) and `extends` it.

## 3. The plugin contract (Q1) — build on the existing directory-scan

Discovery is ALREADY a directory scan (`catalog/enumerateCatalog` globs `<corpus>/<organ>/*.ts`; anatomy globs
`agents/*.ts`,`skills/*.ts`). A **plugin** formalizes "which dirs, from which package":

```
definePlugin({
  name: 'anatomy',                       // the namespace segment
  organs?: './src/organs',               // fragment dirs (catalog) — scanned as today
  agents?: './src/agents',               // composite dirs
  skills?: './src/skills',
  adapters?: [...],                      // optional harness adapters the plugin ships
})
```

A plugin is an npm package exporting a `definePlugin(...)` default. Identity of every fragment/composite becomes
**namespaced**: `<plugin>:<organ>/<anchor>` (σ\* uniqueness is per-plugin — Q2, resolved). The existing scan is
reused verbatim per-plugin; the plugin layer only adds the namespace + the multi-plugin merge.

## 4. The resolver (Q3) — NEW, but reuses the `mergeIR` pattern

Confirmed by census: no agent/catalog extend/override/merge exists today; the only ordered layering is
`mergeIR(scopes)` (user>project>local, close-wins/union-by-name/deny>allow). The plugin resolver GENERALIZES that
proven pattern from scopes to plugins:

```
resolve(config) → ResolvedAgentSet
  config = { extends: [pluginA, pluginB, ...], overrides: {...} }
```

- **Order:** last-writer-wins over the explicit `extends` array (ESLint flat model). NO implicit/directory cascade
  (the cautionary tale the cold reads named).
- **Override primitives — exactly three, per fragment KIND, author-declared** (NOT a general merge DSL):
  `replace` · `append`/`extend` · `patch` (structured, e.g. a tool-permission set), plus a numeric-priority
  force-escape (Nix `mkForce`) for a deep consumer. Silent merge ambiguity is the #1 distrust source — force the
  declaration at fragment-definition time.
- **Home:** `forge/src/resolve/` (doctrine-agnostic engine).
- **Validation at resolve time:** cross-plugin collision report + a reference to a since-removed slot fails LOUDLY
  (a bad prompt with no error is the worst LLM-config failure mode).

## 5. One core, two skins (3.a) — parity by construction

The `npx` CLI and a programmatic `agents.config.ts` are BOTH thin callers into the same `resolve()`. Divergent
code paths is the #1 named risk — prevented structurally, not by discipline. Shared verbs:

- `init` — scaffold `agents.config.ts` that `extends: [anatomy.recommended]` (zero-config default).
- `add <plugin>` — install + wire a plugin into `extends`.
- `compose` / `compile` — run `resolve()` → IR (the existing compile pipeline consumes the resolved set).
- `deploy` — ship the projected tree (existing).
- `explain <agent>` — provenance: which plugin/override each fragment came from, and the final resolved body
  (precedent: `eslint --print-config`, `terraform plan`). NEW, ship in v1.
- `catalog` — enumerate the resolved option-space across all extended plugins (existing, generalized multi-plugin).

**Config is code (Q5):** `agents.config.ts` (TS/ESM) loaded via a `c12`/`bundle-require`-style loader (no build
step) — adopt, don't reinvent. `extends` are real imports; type-checked, IDE-complete.

## 6. Naming decision (nico) — free the word "plugin"

`compile --as-plugin` ALREADY means a **Claude-harness plugin** (a `.claude-plugin/` output bundle). Our ESM
extension unit is a different concept. Decision: **our authoring unit keeps the word `plugin`** (the Operator's
term; the ESLint/Vite industry standard for exactly this), and the Claude-output flag is re-signified
(`--as-claude-bundle` or `--claude-plugin-dir`) to remove the collision. (A signify pass confirms at execution.)

## 7. Map: DONE vs NEW (census-grounded)

- **DONE (reuse):** IR + `compose` + `agentBody` assembly · the `HarnessAdapter` registry + emitters (E5) ·
  per-organ directory-scan discovery · `mergeIR` ordered-layering pattern · σ\* signification + accept-gate.
- **NEW (build):** `definePlugin` contract + namespaced IDs · `forge/src/resolve/` (extends/replace/append/patch)
  · `agents.config.ts` loader · `init`(zero-config)/`add`/`explain` verbs · make anatomy publishable · the
  founding-CLI restructure (`found`→`init`-via-defaults; absorbs vocab Stream-B identifiers, DESIGN-BRIEF Q7) ·
  shadcn-style vendor on-ramp (2nd on-ramp, deferrable to v1.1).

## 8. Phase gate + execution outline

- **NEXT — cold-review** (isolated Ω\*): the `definePlugin` contract names + a plugin-author walkthrough
  ("as a third party, publish a plugin that overrides one fragment") + the `explain` output shape. Only after
  cold-review does this shard.
- **EXECUTION shards (post-review, indicative — authored `census-grounds-spec` when the design locks):**
  P1 make-anatomy-a-plugin (`definePlugin` + publishable) · P2 `forge/src/resolve/` + override primitives ·
  P3 namespaced IDs + multi-plugin catalog discovery · P4 `agents.config.ts` loader + `init`/`add` · P5 `explain`
  - provenance · P6 founding-CLI restructure (absorbs vocab Stream-B identifier rename) · P7 naming re-signify
    (`--as-plugin` → claude-bundle). Deps: P2←P1 · P3←P1 · P4←P2,P3 · P5←P2 · P6←P4.

## 10. Cold-review outcome (isolated Ω\* ×4 — `/tmp/cold-panel/review.txt`)

The SHAPE is validated ("a reasonable, ESLint/Tailwind-like mental model, not fundamentally broken"), but the review
surfaced one real design gap + a naming pass, so the design **does NOT lock** — one revision required before shards:

1. **DESIGN GAP — the two-namespace incoherence (flagged independently ×2).** `extends: [base, my]` uses imported
   JS OBJECTS, but a fragment-level `extends: "base:organ/name"` uses a colon STRING needing a separate resolver —
   "what does `base` mean" has two answers. FIX: **unify on object-imports; a fragment references another via the
   imported binding, never a string ID.** This ALSO resolves review-point that ESLint FLAT-config deliberately
   DROPPED the `"plugin:foo/bar"` string scheme (magic prefix inference) — copying it re-imports a rejected pattern.
   Namespacing (Q2) stays a per-plugin invariant, but the ADDRESS is the imported object, not a `<plugin>:<organ>/`
   string. (Corrects §3/§4's string-address sketch.)
2. **NAMING re-signify (mis-signifiers, both reviewers):** `organs` → `fragments`/`namespaces` (the biology
   metaphor reads as "parts of ONE agent," not a shared library — the exact concern the Operator raised re persona) ·
   `overrides` → `patches`/`customize` (collides with ESLint's file-glob `overrides` — a muscle-memory landmine) ·
   `patch` strategy → `merge` (JSON-Patch vs Merge-Patch ambiguity) · `definePlugin` → `defineAgentPlugin` (webpack
   `DefinePlugin` prior) · `composite` → `preset` (undefined in the schema; collapse the agents/skills/composite
   synonym set). Attribution: **Nuxt-lineage, not Vite** (vite/rollup plugins are bare factory fns, no `definePlugin`).
3. **v1 REQUIREMENTS the walkthrough proved a first-timer needs:** (a) a DISCOVERY command listing extendable
   fragment IDs (no source-archaeology) — elevate `catalog`/`explain`; (b) `compose --dry-run` + a local `file:`
   link workflow BEFORE publish; (c) LOUD failure on a missing `extends` target; (d) documented deterministic
   multi-plugin merge order. (a)+(c) partly exist (catalog + resolve-time validation) — make them first-class.

## 9. Status

Design grounded + verified + Q1–Q6 resolved (Q7 folded); cold-review DONE. The architecture SHAPE is validated;
**one revision pass required before shards** — unify on object-import addressing (§10.1), apply the naming
re-signify (§10.2), elevate discovery/dry-run to v1 (§10.3). After that revision the design LOCKS and P1–P7
(§8) are authored `census-grounds-spec`. Nothing in `packages/` touched — design record only; push/deploy reserved.
