# pi-adapter — RETURN

ρ=LLM. Wave 5, re-dispatch (fresh model) after a Fable-limit death on the same shard. Base
`7ceb286` (kilo-adapter complete, tracked 45/21).

## Residue found + reconciled (disclosed before the work, zero-trust)

A dead prior-session worktree `/private/tmp/mav-pi/wt` @ commit `4859fae` (own message:
"feat(agent-forge): pi adapter — natural surfaces + pi-package code delivery") existed, built
atop `4d81308` — 2 commits behind this shard's actual base (missing `amp-adapter`/`kilo-adapter`,
so its own roster arithmetic — "12", "11→12" — was stale and untrustworthy on inspection, not
taken on its self-report). Verified rather than trusted: read the adapter source in full against
the pi RETURN sheet and the three owned test files before reusing anything. Reconciliation:
`git cherry-pick -n 4859fae` onto the real base `7ceb286`, then resolved 5 conflicts by hand
(`cli/index.ts` roster array, `E6.S6` count, `docs/release-audit-checklist.md` row placement) and
fully re-derived the two ledger files from scratch against current HEAD rather than trusting the
stray diff (`TRACKED-FAILING.md` reset to `--ours` then the 13 pi rows deleted by hand;
`MAP.md` reset to `--ours` then regenerated via the actual tool, never hand-merged). The adapter
source itself (`src/adapters/pi/index.ts`, 615 lines) and the three test-file call-site flips
(`story.tracked`→`story`) applied clean with zero conflicts and were verified correct against the
RETURN sheet and a real-disk smoke before being trusted — nothing in this shard shipped on the
dead session's say-so alone. The stray worktree and its loose scratch files
(`/private/tmp/mav-pi/{strip-tracked.mjs,tf-commit.md,tf-work.md}` — the dead session's own
TRACKED-FAILING-editing scaffolding) were removed after confirming genuinely superseded, same
reversible in-domain janitorial class as the cursor/kilo shard precedents.

## Commit

- `8fdef26` feat(agent-forge): pi adapter — natural surfaces + pi-package code delivery
  (E5.S8+E10.S8/S9).

## Owned ids (13/13 graduated)

| Story  | Test                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------- |
| E5.S8  | skills floor discharged natively: `.agents/skills/` emission, name = dirname spec-strict [PI5] |
| E5.S8  | agents via code: md defs at `.pi/agents/*.md` + registerTool delegate extension [PI9]          |
| E5.S8  | hooks via `pi.on()`: tool_call veto / tool_result / session_start / input [PI3]                |
| E5.S8  | one pi package: `package.json` `pi-package` keyword + `pi.extensions` manifest [PI6][PI2]      |
| E10.S8 | pi is on the adapter roster (new-adapter contract)                                             |
| E10.S8 | rules: root AGENTS.md unchanged, no `.pi/AGENTS.md` surface [PI2]                              |
| E10.S8 | skills: `.agents/skills/` tree unchanged, frontmatter constraints enforced [PI5]               |
| E10.S8 | commands → prompt templates `.pi/prompts/*.md` [PI7]                                           |
| E10.S8 | capabilities honest: hooks/agents/permissions never claim a config surface; mcp none [PI2]     |
| E10.S9 | all code-shaped resources ship as ONE pi package; install line + full-system-access [PI6]      |
| E10.S9 | hooks map onto `pi.on()`; blocking = tool_call veto, result-mutating = tool_result [PI3]       |
| E10.S9 | agents: subagent-pattern emission (md defs + registerTool delegate) [PI9]                      |
| E10.S9 | round-trip honesty: code emissions write-only, TS never parsed as config [PI3]                 |

All 13 `story.tracked` call sites across `test/stories/E5/S8.pi-demonstration.test.ts`,
`test/stories/E10/S8.pi-natural.test.ts`, `test/stories/E10/S9.pi-code-emission.test.ts` flipped
to `story`. Verified with a real-disk smoke (write → read round-trip in `/tmp`, outside vitest,
via the built `dist/`) before gating: rules/skills/commands/agents/hooks all landed at the
documented paths, package.json carried exactly one `pi-package` manifest with both extension
files listed, both the package-install and trust warnings fired, and reimport lifted only config
surfaces (`rules`/`skills`/`commands` populated, `hooks`/`agents` `undefined` — code emissions
confirmed write-only).

## Roster increment (14 → 15) — every bite-guard, disclosed

Read the roster count from the tree at HEAD `7ceb286` (14, amp+kilo already landed) before
committing, per the dispatch's "never a pinned number" instruction.

| File                                              | Edit                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/cli/index.ts`                                | import + registration in the `adapters` array                                              |
| `test/stories/helpers.ts`                         | import + `ALL_ADAPTERS` roster array (alphabetically sorted, already correct pre-conflict) |
| `test/stories/E6/S6.project-every-target.test.ts` | `toHaveLength(14)` → `toHaveLength(15)`                                                    |
| `test/stories/E4/capability-honesty.test.ts`      | new `pi` `GROUND_TRUTH` row (all 8 resource cells) — auto-merged clean                     |
| `docs/release-audit-checklist.md`                 | new `pi` re-verify row (pre-1.0 volatility + 3 UNVERIFIED items flagged)                   |
| `package.json` `./adapters/*` export              | **no edit** — already a wildcard glob (5th shard to reconfirm this a no-op)                |

## Design (disclosed inferences + judgment calls)

- **Single-file shape** mirrors `crush/index.ts` (the exemplar named in the shard spec) — pi has
  no scope-precedence complexity beyond user/project dir swap, so no opencode-style multi-file
  split was warranted.
- **Hooks + agents declared `'plugin'`** (the `Support` type's plugin-mode value, landed by the
  `engine-report-machinery` dependency), never `'full'`/`'partial'` — pi has zero config-file
  dialect for either per [PI2]'s explicit "No sub-agents... build your own with extensions"
  philosophy; both route through `pluginEmitters` AND are handled directly inside `write()` (the
  amp-adapter precedent: owned tests call `adapter.write()` directly, bypassing `compile()`).
- **Event map is 4-for-4 [PI3]-verified**, not padded: `tool.use.pre`→`tool_call`,
  `tool.use.post`→`tool_result`, `session.start`→`session_start`, `prompt.submit`→`input`. Every
  other canonical event skips by name (E4.S4 discipline) — verified in the demonstration test by
  pushing a `file.change.external` hook and asserting it lands in `.skipped`.
- **Skill frontmatter is spec-strict**, not pi's tolerant superset: name = dirname always enforced
  even though [PI5] documents pi accepting name≠dirname as a deliberate deviation — the adapter
  holds the stricter Agent Skills spec line rather than pi's laxer one, per the shard's explicit
  instruction.
- **Trust-gate warning** fires on every write that touches `.pi/` or `.agents/skills/` in project
  scope (skills, commands, hooks-as-code, agents-as-code) — never in user scope (global resources
  aren't trust-gated per [PI2]). **Package warning** (install line + full-system-access caution)
  fires only when code-shaped resources (agents/hooks) are actually emitted, not on every write.
- **Read is deliberately asymmetric with write**: AGENTS.md/CLAUDE.md (co-equal, first-found-wins)
  and SYSTEM.md/APPEND_SYSTEM.md all lift as rules; `.pi/extensions/*.ts` is NEVER parsed as
  config — a foreign extension file is invisible to `read()` entirely (the owned E10.S9 test
  asserts `hooks`/`agents` come back empty even when a real `.ts` extension file sits on disk).
  This is a deliberate write-only-code-emission property, not an unlifted-surfaces gap this
  adapter itself should warn on (no `unlifted-surfaces` channel touched — that's the import-audit
  machinery's concern, out of this shard's territory).

## Legacy-unit-test grep (standing lesson, confirmed inapplicable)

Grepped `pi` as a whole word across the ENTIRE `test/` tree (`grep -rlwn`, not `\bpi\b` textual
substring which false-positives on nothing here since `-w` already word-bounds) before gating:
zero hits outside the six story-suite files this shard touches. pi is NET-NEW — no prior
shipped-but-wrong adapter existed for a legacy unit test to have pinned; same non-finding class as
kilo's.

## Gates (4×0, clean worktree)

Worktree `/tmp/gate-pi` at commit `8fdef26` (removed after gating, along with the reconciled dead
worktree `/private/tmp/mav-pi/wt` and its loose scratch files): `pnpm build` → 2/2 tasks;
`pnpm test --force` → forge 690/690 (112 files), anatomy 36/36 (6th shard to reconfirm root
`pnpm test` doesn't wire agent-memory); `pnpm --filter @leclabs/agent-memory test` → 121/121;
`pnpm lint` → 490 files clean; `pnpm typecheck` → 4/4 tasks green. `coverage.test.ts` green (6/6,
inside the forge run). Net TRACKED-FAILING: 45/21 → 32/18 (13 rows removed, all owned; 3 stories
fully emptied: E5.S8, E10.S8, E10.S9).

## Residue for the judge / Nico's aggregate reconciliation

- **Cleaned up** (safe, reversible, in-domain, same class as cursor/kilo precedent): the dead
  worktree `/private/tmp/mav-pi/wt` (18-commit-behind partial pi attempt from the prior
  Fable-death session) and its loose scratch files under `/private/tmp/mav-pi/`.
- **NOT touched** (out of territory, left for their owners / Nico): every other stale worktree
  under `/private/tmp/` (`af-mcp-rehome`, `af-pristine-eca0068`, `amp-wt`, `base-wt`,
  `devin-compose`, `ih-*`, `mav-baseline-w`, `mav-codex-truth`, `mav-crush-truth`,
  `mav-gemini-w`, `mav-land`) and `/Users/lex/workspaces/.mav-w5-standards` — several pinned well
  behind live HEAD, same residue class, but belong to their respective shards or Nico's aggregate
  pass.
- `continue-adapter-truth` bookkeeping gap (code shipped `4d81308`, task file still `active/`, no
  `.RETURN.md`) — already flagged by prior shards in `plans/interop-hardening/AGENTS.md`;
  confirmed still open, still out of my territory, re-flagged again for Nico.
- The `docs/release-audit-checklist.md` pi row's three UNVERIFIED items (trust.json entry schema,
  subagent frontmatter fields beyond name/description/tools/model, and pre-1.0 volatility
  generally) are honest open threads for a future re-verification pass, not defects.
