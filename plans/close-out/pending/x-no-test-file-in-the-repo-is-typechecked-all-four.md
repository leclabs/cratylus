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
