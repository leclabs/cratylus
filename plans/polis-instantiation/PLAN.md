# polis-instantiation — PLAN

Phase C · found real societies. All tasks pending on A + B; promote to ready/ as those frontiers clear.

## Backlog (pending)
- **C2 — brownfield-rebase** (dep: A4, A5, B4, C1) — `rebase` reads an existing project's structure and
  restructures it to align with polis, consensually (invited reformer). Done-when: an existing repo is
  re-grounded on polis without destroying its in-flight work.
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
  > context/` (culture) → mind; the runtime stays Oikos's. **Gated on B4 (✓ — IR bridge done, so Oikos can
  > consume mind's projection) + C2 (brownfield-rebase, not yet built).** The inventory above is the prep,
  > comprehensive; execution waits on C1/C2 tooling + the consensual rebase op.
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

## Done

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
