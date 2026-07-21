# plugin-cli — NORTH-STAR (target architecture) — **LOCKED**

Author: nico (design authority). Grounded in the 2026-07 surface + σ\*/catalog census; the E1 recharacterization
verified by isolated cold reads (`DESIGN-BRIEF.md`); shape validated by a 4-way isolated Ω\* cold-review, whose
revisions are folded in below (§9). ρ=LLM. **This is the single source of truth for the plugin architecture.**
Design is LOCKED — P1–P7 (§8) are authored `census-grounds-spec`.

Grounding law (VISION): "author semantics once, realize behavior everywhere; the canon is the source of truth,
targets are projections." The plugin architecture makes the canon **distributable + extensible** without breaking
that law.

## 1. The shape in one line

A **package-manager + merge-resolver over a config-cascade graph** (ESLint-flat-config lineage — cold-verified),
where the nodes are **fragments** (dimension-values) and **presets** (agents/skills), npm is the distribution
layer, and every runtime artifact is a deterministic projection of the resolved graph.

## 2. Distribution — the 3 packages become CLI-core + plugins (grounded in the package census)

| package           | role                                                                                                   | change from today                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **agent-forge**   | the CLI core + resolver + IR + adapters. `npx agent-forge`.                                            | already publishable (bin, exports, zero cross-deps). ADD `forge/src/resolve/` + the plugin-loader; keep it doctrine-agnostic.   |
| **agent-anatomy** | **the default PLUGIN** — the baseline catalog + golden example (2.a/2.b) + zero-config defaults (2.c). | make PUBLISHABLE: drop `private`, add `exports` + a `defineAgentPlugin` default export + `files`. Stays a peer, not the corpus. |
| **agent-memory**  | the standalone `memory` tool (unchanged by this work).                                                 | none.                                                                                                                           |

`npx agent-forge init` with no config = the **agent-anatomy plugin through the normal resolver with empty
patches** (defaults-are-a-package, never special-cased). Consumers `npm i @leclabs/agent-anatomy` (or a
third-party plugin) and `extends` it.

## 3. The plugin contract (Q1) — build on the existing directory-scan

Discovery is ALREADY a directory scan (`catalog/enumerateCatalog` globs `<corpus>/<dimension>/*.ts`; anatomy globs
`agents/*.ts`,`skills/*.ts`). An **agent-plugin** formalizes "which dirs, from which package":

```
defineAgentPlugin({
  name: 'anatomy',            // the namespace segment
  fragments?: './src/...',    // fragment (dimension-value) dirs — scanned per-dimension as today
  agents?: './src/agents',    // preset dirs
  skills?: './src/skills',
  adapters?: [...],           // optional harness adapters the plugin ships
})
```

A plugin is an npm package exporting a `defineAgentPlugin(...)` default (factory renamed off `definePlugin` — the
webpack `DefinePlugin` prior; lineage is Nuxt, not Vite — vite/rollup plugins are bare factory fns).

**Addressing is by object-import, never a string ID (cold-review §9.1).** Namespacing (Q2) stays a per-plugin
invariant — each plugin names each concept its locally-fittest σ\*, unique within its own catalog — but a fragment
references another via its **imported JS binding**, not a `<plugin>:<dimension>/<anchor>` string. Two answers to
"what does `base` mean" is the incoherence to avoid: `extends: [base, my]` already passes imported objects, so a
fragment reference must too. (ESLint flat-config deliberately DROPPED the `"plugin:foo/bar"` magic-prefix scheme;
re-importing it would re-adopt a rejected pattern.) The existing scan is reused verbatim per-plugin; the plugin
layer adds the namespace + the multi-plugin merge.

**A binding names a NODE (identity), resolved LATE.** An imported fragment reference reads the node's **resolved**
value (post-patch), never a frozen import-time snapshot — so a base fragment that references another sees a
consumer's patch to it. Identity addresses _which_ node; the resolver supplies the value. (Without late binding a
reference would quietly bypass the very override `extends`/`patches` promise — the crux the cold-review named.)
The resolved reference graph must be **acyclic** — a reference cycle (A reads resolved B, B reads resolved A) has
no base case and FAILS loudly (cycle detection at resolve time).

## 4. The resolver (Q3) — NEW, but reuses the `mergeIR` pattern

Confirmed by census: no agent/catalog extend/override/merge exists today; the only ordered layering is
`mergeIR(scopes)` (user>project>local, close-wins/union-by-name/deny>allow). The plugin resolver GENERALIZES that
proven pattern from scopes to plugins:

```
resolve(config) → ResolvedAgentSet
  config = {
    extends: [pluginA, pluginB, ...],           // ordered; contributions fold in position (below)
    patches: [ { target: frag, op, value, force?: priority }, … ] // ARRAY, target by imported binding
  }
```

- **`patches` is an ARRAY of entries, each targeting its fragment by imported binding** — NOT a string-keyed map
  (that would contradict object-import addressing, §3; the cold-review named this). An entry is
  `{ target: <fragmentBinding>, op, value, force?: priority }`.
- **`kind` ⊥ `dimension`.** A fragment's **kind** is its structural value-type — `scalar` · `set` · `structured`
  (record) — orthogonal to its **dimension** (the axis it configures). Which `op`s are legal follows from kind,
  author-declared at fragment-definition: `scalar → {replace}` · `set → {replace, append}` · `structured →
{replace, merge}`. `merge` was renamed off `patch` (JSON-Patch vs Merge-Patch ambiguity). An `op` outside the
  target's declared-legal set FAILS loudly — silent merge ambiguity is the #1 distrust source.
- **Resolution is an ORDERED FOLD of a node's contributions, not a single winner-pick** (the semantic-merge core —
  the one genuinely-new part; DESIGN-BRIEF). A node's resolved value = fold the contributions in precedence order
  over the base: `replace` **resets** to its value, discarding the prior (this — and only this — is the
  "last-writer-wins" case); `append`/`merge` **accumulate** onto the prior (order-sensitive but not winner-take-all).
  So order matters for every `op`, but history is erased only by `replace`.
- **Precedence order + `force`.** Default order = `extends` array position, then `patches` array position (a
  patch layers over the plugins it patches). A `force(priority)` field on a patch **hoists** that op to fold AFTER
  all non-forced contributions (Nix `mkForce`), highest priority last; a force-priority **tie is a loud error**,
  never a silent pick. NO implicit/directory cascade (the cautionary tale the cold reads named). The order is
  deterministic + **documented** (§9.3).
- **Consumer field is `patches`** (renamed off `overrides` — collides with ESLint's file-glob `overrides`, a
  muscle-memory landmine; cold-probed fittest: targeted modifications whose ops read as patch-strategies, pairing
  with `extends`).
- **Home:** `forge/src/resolve/` (doctrine-agnostic engine).
- **Validation at resolve time — LOUD, never silent (§9.3):** a cross-plugin collision report + a reference to a
  since-removed slot, a missing `extends` target, an illegal `op` for a kind, a force-priority tie, or a reference
  cycle all FAIL loudly (a bad prompt with no error is the worst LLM-config failure mode).

## 5. One core, two skins (3.a) — parity by construction

The `npx` CLI and a programmatic `agents.config.ts` are BOTH thin callers into the same `resolve()`. Divergent
code paths is the #1 named risk — prevented structurally, not by discipline. Shared verbs:

- `init` — scaffold `agents.config.ts` that `extends: [anatomy.recommended]` (zero-config default).
- `add <plugin>` — install + wire a plugin into `extends`.
- `compose` / `compile` — run `resolve()` → IR (the existing compile pipeline consumes the resolved set);
  `--dry-run` prints the resolved set without writing, for the pre-publish `file:`-link workflow (§9.3).
- `deploy` — ship the projected tree (existing).
- `explain <agent>` — provenance: which plugin/patch each fragment came from, and the final resolved body
  (precedent: `eslint --print-config`, `terraform plan`). First-class in v1.
- `catalog` — enumerate the resolved fragment-IDs extendable across all extended plugins (existing, generalized
  multi-plugin). First-class discovery so a first-timer needs no source-archaeology (§9.3).

**Config is code (Q5):** `agents.config.ts` (TS/ESM) loaded via a `c12`/`bundle-require`-style loader (no build
step) — adopt, don't reinvent. `extends` are real imports; type-checked, IDE-complete.

## 6. Naming decisions (nico · signify)

- **Authoring unit = an _agent-plugin_; factory `defineAgentPlugin`.** Keeps the Operator's word `plugin` (the
  ESLint/Vite industry standard for exactly this unit); the factory is qualified to dodge the webpack `DefinePlugin`
  prior.
- **Free the word for the Claude output.** `compile --as-plugin` already means a **Claude-harness plugin** (a
  `.claude-plugin/` bundle). That flag is re-signified (`--as-claude-bundle`) to remove the collision (P7).
- **Consumer patch field = `patches`** (off `overrides`); **strategies = `replace`·`append`/`extend`·`merge`·
  `force`** (`merge` off `patch`).
- **Core anatomy vocabulary (decided via `vocab-depalimpsest/C2`, cold 3/3):** the config axis `organ` →
  **`dimension`**; the reusable VALUE keeps **`fragment`** (MODEL term; `variant` overridden on concept-fit); the
  corpus keeps **`anatomy`**. The generic agents/skills bundle is a **`preset`** (off the undefined synonym
  `composite`). So a plugin declares **`fragments`** (the reusable values), filed by **`dimension`**.

## 7. Map: DONE vs NEW (census-grounded)

- **DONE (reuse):** IR + `compose` + `agentBody` assembly · the `HarnessAdapter` registry + emitters (E5) ·
  per-dimension directory-scan discovery · `mergeIR` ordered-layering pattern · σ\* signification + accept-gate.
- **NEW (build):** `defineAgentPlugin` contract + object-import addressing · `forge/src/resolve/`
  (extends/replace/append/merge/force + `patches`) · `agents.config.ts` loader · `init`(zero-config)/`add`/`explain`
  verbs + first-class `catalog` discovery + `--dry-run` · make anatomy publishable · the founding-CLI restructure
  (`found`→`init`-via-defaults; absorbs vocab Stream-B identifiers, DESIGN-BRIEF Q7) · shadcn-style vendor on-ramp
  (2nd on-ramp, deferrable to v1.1).

## 8. Execution outline (P1–P7 — authored `census-grounds-spec` at sharding)

- **P1 make-anatomy-a-plugin** — `defineAgentPlugin` default export + publishable (drop `private`, add
  `exports`/`files`).
- **P2 `forge/src/resolve/`** — the resolver + patch primitives (`replace`/`append`/`merge`/`force`, `patches`
  field) + LOUD resolve-time validation.
- **P3 object-import addressing** — fragment-references-by-binding + multi-plugin catalog discovery (per-plugin
  namespace invariant).
- **P4 `agents.config.ts` loader + `init`(zero-config)/`add`** — the config-is-code loader + the two scaffold verbs
  - `compose --dry-run` + the `file:`-link pre-publish workflow.
- **P5 `explain` + provenance** — the inspection verb + first-class `catalog` discovery.
- **P6 founding-CLI restructure** — `found`→`init`-via-defaults-package; absorbs vocab Stream-B identifier rename.
- **P7 naming re-signify** — `--as-plugin` → `--as-claude-bundle`.

**Deps:** P2←P1 · P3←P1 · P4←P2,P3 · P5←P2 · P6←P4. (P7 independent.)

## 9. Cold-review outcome (isolated Ω\* ×4 — `/tmp/cold-panel/review.txt`) — FOLDED

The SHAPE was validated ("a reasonable, ESLint/Tailwind-like mental model, not fundamentally broken"). Three
revisions were required before lock; all are now folded into §3–§8 above (this section is the provenance record,
not a live correction layer):

1. **Object-import addressing (§3)** — the two-namespace incoherence (flagged ×2): imported objects for
   `extends` but a colon-string for a fragment reference gave "what is `base`" two answers. Unified on
   object-imports; the string-address scheme is dropped (as ESLint flat-config itself dropped `plugin:foo/bar`).
2. **Naming re-signify (§4·§6)** — `overrides`→`patches` · `patch`→`merge` · `definePlugin`→`defineAgentPlugin` ·
   `composite`→`preset`; core vocab `organ`→`dimension`, VALUE=`fragment`, corpus=`anatomy` (via C2, cold 3/3).
3. **v1 discovery/safety (§4·§5)** — a first-class discovery command (`catalog`/`explain`), `compose --dry-run` +
   `file:`-link before publish, LOUD failure on a missing `extends` target, and a documented deterministic
   multi-plugin merge order.

**Coherence-hardening pass (post-fold, isolated Ω\* ×3 — iterated to convergence).** Folding the ×4 review into
§3–§4 left the merge SEMANTICS under-specified; three iterative cold reads surfaced + closed six gaps, all folded
above: late-bound node identity (§3), `patches`-as-array vs binding-address (§4), `kind ⊥ dimension` + kind→legal-op
(§4), `force` as a patch field (§4), **resolution = ordered fold, not winner-pick** — `replace` resets, `append`/
`merge` accumulate (§4, the semantic-merge core), and acyclicity/cycle-detection (§3). The third read certified the
composition axis coherent; the final read pre-certified closure on the cycle-detection addition.

## 10. Status

Design LOCKED. Q1–Q7 resolved; cold-review folded. P1–P7 (§8) are the execution shards, authored
`census-grounds-spec` against the live tree. Nothing in `packages/` touched — design record only; push/deploy
reserved.

## 11. Deferred canon-candidate (from P3, nico)

A fragment authoring shape that **declares a reference** to another fragment (the §3 object-import form at the
_authoring_ layer, beyond the current bare-σ\* value form) is a canonical **signify/cratylism** decision — deferred,
non-blocking. P3/P4 operate on the value form; the reference-bearing node form exists in the resolver. Introduce a
first-class reference-declaring authoring shape only when a corpus fragment must reference another (cold-verify the
sign then).
