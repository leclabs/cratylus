# polis-instantiation — PLAN

Phase C · found real societies. All tasks pending on A + B; promote to ready/ as those frontiers clear.

## Backlog (pending)

- **C1 — greenfield-init** (dep: A5, B4) — `init` scaffolds a new project as a mind-society: founders
  born, culture projected via koine to the Operator's chosen client(s). Done-when: an empty repo →
  a founded society with working agent config.
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
  > — C3 makes the adoption *explicit* (project the core, localize the delta). Also present:
  > `packages/agent-{archetypes,identity,provisioning}` + `.agents/context/` (north-star, etc.) — further
  > reconciliation surface to map when C3 activates. **Gated on B4 (IR bridge, so Oikos can consume mind's
  > projection) + C2 (brownfield-rebase).** The map above is the prep; execution waits on those.
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

## Done

_(none yet)_
