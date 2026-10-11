# Seen red

## 2026-10-11 — rulings 0070, 0078, 0084 under the meaning-roles cut (agents/25)

The meaning-roles cut restates three glosses the master transcription quoted word for word: the architect role, the decisive stance and the bottom-line-up-front ordering (0116(1), 0117), and it is revising the architect gloss again. The catalog re-cut is integrated, so its checks are no longer frozen. `meanings` in `master.ts` now binds each of these glosses to what its rulings require. A `Meaning` matcher takes the gloss's place in every vector, projected line and module comparison. The anchor, level, slot, position and projection framing (`- slot: **anchor** — … (fixed)`) stay exact. Every other value still compares against the master's text.

- role/architect (0070, 0084): the client's or operator's principal architect, which owns the conceptual design, the delivery, the examples and the meaning.
- stance/decisive (0070): decides within its authority, and in the same clause never hands back as a question what it holds.
- communication-style/bottom-line-up-front (0078): the conclusion first, then one recommended action, then the support a layman needs, in that order, per topic, never a menu or a question it can answer itself.

### Baseline and command

A `git archive` of `3b98e73c`, built offline, with the rebound checks copied in. In that copy only, one canon gloss string was replaced at a time with a value that breaks its ruling, and canon and cli were rebuilt. `packages/canon` in the working tree was not touched.

```sh
pnpm --filter cratylus exec vitest run test/catalog-recut
```

### Observed

- Green: 17 passed against `3b98e73c`'s canon, and 17 passed against the working tree's revised architect gloss.
- Architect replaced by “the client's assistant: carries out the design and delivery the client decides, …”: 8 failed (examples 2, 3, 4, 5, 7, 10, 11 and 0070).
- Decisive replaced by “… hands each held conclusion back as a question for the operator to confirm”: 7 failed (examples 2, 3, 4, 5, 7, 10, 11).
- Bottom-line-up-front replaced by “the support a layman needs first, then the conclusion, then one recommended action per topic; …”: 8 failed (examples 2, 3, 4, 5, 7, 10, 11 and 0078).

Each diff names only the mutated gloss, received against its `Meaning`. The expected values and text of every other check were unchanged. An in-process probe dropped each required clause in turn: missing principal architect, conceptual design, delivery, examples or meaning; a hand-back, or authority exceeded; support before action, action before conclusion, no per-topic, no “never a menu”, no answerable-question clause. Each one is refused. Rewordings that keep the meaning pass, as do the master's own texts and both delivered architect glosses. A regular expression cannot read negation in general: a gloss that contains the required clauses and then contradicts them would pass.

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
