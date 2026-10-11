# Seen red

## 2026-10-11 — decision 0111, agents/9

Re-pointed `examples.test.ts`, “example 9: each installed agent has its own tier-and-effort model role”. No example text changed.

The check reads each installed declaration under `<home>/.cratylus/omp/agents/` through the existing `declaration(name, true)` helper. Its `model` must be the ordered pair `[@<agent>, @<profile-tier>:<profile-effort>]`; the host's model-role map must equal its pre-install map, with no seeded agent or tier roles. The master design's tier-and-effort expectations are unchanged.

### Baseline and command

Built committed HEAD `bf6feef86e674a51c341b46c33b87560ab61372d` in an isolated `git archive` extraction, using `pnpm install --frozen-lockfile --ignore-scripts --offline` and `pnpm build`. Copied in the rebound checks; no production code was changed. This keeps the concurrent delivery builder's working-tree changes out of the red evidence.

The baseline still installs to the legacy host directories. Only in the disposable copy, declaration lookups used `<home>/.omp/agent/agents/` and the agent-launch extension lookup used `<home>/.omp/agent/extensions/cratylus.ts`. This path-only fixture adaptation exposes the baseline's actual declarations and settings, unchanged, rather than failing on a missing owned-root directory. The frozen checks retain owned-root paths.

```sh
pnpm --filter cratylus exec vitest run \
  test/catalog-recut/examples.test.ts \
  test/reconstitution/architect/delegate-stand-in.test.ts \
  -t 'example 9:|real omp preserves' --maxWorkers=1 --no-file-parallelism
```

### Observed failure

Exit 1; example 9 failed with all ten intended assertion failures:

- Host settings contained 15 roles, rather than the four host-provided roles: install added all nine agent roles plus `frontier` and `frontier-other-family`.
- Each of architect, lead, builder, assayer, illustrator, check-writer, kino, nico and mav declared only the scalar `@<agent>`, rather than its own role followed by the profile fallback. For example, builder received `"@builder"`, expected `["@builder", "@frontier:medium"]`; illustrator received `"@illustrator"`, expected `["@illustrator", "@frontier-other-family:high"]`.

Soft assertions make both violations visible in the same run; they still fail the check. The joint run reported four failed test cases and 19 skipped, with only the rebound model-binding assertions failing. Full session output: `artifact://2308`.

The main agent should run the same targeted command against the completed delivery build. No green run against the concurrent working tree was performed here.
