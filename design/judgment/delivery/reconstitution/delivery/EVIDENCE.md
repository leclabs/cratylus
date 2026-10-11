# Held-out delivery/1 — pre-build proof

`structural.test.ts`, test `held-out delivery/1 — changed capability explanation reaches redelivery without a hand-rewritten adapter account`, passed against today's delivery. The fixture substitutes the capability's own explanation in a distinguishable installed runtime package, installs again, and reads the actual omp tool registration. No source or model session is involved.

It was then seen red with a deliberately stale published-tool recording: `RECONSTITUTION_RED=1` supplies the original tool instead of the changed delivery. The assertion rejected the stale verb list (12 original verbs versus the changed explanation's two); the same helper also checks every changed description and rejects adapter-added domain prose.

Commands, from `packages/cli`:

```sh
pnpm exec vitest run --config ../../design/judgment/delivery/reconstitution/delivery/vitest.config.ts
RECONSTITUTION_RED=1 pnpm exec vitest run --config ../../design/judgment/delivery/reconstitution/delivery/vitest.config.ts
```

Observed: first run 1 passed; negative run 1 failed. The lead should run the first command after the build. The negative flag is proof instrumentation, not a normal acceptance setting.
