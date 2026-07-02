# runtime-telemetry — record schema v2, lattice resolver, fold engine

**Lane** Mav · **wave(0)** · deps: none (SPEC static) · HELD until Operator approves `../SPEC.md`.

## Static

`../SPEC.md` D2/D2a (record schema — no scope field; telemetry fold-in; cwd-only degrade), D3
(lattice: built-in markers `{.git, package manifest, PLAN.md, $HOME}` + `memory.scopeMarkers` glob
config in `.agent-factory.config`; `node(p)`; prefix order; attribute-to-writes → `node(cwd)`;
host-qualified paths), D4 (deterministic pass → routing manifest; `--replay` window; retention:
keep-all-compact for v2 records, legacy drops behind one `.bak`), D5 (lock verbs · audit default-allow
`--allow > <home>/audit-allow.txt > none` · `--under` read filter). Source: `packages/agent-memory/src/**`
(tsup → single dependency-free `dist/episodic.mjs`).

## Scope

`packages/agent-memory/**` ONLY. (1) encode: derive `{session?, host, cwd}`; fold
`${AGENT_HOME}/.telemetry/<sid>.jsonl` since-last-encode into `writes`; `--paths` supplement;
hook-absent degrade to cwd-only. (2) lattice module: marker detection (defaults + config globs),
`node(p)`, prefix ops, LCA-of-writes. (3) `dream fold [--replay]` verb: deterministic pass emitting a
per-event `{event → node, basis}` routing manifest (JSON, byte-deterministic) — the tool proposes,
the dream's semantic pass disposes. (4) `read --under <path>` (records whose writes/cwd resolve under
the node). (5) drain retention per D4. (6) `lock acquire|release|status` + audit default-allow.
Backward-compat: v1-shaped records readable; unknown legacy `scope` tags surface in the manifest as
annotations, never as routing.

## Accept (falsifiers)

- Oracle-style suite on scratch homes: journal → `writes` fold-in; absent journal → cwd-only record;
  `/tmp/x` launch = own node (never `$HOME`); config glob adds a boundary and resolution shifts;
  LCA cross-scope kept raw in the manifest; writeless → `node(cwd)`; same input ⇒ byte-same manifest;
  `--replay` over an archive re-emits routing under a swapped strategy; lock conflict + stale-steal;
  audit default-allow pickup, explicit `--allow` override, pinned-count output; `--under` prefix
  semantics incl. host-qualified paths.
- A seeded mis-resolution (wrong node for a known write-set) FAILS the suite (prove one, remove).
- Repo gates 4×0; bundle single-file zero-dep; every existing v1 invocation shape still green.
