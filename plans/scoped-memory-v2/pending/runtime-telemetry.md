# runtime-telemetry — record schema v2, lattice resolver, fold engine

**Lane** Mav · **wave(0)** · deps: none (SPEC static) · HELD until Operator approves `../SPEC.md`.

## Static

`../SPEC.md` D2/D2a (record schema; telemetry fold-in; degradation), D3 (lattice: markers `.git`·
`AGENTS.md`·`PLAN.md`·`$HOME`·launch-cwd; prefix order; attribute-to-writes → territory → $HOME;
host-qualified paths), D4 (deterministic pass; legacy-compat strategy; re-dream over `.bak` archives;
retention keep-all-compact), D7 (lock verbs · audit default-allow · territory read/drain filters —
harvest upmav prototype: `lcaraccioli@upmav ~/.claude/skills/memory/.bak/01KWHXHMY6AC5C0162786DR1YT/`
holds the pre-fork originals; live fork + `/tmp/episodic-oracle.sh` hold the 47-check harness to
adapt). Source: `packages/agent-memory/src/**` (tsup → single dependency-free `dist/episodic.mjs`).

## Scope

`packages/agent-memory/**` ONLY. (1) encode: derive `{session?, host, territory, cwd}`; fold
`${AGENT_HOME}/.telemetry/<sid>.jsonl` since-last-encode into `writes`; `--paths` supplement;
`scope_override` flag; hook-absent degrade. (2) lattice module: marker detection, node resolution,
prefix ops, LCA-of-writes. (3) `dream fold` verb: deterministic pass emitting per-event
`{event → node, basis}` routing manifest (JSON) for the semantic pass to consume — the tool proposes,
the dream re-judges. (4) `redream` verb: fold over `.bak` archives + live log. (5) `drain` retention →
keep-all-compact. (6) lock verbs + audit default-allow + `--territory` filters per D7. Backward-compat:
v1 records readable (compat strategy); existing verb invocations unchanged.

## Accept (falsifiers)

- Oracle suite (adapt the 47-check harness; scratch homes): telemetry fold-in (journal → writes;
  absent journal → territory-only record); lattice: `/tmp/x` launch = own node (never $HOME); marker
  precedence; LCA cross-scope kept raw; writeless → territory; `fold` manifest deterministic (same
  input ⇒ byte-same output); `redream` over an archive re-emits routing under a swapped strategy;
  legacy v1-tagged record maps tag→override; lock conflict/stale-steal; audit default-allow pickup +
  override; `--territory` prefix semantics.
- A seeded mis-derivation (wrong node for a known write-set) FAILS the suite (prove one, remove).
- Repo gates 4×0; bundle stays single-file zero-dep; every existing v1 invocation shape still green.
