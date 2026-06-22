# PLAN — corpus-reindividuation

R=LLM. mirror of `tasks/` state (doc-mirrors-runtime-truth). lead: Nico (principal).

intent ≜ re-individuate the messy `packages/mind` corpus → MECE context modules, homed at
`packages/mind/{kind}/{α(c)}.md` (α≜σ\*\_R, R=LLM), via ordered `/exemplify` delegations. contract =
`references/kinds-and-invariants.md`.

## DAG

```
exemplify-agents ┐
exemplify-skills ├─→ founder-organ-binding ─→ exemplify-corpus-pile ─┐
repair-memory-trio ┘            │                                     ├─→ zero-dangling-gate ─→ compress-founder-memory
                                └─────────────────────────────────────┘
```

frontier(P) = { exemplify-corpus-pile } — entry frontier + founder-organ-binding DONE.

## tasks

| task                    | state     | dep                            | slice                                                                                                     |
| ----------------------- | --------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- | --- | ------------------------- |
| exemplify-agents        | completed | ∅                              | agents — 11 certified accept=valid; 1 real drop fixed (reviewer stewardship); manifests emitted           |
| exemplify-skills        | completed | ∅                              | skills — 11 certified accept=valid, 0 dropped; manifests emitted                                          |
| repair-memory-trio      | completed | ∅                              | dream/wake precision-fixed to real `episodic.mjs` verbs {encode,read,migrate}; 0 skills minted            |
| founder-organ-binding   | completed | agents ∧ skills ∧ trio ✓       | compose — decision 0001 RULED `address`; binding already realized (nico+mav `address [[principal-self]]`) |
| exemplify-corpus-pile   | ready     | founder-organ-binding ✓        | corpus — lexicon ∪ GLOSSARY as ONE D (filenames=accidents)                                                |
| zero-dangling-gate      | pending   | corpus ∧ founder-organ-binding | gate — repo-wide                                                                                          | D   | =0 wikilinks + round-trip |
| compress-founder-memory | pending   | gate                           | memory — exemplify SELF/MEMORY ≤50 ln; purge episodics ∖ nico-this-session                                |

## decisions

- `0001-founder-agency-organ` — RULED `address`. footing-toward-interlocutor (STANCE); re-permission +
  escalation clauses are corollaries, not the seed. Blind reader independently derived `address`. Binding
  was already realized in the corpus pre-ruling; ruling ratifies it.
- `0002-r3-manifest-producer` — LANDED. the R3 manifest PRODUCER was unbuilt (toolkit AGENTS.md: "Nico's
  follow-on"); built `toolkit/emit_manifest.py` (records the certified factorization's homing) + extended
  verify.py R3 to resolve ORGAN-scoped `<organ>/<value>` home_slugs by the (organ,value) pair. See the ADR.

## notes

- supersedes `mind-structure-flatten`, `corpus-signify-pass` (Operator: ignore older plans).
- hypothesis-grade. principal reorderings vs raw brief: (1) zero-dangling gate moved AFTER corpus
  (referents mint there); (2) exemplify's own pipeline NOT re-derived in tasks — delegated.
- **entry-frontier session (2026-06-22):** ran agents+skills+trio. Division that emerged: the exemplify
  AGENT _certifies_ (accept=valid, round-trip, fixes drops IN the cell); a deterministic _producer_
  records the manifest. verify PASS R1+R2+R3 (manifests now MECHANICAL, not the audit-line NOTE), 17/17
  toolkit tests + the new organ-scoped R3 case. 2 soft notes await an Operator call (see ADR 0002).
- **NOT deployed** — the 4 cell edits (reviewer composite, stewardship holders, dream, wake) are
  corpus-side only; fleet redeploy is a downstream `run-the-business` concern, not this plan.
