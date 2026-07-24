# S6 · ir-lineage-excise

**Objective.** Delete the IR-intake lineage. With the braids cut by S1–S5, remove the second pipeline
entire: its core, its CLI verbs, its fifteen unused harness adapters, its tests, and the orphaned fixture
whose generator no longer exists.

**Inputs (pinned, exist at authoring).**

- `packages/agent-forge/src/core/{ir,engine,serialize,adapter}/` + `src/core/schema/*.json` +
  `src/core/scripts/generate-types.ts` — ~2,501 lines / 26 files, **minus** whatever S2 rehomed
- `packages/agent-forge/src/cli/index.ts:123,142,189,199,239,246,253,268` — command wiring; `:2-17,47-68`
  — the 16-adapter table
- CLI commands `compile, import, lint, diff, watch, migrate, doctor, events, import-audit` — 1,527 lines
- `packages/agent-forge/src/adapters/` — 15 of 18 dirs go entirely (aider, amp, cline, continue, copilot,
  crush, cursor, devin, gemini, kilo, opencode, pi, roo, standards, zed). Survivors: `claude/anatomy.ts`,
  `codex/anatomy.ts`, `registry/`, plus S3's extracted serializer. From `claude/` also drop `read.ts`,
  `bundle.ts`, `paths.ts`, `mechanisms.ts`, and `write.ts`
- `packages/agent-forge/test/adapters/` (1,785) + `test/core/` (1,010) + stories E1, E2, E3, E4, E7, E9,
  E10 (~7,410) — roughly 10,200 of 17,635 test lines
- `packages/agent-forge/test/adapters/ir-bridge/agent-canon.agent-forge.json` — the 75KB fixture, and
  `round-trip.test.ts:18-20` naming its generator `agent-canon/toolkit/emit_ir.py`, **deleted in
  `d532a5f`**
- `packages/agent-forge/package.json` `exports` — `"."` and `"./core"` both resolve to the core barrel

**Constraints.**

- **Sweep three already-dead vestiges rather than preserving them by accident:**
  `core/engine/boundary.ts:104 realize()`, `core/engine/vector-projection.ts` (exported at
  `engine/index.ts:8`), and `adapters/claude/mechanisms.ts:12 claudeMechanisms` (exported at
  `claude/index.ts:107`). All three are called by nothing.
- Deletion, not deprecation. No compat shim, no re-export stub, no `@deprecated` alias.
- **The `"."` export must be reconsidered, not merely repaired.** It currently _is_ the core barrel; when
  that barrel loses most of its content, ask first-principles what the package root should expose — do not
  reflexively keep a root export pointing at a hollowed-out module.
- A deleted test is correct only when its **entire subject** is deleted. Any test whose subject survives
  must survive with its assertions intact. State the count deleted and why.
- `partition-then-prune`: before removing a directory, grep for **code** path-resolution into it, not just
  prose mentions.

**Carried in from waves 0–2 — read before starting.**

- **The reach mechanism was `export *`, not the dual barrel.** S4 measured `adapters/claude/anatomy.ts`
  independently reaching all 26 IR modules through a single **type-only**
  `import type { HarnessAdapter } from '../../core/index.js'`. A barrel that `export *`s a lineage makes
  even a type-only import a full-lineage edge, and it is invisible to grep. Expect the same shape
  elsewhere; name the **defining module**, never the barrel.
- **The dual barrel resolves itself here.** `adapters/claude/index.ts` still exports both kinds on disk
  because `agent-canon`'s `null-dimension` and `projection-stability` tests import anatomy symbols from
  `@leclabs/agent-forge/adapters/claude`. Deleting `read.ts`/`write.ts` leaves that barrel anatomy-only
  for free — no contract change needed.
- **`import.meta.resolve` is NOT an existence oracle.** It matched a bogus `./adapters/*` subpath without
  stat-ing the target. Use `await import()` for any resolution claim; only a real load proves a
  declared-but-unbuilt path fails.
- **Do NOT rename `Adapter` / `HarnessAdapter`.** Once this shard lands, `HarnessAdapter` becomes the only
  adapter and its qualifier goes dead — so the anchor genuinely wants re-deriving. That is a `signify`
  act with a cold-derivation obligation and it is **the plan owner's**, not an executor's. Report the
  dead qualifier; change nothing.
- `tsup.config.ts` enumerates `readdirSync('./src/adapters')` and `package.json` maps `./adapters/*`, so
  the two enumerations stay in sync automatically as adapter dirs are deleted. Verify, don't assume.

**Dependencies.** S1, S4 (transitively S2, S3), S5.

**Outputs.** One pipeline in the package; `src/core/` holding only what the projection path uses; an
`exports` map that describes the surviving surface; the orphaned fixture gone.

**Completion criteria (falsifier).** `rg -n "readIR|writeIR|findIRRoot|defaultIRRoot"
packages/agent-forge/src` returns nothing, control proven before the cut; no
`.agent-forge`-IR-writing command remains in `--help`; every removed verb errors as unknown rather than
parsing; full `pnpm test` green from the repo root; and the real dogfood lands **10 agents / 15 skills /
3 hooks** with `settings.json` byte-identical to pre-plan. REJECTED if a re-export stub survives; if a
surviving-subject test was deleted to reach green; if the deleted-test count is reported without saying
what each covered; if `"."` is left pointing at a hollow barrel by default rather than by decision; or if
any of the three named vestiges is still present.
