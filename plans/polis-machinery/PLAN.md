# polis-machinery — PLAN

Phase B · operationalize projection. Status mirror; task files live under state folders.

## Frontier (ready)

_(empty — **Phase B machinery substantially complete**: B1·B2·B4·B5·B7·B8·B9 done, B3 docs-first-pass done.
The culture→config→any-client spine is in. The live frontier is now **Phase C** (`polis-instantiation`):
C1/C2/C3 are unblocked by B4; C4 fleet-migration by the proven render. Remaining B-items are deferred/
dep-gated: B3 config-as-projection (until koine has dev-agents), B6 release-self-update (dep B3).)_

## Backlog (pending)

- **B3 — koine-cultural-alignment** (dep: B1 ✓) — **docs first-pass DONE** (`76b5d79`: per-package
  `AGENTS.md`/`CLAUDE.md` at load-bearing depth; biome/build/test green). **Deferred:** "re-home koine's own
  agent-config as projections from mind's corpus" — koine has no dev-agent config to re-home *yet*; becomes
  real once koine acquires dev-agents (then: author as `ideas/` cells, project via `[[exemplify]]`, deploy to
  `koine/.claude/`). Mav's call to finish.
- **B6 — release-self-update** (dep: B3) — on a new `leclabs/polis` release (changesets), downstream
  societies pull culture updates. *Operator #5.* Done-when: a published release propagates to a consumer.

## Done

- **B4 — culture→IR bridge** · `completed/B4-culture-ir-bridge.md` · Mav (koine IR) + Nico (mapping) ·
  route mind's projection through koine's canonical IR → any client. `render/ir.py` emits mind→IR (lossless:
  mind→IR→claude-code byte-equal to the proven render); **≥2 dialects round-trip clean (claude + codex,
  IR-identity across all 18 artifacts)**; honest lossy-coverage map for the other 8 adapters (skip-with-warning,
  never silent). Done-when met; Phase C unblocked. `trigger:`-surfacing deferred (adapter enhancement).

- **B8 — R3 routing-manifest** · `completed/B8-r3-routing-manifest.md` · Nico + Mav · mechanize B2's R3.
  Wired + exercised end-to-end: producer (`exemplify` step 6) → first real manifest (`.manifests/dream.json`,
  from the dream de-bloat run) → consumer (`gate_reconstruct` R3) → **verify reads `R1+R2+R3`** (R3 is a gate,
  not a NOTE). Test-isolation fix (`POLIS_MANIFESTS`) so committed manifests coexist with the no-manifest
  case. Digest v1 = NFC+whitespace+trim; markdown-norm refinement deferred (non-blocking). Suite 10/10.

- **B5 — continuity-hooks** · Mav-agent (driven by Nico) · *Operator #4.* An **opt-in, off-by-default**
  `.husky/post-commit` that fires the one repo-level continuity ritual — **praxis-advance** — as a
  *reminder* (detect a commit touching `plans/**/{pending,ready,active,completed}/` → nudge to re-mirror
  PLAN.md via `/praxis`; never auto-edits the hand-authored mirror). Opt in via `pnpm run
  continuity:install` (sets `git config polis.continuity`, lives in `.git/config`, never committed → fresh
  clones unchanged). Nico's scope call: encode/dream are per-agent sidecar ops, NOT git-boundary — out of
  scope; praxis-advance is the only repo-level ritual. Off-by-default guard verified empirically; composes
  with pre-commit/commit-msg; biome 112 green.

- **B9 — toolkit-hardening** · `completed/B9-toolkit-hardening.md` · Mav (machinery) + Nico (register) ·
  three new PASS-gated `verify.py` stages so the projector refuses what it passed silently: `gate_symbols`
  (every fence-interior glyph declared-or-exempt), `gate_skill_operative` (no empty skill body),
  `gate_skill_provenance` (empty-provenance surfaces as a NOTE, never silent). `…` declared in the symbol
  table (Nico). Suite 9/9; verify PASS; independently re-verified the clean corpus stays green under the new
  gates. Open: H1-drop still ungated (future task).

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
