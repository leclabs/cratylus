# RETURN — convergence-graduation (wave 7, TERMINAL) · judged PASS

commit `2ad35c8` — fresh executor (sonnet), sole worker atop green base `1b68551` (tracked 8/7,
roster 16, all wave 5–6 shards + zed landed).

## Owned tracked ids closed

Re-derived the LIVE set from `TRACKED-FAILING.md` at dispatch time (8 rows/7 stories — the pinned
"11 owned ids" in the task spec were stale; 3 had already force-graduated during waves 5–6, matching
the dispatch's warning). All 8 rows investigated; **6 graduated, 2 disclosed as genuine permanent
residuals** (not forced):

| Row (exact text removed)                                                                                       | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1.S3 · `${spec.client} ${spec.path}: zero ${spec.resource} imported…`                                         | cursor's `~/.cursor/AGENTS.md` was the one remaining unread-fabricated-path leak (`read.ts` consulted it at every scope) — gated to project scope only, mirroring the E8.S5 write-side fix. All 7 specs now zero-lift.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| E1.S3 · `${spec.client} ${spec.path}: import report warns naming…`                                             | New `auditImport` `fabricated` leg (`src/cli/commands/import-audit.ts`) + wiring in `import.ts`: a per-client/scope table of documented-fabricated paths, named in the console report when present on disk. All 7 specs now warn.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| E2.S3 · `touched-path set ⊆ union of documented per-adapter project surfaces…`                                 | The four originally-named fabrications (`.codex/skills`, `.copilot/`, `.crush/mcp.json`, `.continue/config.yaml`) were **already retired** by their adapter-truth shards. The real residue: the allowlist predates wave-5/6's 6 new adapters — `GEMINI.md`, `.zed/settings.json`, `.amp/`, `.devin/rules/` + `.windsurf/`, `.kilo/`, `.pi/` were never added. Backfilled.                                                                                                                                                                                                                                                                                                                   |
| E4.S1 · `${adapterId}/${type}: import(compile(r)) ≡ r (${reason})` — 3 of 5 tracked pairs                      | codex/copilot/gemini's remote-MCP `headers` read-side drop, fixed: write now threads the generic `headers` field into each dialect's native remote-header key (codex has none of its own — `http_headers` is its only header surface, so it doubles as the carrier); read lifts it back into `headers` (comparable; `http_headers` stays schema-excluded, codex-specific).                                                                                                                                                                                                                                                                                                                  |
| E4.S3 · `stale cells: cursor/copilot/continue/gemini commands, continue permissions, crush hooks+permissions…` | Of the 11 listed cells, only `continue/permissions` was still genuinely stale (the other 10 in the array were already honest — a comment/array mismatch left over from prior shards). Implemented `~/.continue/permissions.yaml` read/write (`cn` CLI's documented persistence, `--allow/--ask/--exclude` → `allow/ask/exclude` [CT6]); capability flipped `none` → `partial`.                                                                                                                                                                                                                                                                                                              |
| E4.S7 · `all 10 targets compile the portable core with zero warnings and zero skips…`                          | The row's "10 targets" framing predated wave-5/6 (roster is now 16). Probed the actual 16-adapter compile: devin (`[WS5]`) and pi (`[PI2]`×2) and standards each carry a genuine, permanent by-design warning the old row never accounted for — literal zero was never achievable for the current roster, nor should it be (dispatch context flagged exactly this). Re-scoped the assertion from `totalWarnings===0` to an explicit per-adapter documented-warning/skip contract (7 adapters carry named, cited noise; the other 9 must be silent) — bites on any _undocumented_ warning, not on the by-design ones. amp/kilo/zed (also clean) joined the `CLEAN_TARGETS` regression guard. |
| E9.S3 · `declaration table ≡ ground truth for every classified cell…`                                          | Of 6 `FALSE_TODAY` cells, 5 were already fixed by prior shards (stale array). Only `gemini/payload` was real: declared `claude-json`, documented `native` (Gemini's own hook envelope, not Claude's JSON shape) [GM4]. One-line capability fix.                                                                                                                                                                                                                                                                                                                                                                                                                                             |

**Genuine residuals, disclosed (not forced), left tracked:**

- **E1.S2** — cline only (crush graduated: `readImpl` now lifts `crush.json` `hooks.PreToolUse` +
  `permissions.allowed_tools`, matching its documented write side). Cline's fixture writes a
  hand-authored `.clinerules/hooks/PreToolUse` executable with no `# agent-forge:<id>` marker; the
  adapter's own doc-comment (pre-existing, from `cline-adapter-truth`) already states why this
  can't lift: a foreign shell script carries no structured matcher/command/timeout fields to
  recover, and synthesizing one from arbitrary content would be fabrication, not a documented
  contract. I considered treating the whole script's own path as a single opaque `Hook.command`,
  but that reinterprets the IR field's meaning (a command to run) into "a self-reference" and was
  already implicitly rejected by the prior shard's own reasoning — leaving it to your judgment
  rather than reopening a settled design call.
- **E4.S1** — codex/agents (`tools`/`color` have no documented Codex agent-TOML field [CX1], warned
  - dropped on write, never fabricated) and claude/rules (a default CONCAT rule's `CLAUDE.md` now
    imports `@AGENTS.md` per Anthropic's own documented shim [S7], not a literal body — a non-concat
    rule DOES round-trip losslessly via `.claude/rules/<id>.md`). Both pre-existing, unrelated to the
    mcp-headers class this shard closed; unchanged.

## FINAL tracked count

**2/2** (was 8/7) — `TRACKED-FAILING.md` enumerates exactly `E1.S2` (cline) and `E4.S1`
(codex/agents + claude/rules), both disclosed genuine/permanent above, not FUTURE-class. This is a
**partial miss** against the plan's literal terminal condition ("0 tracked call sites, else FUTURE
with written basis") — per direct dispatch instruction ("do NOT force it… leave it tracked and
DISCLOSE… honesty over a green-at-any-cost sweep"), I did not synthesize a fix for either. Both are
architecture-level, by-design losses your judgment should close (retire the row's premise, or accept
permanently) rather than a code fix I should force. MAP.md regenerated (333 refs, 331 green, 2
tracked).

## Non-owned edits disclosed

None beyond the 10 production files directly implementing the 6 graduated ids (`codex/{read,write}.ts`,
`continue/index.ts`, `copilot/read.ts`, `crush/index.ts`, `cursor/read.ts`, `gemini/{index,read}.ts`,
`cli/commands/{import,import-audit}.ts`) + the 7 test files whose rows graduated + `MAP.md`/
`TRACKED-FAILING.md`. Every production edit traces to one of the 6 graduated ids above. Biome
auto-reformatted one file (`continue/index.ts`, a wrapped `reason:` string) and Prettier
auto-reformatted the two regenerated markdown tables (`MAP.md`, `TRACKED-FAILING.md`) — both
tool-forced, not hand-edited.

## Accumulated residue folded in (per dispatch)

- **(a) crush `src/core/adapter/types.ts` + `E1.S3.test.ts` touch, "verify minimality":** on
  inspection this referred to work already landed in prior commits (`crush-adapter-truth`,
  `9f3ebf4`; `cline-adapter-truth`, `2998fda`) — nothing to redo. Verified: current `types.ts` is
  unchanged by this shard; `E1.S3.test.ts` only changed by my own graduation-flip edits above.
- **(b) zed declared-partial rules/skills/mcp — "classify at the E4.S1 matrix close":** verified
  zed declares all three `'partial'`, never `'full'` — E4.S1's matrix only classifies declared-`full`
  pairs, so zed was never a candidate for (mis)classification there. No action needed; confirmed via
  the (already-green) "matrix completeness" story.
- **(c) roster-metadata's `Adapter.status` — E9.S3/E4.S3 tables accounting for it:** both
  `GROUND_TRUTH` tables already key by `adapter.id` over `ALL_ADAPTERS` (current+renamed only; the
  sunset `roo` stub isn't in `ALL_ADAPTERS` at all) — already correctly scoped, confirmed by the
  ground-truth-coverage stories (green, unchanged).

## Gates (4×0, clean worktree of `2ad35c8`)

`git worktree add /tmp/gate-convergence 2ad35c8` → `pnpm install --frozen-lockfile && pnpm build &&
pnpm test --force && pnpm typecheck && pnpm lint`, worktree removed after:

- **build**: green (forge dual ESM+DTS).
- **test --force**: forge **694/694** (112 files) · anatomy **36/36** (6 files) · memory **121/121**
  (9 files) — all three ran under the root `pnpm test --force` this time (dispatch's noted
  turbo-skips-agent-memory quirk did not reproduce here; verified anyway per gate law).
  `coverage.test.ts` green, prints `TRACKED-FAILING: 2 test(s) across 2 story(ies)`.
- **typecheck**: clean (`tsc --noEmit`, all 3 packages).
- **lint**: clean (`biome check .`, repo-wide, 495 files).

## Residue for judge

- The many stray `git worktree`s pre-existing under `/tmp/` and
  `/Users/lex/workspaces/.mav-w5-standards` (from earlier waves' recovery) were left untouched —
  not created by this shard, out of territory to prune unilaterally (same disclosure as
  `roster-metadata`'s RETURN).
- `docs/release-audit-checklist.md` shows as modified in the pre-dispatch `git status` snapshot but
  had zero diff against `HEAD` at dispatch time (stale snapshot artifact, not this shard's doing) —
  confirmed untouched by this shard's commits.
