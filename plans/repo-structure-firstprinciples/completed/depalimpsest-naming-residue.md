# depalimpsest-naming-residue

**State:** ready · **Owner:** Mav (structure/cleanup); naming changes flagged to Nico · **Deps.** none
(independent of the structure forks — pure [[palimpsest]] cleanup, can land first).

**What.** Scrape the repo's directory + file + prose naming back to one coherent surface. The founding
left layered residue: agentir-era references that outlived their referent, cross-refs to retired paths,
and stale "pending" prose that warns about residue already gone. This is the [[palimpsest]] task — it
does NOT depend on the koine collapse or episodic extraction; it cleans what is true regardless.

**The residue this review found (empirically, HEAD `55cf653`).**

1. **Stale "alignment pending" prose — the warning outlived the residue.** `packages/koine/AGENTS.md`
   lines 47–52 ("Alignment status (Phase B) … residual internal `agentir` identifiers and DESIGN prose
   may not yet be fully re-homed — do not assume done") is itself stale: a grep over `*.ts/*.py/*.json/
*.sh/*.yaml` finds **zero** `agentir` code identifiers. The ONLY `agentir` token in non-prose is one
   intentional comment in `pnpm-workspace.yaml:13` ("carried from agentir"). There is **no**
   `koine/core/DESIGN.md` (the only DESIGN file is `packages/mind/DESIGN.md`, unrelated). The
   `.agentir/` convention is fully `.koine/` (`IR_DIRNAME='.koine'`, tests assert `.koine`). Action:
   delete/rewrite the stale warning — state the rename as **landed and complete**, not "pending".
2. **Root `AGENTS.md` lines 20–21** carry the same stale "Alignment pending … `.agentir/` … not yet
   re-homed" prose. Same fix: the alignment is done; rewrite to reflect it.
3. **Stale cross-ref to a retired path.** `README.md:42` points at
   `plans/polis-machinery/COORDINATION.md` for the "Nico<->Mav build log" — **that path no longer
   exists** (polis-machinery retired; COORDINATION.md removed, per `memory-model-redesign/AGENTS.md:18`
   "COORDINATION.md is retired"). Fix the cross-ref (point at `plans/` index or drop it).
4. **README package table is stale on koine's members.** `README.md:16` lists "Node: `core` · `cli` ·
   `adapters`" — omits `episodic`. Likewise `packages/koine/AGENTS.md` "three npm packages" heading
   describes three while four exist. (Resolve in concert with the structure spec if it lands; but the
   COUNT is wrong today regardless — flag/fix the factual drift.)
5. **`koine/episodic` (path) vs `koine-episodic` (name) mismatch** — the dash-flat-name / nested-path
   incoherence. Full resolution is the structure spec's job (Fork 2); this task only **records** it as
   palimpsest so it is not lost if the structure arc stalls.
6. **`.scratchpad/formalize.edit.md`** — a single stray scratch file tracked-or-untracked at root.
   Verify it is gitignored (transient) or remove it; scratch artifacts should not accrete in the tree.

**Naming-decision boundary.** Items 1–4 + 6 are factual-drift / dead-reference cleanup — **Mav's call**
(no concept is being renamed, only stale statements corrected). Item 5's _resolution_ is a rename =
**Nico** ([[signify]]); this task only logs it. Do NOT rename any package or dir here — that is P1/P2.

**Exit criteria.**

- Zero stale `agentir` "pending/not-yet-re-homed" prose: `packages/koine/AGENTS.md` + root `AGENTS.md`
  state the rename as complete. The one intentional `pnpm-workspace.yaml` historical comment may stay
  (it is a true provenance note, not a stale warning) — confirm that is the only surviving mention.
- `README.md` has no dead path reference (COORDINATION.md cross-ref fixed/removed) and its koine member
  list matches reality (or is reconciled with the structure spec if that lands jointly).
- `.scratchpad/` residue resolved (gitignored or removed).
- A short residue-ledger appended here listing exactly what changed, so a reviewer can diff intent.
- Green: `pnpm lint` (biome) clean; no behavioral code touched (prose/config-comment only).

## Residue ledger — landed (branch `worktree-koine-depalimpsest`)

Re-verified empirically against HEAD `8cb7ee6`; prose / config-comment only, zero behavioral code touched.

- **`packages/koine/AGENTS.md`** — (a) heading "three npm packages" → "the config-translation packages"
  (the count was wrong: four members nest under the glob). (b) Added an off-domain note for `episodic`
  (`@leclabs/koine-episodic`), recording it as a structural stranger pending extraction — item 5 logged,
  not resolved. (c) "Alignment status (Phase B)" rewritten: rename stated **complete**, the stale "still
  pending re-homing / DESIGN prose" warning removed; the genuine future-dogfooding note kept.
- **`AGENTS.md` (root)** — dropped the stale "**Alignment pending:** internal `agentir` identifiers … not
  yet re-homed" warning; provenance kept ("formerly _agentir_; rename complete"); `episodic` noted.
- **`README.md`** — member list `core · cli · adapters` → `… · episodic` (count fixed); dead cross-ref
  `plans/polis-machinery/COORDINATION.md` (retired path) → "active and retired phase plans". Table
  re-aligned at Prettier's fixpoint.
- **`.scratchpad/`** — already gitignored (`.gitignore:23`) and absent from a clean checkout; the stray
  `formalize.edit.md` is transient/untracked. No tree change needed — item 6 already satisfied.
- **NOT touched (intentional provenance, confirmed sole survivors):** `pnpm-workspace.yaml:13` "carried
  from agentir"; the three "formerly _agentir_" notes. Zero `agentir` **code** identifiers remain.

Gates green: `prettier --check` (3 md files) + `biome check .` (127 files, no fixes). Item 5's
_resolution_ (the path↔name rename) stays P1/P2 — out of scope here by design.
