# plugin-cli — DESIGN BRIEF (recharacterized E1) — VERIFIED

**Status: DESIGN, not execution.** Convergent prose (census → this brief → cold-review). Sharded only after it
settles (`census-grounds-spec`). Supersedes north-star's deferred `E1`.

## Verification (nico, first-principles — NOT an echo of the Operator's framing)

The Operator hypothesized "npx CLI + conventional ESM plugin (vite/eslint lineage)." I verified it against
**isolated cold reads** (3× `claude -p` from `/tmp`, no project context, tool-less) given the PROBLEM ONLY — the
prompt never named vite or eslint. Result: **confirmed, and sharpened.** Both substantive reads independently
named **ESLint flat-config (v9+)** as the strongest precedent and converged on the same core mechanism. The
hypothesis is right; the verification adds precision the framing lacked and surfaces one tension.

**The reframe that matters (the non-echo):** strip "AI agent" away and this is a **package-manager + build
resolver over a merge graph** — a config-cascade problem (ESLint / Nix / Tailwind / Terraform territory), NOT an
AI problem. Steal the resolution model wholesale; spend ALL original design effort on the one genuinely new part
the precedents never faced: **semantic/prompt-content merge semantics.** Everything else is downstream.

**Sharpenings beyond the Operator's words:**

1. **Precedent is ESLint FLAT config specifically** (v9+), not the old `.eslintrc` cascade — the directory-cascade
   / `extends: "string"` era is the CAUTIONARY tale, not the model. Vite is a weaker analogue than implied.
2. **"One core resolver, two thin skins"** is the by-CONSTRUCTION mechanism for req 3.a (CLI/ESM parity). Not
   "same aesthetic" — the CLI and the ESM API must be thin callers into ONE `resolve()`. Divergent CLI-vs-library
   code paths is the #1 named risk; fix by construction, never by discipline.
3. **Namespaced fragment IDs (`pkg:name`)** are mandatory for req 3.b — and this is a REAL TENSION with our
   current model (bare anchors + shortlex, one-anchor-one-concept assumed GLOBAL). Cross-plugin composition breaks
   that assumption: two plugins may both define `parsimony`. Namespacing + a resolution/override order is required.
4. **Override is 3 primitives, not a merge DSL:** `replace` · `append`/`extend` · `patch` (structured, per
   fragment KIND, author-declared) over an EXPLICIT ordered `extends` list (last-writer-wins), plus a
   numeric-priority force-escape (Nix `mkForce`) for deep consumers. Silent merge ambiguity is the #1 distrust
   source in every precedent. This "genuinely hard part" is where the design effort goes.
5. **Defaults are a PACKAGE, not a special case** (req 2.c): `npx <tool> init` = the defaults package through the
   normal resolver with empty overrides. The moment defaults get special-cased merge logic, it's two systems.
6. **`explain`/provenance tooling in v1** ("why did this fragment win; what's the final prompt") — every precedent
   that succeeded shipped inspection early (`eslint --print-config`, `terraform plan`, Nix `why-depends`).
7. **shadcn-style "vendor into repo" as a SECOND on-ramp** — prompt text is often forked-and-edited, not
   parametrized forever. A genuine differentiator, cheap now, expensive to bolt on later.

## Map onto our current architecture (what's DONE vs NEW)

| target capability                                                              | our state                                                                                                                             |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| IR + compose + pluggable emitters (backend-agnostic render)                    | **DONE** — forge IR · `compose` · `HarnessAdapter` registry (E5). The "unified/babel parse→IR→render" precedent is already satisfied. |
| fragment + composite model                                                     | **DONE** — organ-values (fragments) · agents/skills (composites); the accept-gate + σ\* signification                                 |
| baseline catalog + golden example (2.a/2.b)                                    | **PARTIAL** — agent-anatomy IS the catalog; it must become A PLUGIN (one of many), not THE corpus                                     |
| plugin package boundary (a plugin = an npm pkg exporting fragments+composites) | **NEW** — no plugin contract exists (`defineCatalog`/`definePlugin`?)                                                                 |
| namespaced cross-plugin IDs + resolver/override                                | **NEW** — the bare-anchor/shortlex model is single-corpus; 3.b needs namespacing + `extends`/override                                 |
| one-core-two-skins CLI/ESM parity (3.a)                                        | **PARTIAL** — thin CLIs exist (`project`/`found`) but each has its own logic; must collapse to one `resolve()`                        |
| zero-config `npx` + defaults-as-package (2.c)                                  | **NEW** — no npx entry; `found`/`init` is doctrine-laden (Stream B depalimpsest folds in)                                             |
| `explain`/provenance · shadcn vendor on-ramp                                   | **NEW**                                                                                                                               |

**The crux:** agent-anatomy today is THE (single, globally-bare-namespaced) corpus. To be "the golden example +
baseline + defaults," it must become **a plugin among plugins** — which FORCES the namespacing + resolver work.
That, not "project-to-dir purity," is the real content of recharacterized E1.

## Open design questions (converge before sharding)

1. **The plugin contract.** What does an ESM plugin export? A `definePlugin({ fragments, composites, adapters? })`
   factory returning namespaced fragments + composites, idiomatic to JS authors (the ESLint-plugin analogue).
2. **Namespacing vs σ\*/shortlex — RESOLVED (nico, grounded in `catalog/index.ts` + `signify`/`MODEL`).** No
   conflict; the tension is not fatal. Grounding: an organ value's HOME is already its DIRECTORY
   (`organs/<organ>/`), and `PARTITIONED` (`|home(c)|=1 ∧ disjoint`) makes the ORGAN a namespace _today_ — the
   catalog discovers values per-organ-dir and there is NO cross-corpus collision check (it assumes one corpus).
   So: **σ\* uniqueness (α(c)=σ\*(c), one fittest sign) is a per-CATALOG/per-plugin invariant** — a plugin author
   names each concept its locally-fittest sign, unique within their catalog. Two plugins independently choosing
   `parsimony` for similar-but-distinct concepts is NOT a σ\* violation (each is locally fittest); it is a
   RESOLUTION event — the outer namespace becomes `<plugin>:<organ>/<anchor>`, and cross-plugin anchor collisions
   resolve by `extends` order (last-writer-wins, ESLint model). Shortlex is a within-organ emit order — untouched.
   **Upshot: namespacing extends the existing directory-home model; it does not rewrite σ\*.** This de-risks the
   whole plugin direction — the anatomy is compatible.
3. **The resolver + override primitives.** `resolve(config) → ResolvedAgentSet`: `extends` order, `replace`/
   `append`/`patch` per fragment kind, force-priority escape. Where does it live — a new `forge/src/resolve/`?
4. **One-core-two-skins.** The shared `resolve()` both the `npx` CLI and `agents.config.ts` call. What are the
   shared verbs (`init`·`add`·`compose`·`deploy`·`explain`·`catalog`)?
5. **Config-is-code loading.** `agents.config.ts` loaded via a `c12`/`bundle-require`-style loader (TS/ESM, no
   build step) — adopt, don't reinvent.
6. **Distribution.** npm layout: `agent-forge` = CLI core + resolver; `agent-anatomy` = the default plugin (a peer,
   `extends`-ed by empty config). What does `npx` resolve to? Does the old E1 "anatomy type-only w.r.t. forge"
   purity fall out of the plugin boundary (likely yes — a plugin imports the core's `definePlugin`, nothing more)?
7. **Vocabulary (Stream B).** The founding-CLI layer is rebuilt here with clean vocab from the start
   (`found`/`polis` → `init`/`project`/`catalog`) — its depalimpsest spec (vocab-depalimpsest Stream B) is a
   REQUIREMENT of this redesign, not a separate sweep.

## Phase plan

- **DESIGN (next):** resolve Q1–Q7 → author `NORTH-STAR.md` (the plugin architecture) → cold-review (isolated Ω\*
  on the plugin contract names + a plugin-author walkthrough + the namespacing/σ\* reconciliation).
- **EXECUTION (after convergence):** shards citing the settled design; Stream B folded in.

## Provenance

Verification cold reads: `/tmp/cold-panel/results.txt` (ARCH-1/3; problem-only, unprimed). Precedents the cold
reads converged on: ESLint flat-config (primary) · Nix module priorities · Tailwind `theme.extend`/presets ·
unified/babel IR-pipeline · shadcn vendor-on-ramp · npm-as-registry.
