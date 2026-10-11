# Seen red

## 2026-10-11 — decision 0111, illustrator model binding

Re-pointed the illustrator model-role assertion in `delegate-stand-in.test.ts`, “real omp preserves the offered tools and routes only exposed dispatch”. No example text, dispatch expectation or scenario changed.

The check parses the installed `<home>/.cratylus/omp/agents/illustrator.md` YAML front matter using Bun, the same parser used by the existing fixture. Its `model` must be `["@illustrator", "@frontier-other-family:high"]`: the illustrator's own role first, then its profile's other-family frontier tier at high effort. The fixture provides no host model roles, so install must leave the host role map absent or empty, not seed any roles.

### Baseline and command

Built committed HEAD `bf6feef86e674a51c341b46c33b87560ab61372d` in an isolated `git archive` extraction, using `pnpm install --frozen-lockfile --ignore-scripts --offline` and `pnpm build`. Copied in the rebound checks; no production code was changed. The concurrent delivery builder's working tree was not built or tested.

The baseline installs into legacy host directories, so only the disposable copy's declaration lookups and agent-launch extension lookup were directed there: `<home>/.omp/agent/agents/` and `<home>/.omp/agent/extensions/cratylus.ts`. Neither installed declaration content nor host settings were altered. The frozen checks retain owned-root paths. This isolates the model-binding regression from the separate location cutover.

```sh
pnpm --filter cratylus exec vitest run \
  test/catalog-recut/examples.test.ts \
  test/reconstitution/architect/delegate-stand-in.test.ts \
  -t 'example 9:|real omp preserves' --maxWorkers=1 --no-file-parallelism
```

### Observed failure

Exit 1. All three task variants (default active, explicit active and inactive) failed on both rebound assertions:

- `illustrator role precedes its profile fallback`: received scalar `"@illustrator"`; expected `["@illustrator", "@frontier-other-family:high"]`.
- `install seeds no host roles`: received nine seeded agent roles, including `illustrator: "@frontier-other-family:high"`; expected `{}`.

Soft assertions allowed the existing dispatch checks to continue; no dispatch or tool-exposure assertion failed. The joint run reported four failed test cases and 19 skipped, with only the rebound model-binding assertions failing. Full session output: `artifact://2308`.

The main agent should run the same targeted command against the completed delivery build. No green run against the concurrent working tree was performed here.
