# E3 · operator-lexicon-module ⚡ FOUNDATION

**Slice** ENGINE(toolkit) · **Wave** 0 · **Deps** none · **State** ready · **Executor** nico (lexicon content = signification; module + test rewire = toolkit)

## Why

`test/symbols.test.ts` claims "SOURCE-GRAIN, not markdown" then **parses `references/formal-symbolic-notation.md`**
to load its symbol table — it lints against a _projection_. Per the thesis (TS source, md projection) and
simplicity/DRY, the lexicon must be an **ESM module**; the markdown human-glossary is unnecessary (a human asks
an agent to explain an artifact — the on-demand dereference channel, not a maintained doc).

## Spec

1. **Create `src/toolkit/operator-lexicon.ts`** — the single home. `export const OPERATORS: Record<Glyph,
{ sense: string; signature: string; coldVerified: boolean }>`. Migrate every col-1 glyph from
   `formal-symbolic-notation.md`; ADD `↾` (restriction, `coldVerified: true`) and the `⟨⟩` **dual sense**
   (tuple `⟨a,b⟩` AND modifier `X⟨m⟩`, disambiguated by position — both recorded). Dense sense-name +
   signature only; NO human-comprehension prose (agent-audience, per the md's own rule).
2. **Rewire `test/symbols.test.ts`** — `declaredSymbols()` imports the module's keyset; delete the markdown
   read.
3. **The E2a residue gate reads the same module** for its admissible-operator set (one home — DRY).
4. **Archive `references/formal-symbolic-notation.md` (D12 — it's markdown).** Move it to
   `.scratchpad/formal-symbolic-notation.{ulid}.md` with its original path appended as the last line; do NOT
   plain-delete. Repoint the 9 skills citing its path + `src/toolkit/AGENTS.md` to the module (or drop the
   citation — the gate enforces structurally). Human-comprehension channel: ask an agent to explain the artifact.

## Acceptance (falsifier)

- FAIL if `symbols.test.ts` still reads any `.md` (grep the test for `readFileSync.*\.md`).
- FAIL if `references/formal-symbolic-notation.md` still exists at its path or is cited anywhere
  (`grep -rn formal-symbolic-notation` over source → empty), OR if it was plain-deleted rather than archived to
  `.scratchpad/…{ulid}.md` with its original path appended (D12).
- FAIL if the module omits any glyph the live corpus uses (gate must stay non-vacuous AND green on the corpus).
- FAIL if `↾` or either `⟨⟩` sense is absent.
- FAIL if the module carries human-comprehension prose beyond dense sense-name + signature.

## Return

The module · the rewired `symbols.test.ts` · confirmation the md is deleted + zero-citation grep-proof · both
gates (symbols + E2a) green reading the module.
