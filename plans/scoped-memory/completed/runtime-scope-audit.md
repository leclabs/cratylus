# runtime-scope-audit — episodic.mjs grammar + the audit verb

**Lane** Mav · **wave(1)** · deps: none (SPEC pins the contract) · **Status** pending (HELD until
Operator approves `../SPEC.md`).

## Static

`../SPEC.md` §3 (tag grammar `user | project:<key> | plan:<key>/<plan>`) · §6 (audit detector:
marker classes, `.agent-factory.config` keylist, `--allow` shrink-only pins, exit semantics). Source:
`packages/agent-memory/src/**` (bin → tsup → one dependency-free `dist/episodic.mjs`).

## Scope

ONLY `packages/agent-memory/**`: (1) encode `--scope` validation against the grammar — unknown shape =
loud reject, `plan:` accepted + stored; (2) NEW `audit --home <h> [--allow <file>]` verb per §6 —
deterministic, line-numbered findings, exit 1 on hit / 0 clean; (3) `resolveFile` routed-target for
`plan:` (the plan's `AGENTS.md`). Dependency-free bundle preserved (no new deps).

## Accept (falsifiers)

- Unit fixtures: seeded-polluted SELF/MEMORY → exit 1 with the offending lines named; clean → 0;
  `--allow`-pinned finding → 0 and an unpinned new finding still → 1; `encode --scope bogus:x` rejects.
- `encode --scope plan:polis/scoped-memory` round-trips through `read`.
- Bundle: `tsup` emits one file, `node dist/episodic.mjs audit --home <fixture>` runs with no install.
- Gates: repo build · test · lint · typecheck green.

**Outcome (2026-07-02):** completed — see git (d067048 + cd6f43a). Judge: all falsifiers re-verified ground-truth; branch-ref precision amended (cd6f43a) after live-probe FP evidence.
