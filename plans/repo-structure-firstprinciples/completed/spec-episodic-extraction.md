# spec-episodic-extraction

**State:** pending · **Owner:** Mav (move/structure) + Nico (sign-off on the rename, [[signify]]) ·
**Deps.** Fork 2 (Operator + Nico: home + name) resolved. Blocked until that fork clears.

**What.** Pull `episodic` out of `packages/koine/` to its own top-level package. It is a different
domain (agent memory: ULID JSONL store + dream routing + atomic compaction), is imported by **nobody**,
has **zero koine deps**, and is **already excluded** from koine's tsconfig references + changeset
`fixed`. Nesting it under `koine/` is pure agentir-grouping palimpsest. The extraction is settled; the
**name** is the fork.

**Target (Mav's recommendation = Fork 2 option b).**

```text
packages/episodic/      # <- packages/koine/episodic/ (git mv, whole package)
  package.json          # RENAME @leclabs/koine-episodic -> @leclabs/episodic  (drop koine- prefix)
  src/ test/ tsup.config.ts tsconfig.json README.md AGENTS.md CLAUDE.md
```

**The rename is a real cross-plan touch — reconcile, do not blindside.** `memory-model-redesign` PLAN
currently names `@leclabs/koine-episodic` as its **settled, deployed, Nico-reverified** home (the
jsonl-episodic-store + dream-routing-engine + fleet-sync tasks all reference it). Renaming it therefore:

- requires **Nico's concurrence as that plan's lead**, not just a naming nod;
- must update `memory-model-redesign`'s task prose + PLAN references to the new name;
- the `package.json` scripts at repo root (`organs:*`, `continuity:*`) reference
  `packages/mind/toolkit/continuity/*.sh`, NOT the koine-episodic package path — verify they are
  untouched by the move (they should be; the move is package-internal).

**Ordered steps (when unblocked).**

1. `git mv packages/koine/episodic packages/episodic`.
2. If renaming (option b): update `package.json` `name`; sweep the ~handful of internal self-references
   (tests, README, AGENTS.md). Zero external import sites (verified: imported by nobody), so the import
   blast radius is **empty** — the cleanest possible rename.
3. `pnpm-workspace.yaml`: the flat `packages/*` glob (from P3) already includes it; if P3 hasn't landed,
   add `packages/episodic` to the glob alongside `packages/koine/*` as an interim.
4. Confirm `tsconfig.json` references + `.changeset/config.json` — episodic was already absent from
   both, so add it to tsconfig references (it should have been there); decide its changeset access.

**Fleet/deploy implication.** None — episodic is runtime code with no deploy-path coupling. The live
agent-organs DATA store (external) is untouched and must stay external; this moves only the _runtime
code package_, never the data.

**Rollback.** `git mv` back; the rename is a single `name` field + internal refs. No external consumer,
no published artifact — lowest-risk move in the plan.

**Exit criteria.**

- `packages/episodic/` is a top-level package; nothing nests it under `koine/`.
- Name decided per Fork 2 and, if renamed, `memory-model-redesign` reconciled + Nico concurs.
- `pnpm build` + `pnpm test` + `pnpm lint` green; the episodic test suite passes from the new location.
- Root `organs:*`/`continuity:*` scripts verified unaffected.
