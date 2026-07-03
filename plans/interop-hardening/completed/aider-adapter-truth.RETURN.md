# aider-adapter-truth — RETURN

**Commit:** (this session's commit, atop live main `d879e60`). Sole worker on the checkout —
`git diff --cached --stat` was empty before staging. Re-dispatch note (fresh model after a prior
Fable-limit death): found one stray CLEAN worktree at `/private/tmp/af-aider-gate` pinned to
`eca0068` (predates any aider work — a leftover gate dir from an unrelated shard, name notwithstanding);
no uncommitted diff against its own HEAD, so removed as dead residue (`git worktree remove`) rather than
resumed from. Everything below is a from-scratch derivation atop live main, not a resume.

## Owned ids graduated (7/7)

| Story  | Test (exact row removed from TRACKED-FAILING.md)                                                           |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| E2.S4  | `aider user scope emits ~/.aider.conf.yml — a bare ~/AGENTS.md is inert [AI1][AI2]`                        |
| E6.S6  | `aider: emitted rules are wired for reading via .aider.conf.yml read: — aider has no auto-discovery [AI2]` |
| E8.S10 | `compile also emits .aider.conf.yml wiring the conventions file via read: [AI1][AI2]`                      |
| E8.S10 | `.aider.conf.yml wiring is merge-safe with an existing conf (E3.S5) [AI1]`                                 |
| E8.S10 | `the fabricated ~/AGENTS.md user-scope write is gone [AI1]`                                                |
| E8.S10 | `read models the conf chain: read:-wired conventions files lift [AI1]`                                     |
| E9.S4  | `.aider.conf.yml: conventions wired via a merged read: entry, foreign keys preserved [AI1][AI2]`           |

All 7 owned ids graduated (`story.tracked` → `story`). **One forced graduation beyond the owned 7**:
`E1.S2`'s aider row (`import aider: every documented resource class lifts from a §2-truth fixture (gap:
conventions wired via read: are not lifted; no auto-discovery exists [AI2])`) — E1.S2 was NOT in this
shard's Static/Owned tables (out of the dispatched scope), but its `it.fails`-wrapped assertion is the
same read-side conf-chain lift the owned fix delivers; it started passing as an unavoidable side effect,
and a passing assertion inside `it.fails` errors the suite — leaving it tracked was not an option. Flipped
it too (mirrors the cline-adapter-truth precedent's "15 owned + 1 forced" pattern). This is templated
across multiple clients (`${spec.client}`/`${spec.gap}`), so the row/call-site itself stays (other
clients' gaps remain tracked) — only the Reason-column `[AI2]` citation for aider was retired, with a
graduation note appended, matching the file's existing convention for partial multi-target rows (e.g.
the E2.S3/E4.S1 rows already carry "— X graduated" clauses without deleting the row).

Net TRACKED-FAILING: **66 → 59** rows (29 → 26 stories: E2.S4, E6.S6, E8.S10 each drop out entirely —
E9.S4 keeps its one remaining non-aider row). MAP.md regenerated (334 refs).

## Design (decision + rationale)

- **Conventions file + `.aider.conf.yml` `read:` wiring, both scopes** [AI1][AI2]: aider auto-discovers
  NO conventions file — a bare `AGENTS.md` sitting in the repo is invisible to a stock `aider` run unless
  `.aider.conf.yml` (or `--read`/`/read`) names it. `write()` now emits **both** files whenever `ir.rules`
  is non-empty:
  - **Project scope**: conventions at `<cwd>/AGENTS.md` (unchanged path/content from before), conf at
    `<cwd>/.aider.conf.yml`, `read:` entry is the **bare basename** (`AGENTS.md`) — repo-relative, so a
    committed/shared `.aider.conf.yml` still resolves correctly for every teammate's clone regardless of
    where relative-to-conf-vs-relative-to-cwd resolution actually lands (docs don't specify; same
    directory either way removes the ambiguity).
  - **User scope**: conventions moved to `~/.aider/AGENTS.md` (the bare `~/AGENTS.md` fabricated write —
    no documented consumer — is gone), conf at `~/.aider.conf.yml`, `read:` entry is the file's **absolute
    path**. Rationale: a global `.aider.conf.yml` applies across arbitrary project cwds at invocation time;
    aider's own docs (checked live via `aider.chat/docs/config/aider_conf.html` and
    `.../usage/conventions.html`) confirm the home→git-root→cwd search chain and last-wins precedence but
    are silent on relative-path resolution basis for `read:` — absolute removes the ambiguity outright
    for the one scope where "same directory as the conf" isn't guaranteed.
  - **Merge-safety**: an existing `.aider.conf.yml` is read first; its `read:` list (string or array,
    normalized) is **unioned** with forge's entry (not replaced) before `mergeYamlKeys` shallow-merges the
    result over the foreign document — every other foreign key survives untouched, and a pre-existing
    `read:` entry is never dropped.
- **`read()` models the real conf chain** [AI1]: loads `.aider.conf.yml` (scope-appropriate path), reads
  its `read:` list, resolves each entry (absolute as-is, relative against the scope's base dir — cwd for
  project, home for user), and lifts each resolved file's content as one `Rule` whose `id` is the file's
  basename stem (frontmatter `id` still wins if present, via the shared `parseRule`). Falls back to the
  bare conventions-file path only when no conf/`read:` entries exist (legacy/foreign state predating this
  wiring) — this is the one behavior change with a real fidelity cost, addressed below.
- **Everything else unchanged**: capabilities matrix untouched (skills/commands/agents/hooks/mcp still
  `'none'`, per [AI3][AI5][AI6] — confirmed correct, not this shard's territory); the write-side warning/
  skip loop for unsupported resources is byte-identical to before.

## Non-owned test edits (all disclosed)

The LEGACY-UNIT-TEST lesson's exact class surfaced twice: several tests across the repo pinned aider's
OLD read() behavior — a hardcoded hardcoded-`id:'main'` return regardless of which file actually held the
content (a stub, not a real translation). Once read() genuinely follows the conf chain, the id it
produces is derived from the wired file's basename stem instead — correct (aider has no id concept; the
stem is the only available label), but it breaks every test that asserted exact rule-`id` round-trip
identity for aider specifically. None of these are in the Static section's named test list; all three only
surfaced at the repo-wide `pnpm test` gate, exactly as the dispatch predicted.

1. **`test/adapters/aider/round-trip.test.ts`** — `'round-trips rules'` asserted
   `re.rules` deeply-equals the original `[{id:'main', body:...}]`. Rewrote to assert body-content
   equality (the real invariant) plus the new, correct, filename-derived id (`'AGENTS'`), with a comment
   explaining the id-source change.
2. **`test/stories/E3/e3s2-fixpoint.test.ts`** (E3.S2, generic cross-adapter fixpoint test, NOT
   aider-specific in structure) — added a `RULE_ID_REGENERATORS` set (`{'aider'}`) and a `stripRuleIds`
   helper, mirroring the file's own pre-existing `HOOK_ID_REGENERATORS`/`stripHookIds` precedent for hook
   ids that don't survive certain adapters' compile→import cycle. Only aider's `rules` key comparison is
   id-stripped; every other adapter/key still compares exactly (no weakening elsewhere).
3. **`test/stories/E4/roundtrip-matrix.test.ts`** (E4.S1, `PASSING_PAIRS` includes `['aider','rules']`) —
   added a local `stripId` scoped to `adapterId==='aider' && type==='rules'`, mirroring the file's own
   documented `EXCLUDED_FIELDS.hooks: ['id']` precedent (same rationale: "source-filename artifact,
   native dialect has no id slot") — kept adapter-scoped rather than broadened into `EXCLUDED_FIELDS.rules`
   globally, since every OTHER `rules:'full'` adapter (claude, continue, codex, copilot, crush, cursor,
   gemini, opencode, cline) DOES preserve id via its own one-file-per-rule filename convention; a blanket
   exclusion would have silently lowered the bar for all of them.
4. **`test/stories/E1/E1.S2.test.ts`** — removed the `gap` field from aider's fixture spec (the forced
   E1.S2 graduation above); the fixture itself (`.aider.conf.yml` + wired `CONVENTIONS.md`) was already
   documented-truth-shaped and needed no change, only the loop routing (tracked → plain).
5. **`test/stories/TRACKED-FAILING.md`** — beyond the 7 owned-row deletions (done as targeted in-place
   line removals, no reflow — verified via `git diff` showing only the affected hunks), the shared E1.S2
   templated row's Reason cell was hand-edited to drop the now-resolved `[AI2]` citation and append an
   "aider graduated" clause, matching the file's own established convention for partially-graduated
   multi-target rows (E2.S3/E4.S1 already do this). Row itself preserved (other clients still gap it).

## Residue for judge / next shards

- Aider's rule-id loss on read (filename-stem-derived, not frontmatter-recovered) is a genuine, permanent
  dialect limit, not a gap: aider's conventions file is plain markdown fed verbatim to the LLM's context —
  injecting a synthetic YAML-frontmatter id block would leak bookkeeping into the model's prompt, which is
  strictly worse than an honestly-synthesized id. Documented inline at all three edited call sites; no
  further action expected.
- `E4.S7` (portable-core, convergence-owned) and `E1.S4` (unsupported-by-source, engine-owned wave 4) were
  checked for collateral impact and found clean — neither references anything this fix touches; both left
  untouched, still correctly tracked.
- Numerous other stray worktrees exist under `/private/tmp/` and `/Users/lex/workspaces/.mav-w5-standards`
  for other in-flight wave-5 shards (kilo, mcp-rehoming, amp, devin, pi, standards, crush, codex, gemini,
  base) — out of territory, not touched, left exactly as found.

## Gates (4×0, pristine worktree)

- Clean worktree `/tmp/gate-aider` created at this session's commit sha (`git worktree add`), gated there,
  removed after.
- `pnpm build` — 2/2 tasks green.
- `pnpm test --force` (turbo) — agent-forge 677/677, agent-anatomy 36/36; agent-memory has no turbo
  pipeline wiring (same as every prior wave-5 shard) — run directly via
  `pnpm --filter @leclabs/agent-memory test` — 121/121 green.
- `pnpm lint` — biome, 0 errors (477 files).
- `pnpm typecheck` (turbo) — 4/4 packages, 0 errors.
- `coverage.test.ts` — green (6/6): MAP.md byte-current, TRACKED-FAILING.md enumeration exact,
  totality/no-silencer meta-gates all pass.
