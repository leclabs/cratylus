# V3 · node-scope-severance

**Objective.** Sever provenance from scope. `node()` answers _where a record was captured_; both the
dream routing law and the store treat it as _what the record is about_. That single conflation is
two of the operator's named symptoms.

## The defect, measured — and it is ONE defect wearing two faces

**Face A — the routing law is unsatisfiable in practice.**
`packages/agent-canon/src/skills/dream/skill.ts:35` states
`node(i) ∉ { HOME · legacy } ⇒ i ∉ SEMANTIC ∧ i ∉ PROCEDURAL`.
`foldRecords` (`packages/agent-memory/src/fold.ts:32-37`) computes `resolveNode(r.cwd, …)` at
`fold.ts:35`; `LEGACY_NODE` (`fold.ts:33-34`) is reachable only when `r.cwd` is undefined. In
`resolveNode` (`packages/agent-memory/src/node.ts:153`), `.git` is marker #1 (`node.ts:32-39`,
returned `node.ts:201`) and `$HOME` is returned only at `node.ts:185`. An agent always works inside a
repo ⇒ the walk halts at the repo root ⇒ every record scopes to a project node ⇒ the law bars **all
of them** from the two stores that exist to hold cross-project wisdom.
**Measured on the live corpus: 16/16 records resolve to a project node. Zero to `$HOME`, zero to
`legacy`.** The law is satisfiable only by a session literally run from `~`.

**Face B — a repo rename launders orphans into the global store.** `node.ts:169-175` folds a
non-existent `cwd` to its nearest existing ancestor. Verified on this box:
`/Users/lex/workspaces` contains no `.git`, no `package.json`, no `PLAN.md`, no
`Cargo.toml`/`go.mod`/`pyproject.toml` — **zero markers** — so the walk continues to `/Users/lex` =
`currentHome` and returns `$HOME` at `node.ts:185`. `basis` records `$HOME`, indistinguishable from a
genuine `~`-rooted session. The severity is inverted: **orphaned project records become the only
records the law admits to the durable stores.**

## Inputs

`packages/agent-memory/src/node.ts:150-210` · `packages/agent-memory/src/fold.ts:25-45` ·
`packages/agent-memory/src/audit.ts:170-230` (`scanLine`, `auditHome`) ·
`packages/agent-canon/src/skills/dream/skill.ts`

## Constraints

- **Delete the `node(i) ∈ {HOME, legacy}` predicate; do not tune it.** It tests provenance and claims
  to test scope. Tuning a predicate that measures the wrong quantity produces a better-calibrated
  wrong answer.
- Keep `node()` computing provenance — it is correct at its actual job and other things read it.
- Prefer the existing deterministic instrument over new inference: `audit.ts:177 scanLine()` already
  detects repo-key / path / ref-shaped tokens and is exactly a content-scope test.
- The dream cell is a formal block under the self-sufficiency, symbols and reader-density gates.
  Re-run `pnpm --filter @leclabs/agent-canon test` after editing it.
- A schema change to `record.ts` is **out of scope** — that is S3's call. Fix what is deterministic.

## Outputs

`packages/agent-memory/src/node.ts` · `packages/agent-memory/test/node.test.ts` ·
`packages/agent-canon/src/skills/dream/skill.ts` (routing law + the `--residue` shape line, which V2
is forbidden to touch)

## Acceptance

1. **Face B:** a record whose `cwd` no longer exists resolves to a basis that is NOT `$HOME` —
   `vanished-cwd`, folded to `legacy`. The `while (!existsSync(start))` loop at `node.ts:171` already
   knows the fact and currently discards it; thread it. Test with a synthetic vanished path.
   **This test must fail on the pre-state.**
2. **Face A:** the dream cell's routing law no longer predicates admission on `node(i)`. Whatever
   replaces it must be satisfiable by a record captured inside a repo — demonstrate with a worked
   example in the shard's return.
3. A record whose body is project-referential (per `scanLine`) is still barred from SEMANTIC and
   PROCEDURAL. The scope discipline must survive the fix — this is the exonerating case.
4. `pnpm test && pnpm typecheck` green.
