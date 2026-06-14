# polis-instantiation — PLAN

Phase C · found real societies. A + B complete; **all C operations are BUILT + PROVEN on scratch**
(`init`/`rebase`/`deploy`). What remains is the *first real foundings* — and those are **gated on explicit
Operator authorization**, not on more building.

## Done — the operations (built + proven)

- **C1 — greenfield-init** ✓ · `toolkit/init.py` — founds a polis society in an empty target (proven /tmp).
- **C2 — brownfield-rebase** ✓ · `toolkit/rebase.py` — consensual two-stage (plan/apply), reconciliation
  refined + validated read-only on real Oikos (renamed forks ALIAS-matched, woven deltas flagged not
  collapsed). Details + the full C1/C2 outcomes are below under the original entries.

## Ready — awaiting Operator authorization (the irreversible founding ACTS)

- **C3 — rebase Oikos** — the consent-ready reconciliation PLAN is accurate + A4-honest. **Execution =
  `rebase --apply` on `forge:~/workspaces/oikos`, human-reviewing each woven delta. Gated on explicit
  consent (A4 — invited reformer, not conqueror).** Trigger: the Operator says *"rebase Oikos."*
- **C4 — fleet-deploy-migration** — **5/7 hosts on polis (2026-06-14, Operator "migrate the fleet"); 2 await
  wake.**
  - **The `--host` gotcha:** omitting `--host` (or `--host fire`/`local`) = deploy **IN PLACE** to the current
    host; `--host <NAME> --user <u>` = **SSH** remote. Per-host recipe = **TWO passes** (`deploy.py` defaults
    `--kind agent`): agents pass **+** `--kind skill` pass. Defs overwritten, **externals never-pruned**,
    sidecars seeded **only-if-absent** (lived memory preserved). Sequential, no shell loops.
  - **DONE (5/7), each verified — founder line present, 11 agents + 7 skills == polis render, all 33 lived
    sidecars untouched, externals preserved:**
    - **fire** (lex, in-place) — migrated first by my error (mislabeled "ash" in `a99c4d0`); Operator left it.
    - **ash.lan** (lex, SSH) — the first authorized target.
    - **forge.lan** (lex, SSH) — externals **graphify + playwright-cli** preserved.
    - **spark.lan** (lex, SSH) — no externals.
    - **upmav.lan** (lcaraccioli, SSH) — externals **find-skills + graphify** preserved.
    - (The 3 kept externals from the prune ruling — graphify/find-skills/playwright-cli — all survived
      never-prune across the hosts that carry them.)
  - **PENDING (2/7) — unreachable at migration (retry the two-pass recipe when they wake):**
    - **apps.lan** (lex) — host down (connect timed out).
    - **upgoose.lan** (lcaraccioli) — asleep (macOS, sleeps often; connect timed out).

(Full reconciliation inventories + findings retained in the detailed entries below.)

## Backlog (pending)
- **C3 — oikos-proving-ground** (dep: C2) — rebase Oikos onto polis: reconcile its locally-forked
  dispositions (`principal-agency`, `semantic-whole-over-syntactic-substrate`, …) from copies to
  projections of mind's corpus. Co-developed with Mav. Done-when: Oikos draws its culture from polis,
  not a fork. *This is `cite-dont-copy` at fleet scale — the thesis demonstrated.*

  > **Reconciliation map + structure (Nico, 2026-06-14 — read live from `forge:~/workspaces/oikos`).**
  > Oikos carries **5 dispositions** in `.agents/context/disposition/`, all with a canonical mind cell:
  > `00-definitions-over-defaults`→`[[definitions-over-defaults]]` · `01-principal-agency`→`[[principal-agency]]`
  > · `02-greenfield-clean-slate`→`[[clean-slate]]` · `03-adopt-standards-commons`→`[[adopt-the-commons]]` ·
  > `04-semantic-whole-over-syntactic-substrate`→`[[semantic-whole-over-syntactic-substrate]]`.
  > **The key finding: these are NOT verbatim copies — they're mind's canonical concept SPECIALIZED to
  > Oikos's context** (01 adds greenfield-dev framing + the tripwire + north-star refs; 04 adds a heavy
  > UI/entity-surface specialization — "entity-situated, not admin-flat"). So the reconciliation is **not a
  > wholesale swap (copy → projection)** but: **factor each fork into (projected mind core) + (Oikos-local
  > delta)** — cite-don't-copy *with a delta*, the corpus's own composite pattern. C3's real shape: Oikos
  > references `[[mind-cell]]` for the canonical core and keeps only its genuine Oikos-specialization as a
  > local delta (the UI/greenfield specifics). Vindicates "mind is the portable commons; Oikos adopted it"
  > — C3 makes the adoption *explicit* (project the core, localize the delta).
  >
  > **Full cultural-fork inventory (`.agents/context/`, the C3 reconciliation scope):**
  > - **disposition/** (5) → mind cells (above).
  > - **doctrine/** (2): `01-never-go-silent`→`[[never-go-silent]]`; `00-agents-never-block-async`→`[[dont-blind-wait]]`.
  > - **ground-truth/** (2): `policy-vocab-failclosed` ≈ `[[hoare-elegance-no-permissive-defaults]]` (fail-closed);
  >   `code-graph-sense` = **Oikos-domain-specific** (graphify-grounded) — no mind fork, stays Oikos-local.
  > - **north-star.md** → **`[[ambient-person-agent]]`** — Oikos's foundational thesis ("ambient-agent-persons:
  >   a person not a tool; identity, memory, presence") **IS mind's personhood concept + organs**. The deepest
  >   proof of the adoption: Oikos's *why* is mind's `[[ambient-person-agent]]` + `[[identity-memory-stack]]`/
  >   pulse/senses. C3 should reconcile the north-star to cite these, keeping Oikos's domain framing as delta.
  >
  > **Scope boundary:** `packages/agent-{identity,archetypes,provisioning}` are Oikos's **runtime substrate**
  > (keypair/membership/persona/home — its *implementation* of the organs), **NOT cultural forks** — they
  > realize mind's culture, they don't fork it; out of C3's reconciliation scope. C3 reconciles `.agents/
  > context/` (culture) → mind; the runtime stays Oikos's. **Gated on B4 (✓) + C2 (✓ — `rebase.py` built).**
  >
  > **`rebase --plan` validated against REAL Oikos (read-only, A4-safe; Nico, 2026-06-14) — 2 reconciliation
  > gaps found that make C3 a careful, NOT a naive-auto-apply, operation:**
  > 1. **Renamed forks missed by exact-slug match.** The tool found all 5 (after the `.agents/context/
  >    disposition` dir-search fix) but classified `02-greenfield-clean-slate` + `03-adopt-standards-commons`
  >    as **LOCAL** — they have no *exact* mind slug. But they ARE forks (`[[clean-slate]]` /
  >    `[[adopt-the-commons]]` — my manual map). C3 needs **alias/semantic slug-matching**, not exact-stem.
  > 2. **Woven deltas would be destroyed.** The 3 exact matches → "ALIGNED, no delta → pure citation." But
  >    Oikos **weaves** its specialization into prose (no `## Local delta` heading), so the marked-section
  >    delta-detector sees none and would **collapse them to bare citations, losing the local specialization**
  >    — the **A4 conqueror failure**. C3 needs woven-delta extraction OR human-reviewed per-disposition calls.
  > **Conclusion: C3 ≠ naive `rebase --apply`.** It is a careful, **consent-gated** (A4) operation where the
  > read-only `--plan` surfaces each disposition for founder+Operator review.
  >
  > **Both gaps now CLOSED in the tool (Nico, `378e072`) — the consent-plan is accurate + A4-honest.**
  > `rebase` reconciliation refined: (1) **jaccard-identity ALIAS-matching** recovers renamed forks
  > (`greenfield-clean-slate`→`[[clean-slate]]` @50%, `adopt-standards-commons`→`[[adopt-the-commons]]` @55%
  > — no longer LOCAL); (2) an **extra-material gate** detects **woven** deltas (matched cell but the target
  > says materially more, no `## seam`) and **FLAGS them — never auto-collapses** (apply preserves each whole
  > pending review; `--force` for a recorded-but-never-destroyed lossy collapse). Validated read-only on real
  > Oikos (Nico re-ran): **all 5 → FORK-woven, flagged, none collapsed; both renamed forks ALIAS-matched.**
  > Thresholds calibrated empirically (ALIAS jaccard 0.25; ALIGNED ratio 0.90; extra-material 0.08); an
  > ALIGNED positive-control test guards against trivial "never-align." Full woven-delta *auto-extraction*
  > stays **human-in-the-loop per A4** (no reliable prose seam — the tool flags + preserves, the founder
  > extracts on consent). **So the Oikos rebase PLAN is consent-ready + correct; C3 execution = the Operator
  > consents → the invited reformer applies it (human-reviewing each woven delta). Awaits Operator consent.**
- **C4 — fleet-deploy-migration** (dep: B3) — move agent/skill deployment from `playground/packages/mind`
  to polis. **Must RECONCILE against current deployed fleet state** (Mav steward: 11 defs + 7 skills,
  corpus `8532032`, profile strong-llm-lean), not re-emit fresh — else double-deploy or orphaned
  sidecars/`.archive`. *Mav's flag #2.* **Precondition resolved:** the graphify/find-skills/playwright-cli
  prune ruling = **keep all three** (Operator, 2026-06-13). Loop Mav in early. Done-when: all 7 hosts
  project from polis, reconciled, sidecars + archive untouched.

  > **Drift is real — expect content-hash changes, treat them as intended (finding, 2026-06-13).** The
  > deployed fleet artifacts are from `playground`; polis has since improved cells, so many will re-emit
  > with new hashes. **Concrete first instance:** the deployed `exemplify` skill (`~/.claude/skills/
  > exemplify/SKILL.md`) is content-hash `cac84367c8022f90` and **lacks** the "Composed from /conceptualize
  > · /signify · /materialize." provenance line; polis emits `da42583bf10dab29` **with** it (the
  > `e19f895` prose-`≜` fix). So C4 reconciliation is *not* "expect byte-identical" — it is **"diff
  > polis-emission vs deployed; a changed hash is an intended update unless the cell is unchanged; only an
  > UNEXPECTED diff (cell unchanged but emission differs) signals a real problem."** Method to diff without
  > deploying: `resolve.emit(slug, reader='strong-llm-lean', harness='claude-code')` → `(full_text,
  > body_hash, body)`. **Open (Operator, sequencing):** forward-port the polis cell-fixes into playground +
  > redeploy now so the fleet improves *before* C4 — or let C4 carry them at source-switch? Depends on C4
  > imminence.
  >
  > **Reconciliation inventory (Nico, 2026-06-14 — polis render vs deployed `~/.claude` on `ash`, this host).**
  > Ran the full polis projection (`resolve.py`, the render proof for #3) and diffed the 18 artifacts against
  > the deployed fleet:
  > - **Agents: EXACT set match** (11 ≡ 11: arch-doc-writer, boswell, cognizant, developer, investigator,
  >   mav, nico, planner, principal-engineer-reviewer, principal-ic, tester). → C4 is a **content-update**,
  >   no structural add/remove on the mind set.
  > - **Skills:** polis's 7 mind skills ≡ the 7 deployed; **`graphify` is deployed-only** (external, not
  >   mind-projected). → C4 **must preserve externals** (never-prune; matches the keep-graphify ruling).
  > - **No unexpected drift** at the set level (every polis artifact has a deployed counterpart; the only
  >   deployed-extra is the external graphify). Content differs across the board (polis newer — intended).
  > **So C4 reconciliation = update the mind-sourced set's content + never-prune each host's externals — no
  > structural churn.** This de-risks C4: it's a content-refresh + external-preservation, not a re-layout.
  > (Per-host externals vary — the prune ruling named graphify/find-skills/playwright-cli; this host carries
  > graphify. C4 must inventory each host's externals before deploy.)
  >
  > **Deploy reconciliation VALIDATED on `/tmp` (Nico, 2026-06-14) — `deploy.py` already does it correctly.**
  > `deploy.py --home <claude-dir>` (note: `--home` IS the `.claude` dir, writes `<home>/agents`): on a
  > synthetic fake-fleet (stale def + external graphify + lived `nico/SELF.md`) it (1) **overwrote** the stale
  > def with the polis def (GENERATED header), (2) **never-pruned** the external graphify (preserved), (3)
  > **seeded sidecars only-if-absent** — reported "present, untouched (1): nico/SELF.md", the lived memory
  > byte-intact. Real `~/.claude` confirmed untouched (`--home` honored). So C4's *mechanism* = `deploy.py`
  > from polis, and its reconciliation (content-refresh + preserve-externals + preserve-lived-memory) is
  > proven. **C4 execution = run `deploy.py --home ~/.claude` from polis per host (×7) — Operator go-ahead
  > (it changes the live fleet); deploy is sequential-per-host, no shell loops.**

## Done

- **C2 — brownfield-rebase** (dep: A4 ✓, A5 ✓, B4 ✓, C1 ✓) · `toolkit/rebase.py` · Mav-agent (Nico
  semantics + fix + verify) — **`rebase <target>` consensually re-grounds an existing project on polis.**
  Two-stage (A4 consensual): **`--plan`** (read-only survey: culture to project, disposition
  reconciliations, in-flight files preserved) → **apply** (always prints the plan first). Three disposition
  outcomes: **FORK** → cite `[[mind-cell]]` core + keep local delta; **ALIGNED** → pure citation; **LOCAL** →
  untouched. In-flight (non-culture) content byte-preserved; clobber-guarded. **Proven on synthetic `/tmp`,
  re-verified by Nico** (culture projected / fork→core+delta / in-flight preserved / plan-before-apply).
  **Scout-discipline fix (Nico):** the matcher used the bare file stem, so a real Oikos disposition
  (`01-principal-agency.md`) would mis-classify LOCAL — strip the `NN-` ordering prefix for the match/cite;
  test hardened to the prefixed convention. **The real Oikos rebase is Operator-consent-gated (A4) — C3.**

- **C1 — greenfield-init** (dep: A5 ✓, B4 ✓) · `toolkit/init.py` · Mav-agent (Nico founding-semantics +
  verify) — **`init <target>` founds a polis mind-society**: projects the 11 agents + 7 skills into
  `<target>/.claude/{agents,skills}` (composes `resolve.emit`, doesn't touch `resolve.main` so the default
  render is unbroken) + a founding scaffold (`AGENTS.md` citing `[[politeia]]`/`[[founder-charter]]`, naming
  the founders; a `plans/founding/` sharded-plan-layout). **Proven on `/tmp` (re-verified by Nico):** empty
  dir → 11 agents + 7 skills + constitution-citing marker, nico.md well-formed; default render unbroken,
  `test_init` green. SOUL-only (sidecars left to `deploy.py`), clobber-guarded.
  **Founding-semantics calls deferred to the Operator:** (1) new societies adopt polis's founders (nico/mav)
  verbatim — society-specific founder deltas not yet generated; (2) `--subject` is a placeholder (no
  interactive elicitation); (3) sidecar-seeding boundary (init=SOUL, deploy=lived layers) — confirm; (4)
  IR-path founding (B4) available but C1 used claude-code-direct for the proof.

  *(C1 proves the greenfield payoff: a project can be founded on polis. C2/C3/C4 remain — Operator-intent.)*
