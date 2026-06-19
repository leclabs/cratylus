# episodic-toolsource-bundle

**Owner.** Mav. **Deps.** none (parallel with skill-companion-deploy). **State: READY.**

**What.** Retire `@leclabs/koine-episodic` as a published npm package; keep its TS source +
test suite in-repo as a **private build-only origin**; add a bundle step that emits one
self-contained, dependency-free `episodic.mjs` artifact (the thing that will ride next to the
`memory` skill).

**Why.** The package was a CLI wearing a library's clothes — **zero** TS importers (only a
`tsconfig` project-reference), **zero** deps, serving only the memory rituals. The library
identity bought nothing and cost distribution (it never reached fleet hosts). Keep the
engineering rigor (typed source, vitest), drop the package identity.

**Scope.**
- Demote `packages/episodic` to private/build-only: remove the consumable package identity
  (npm `name`/published `bin` as a library), `private: true`; drop or repurpose the
  `tsconfig` project-reference. Retain `src/` + `test/`.
- Add an **esbuild bundle** → single-file `episodic.mjs` (zero deps → trivial). Self-contained
  argv CLI: `encode | read | migrate` (and `dream`/`compact` per the engine surface).
- Confirm the bundle runs under plain `node` (the only host runtime — Claude Code is a node
  CLI, so node is present wherever a skill runs).

**Decisions (Mav's, settled).**
- **Source location:** stays a private build-only workspace, NOT co-located under
  `ideas/memory/`. Keeps the TS toolchain (vitest/biome/esbuild) out of the markdown+python
  mind corpus. Nico leaned toward fuller co-location; reconcile, but the deployed *artifact*
  travels either way — which is the actual requirement. In-repo dir reads as "toolsource",
  not "package".

**Exit criteria.**
- `episodic.mjs` is one dependency-free file; `node episodic.mjs --help` runs; the
  `encode/read/migrate` surface is intact.
- The retained TS test suite (atomic `compact` crash-test, two-leg `assertNoLoss`,
  ULID monotonicity) is **green** — correctness code unchanged.
- `@leclabs/koine-episodic` no longer exists as a consumable package; nothing in the repo
  imports it; repo build + lint green.
- The long-pending `koine-` prefix rename is **closed by deletion** (no package to rename).
