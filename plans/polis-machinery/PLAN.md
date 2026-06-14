# polis-machinery — PLAN

Phase B · operationalize projection. Status mirror; task files live under state folders.

## Frontier (ready)

- **B2 — reconstruction-oracle** · `ready/B2-reconstruction-oracle.md` (ex-markdown-ast-compose/05)
  Automate `accept(F) ⇔ reconstruct(F) ≽ D` as a verify-stage oracle. Done-when: verify gate runs the
  oracle; a dropped-dependency or under-reconstruction fails the gate.

## Backlog (pending)

- **B3 — koine-cultural-alignment** (dep: B1) — re-home koine's own agent-config as projections from
  mind's corpus; adopt polis conventions (biome, commit style); make koine itself a mind-aligned package.
- **B4 — culture→IR bridge** (dep: B1, A5) — connect the mind toolkit's projection to koine's IR so a
  founded society's culture compiles to any client, not just claude-code. Done-when: one corpus →
  IR → ≥2 client dialects, round-trip clean.
- **B5 — continuity-hooks** (dep: —) — fire dream / praxis advance / agent-continuity at git workflow
  boundaries (post-commit), inspired by graphify's hook. *Operator #4.* Done-when: a commit triggers the
  configured continuity step; opt-in per repo.
- **B6 — release-self-update** (dep: B3) — on a new `leclabs/polis` release (changesets), downstream
  societies pull culture updates. *Operator #5.* Done-when: a published release propagates to a consumer.

## Done

- **B1 — koine-deep-rename** · `completed/B1-koine-deep-rename.md` · Mav · merged #1 (`b8aa273`)
  Zero `agentir` residue in `packages/koine/**`; CLI literal + `.koine/` convention + schema `$id` +
  env/docs all renamed. Surfaced + fixed a tsconfig `extends`-depth bug that stopped the TS suite
  collecting. **Folded in B0 (baseline-green, finding #1 TS side):** koine had never been run through
  biome — applied the formatter (single-quote) and fixed 35 lint rules by hand. Build + 117 tests +
  lint green.
- **B0-adjacent — repo-config hygiene** · merged #2 (`dffa580`) · Mav
  Finding #3 (pnpm `onlyBuiltDependencies` → `pnpm-workspace.yaml`), finding #4
  (`worktree.bgIsolation` set explicitly), gitignore `.claude/worktrees/` + `.turbo/`, drop stale
  root `.agentir/local/`.
