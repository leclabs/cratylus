# docs-assumption-audit-records — the pinned assumption record + the dated release-audit checklist

**Lane** Nico · **wave(4)** · deps: none (docs territory; content sources exist).

## Static

- `packages/agent-forge/test/stories/E7/s10-claude-agents-md-tripwire.test.ts` (encodes the required record content: issue #31005 [S49] with [S7][S62]) · `test/stories/E10/S7.release-audit.test.ts` (encodes checklist shape: per-adapter rows, each UNVERIFIED item exactly once — [CX1][OC2][WS7][CT2] class — and the E7.S10 tripwire)
- `plans/interop-hardening/completed/standards-compat-research.RETURN.md` (S-refs, source ledger) · `completed/harness-landscape-research.RETURN.md` §2/§3 (UNVERIFIED markers per adapter) · `completed/pi-harness-research.RETURN.md`
- `plans/interop-hardening/stories/E7-standards-reach.md` (E7.S10) · `stories/E10-adapter-roster.md` (E10.S7)
- `docs/` (project vault — AGENTS.md §Memory vault binds it) · `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **docs authoring** (ρ=LLM; project-vault reference notes). Territory: `docs/**` + graduation flips.

- **Assumption record** (E7.S10): the claude CLAUDE.md-not-AGENTS.md premise pinned as a vault note — names anthropics/claude-code issue #31005 [S49], carries [S7][S62], states the tripwire (revisit when Claude Code reads AGENTS.md natively). Path/name: derivable from the test's search predicate — read the test first.
- **Release-audit checklist** (E10.S7): dated doc; one row per shipped adapter; every UNVERIFIED item from the RETURN sheets appears exactly once; carries the E7.S10 tripwire entry.

## Owned tracked ids (2)

| Story  | Test (call site)                                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| E7.S10 | `the pinned assumption record exists in the project vault (docs/), naming issue #31005 [S49] with [S7][S62]`                   |
| E10.S7 | `a dated release-audit checklist doc exists with per-adapter rows, each UNVERIFIED item exactly once, and the E7.S10 tripwire` |

## Accept (falsifiers)

- Graduation: both ids flip `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero non-owned `story.tracked` flips.
- Story ground: the docs are themselves the observable — each claim in them traces to a RETURN-sheet ref (no invented source); UNVERIFIED enumeration is complete against §2/§3 (grep the sheets, count).
- Territory: diff confined to `docs/**` + graduation flips.
