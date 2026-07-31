# Canon/forge separation — what remains

Filed, not chased. Audited 2026-07-30 with file:line citations; ranked by whether it changes
emitted bytes. The principle under audit: **canon is the generic design discovered from the model's
concept space; forge owns harness projection.** Violations run in both directions.

## Landed this session

| what                                                                                                             | commit    |
| ---------------------------------------------------------------------------------------------------------------- | --------- |
| The invocation leaves the cell; adapter derives it; codex stops being stripped and gains `hooks/` + `hooks.json` | `b162a80` |
| `CLAUDE_SESSION_ID` / `$CLAUDE_SETTINGS_PATH` → the generic `AGENT_SESSION_ID` contract                          | `aef6971` |
| GATE `harness-parity` — convicts a silently-absent cell set and a foreign harness path                           | `b162a80` |

## Next

The canon→codex path is now whole: authored once, projected to both harnesses, deployed to both.
What remains is ownership, not reachability.

**Take B9 next** — `CanonicalEvent`, the same defect in the lifecycle vocabulary. The harness-neutral
event taxonomy IS the ideal design and belongs to canon, with forge keeping only the per-harness
maps; its own header already argues _"This is canon, not a Claude detail."_ Same seam, same shape of
fix, and [`DIMENSION-OWNERSHIP.md`](./DIMENSION-OWNERSHIP.md) is now the executed template — including
the step ordering, the byte-identity oracle, and the trap that a defaulted parameter which is
accepted and ignored passes every byte-identity check there is.

**Two defects filed by the executing agents, neither chased:**

- `agent-forge`'s `anatomy-descriptor` test compares canon's dimension dirs against forge's own
  FIXTURE catalog, since forge cannot depend on canon. It still bites on drift, and canon's
  `cratylism.test.ts` covers dir↔catalog drift against the real catalog — but the fixture now names
  canon's 22 dimensions, which is a maintenance coupling worth removing.
- `agent-forge catalog`'s zero-config corpus view loads the corpus package's entry module for its
  catalog and refuses loudly when it finds none. That path has no test coverage, before or after.

Still claude-shaped in deploy, and worth folding in when B1–B6 is done: `deploy/seeds.ts` (memory
store names + doctrine prose), `deploy/manifest.ts` `KIND_ROOT`, `deploy/init.ts`.

## Direction A — harness knowledge still inside `agent-canon/src`

| #   | what                                                                                                              | where                                         | bytes?       |
| --- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------ |
| A2  | `matcher: 'AskUserQuestion\|Agent\|SendMessage'` — claude TOOL NAMES in a cell                                    | `hooks/stance-guardrail-pre.ts:21`            | yes          |
| A5  | `substrate ↦ claude` in the skill that AUTHORS cells — the reproduction mechanism for every other leak            | `skills/create-agent/skill.ts:20`             | yes          |
| A6  | front-matter/`<name>.md` asserted as the authoring law; codex emits `.toml`                                       | `create-agent`, `create-skill`, `materialize` | yes          |
| A7  | `dimensions/model/claude.ts` — a vendor name as a canon dimension VALUE (also orphaned: no agent selects it)      | `dimensions/model/claude.ts:3`                | catalog only |
| A9  | the σ\*-register law quantifies over `CLAUDE.md`/`SKILL.md`/`AGENTS.md` — one harness's file tree, not cell kinds | `skills/signify/skill.ts:55`                  | yes          |
| A10 | `timeout` on hook cells — `HarnessMechanism` already owns it                                                      | 4 cells                                       | yes          |
| A12 | `scripts/<capability>.mjs` — the projector owns that shape                                                        | `wake`, `dream`, `handoff`, `event-tap`       | yes          |

**A2 needs real design, not a rename.** "Fire when the agent is about to ask or delegate" is a
generic intent expressed in claude's tool namespace. The generic form requires a canonical
tool-class vocabulary — the same move `CanonicalEvent` made for lifecycle events. Do not paper it.

## Direction B — generic design decided inside `agent-forge`

| #       | what                                                                                                                                                                                                        | where                                      |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| B1      | **the dimension allowlist** — which 22 dimensions are real, as a TS union in the projector                                                                                                                  | `anatomy/index.ts:56-77`                   |
| B2      | per-dimension `axis`/`kind`/`arity` — design opinions, self-declared: "agent-forge owns the MECHANISM… the corpus owns the DATA"                                                                            | `anatomy/index.ts:304-341`                 |
| B3-B5   | the SAME dimension list hand-kept in **four** places (`SetDimension`, `Agent` fields, `DIMENSION_FIELD`) — B5's own comment argues against being a second copy                                              |                                            |
| B6      | `guardrails` non-nullable — "no agent may exist unconfined" is canon doctrine, enforced by forge's types and explicitly refusing an `accept()` leg                                                          | `anatomy/index.ts:378-401`                 |
| B7      | memory-store seed PROSE (CoALA doctrine) authored in the deploy layer; its own `TODO(S4)` admits it                                                                                                         | `deploy/seeds.ts:36-86`                    |
| B9      | **`CanonicalEvent`** — the harness-neutral lifecycle taxonomy IS the ideal, so it belongs to canon; forge should own only the per-harness maps. Its header even argues "This is canon, not a Claude detail" | `core/hook/generated.ts`                   |
| B11-B14 | σ\*-register doctrine, `NO_PRIOR`, `HUMAN_MARKERS`, parsimony classes — canon semantics hardcoded beside an empty `Policy` injection seam that exists for exactly this                                      | `validate/*`, `core/exemplify/register.ts` |
| B16     | the SOUL body shape — harness-neutral by its own header, which is what makes it canon's                                                                                                                     | `core/anatomy-body.ts:41-68`               |
| B17     | `CANON_PACKAGE = '@leclabs/agent-canon'` — the projector names one corpus as the default design                                                                                                             | `config/scaffold.ts:20`                    |

**B1–B6 are one defect with five faces:** the ideal agent's dimension set is capped by a TypeScript
union in the harness-projection package, and transcribed by hand four more times. A corpus cannot
discover a new dimension without editing forge — which inverts the whole thesis. Fixing it means
the catalog becomes DATA the corpus supplies and forge validates.

## Clean — checked, and correct

The adapters themselves. `canonicalToClaude`/`canonicalToCodex` are pure maps;
`CODEX_AGENT_SCOPED_EVENTS` is an adapter asserting a fact about its own harness;
`adapters/registry` is the only module naming concrete adapters; `runtime-shim.ts` is a correctly
declared and correctly located vendor seam; `validate/policy.ts` is correctly empty of doctrine.
