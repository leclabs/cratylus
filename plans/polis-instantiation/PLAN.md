# polis-instantiation — PLAN

Phase C · found real societies. A + B complete; **all C operations are BUILT + PROVEN on scratch**
(`init`/`rebase`/`deploy`). The operations are done. The first *real foundings* are Operator-intent —
and the two that remained open were **dropped by the Operator (2026-06-15)**; see "Dropped" below.

## Done — the operations (built + proven)

- **C1 — greenfield-init** ✓ · `toolkit/init.py` — founds a polis society in an empty target (proven /tmp).
- **C2 — brownfield-rebase** ✓ · `toolkit/rebase.py` — consensual two-stage (plan/apply), reconciliation
  refined + validated read-only on real Oikos (renamed forks ALIAS-matched, woven deltas flagged not
  collapsed). Full C1/C2 outcomes are below under the detailed entries.
- **C4 — fleet-deploy-migration** ✓ (closed **6/7**, 2026-06-15) — **source-switch achieved:** the live
  fleet now projects from **polis** (`packages/mind/.render/`), not playground. Reconciliation held as
  designed: defs overwritten, externals never-pruned, sidecars seeded only-if-absent (no clobber).
  Deployed corpus = **11 agents + 10 skills** (new this round: skills `wake` · `handoff` · `formalize`;
  principle `self-sufficient-formalism`; praxis reformalized cite-once with `update`/`sync` ops; toolkit
  fixes — render → `.render/` staging, composer derives composition from bindings). Hosts migrated +
  verified (11 agent defs overwritten, 10 skills == polis render, all lived sidecars present + untouched):
  **fire · ash.lan · forge.lan · spark.lan · upmav.lan · upgoose.lan** (externals graphify / find-skills /
  playwright-cli preserved per the keep-all-three prune ruling). **apps.lan (7th) dropped — see below.**

## Dropped (Operator, 2026-06-15)

- **C3 — rebase Oikos** — abandoned by Operator decision. The Oikos rebase will **not** proceed. The
  tooling survives (`toolkit/rebase.py` — ALIAS slug-matching + woven-delta flagging, validated read-only
  on real Oikos); the reconciliation map is **re-derivable** at any time via `rebase --plan` if revived.
  No live thread remains.
- **C4 / apps.lan (1/7)** — finishing the last host abandoned. **C4 is closed at 6/7.** apps.lan stays on
  its prior projection; it is **redeployable** via the standing two-pass `deploy.py --scope user` recipe
  (toolkit `AGENTS.md`) if ever revived. No live thread remains.

## Done — detailed entries

- **C2 — brownfield-rebase** (dep: A4 ✓, A5 ✓, B4 ✓, C1 ✓) · `toolkit/rebase.py` · Mav-agent (Nico
  semantics + fix + verify) — **`rebase <target>` consensually re-grounds an existing project on polis.**
  Two-stage (A4 consensual): **`--plan`** (read-only survey: culture to project, disposition
  reconciliations, in-flight files preserved) → **apply** (always prints the plan first). Three disposition
  outcomes: **FORK** → cite `[[mind-cell]]` core + keep local delta; **ALIGNED** → pure citation; **LOCAL** →
  untouched. In-flight (non-culture) content byte-preserved; clobber-guarded. **Proven on synthetic `/tmp`,
  re-verified by Nico** (culture projected / fork→core+delta / in-flight preserved / plan-before-apply).
  **Scout-discipline fix (Nico):** the matcher used the bare file stem, so a real Oikos disposition
  (`01-principal-agency.md`) would mis-classify LOCAL — strip the `NN-` ordering prefix for the match/cite;
  test hardened to the prefixed convention.

- **C1 — greenfield-init** (dep: A5 ✓, B4 ✓) · `toolkit/init.py` · Mav-agent (Nico founding-semantics +
  verify) — **`init <target>` founds a polis mind-society**: projects the 11 agents + 7 skills into
  `<target>/.claude/{agents,skills}` (composes `resolve.emit`, doesn't touch `resolve.main` so the default
  render is unbroken) + a founding scaffold (`AGENTS.md` citing `[[politeia]]`/`[[founder-charter]]`, naming
  the founders; a `plans/founding/` sharded-plan-layout). **Proven on `/tmp` (re-verified by Nico):** empty
  dir → 11 agents + 7 skills + constitution-citing marker, nico.md well-formed; default render unbroken,
  `test_init` green. SOUL-only (sidecars left to `deploy.py`), clobber-guarded.
