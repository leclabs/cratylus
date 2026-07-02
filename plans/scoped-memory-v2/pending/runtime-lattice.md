# runtime-lattice — record schema v2, node resolver, fold manifest

**Lane** Mav · **wave(0)** · deps: none (SPEC static) · HELD until Operator approves `../SPEC.md`.

## Static

`../SPEC.md` D2 (record: `{id, session?, host, cwd, body, tags?}` — cwd derived by the tool), D3
(`node(p)`: nearest-ancestor marker; defaults `{.git, package manifest, PLAN.md, $HOME}`; no marker ⇒
session-start cwd; `memory.scopeMarkers` glob config in `.agent-factory.config`), D4 pass 1
(deterministic fold → routing manifest `record ↦ node(cwd)`), D5 (`read --under` · `dream.lock`
verbs · audit allow-file `--allow > <home>/audit-allow.txt > none`). Source:
`packages/agent-memory/src/**` (tsup → single dependency-free `dist/episodic.mjs`).

## Scope

`packages/agent-memory/**` ONLY. (1) encode derives `{session?, host, cwd}`. (2) `node <path>`
resolver verb per SPEC D3 (total: reflexive · `.git`-file → primary checkout · nonexistent → nearest
existing ancestor · per-host `$HOME` from config · markers: defaults + config globs). (3) `fold`
verb: live log → per-record `{id ↦ node | legacy, marker-basis}` manifest, byte-deterministic;
cwd-less records → the `legacy` bucket. (4) `read --under <path>`: same-host records whose
`node(cwd)` resolves under the given node; foreign-host records report as counts. (5) `lock
acquire|release|status` on `${AGENT_HOME}/dream.lock`, stale = age > 2h. (6) audit: scan set →
`{SEMANTIC.md, PROCEDURAL.md}` + allow-file default resolution + pinned-count. (7) route engine
retarget: the v1 organ target set (`SELF|MEMORY|…`) and tag-grammar addressing retire; routed
targets address by node path + the v2 store names. Existing verb invocation shapes stay green;
v1-shaped records remain readable (their `scope` field is inert data, never routing).

## Accept (falsifiers)

- Scratch-home suite: cwd derived (not caller-supplied) on encode; `/tmp/x` session ⇒ `node` =
  `/tmp/x` (never `$HOME`); reflexive (cwd = repo root ⇒ that root); a `.git` FILE resolves to the
  primary checkout's node; marker precedence (PLAN.md in a package in a repo → nearest); a config
  glob shifts resolution; cwd-less record lands in `legacy` (fold never throws); same log ⇒
  byte-identical manifest; `read --under` prefix + foreign-host-counts semantics; lock conflict +
  stale-steal at the 2h constant; audit: seeded polluted SEMANTIC.md → exit 1 (the v2 scan set
  bites), default-allow pickup, explicit `--allow` override, stale-pin report; a route addressed to
  a v1 organ name is REJECTED.
- A seeded wrong-node resolution FAILS the suite (prove one, remove).
- Repo gates 4×0; bundle single-file zero-dep.
