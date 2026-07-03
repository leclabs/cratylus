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

**Active (wave 4, in flight):** `engine-report-machinery` · `exemplify-pipeline` · `zed-adapter` —
executors were killed mid-run by the account session limit (resets 2026-07-04 01:30 CT); their
partial edits sit UNCOMMITTED in the working tree awaiting SendMessage resume. Do not commit or
clean that churn.

**Tracked-failing: 220/64** (229 at suite birth; docs −2, ir-schema −7).

**Completed:** `harness-landscape-research` · `standards-compat-research` · `pi-harness-research`
(RETURNs beside each) · `capability-user-stories` (81 stories, `stories/`) ·
`story-coverage-tests` (suite @0e23b36: 667 green, TRACKED-FAILING 229/69 enumerated, map total
both directions).

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

| Shard                    | Lane | Ids | Owned paths · deps                                                          |
| ------------------------ | ---- | --- | --------------------------------------------------------------------------- |
| `claude-mcp-rehoming`    | Mav  | 7   | claude MCP/settings paths · ⊳engine                                         |
| `codex-adapter-truth`    | Mav  | 16  | `src/adapters/codex` · ⊳schema                                              |
| `gemini-adapter-truth`   | Mav  | 12  | `src/adapters/gemini` · ⊳schema                                             |
| `copilot-adapter-truth`  | Mav  | 14  | `src/adapters/copilot` · ⊳schema                                            |
| `cursor-adapter-truth`   | Mav  | 11  | `src/adapters/cursor` · ⊳schema                                             |
| `opencode-adapter-truth` | Mav  | 12  | `src/adapters/opencode` · ⊳schema ⊳engine                                   |
| `cline-adapter-truth`    | Mav  | 15  | `src/adapters/cline` · ⊳schema                                              |
| `crush-adapter-truth`    | Mav  | 8   | `src/adapters/crush` · ⊳engine                                              |
| `continue-adapter-truth` | Mav  | 9   | `src/adapters/continue` · ⊳engine                                           |
| `aider-adapter-truth`    | Mav  | 7   | `src/adapters/aider` · ⊳engine ⊳exemplify                                   |
| `amp-adapter`            | Mav  | 7   | new `src/adapters/amp` · ⊳engine                                            |
| `kilo-adapter`           | Mav  | 6   | new `src/adapters/kilo` · ⊳schema ⊳engine                                   |
| `pi-adapter`             | Mav  | 13  | new `src/adapters/pi` · ⊳engine                                             |
| `devin-adapter`          | Mav  | 6   | new `src/adapters/devin` · ⊳schema                                          |
| `standards-surfaces`     | Mav  | 8   | new `src/adapters/standards` + doctor + neutral-tree glue · ⊳schema ⊳engine |

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
