# opencode-adapter-truth — RETURN

**Commit:** `4d1b506`, atop base `728be9f` (cursor-adapter-truth complete). Gated in clean worktree
`git worktree add /tmp/gate-opencode 4d1b506` (removed after gating). Re-dispatch note: per the
dispatch, the prior Fable-session attempt at this exact shard was treated as fully from-scratch —
no prior worktree/branch for this task was found on the live checkout (unlike the cursor shard's
stale `.claude/worktrees/mav-cursor-truth`), so this is a clean derivation, not a resume.

Built atop the already-landed engine-report-machinery fix: opencode's `hooks` capability was already
flipped `partial → plugin` with hook emission extracted to `pluginEmitters.hooks` (the
`.opencode/plugins/` shim). That mechanism is untouched here — only the event map it draws from
(`canonicalToOpencode`) was pruned.

## Owned ids graduated (12/12)

| Story | Test (exact row removed from TRACKED-FAILING.md)                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------- |
| E8.S6 | `MCP lives under the mcp key of opencode.json, typed local, command as ARRAY [OC7]`                                 |
| E8.S6 | `the fabricated .opencode/mcp.json is never emitted [OC7]`                                                          |
| E8.S6 | `agents capability on: .opencode/agents/*.md with mode field [OC2]`                                                 |
| E8.S6 | `commands capability on: .opencode/commands/*.md emitted [OC4]`                                                     |
| E8.S6 | `no permissions.json; IR permissions map to the permission DSL in opencode.json [OC8]`                              |
| E8.S6 | `no fabricated env.json is emitted [OC1]`                                                                           |
| E8.S6 | `hook-plugin shim maps only [OC5]-verified event names (E5.S4)`                                                     |
| E8.S6 | `fabricated-shape import: .opencode/{mcp,permissions,env}.json lift zero phantom resources (E1.S3) [OC7][OC8][OC1]` |
| E4.S4 | `opencode: eventMap injective — agent.idle and turn.end must not collide on session.idle`                           |
| E4.S4 | `opencode: toCanonical(toNative(e)) = e (agent.idle and turn.end collide on session.idle)`                          |
| E5.S4 | `opencode: only the [OC5]-verified plugin event names are mapped; unverified names are excluded until re-verified`  |
| E9.S4 | `opencode.json: mcp lands under the documented "mcp" key with foreign keys preserved [OC7]`                         |

E8.S6 fully empties (all 8 of its rows were mine — the story had no other call sites). E4.S4 keeps
cline's row (still tracked, other territory). E5.S4 keeps kilo's row (no kilo adapter — future
shard). E9.S4 keeps claude's + aider's rows (still tracked, other territory).

Net TRACKED-FAILING: **94 → 82** (34 → 33 stories: E8.S6 fully graduated). MAP.md regenerated
(`pnpm exec tsx test/stories/tools/render-map.ts`, 334 refs), prettier-formatted.

## Design (decision + rationale)

- **`opencode.json` as the ONE config home** [OC1][OC7][OC8]: `paths.ts` gained `configFile` (project
  root `<cwd>/opencode.json`; user `~/.config/opencode/opencode.json`) and dropped the fabricated
  `mcpFile`/`permissionsFile`/`envFile` fields entirely — there was nothing left for them to point
  at once the real dialect landed. `write.ts` builds an `owned` object (`{mcp?, permission?}`) and
  merges it into the existing file via the shared `mergeJsonKeys` helper (the same key-scoped-merge
  utility crush already uses) — foreign keys survive untouched (E9.S4).
- **MCP command-as-ARRAY** [OC7]: the real dialect's local-server shape is
  `{type:'local', command:[...], enabled?, environment?}` — note the key is `environment`, not
  `env` (a documented-dialect detail easy to miss). Write merges IR's `command`(string|array) +
  `args` into one array; **read splits the array back into `command`(string) + `args`(rest)**
  rather than keeping it as IR's array form — this was a deliberate choice to preserve the
  already-green `opencode/mcp` row in `E4/roundtrip-matrix.test.ts` (`PASSING_PAIRS`), whose shared
  fixture uses the split `{command:'npx', args:[...]}` shape; verified the round-trip against that
  exact fixture before committing to the split, not guessed. Remote servers land as
  `{type:'remote', url, headers?}` — opencode's dialect has no sse-vs-http distinction, so read
  defaults remote transport to `'http'` (honest: the real config doesn't carry the distinction either).
- **Permissions DSL** [OC8]: real opencode permission config is a nested glob-DSL
  (`{bash:'ask'}` / `{edit:{'*.md':'deny'}}`), not IR's flat `{allow,deny,ask}` lists. Wrote a
  best-effort two-way mapper (`buildPermission`/`permissionsFromOpencode`): a bare `Tool(*)`/`Tool`
  IR pattern becomes a flat `{tool: action}` entry; a scoped `Tool(glob)` pattern nests under the
  tool key. Applied in `allow → ask → deny` order so a same-key collision resolves to the more
  restrictive action. This is real, lossy-but-honest translation (declared `partial`, matching
  ground truth) — not the previous behavior (dump raw IR JSON to a fabricated `permissions.json`
  with a "not natively read" warning).
- **Agents on** [OC2]: `.opencode/agents/*.md`, filename = id. Documented frontmatter is narrower
  than the generic IR Agent shape (description/mode/model/temperature/tools/permission only — no
  color/permission_mode/max_turns/memory/effort), so — mirroring the codex `color`-drop and cursor
  `serializeCursorAgent` precedent exactly — wrote a **bespoke** `serializeOpencodeAgent` rather
  than reusing the generic `serializeAgent`, with a named warning listing every dropped field
  actually present on a given batch of agents. An unset `mode` is defaulted to `'subagent'` (the
  field is required by opencode's frontmatter, and IR agents are subagent definitions by contract)
  — the default is **disclosed via a per-agent warning naming the agent**, never fabricated silently.
  Declared `partial` (not `full`), matching the field-coverage gap.
- **Commands on** [OC4]: `.opencode/commands/*.md`, filename = id; reuses the generic
  `serializeCommand`/`parseCommand` (opencode's documented command fields — description/agent/
  model/subtask — round-trip well enough through the generic path; no bespoke serializer needed
  here, unlike agents). Declared `partial` (argument_hint/allowed_tools have no native home).
- **Event map pruned to the 4 [OC5]-verified names** (`tool.execute.before/after`,
  `session.created`, `file.edited`): removed the other 9 native names (`session.deleted`,
  `session.idle` for BOTH `agent.idle` and `turn.end`, `file.watcher.updated`, `command.executed`,
  `permission.asked`, `permission.replied`, `tui.toast.show`, `session.compacted`) — none are
  confirmed in current opencode plugin docs, and the `agent.idle`/`turn.end` pair sharing
  `session.idle` was the injectivity violation itself. `capabilities.hooks.supported` shrunk to
  match exactly (4 events) so the generic "supported+skipped=28" story stays green with no
  special-casing. The removal is a genuine, reported behavior change, not a silent one — see the
  relay-test note below.
- **env has no surface** [OC1]: capability flipped `'full' → 'none'`. `ir.env` now gets a named
  warning + a `skipped` entry, never a fabricated `env.json`. This was **not** in the owned-id list
  but is a direct, necessary consequence of the OC1 fix — leaving `env: 'full'` declared while
  writing nothing would have been a worse lie than the one being fixed.

## Non-owned test edits (all disclosed)

1. **`test/stories/E1/E1.S2.test.ts`** — removed opencode's
   `gap: 'opencode.json mcp/permission + agents/commands unread [OC2][OC4][OC7][OC8]'` field. The
   now-complete mcp/permission/agents/commands read side satisfies every resource class in E1.S2's
   opencode fixture (`opencode.json` with typed `local` mcp + `permission` key, `.opencode/agents/
rev.md`, `.opencode/commands/go.md`, `.opencode/skills/s1/`). Ran the file standalone first to
   confirm exactly opencode's spec flipped (10/10 green), nothing else. Same mechanism the
   copilot/cursor/crush/gemini/zed shards used.
2. **`test/stories/E1/E1.S3.test.ts`** — added `.opencode/mcp.json` to `ZERO_LIFT_GRADUATED`: read.ts
   no longer consults that fabricated sidecar at all, so the zero-lift leg holds. The sibling
   "import report warns naming the unrecognized path" leg stays tracked (no such warning exists
   yet) — split exactly as the file's own doc comment describes.
3. **`test/stories/E4/roundtrip-matrix.test.ts`** (E4.S1, mandatory per the declaration-is-the-oracle
   discipline) — removed `['opencode', 'env']` from `PASSING_PAIRS`. `env` capability flipped to
   `'none'`, so it's no longer in the declared-`'full'` set the matrix-completeness story checks;
   leaving the pair classified would have failed that story. Verified opencode/mcp (still declared
   `full`) still round-trips clean before leaving it in `PASSING_PAIRS` unchanged.
4. **`test/stories/E4/relay.test.ts`** (E4.S6) — narrowed the "resources survive the relay exactly"
   list from `[rules, skills, hooks, mcp_servers, permissions, env]` to `[rules, skills, mcp_servers,
permissions]`. Root cause: the fixture's `Stop` hook maps to canonical `turn.end`, which the
   pruned (honest) event map no longer carries — a genuine, **reported** loss (the hook is entirely
   skipped with a named warning), not a silent one; the prior "exact survival" claim for `hooks`
   only held because of the fabricated `turn.end → session.idle` mapping being removed here. `env`
   drops for the same reason (no surface at all now). Both losses are still covered by the sibling
   "symmetric diff ⊆ reported-loss fields" story, which stayed green throughout.
5. **`test/stories/E2/e2s3-project-compile.test.ts`** — corrected a stale inline comment (6
   fabricated paths → 5; opencode's `.opencode/mcp.json` graduated). No assertion changed — this
   file's `DOCUMENTED_PROJECT_FILES`/`DOCUMENTED_PROJECT_PREFIXES` allowlists already had
   `opencode.json`/`.opencode/agents/`/`.opencode/commands/` and an explicit "deliberately absent"
   comment for the three fabricated sidecars, i.e. this file was already pre-built for exactly this
   fix by an earlier pass. Mirrored the same correction into `TRACKED-FAILING.md`'s E2.S3 reason cell.
6. **Four legacy non-story unit-test files** (pre-story-coverage suite, discovered only at the
   repo-wide gate — invisible to a `test/stories`-only run, per the standing wave-5 lesson):
   - `test/adapters/opencode/round-trip.test.ts` — rewrote the "warns about commands+agents
     (unsupported)" test to "writes commands + agents" (files exist, `mode:` present, no
     unsupported-surface warning); rewrote the "writes skills, MCP servers, permissions, env" test
     to assert the fabricated sidecars are gone and `opencode.json` carries `mcp`/`permission`
     instead; dropped `env` from the Phase-2 round-trip test (asserts `re.env` is now `undefined`).
   - `test/cli/portability-phase2.test.ts` — same class: rewrote the opencode cross-adapter test to
     assert real commands/agents/mcp/permission emission and an `env` warning instead of a
     commands/agents warning.
   - `test/adapters/ir-bridge/round-trip.test.ts` — the shared
     `describe.each([opencodeAdapter])` "lossy-by-design: whole-resource-skip" block no longer holds
     (agents are written now, not skipped). Removed it entirely (mirroring how the cursor shard
     already removed cursor from this same block) and added a dedicated
     `describe('B4 round-trip: opencode (color dropped...)')` block mirroring the cursor/codex
     field-level-drop pattern: `report.skipped` empty, warnings name both `color` (dropped) and
     `mode` (defaulted), and `re.agents` equals the fixture agents minus `color` plus `mode:
'subagent'` (none of the 11 agent-anatomy fixture agents set `mode`, so every one gets the
     default — verified against the actual fixture content before writing the assertion).
   - `test/adapters/codex/anatomy.test.ts` — despite the directory name, this file's
     "lossy reporting for agents-none adapters" describe block had an opencode-specific test
     asserting a whole-resource skip+warn. Rewrote it to assert the real write (file exists at
     `.opencode/agents/nico.md`, not skipped) plus the mode-default warning; corrected the block's
     docblock (now describes aider only for the whole-skip case, points at the opencode test above
     for the field-level-drop case).

## Residue for judge / next shards

- **Bespoke `serializeOpencodeAgent`, not the generic `serializeAgent`**: this diverges from the
  copilot-shard precedent note ("agents/skills reuse generic serializeAgent — no bespoke serializers
  needed") — that precedent held for copilot because its documented frontmatter is broad enough to
  match the IR shape. opencode's is narrower (same class as cursor's `serializeCursorAgent`), so
  reusing the generic serializer would have fabricated undocumented keys (`color` etc.) straight
  into the file — same anti-pattern the divergence research flags elsewhere. Flagging so a future
  shard doesn't treat "reuse the generic serializer" as a blanket rule.
- **`AGENT_UNSUPPORTED_FIELDS` drop list** (`color`, `permission_mode`, `max_turns`, `memory`,
  `effort`) lives locally in `write.ts`, duplicated conceptually (not literally) from cursor's list
  of the same shape. No shared home was created for it — each adapter's documented-field set is
  genuinely different (opencode's includes `tools`/`temperature`, cursor's doesn't), so a shared
  constant would either be wrong for one of them or need per-adapter overrides anyway. Left
  adapter-local by design, not an oversight.
- **`opencode.json` `enabled`/`cwd` MCP fields, `oauth` on remote entries**: read/write handle
  `enabled` (maps to IR's `disabled` when `false`) but not `cwd` (stdio) or `oauth` (remote) — no
  IR field exists for either and neither was exercised by any owned test. Flagging as unmodeled,
  not fixed.
- **E4.S3 capability-honesty rows** (`stale cells...`, `over-claim cells retired...`): opencode's
  own cells (agents/commands under-claim, env over-claim) are now individually honest, but both
  tracked tests are **combined, multi-adapter** assertions that also require cline's and crush's
  cells to be fixed (neither has landed yet in this wave) — left untouched, correctly still tracked.
  Not a gap in this shard; just noting why it didn't graduate despite opencode's own honesty being
  fixed.
- **No stray worktree found for this task**: unlike the cursor shard's stale
  `.claude/worktrees/mav-cursor-truth`, no dead worktree or branch exists on the live checkout for
  `opencode-adapter-truth` — the prior Fable-session death apparently left no local artifact to
  clean up. Several unrelated worktrees exist under `/private/tmp/` and
  `/Users/lex/workspaces/.mav-w5-standards` for OTHER in-flight wave-5 shards (aider, kilo, devin,
  amp, pi, mcp-rehoming, standards) — out of territory, not touched.

## Gates (4×0, pristine worktree `/tmp/gate-opencode` @ `4d1b506`)

- `pnpm build` — 2/2 tasks green.
- `pnpm test --force` (turbo) — agent-forge 676/676, agent-anatomy 36/36; agent-memory run
  separately via `pnpm --filter @leclabs/agent-memory test` (turbo's root `test` pipeline doesn't
  wire agent-memory in — same as observed in prior shards) — 121/121 green.
- `pnpm lint` — biome, 0 errors (472 files).
- `pnpm -w typecheck` (turbo) — 4/4 packages, 0 errors.
