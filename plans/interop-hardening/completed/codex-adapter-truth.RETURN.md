# RETURN — codex-adapter-truth (wave 5)

commit `98a5772` — codex adapter truth: skills→`.agents/skills`, agent TOML `developer_instructions`,
no fabricated hooks-gate/permissions/env, MCP `bearer_token_env_var`/`http_headers`, `AGENTS.override.md`
lift. 17 files, +479/−357.

- **Graduated (owned 16/16):** E8.S2 ×13 (skills path project+user ×2 each [CX2], agent TOML
  `developer_instructions` + no fabricated `system_prompt`/`tools`/`color` [CX1], no `[features]
codex_hooks` gate [CX4], event map excludes `PermissionRequest`/covers `PreCompact`+`PostCompact`
  [CX4], no fabricated `permissions`/`env` keys + fabricated-shape import lifts zero phantoms [CX6],
  remote MCP no `type` key [CX7], `AGENTS.override.md` lifts over `AGENTS.md` [CX3]) · E7.S6 ×2 (remote
  entry shape, SSE-inexpressible warn [CX7][S47]) · E4.S4 ×1 (fabricated `PermissionRequest` gone [CX4]).
- **Forced non-owned (1, disclosed):** E7.S4's neutral-tree half graduated as a side effect — codex now
  authors into `.agents/skills/` per [CX2], which happens to satisfy the byte-equal-copy assertion
  against claude's independently generated `SKILL.md` for this fixture (not a deliberate symlink/mirror
  mechanism; flagged fragile in the module comment). The doctor drift-guard half stays tracked.
- **Non-owned test corrections (disclosed, no TRACKED-FAILING/MAP delta beyond the above):**
  `test/adapters/codex/{anatomy,round-trip}.test.ts` and `test/adapters/ir-bridge/round-trip.test.ts`
  (non-story, ungated) encoded the old fabricated shapes as ground truth — updated to the documented
  shapes; codex's agent-anatomy round-trip is no longer zero-loss on the undocumented `color` field
  (split into its own describe block, one named warning per agent). `E4.S1` roundtrip-matrix:
  `codex/env` removed from the declared-full matrix (capability `env` downgraded full→partial — the
  real surface is `shell_environment_policy`, not a flat KEY=value map, so it no longer round-trips
  even partially); `codex/agents` moved into the tracked-mismatch set (`tools`/`color` drop) beside the
  existing mcp/headers-drop pairs — the shared `TRACKED_PAIRS` loop now carries a reason per pair
  instead of one hardcoded suffix (same call site, so no TRACKED-FAILING row was added). `E1.S2`:
  codex's `.agents/skills unread` gap removed from the fixture spec (data-only — `paths.ts`'s
  `skillsDir` is shared by read+write, so the CX2 write fix necessarily also fixes the read-side lift
  exercised there; same shared call site, other clients still populate it, so no TRACKED-FAILING/MAP
  change was needed).
- **Tracked:** 148/40 → 131/39 (−17 = 16 owned + 1 forced; verified via `coverage.test.ts`'s own
  scan-derived print, not the file's pre-existing hand-written header, which was already stale before
  this session).
- **Gates:** 4×0 (build · test 676/676 · lint · typecheck) in a pristine `git worktree` of `98a5772`.
- **Residue routed:** E2.S3's tracked-reason prose (col 3, ungated) still names `.codex/skills [CX2]`
  among "6 fabricated paths" — now stale (codex's contribution is fixed; the test itself still
  correctly fails on the other adapters' fabrications, confirmed by the 676/676 gate) but left
  untouched as out-of-territory cosmetic drift, for whoever owns that shard to clean up in passing.
