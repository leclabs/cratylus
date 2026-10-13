# Held-out workflow/4 — pre-build red

`structural.test.ts`, test `held-out workflow/4 — independent root precedes recorded cyclic concepts and the account names their cycle`, was run with:

```sh
pnpm exec vitest run --config ../../design/judgment/workflow/reconstitution/overview/vitest.config.ts
```

From `packages/cli`, it failed on the contract's required `concepts overview --context film-production` operation: `unknown verb 'overview'`. This is a missing capability failure, not an import or fixture error. No live session ran.

The check keeps both cycle edges, expects production first followed by revision and review in recorded order, and requires the cycle in structured output and the account. The lead should run the same command after the build.
