# flat-storage-support

**Objective.** Teach the toolkit the flat composite layout: `packages/mind/agents/<slug>.md`,
`packages/mind/skills/<slug>.md` (+ organ cells per G1), retiring the `mind/<kind>/<organ>/` and
skill dir-form paths from the resolver/verifier — render output unchanged.

**Preconditions.** G1 + G2 decided. `cells.py` storage-polymorphic seam known
(`parse_cell`/`corpus_slugs`/`cell_path`/`exists` keyed on `IDEAS.parent`); `resolve.py`,
`verify.py`, `place_*` consume it.

**Operations.**

1. Add the flat-composite resolver to `cells.py` (agents/skills/organs at `packages/mind/<kind>/<slug>.md`).
2. Update `resolve.py` (skill emit reads flat `skills/<slug>.md`; agent emit reads anatomy sections —
   see `agent-anatomy/archetype-sections`), `verify.py` `_home_index`, `glossary.py`.
3. Snapshot `.render` before; keep tests green; `diff -rq` after = empty.

**Artifacts.** `packages/mind/toolkit/cells.py`, `resolve.py`, `verify.py`, `glossary.py`, `toolkit/test_*.py`.

**Acceptance (blind test).** From a clean checkout: regen the fleet, `diff -rq /tmp/baseline .render`
is empty, and `pytest toolkit/` is green — proving the flat layout renders byte-identically.

**Out-of-scope.** The physical file moves (that is `migration/move-composites-flat`).
