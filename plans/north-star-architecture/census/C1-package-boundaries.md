# C1 findings — toolkit placement (ANATOMY vs FORGE concern)

Source: Explore census of `packages/agent-anatomy/src/toolkit/**`.

## Verdict

`agent-anatomy/toolkit/` hosts a large body of **FORGE-concern** projection/build/deploy/accept-gate
tooling that delegates its real logic UP into `@leclabs/agent-forge` — the manufacture tooling lives in
the _source-content_ package. The clean **ANATOMY-concern** residents are the runtime hook bodies.

## FORGE-concern (candidates to relocate into agent-forge)

- `project-cli.ts`, `project-cli-codex.ts` — projection CLIs → SOUL/SKILL tree + `settings.json` + codex `.toml`. Wrap forge adapters.
- `project-human.ts`, `project-human-cli.ts`, `organ-docs.ts` — organ-README (human) projection + byte-lock.
- `project-targets.ts`, `project-targets-cli.ts` — deploy-target regen + byte-lock ("`deploy` for locked artifacts").
- `project.ts` — `fragmentToMarkdown` organ-value → cell-body render.
- `hooks.ts` — lifts hook source cells → forge `Hook` deploy-IR + worker payloads (STRADDLES: references anatomy's specific stance-guard cells).
- `cold-oracle/{accept,residue,structural-parsimony,oracle}.ts + cold-oracle.sh + sweep.mjs` — the `accept()` gate (manufacture QA), imports `@leclabs/agent-forge/anatomy` types.

## ANATOMY-concern (stay — runtime substance)

- `guardrail/{stance-guardrail-pre,stance-guardrail,stance-judge}.sh`, `stance-judge-prompt.md` — the hook handlers + judge + rubric that execute at agent runtime.

## AMBIGUOUS (debate)

- `hook-cell.ts`, `rule-cell.ts` — types straddling runtime-worker-bytes (anatomy) + deploy-target/accept metadata (forge).
- `operator-lexicon.ts` — shared authoring notation (anatomy) that drives build-time symbol/residue gates (forge).
- `guardrail/test-stance-guardrail.sh`, `continuity/*.sh` — CI/dev/git-substrate harness, neither pure runtime nor projection.

## Cycle constraint

Most forge-concern modules already import `@leclabs/agent-forge/*` downward → relocation legal.
`hooks.ts` references anatomy sibling cells → split generic-lift (forge) from specific-cells (anatomy).
