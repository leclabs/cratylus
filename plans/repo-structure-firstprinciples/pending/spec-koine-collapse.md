# spec-koine-collapse

**State:** pending · **Owner:** Mav · **Deps.** Fork 1 (Operator: collapse vs keep-split) resolved =
COLLAPSE. Blocked until the Operator signs off; the content below is the _spec to execute_, not yet a
green light.

**What.** Collapse `@leclabs/koine-core` + `@leclabs/koine-adapters` + `@leclabs/koine` (cli) into a
single `@leclabs/koine` package, preserving every current entry point via subpath `exports` + `bin`.
Rationale: [[defer-the-package-boundary]] — three internal-only, never-published, one-directionally
coupled boundaries with no independent consumer are premature cost. (If Fork 1 resolves to KEEP-SPLIT
for publish intent, this task is dropped and only the name<->path rename of the nested dirs is specced.)

**Target.**

```text
packages/koine/
  package.json          # name "@leclabs/koine"; bin { "koine": "./dist/cli.js" };
                        # exports: { ".": core, "./core": core, "./adapters/*": adapter-subpaths }
  src/core/             # <- core/src/**   (the IR, engine, schema loader, Adapter contract)
  src/adapters/         # <- adapters/src/** (10 client adapters, kept as subpath exports)
  src/cli/              # <- cli/src/**     (compiled to bin)
  schema/               # <- core/schema/** (JSON Schema, source of truth for pnpm gen)
  scripts/ test/ docs/ README.md AGENTS.md
```

**Ordered migration steps (the execution recipe, when unblocked).**

1. `git mv` the three `src/` trees into `packages/koine/src/{core,adapters,cli}`; `schema/`, `scripts/`,
   `docs/`, `test/` consolidate up to `packages/koine/`. Use `git mv` so history follows; stage
   deliberately (a stray `git mv` rides the next unrelated commit — known craft hazard).
2. Rewrite the **internal imports**: `@leclabs/koine-core` -> relative `../core` (or a `#core` import
   alias) and `@leclabs/koine-adapters` -> `../adapters`. ~60 core-import sites + 4 adapters-import
   sites (the grep'd coupling) — mechanical, but typecheck-gated.
3. Author the single `package.json`: merge the three dep sets (dedupe via catalog), define `bin` +
   subpath `exports`, single `tsup` config emitting `index` (core), per-adapter chunks, and `cli`.
4. Collapse `tsconfig.json` references 3 -> 1 (`packages/koine`); update `.changeset/config.json`
   `fixed` to the single name (or remove `fixed` — one package needs no fixed group).
5. Update the **IR-fixture path**: `packages/koine/adapters/test/ir-bridge/mind.koine.json` ->
   `packages/koine/test/ir-bridge/mind.koine.json`, and the two consumers
   (`packages/mind/toolkit/test_ir_bridge.py`, the `memory-model-redesign/refresh-koine-ir-fixture`
   task prose) — this is the ONLY cross-package path coupling, so it is the one external touch.
6. `pnpm gen` (schema->types) must still resolve from the new `schema/` location; verify generated.ts
   round-trips.

**Fleet/deploy implication.** **None beyond the IR-fixture path.** Verified: `deploy.py` references no
koine path; agent-def deploy projects from `packages/mind/.render/`. The fixture path is the sole seam.

**Rollback.** Single squashed commit on a branch; revert restores the four-dir layout. The `git mv`
history-follow means a revert is clean. No published artifact exists to break (all `0.0.0`, no tags).

**Exit criteria.**

- One `@leclabs/koine` package; `core`/`adapters`/`cli` are `src/` subdirs, not packages.
- Every prior entry point reachable: `import '@leclabs/koine'` (core), `'@leclabs/koine/core'`,
  `'@leclabs/koine/adapters/<client>'`, and the `koine` bin all resolve.
- `pnpm build` + `pnpm test` + `pnpm lint` green; `pnpm gen` round-trips; IR-bridge test green at the
  new fixture path; `packages/mind` `test_ir_bridge.py` green against the moved fixture.
- `tsconfig.json`, `.changeset/config.json`, `pnpm-workspace.yaml` all reference the single package.
