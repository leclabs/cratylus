# polis-machinery — PLAN

Phase B · operationalize projection. Status mirror; task files live under state folders.

## Frontier (ready)

- **B8 — R3 routing-manifest** (dep: B2 ✓) · `ready/B8-r3-routing-manifest.md` · Mav (emit + gate) +
  Nico (routing unit) — mechanize B2's R3. Unit decided: the conceptualize fragment, keyed by
  content-digest. `resolve`/`exemplify` emit a manifest; `gate_reconstruct()` gates coverage against it.
  Done-when: an unrouted fragment FAILS, full coverage PASSES — R3 is a gate, not a NOTE.
- **B5 — continuity-hooks** (dep: —) — fire dream / praxis advance / agent-continuity at git workflow
  boundaries (post-commit), inspired by graphify's hook. *Operator #4.* Dep-free, Mav's. Done-when: a
  commit triggers the configured continuity step; opt-in per repo.

## Backlog (pending)

- **B3 — koine-cultural-alignment** (dep: B1) — re-home koine's own agent-config as projections from
  mind's corpus; adopt polis conventions (biome, commit style); make koine itself a mind-aligned package.
- **B4 — culture→IR bridge** (dep: B1, A5) — connect the mind toolkit's projection to koine's IR so a
  founded society's culture compiles to any client, not just claude-code. Done-when: one corpus →
  IR → ≥2 client dialects, round-trip clean.
- **B6 — release-self-update** (dep: B3) — on a new `leclabs/polis` release (changesets), downstream
  societies pull culture updates. *Operator #5.* Done-when: a published release propagates to a consumer.

## Done

- **B7 — identity-organ verbatim-render seam** · `completed/B7-identity-organ-verbatim-seam.md` · Nico
  (cell-side) + Mav (machinery) · **closes finding #2.** The identity-&-memory protocol moved out of the
  composer's hardcoded `_identity_block()` into its one home cell `ideas/identity-memory-stack.md`
  (`render: verbatim` + a `## Protocol` section), projected by a generic verbatim-organ contract
  (`GENUS_ORGANS` + `render_organ()` + `cells.section_body()`). R1 now covers the organ (def declares the
  ref) without it rendering as a density-keyed bullet. **Byte-identical no-op** — independently verified
  11 agents × 3 readers (33/33 identical); `verify.py` PASS, suite 6/6. Future organs opt in by declaring
  `render: verbatim` — no composer change.

- **B2 — reconstruction-oracle** · `completed/B2-reconstruction-oracle.md` · Mav · (ex-markdown-ast-compose/05)
  `accept(F) ⇔ reconstruct(F) ≽ D` made mechanical: new `gate_reconstruct()` in `toolkit/verify.py`,
  PASS-gated after roundtrip. Per Nico's `≽ D` ruling — **R1 (one-home totality, transitive `[[ ]]`
  closure → ∃! home, reports the reachability path) + R2 (cite-don't-copy, uncited 8-word definiens-run)
  mechanical; R3 (completeness vs Δ) a visible audit-line NOTE** (no routing manifest exists yet).
  `test_reconstruct.py`: corrupted corpus FAILS, clean PASSES. mind suite 6/6, repo green.

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
