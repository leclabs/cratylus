# interop-hardening — pressure-test and harden the library's capability surface

**The initiative.** The repo stands on a stable foundation; this plan strengthens, improves, fixes,
and pressure-tests every intended capability of the library (agent-forge as the common tongue +
agent-anatomy as its opinionated corpus): harness interop (import → IR → export, round-trip
accurate), the conventional `.{namespace}/` output surface, plugin-architecture adapters where a
harness lacks native support, and the context-optimization pipeline (raw operator context →
exemplify → reader=LLM artifacts). Method: research the landscape → a full user-story library →
tests that cover every story (failing tests define the gap) → implementation shards that close it.

## Status mirror

DAG: `wave(0) {harness-landscape-research · standards-compat-research}` →
`wave(1) {capability-user-stories ⊳ both}` → `wave(2) {story-coverage-tests ⊳ stories}` →
`wave(3) {author-implementation-shards ⊳ tests}` → `waves(4–7) {the 23 implementation shards below}`.

**ALL WAVES COMPLETE (2026-07-03).** Waves 4–7 all landed & judged. Final HEAD `dec62af`.
**32 commits local-unpushed since origin `53023a1` — held at the push gate** (irreversible-outward;
awaiting Operator sign-off).

**Tracked-failing: 2/2** (229 at suite birth → 2). The terminal condition was "→ 0 (only the
pre-marked FUTURE exclusions E5.S6·E9.S5·E10.S10 remain)". **2 rows survive as proven by-design
boundaries, surfaced for a scope decision** (convergence-graduation declined to force them — honesty
over green-sweep):

1. **E1.S2 (cline foreign hook)** — a hand-authored `.clinerules/hooks/<Event>` script with no
   `# agent-forge:<id>` marker has no structured fields; synthesizing a Hook from arbitrary foreign
   shell would be fabrication, which the initiative forbids. Correctly reported as unlifted-surface.
2. **E4.S1 (codex/agents `tools`/`color`; claude/rules concat path)** — lossy-by-design: no Codex
   agent-TOML field for tools/color (warned+dropped, never fabricated); a concat rule's CLAUDE.md
   references `@AGENTS.md` per Anthropic's own shim [S7] rather than duplicating the body. This is
   the library's explicit "lossy translation is first-class" thesis.
   **Decision pending:** reclassify both as documented won't-do exclusions (joining the FUTURE set →
   clean 0) OR keep them tracked as honest permanent boundaries. Reclassifying changes the agreed
   exclusion scope → Operator's call.

Roster **11→16** (5 new adapters: amp·kilo·pi·devin·standards).

**Wave-5 recovery note:** all 15 shards' first-attempt executors died on the account Fable-5 limit
mid-flight. Recovery (model switched to Opus): 3 had raced through (continue·claude-mcp·crush), devin
was hand-replayed from its orphaned dangling commit, the remaining 11 were RE-DISPATCHED under a fresh
model (sonnet) serially atop live HEAD — one at a time because the shared ledger (`TRACKED-FAILING.md`)
is the serialization point. A pre-existing orphaned anatomy fixture (`memory.md`, red on any clean
checkout) was fixed first → green base `53023a1`. Every shard judged by net-row-math + a clean-worktree
4×0 gate. Landing chain `dc418f0`…`ca44e0b`. Waves 6–7 (`claude-surfaces` @645261a · `roster-metadata`
@401ad73 · `convergence-graduation` @2ad35c8) landed serial on the same fresh-model pipeline.

**Completed:** `harness-landscape-research` · `standards-compat-research` · `pi-harness-research` ·
`capability-user-stories` (81 stories, `stories/`) · `story-coverage-tests` (suite @0e23b36) ·
**wave(4) whole**: `docs-assumption-audit-records` · `ir-schema-expressiveness` · `zed-adapter`
@d318b20 · `exemplify-pipeline` @2a9de62 · `engine-report-machinery` @d36c2dc (RETURNs beside
each; joint gates 4×0, forge 670/670; pushed). **wave(5) WHOLE** (all 15 landed & judged, each in
its own clean-worktree 4×0 gate; final HEAD `ca44e0b`, forge 694/694): `devin` @dc418f0 ·
`codex` @98a5772 · `gemini` @d0fe3d6 · `copilot` @9489236 · `cursor` @884095c · `opencode` @4d1b506
· `cline` @2998fda · `aider` @bc7abcb · `amp` @99d2c0c · `kilo` @015fde3 · `pi` @8fdef26 ·
`standards` @7413fd9 · `continue` @4d81308 · `claude-mcp-rehoming` @eca0068 · `crush` @9f3ebf4
(RETURNs beside each). Not yet pushed past `53023a1` — held at the wave-close push gate.

## Implementation shards (pending/) — 229 tracked ids, MECE, 0 orphans

Ownership axis = file owned paths (`src/adapters/<id>/**` disjoint per adapter; core split
schema¦engine¦exemplify; docs separate). Cross-adapter parametrized call sites converge in wave(7).
Graduation mechanism per shard: `story.tracked` → `story` + TRACKED-FAILING row deletion + MAP regen.

**wave(4)** — roots, 5-wide:

| Shard                           | Lane | Ids | Owned paths                                                         |
| ------------------------------- | ---- | --- | ------------------------------------------------------------------- |
| `ir-schema-expressiveness`      | Mav  | 7   | `src/core/schema` + generated IR                                    |
| `engine-report-machinery`       | Mav  | 19  | `src/core/engine` · adapter contract · `src/cli` (+ hook-id seam)   |
| `exemplify-pipeline`            | Mav  | 13  | new `src/core/exemplify` + optimize verb + vector projection export |
| `zed-adapter`                   | Mav  | 6   | new `src/adapters/zed`                                              |
| `docs-assumption-audit-records` | Nico | 2   | `docs/`                                                             |

**wave(5)** — 15-wide (deps noted; roster-registration line in `src/cli/index.ts` = declared append-only seam):

| Shard                    | Lane | Ids | Owned paths · deps                                                                                                    |
| ------------------------ | ---- | --- | --------------------------------------------------------------------------------------------------------------------- |
| `claude-mcp-rehoming`    | Mav  | 7   | claude MCP/settings paths · ⊳engine                                                                                   |
| `codex-adapter-truth`    | Mav  | 16  | `src/adapters/codex` · ⊳schema                                                                                        |
| `gemini-adapter-truth`   | Mav  | 12  | `src/adapters/gemini` · ⊳schema                                                                                       |
| `copilot-adapter-truth`  | Mav  | 14  | `src/adapters/copilot` · ⊳schema                                                                                      |
| `cursor-adapter-truth`   | Mav  | 11  | `src/adapters/cursor` · ⊳schema                                                                                       |
| `opencode-adapter-truth` | Mav  | 12  | `src/adapters/opencode` · ⊳schema ⊳engine                                                                             |
| `cline-adapter-truth`    | Mav  | 15  | `src/adapters/cline` · ⊳schema                                                                                        |
| `crush-adapter-truth`    | Mav  | 8   | `src/adapters/crush` · ⊳engine                                                                                        |
| `continue-adapter-truth` | Mav  | 9   | `src/adapters/continue` · ⊳engine                                                                                     |
| `aider-adapter-truth`    | Mav  | 7   | `src/adapters/aider` · ⊳engine ⊳exemplify                                                                             |
| `amp-adapter`            | Mav  | 7   | new `src/adapters/amp` · ⊳engine                                                                                      |
| `kilo-adapter`           | Mav  | 6   | new `src/adapters/kilo` · ⊳schema ⊳engine                                                                             |
| `pi-adapter`             | Mav  | 13  | new `src/adapters/pi` · ⊳engine                                                                                       |
| `devin-adapter`          | Mav  | 6   | new `src/adapters/devin` · ⊳schema                                                                                    |
| `standards-surfaces`     | Mav  | 5   | new `src/adapters/standards` + doctor + neutral-tree glue · ⊳schema ⊳engine (was 8; 3 force-graduated by zed d318b20) |

**wave(6)** — 2-wide:

| Shard             | Lane | Ids | Owned paths · deps                                                             |
| ----------------- | ---- | --- | ------------------------------------------------------------------------------ |
| `claude-surfaces` | Mav  | 16  | claude rules/hooks/CLAUDE.md/local/plugin-bundle · ⊳claude-mcp ⊳schema ⊳engine |
| `roster-metadata` | Nico | 4   | roster ids/aliases/status · ⊳devin                                             |

**wave(7)** — terminal:

| Shard                    | Lane | Ids | Owned paths · deps                                                         |
| ------------------------ | ---- | --- | -------------------------------------------------------------------------- |
| `convergence-graduation` | Mav  | 11  | cross-adapter equations + residue · ⊳ all adapter shards (waves 5–6) + zed |

Deliberately deferred: none — the only unowned stories are the pre-marked FUTURE exclusions
(E5.S6 · E9.S5 · E10.S10), which carry no tracked ids.
