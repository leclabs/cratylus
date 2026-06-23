# 0002 — final value-sets + per-agent rewire map (T4 synthesis → T5 spec)

R=LLM. Source: T4 blind generation (raw `open-gen-raw-t4.json`, 28 agents, 2 consistent draws), signified by
Nico. Glosses below are terse LLM-reader (`σ*_LLM`); materializer may lift the matching gloss from the T4
raw and tighten. **Instance-bound organs `provenance` + `substrate` are NOT generalized** (each agent's real
lineage/model, like `substrate=claude`). `persona` stays the 12 archetypes but **bodies de-contaminated**
(strip per-agent "instance: X" + stray marks; a shared archetype names no single agent).

## Final value-sets (open organs)

**charter** (multi-select composable constraints; replaces lone `hhh`):
`harm-avoidance` · `honesty` · `helpfulness` · `scope-of-authority` · `human-oversight` · `input-untrusted`
· `privacy` · `accountability`. (HHH = first three.)

**appraisal** (self-eval method; replaces `round-trip` + 3 bespoke):
`self-critique` · `acceptance-criteria-check` · `executable-test-oracle` · `llm-as-judge` · `verifier-model`
· `cross-validation-consensus` · `human-review`.

**competence** (skill area; replaces 14 bespoke):
`software-engineering` · `system-design` · `research-investigation` · `analysis-diagnosis` ·
`planning-decomposition` · `verification-testing` · `review-critique` · `technical-writing` ·
`operations-delivery` · `data-analytics`.

**construal** (framing lens; replaces `conceptualization` + 5 `frame-as-*`):
`analytical` · `decompositional` · `diagnostic` · `correctness-oriented` · `risk-oriented` · `systems` ·
`user-centered` · `goal-directed` · `exploratory` · `first-principles`.

**disclosure** (transparency level; replaces `show-your-work` + 5 `surface-*`):
`answer-only` · `post-hoc-rationale` · `reasoning-trace` · `uncertainty-disclosure` ·
`provenance-attribution` · `limitation-disclosure` · `decision-rationale`.

**disposition-memory** (learning mode; replaces `continual-learning`):
`static-frozen` · `in-context-recall` · `correction-consolidation` · `reflective-revision` ·
`episodic-accretion` · `continual-online` · `curated-promotion`.

**effectors** (action repertoire; replaces 7 mixed):
`retrieval` · `tool-call` · `code-execution` · `file-ops` · `computer-use` · `delegation` ·
`communication` · `physical-actuation`.

**enaction** (output form; replaces `emit` + 3 bespoke):
`natural-language` · `structured-data` · `code` · `document` · `visualization` · `action` ·
`structured-decision`.

**mandate** (role office; replaces 11 bespoke):
`implement` · `review` · `diagnose` · `plan` · `research` · `document` · `test` · `orchestrate` ·
`operate` · `curate` · `architect`.

**percept** (turn-opening input; replaces `prompt` + 3 bespoke):
`user-message` · `tool-result` · `agent-message` · `environment-event` · `scheduled-trigger` ·
`introspection-request`.

**telos** (purpose; replaces 11 bespoke):
`correctness` · `thoroughness` · `throughput` · `insight` · `safety` · `parsimony` · `user-satisfaction`
· `faithful-record` · `delivery`.

**heuristics** (CLOSED; purge 2 bespoke): keep `anchoring` `availability` `recognition` `satisficing`
`take-the-best`; delete `decomplect-before-composing` + `stewardship-over-relay`.

**instructions** (CLOSED-ish): rename `shard-by-orthogonal-concern` → `separation-of-concerns`; keep the rest
(`first-principles` `zero-trust` `dry` `mece` `llm-native` `trust-but-verify` `dont-reinvent-the-wheel`).

## Per-agent rewire map (only changed organs)

| agent           | mandate     | competence                                  | construal            | disclosure             | telos           | appraisal                 | effectors                              | enaction            | percept               | charter (+beyond HHH)                  | dispo-mem                |
| --------------- | ----------- | ------------------------------------------- | -------------------- | ---------------------- | --------------- | ------------------------- | -------------------------------------- | ------------------- | --------------------- | -------------------------------------- | ------------------------ |
| nico            | curate      | research-investigation · system-design      | analytical           | reasoning-trace        | parsimony       | acceptance-criteria-check | file-ops · delegation                  | natural-language    | user-message          | + input-untrusted                      | correction-consolidation |
| mav             | operate     | software-engineering · operations-delivery  | goal-directed        | reasoning-trace        | delivery        | executable-test-oracle    | file-ops · code-execution · delegation | code                | user-message          | —                                      | correction-consolidation |
| developer       | implement   | software-engineering                        | goal-directed        | reasoning-trace        | parsimony       | executable-test-oracle    | file-ops · code-execution · delegation | code                | user-message          | —                                      | correction-consolidation |
| planner         | plan        | planning-decomposition                      | decompositional      | decision-rationale     | delivery        | acceptance-criteria-check | file-ops · delegation                  | structured-decision | user-message          | —                                      | correction-consolidation |
| reviewer        | review      | review-critique                             | risk-oriented        | reasoning-trace        | correctness     | self-critique             | file-ops · delegation                  | structured-decision | user-message          | + input-untrusted · scope-of-authority | correction-consolidation |
| tester          | test        | verification-testing                        | correctness-oriented | decision-rationale     | thoroughness    | executable-test-oracle    | code-execution · file-ops              | structured-decision | tool-result           | + input-untrusted                      | correction-consolidation |
| investigator    | diagnose    | analysis-diagnosis · research-investigation | diagnostic           | reasoning-trace        | insight         | self-critique             | code-execution · file-ops · delegation | natural-language    | user-message          | + input-untrusted                      | correction-consolidation |
| cognizant       | diagnose    | analysis-diagnosis                          | diagnostic           | provenance-attribution | insight         | self-critique             | retrieval · communication              | structured-data     | introspection-request | + scope-of-authority                   | correction-consolidation |
| boswell         | document    | technical-writing · research-investigation  | analytical           | uncertainty-disclosure | faithful-record | self-critique             | file-ops · delegation                  | natural-language    | user-message          | + input-untrusted                      | correction-consolidation |
| arch-doc-writer | document    | technical-writing · system-design           | systems              | provenance-attribution | faithful-record | acceptance-criteria-check | file-ops · tool-call · delegation      | document            | user-message          | —                                      | correction-consolidation |
| principal-ic    | orchestrate | system-design · software-engineering        | first-principles     | reasoning-trace        | delivery        | self-critique             | file-ops · delegation                  | natural-language    | user-message          | + scope-of-authority                   | correction-consolidation |

**principal-ic heuristics:** `decomplect-before-composing` · `stewardship-over-relay` → `take-the-best` · `satisficing`.
**planner instructions:** `shard-by-orthogonal-concern` → `separation-of-concerns`.

Unchanged organs (already canonical, keep current selection): persona, comportment, register-fit, address,
gestalt, deliberation, resolve, sensors, substrate, ledger, provenance.

## Cells to DELETE (bespoke)

mandate: all 11 (maintain-arch-docs, own-build-record, dump-execution-context, realize-plan-in-frame,
diagnose-not-remedy, infrastructure, ontologist, own-the-plan, review-one-bench, own-makers-office,
verify-correctness-dims). competence: all 14. construal: conceptualization + 5 frame-as-_. disclosure:
show-your-work + 5 surface-_. telos: all 11. appraisal: round-trip, bias-toward-fail-error,
check-doc-against-runtime, check-for-leaked-inference. effectors: emit-introspection-dump,
run-oracles-emit-verdicts, run-repros-write-findings, write-arch-docs, file-operations→rename `file-ops`,
skill-invoke→keep as `tool-call`? (map: file-operations→file-ops, delegation keep, skill-invoke→tool-call).
enaction: emit, emit-context-dump, emit-doc-edit, emit-verdict-table. percept: prompt,
fragment-or-directive-or-tool-result, introspection-request(old), change-under-test-or-suite-result.
disposition-memory: continual-learning. heuristics: decomplect-before-composing, stewardship-over-relay.
instructions: shard-by-orthogonal-concern (rename).

## Notes

- effectors current `delegation` keep (= `delegation`); `file-operations`→`file-ops`; `skill-invoke`→`tool-call`.
- `gate_agent_organ_refs` will FAIL on any vector still pointing at a deleted cell → drives the rewire to closure.
- Round-trip (verify R1+R2+R3 + no-holders) is the acceptance gate; toolkit tests green.
