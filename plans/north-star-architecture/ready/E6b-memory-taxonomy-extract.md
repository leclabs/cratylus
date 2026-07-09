# E6b — R6: align to the 4-part CoALA taxonomy — extract vault + AGENTS

**static:** `packages/agent-memory/src/{route.ts, dream.ts}` · `../NORTH-STAR.md §3.1`.
**scope:** remove `vault` AND `AGENTS` from `route.ts` `StoreName`/`V2_STORES` and the `dream.ts` route cases.
Owned model = Episodic (`EPISODIC.jsonl`) · Semantic (`SEMANTIC.md`) · Procedural (`PROCEDURAL.md`) + Working
(no store). Project-scoped externalization survives as a plain agent file-edit (documented in the memory
protocol), NOT a route target; cross-host `vault` is out of scope entirely.
**accept:** `git grep -E "'vault'|'AGENTS'" packages/agent-memory/src/route.ts` = empty; `V2_STORES` =
{SEMANTIC, PROCEDURAL, EPISODIC}; `dream.ts` routes only those (+ drop/EPISODIC-retain); memory tests green.
**dep:** E6a (rename lands first).
