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

frontier(P) = { exemplify-agents, exemplify-skills, repair-memory-trio } — 3-wide, dispatch concurrent.

## tasks

| task                    | state   | dep                            | slice                                                                                         |
| ----------------------- | ------- | ------------------------------ | --------------------------------------------------------------------------------------------- | --- | ------------------------- |
| exemplify-agents        | ready   | ∅                              | agents — ∥ 1 subagent/file over `agents/*.md`                                                 |
| exemplify-skills        | ready   | ∅                              | skills — ∥ 1 subagent/file over `skills/*.md` ∖ {wake,dream}                                  |
| repair-memory-trio      | ready   | ∅                              | skills — de-palimpsest wake/dream vs `episodic.mjs`, mint, then exemplify                     |
| founder-organ-binding   | pending | agents ∧ skills ∧ trio         | compose — checkpoint; decision 0001; bind `principal:=agent ^ delegate:=operator` in nico+mav |
| exemplify-corpus-pile   | pending | founder-organ-binding          | corpus — lexicon ∪ GLOSSARY as ONE D (filenames=accidents)                                    |
| zero-dangling-gate      | pending | corpus ∧ founder-organ-binding | gate — repo-wide                                                                              | D   | =0 wikilinks + round-trip |
| compress-founder-memory | pending | gate                           | memory — exemplify SELF/MEMORY ≤50 ln; purge episodics ∖ nico-this-session                    |

## decisions

- `0001-founder-agency-organ` — OPEN. organ home for the founder agency construal (default `address`).

## notes

- supersedes `mind-structure-flatten`, `corpus-signify-pass` (Operator: ignore older plans).
- hypothesis-grade. principal reorderings vs raw brief: (1) zero-dangling gate moved AFTER corpus
  (referents mint there); (2) exemplify's own pipeline NOT re-derived in tasks — delegated.
