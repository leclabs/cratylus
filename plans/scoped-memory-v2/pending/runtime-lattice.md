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
resolver verb (markers: defaults + config globs). (3) `fold` verb: live log → per-record
`{id ↦ node, marker-basis}` manifest, byte-deterministic. (4) `read --under <path>` (records whose
`node(cwd)` resolves under the given node; host-aware). (5) `lock acquire|release|status`.
(6) audit allow-file default resolution + pinned-count output. Existing verb invocation shapes stay
green; v1-shaped records remain readable (their `scope` field is inert data, never routing).

## Accept (falsifiers)

- Scratch-home suite: cwd derived (not caller-supplied) on encode; `/tmp/x` session ⇒ `node` =
  `/tmp/x` (never `$HOME`); marker precedence (PLAN.md inside a package inside a repo resolves to the
  nearest); a config glob adds a boundary and resolution shifts; same log ⇒ byte-identical manifest;
  `read --under` prefix semantics; lock conflict + stale-steal; audit default-allow pickup, explicit
  `--allow` override, stale-pin report.
- A seeded wrong-node resolution FAILS the suite (prove one, remove).
- Repo gates 4×0; bundle single-file zero-dep.
