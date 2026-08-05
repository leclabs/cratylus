# no test file in the repo is typechecked - all four packages set include src only, so a type error in any test ships silently

> FILED, not specified. A stub: symptom + locus + provenance, no census, no
> acceptance. It exists so the defect was not chased when it was found. Whoever
> promotes it to `ready` owes it a real spec (`/praxis upsert`).

**Symptom.** no test file in the repo is typechecked - all four packages set include src only, so a type error in any test ships silently

**Locus.** _(unfilled — the filer may not have known)_

**Provenance.** Filed 2026-07-26 from `b6cfc7b`, while executing `M3`.

## Measured 2026-07-26 (mav), so the next attempt does not repeat the dead end

**Confirmed real.** All four packages set `"include": ["src/**/*"]`; **76 test files**
are outside it. Vitest transpiles without typechecking, so a type error in any test
ships silently — and `pnpm typecheck` was trusted as a gate throughout the close-out
wave while blind to every one of them.

**The obvious fix does not work.** Widening `include` to `["src/**/*","test/**/*"]`
yields 17 × `TS6059` — _"File … is not under rootDir 'src'"_ — because `rootDir` is
`src` for the build. Those are structural complaints, not type errors; the real
error count underneath is still unmeasured.

**Shape of the actual fix:** a separate `tsconfig.test.json` per package that extends
the base, drops/relaxes `rootDir`, and adds `test/**/*`, wired as its own turbo task
so the build config stays untouched. Expect it to surface genuine errors on first run —
budget for that rather than assuming zero.

**Cautionary note.** My first measurement of this said "1 type error per package". It
was wrong: the comment-stripping regex I used to read the tsconfig ate `/**/*` inside
the include string as a block comment, so tsc was handed `src*`, matched nothing, and
returned a single TS18003. Parse JSON with a JSON parser.

## CLOSED 2026-07-26 (developer)

**The gate.** A `tsconfig.test.json` per test-bearing package — `canon`,
`forge`, `memory`, `runtime` — each extending that package's
`tsconfig.json`, forcing `noEmit` and `rootDir: "."`, and including
`src/**/*` + `test/**/*` (memory also `vitest.config.ts`, previously
unchecked too). `invoke` ships no tests and gets none. Wired as
`typecheck:test` in each manifest, a `typecheck:test` turbo task, a root
`pnpm typecheck:test`, and a third line in `.husky/pre-push` beside `typecheck`
and `test`. `tsconfig.build.json` and every `dist` are untouched — no `src` file
changed in this shard.

**Non-vacuity, asserted not assumed.** A synthetic `test/__gate_falsifier.ts`
(`const n: number = "not a number"`) was fed to the new task: TS2322, exit 2.
Removed. The gate convicts.

**True error count underneath the TS6059 wall: 22**, all in test code, zero in
`src` — canon 7, forge 2, memory 13, runtime 0. Three classes:

1. **A dead API argument (7 sites' worth of decay, 3 files)** — `bin-name-single-home`,
   `event-tap-cell`, and `runtime-shim` all pass `out:` to `projectPluginSet`,
   which has had no such field since V7 moved writing to the caller. Each file's
   own comment says _"V7: the projector RETURNS the tree; the caller is the one
   writer"_ directly above the stale argument. Inert at runtime (the real write
   is the adjacent `writeRenderTree(out, …)`), so nothing was broken — but it is
   exactly the drift an untypechecked test corpus accumulates silently.
2. **`noUncheckedIndexedAccess` on regex captures** (`m[1]`, `m[2]`) — canon's
   `cratylism` and `boundary-binding`.
3. **`noUncheckedIndexedAccess` on array/record reads after a length assertion**
   — forge's `hooks.test.ts`, memory's `dream.test.ts`.

**Zero suppressions.** No `@ts-expect-error`, no `any`, no `skipLibCheck`-style
escape was needed. Two fixes strengthened their tests rather than appeasing the
compiler: `dream.test.ts` gained an `idOf(kind)` helper that throws when the
fixture drifts (replacing `Object.fromEntries` reads that would have silently
read `undefined`), and its byte-verification collapsed to a single ordered
`lines.map(parseRecord)` equality.

**One collateral fix.** `biome.jsonc` gained a `**/tsconfig.*.json` override with
`json.parser.allowComments`. Biome special-cases the bare `tsconfig.json` name
only, so a comment in a sibling config is a parse error — the rationale had to
live either in the file or nowhere.
