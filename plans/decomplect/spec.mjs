#!/usr/bin/env node
// spec — the SEQUENCING DATA for plan `decomplect`, and the only home for it.
//
// WHY DATA AND NOT PROSE. `praxis` requires `spec(t) ≜ ⟨intent, inputs, constraints, deps,
// outputs, accept⟩`. Intent/constraints/accept are for an LLM and live in each shard's prose.
// `deps` and `outputs` are RELATIONS OVER THE CORPUS — `R`, `slices`, `waves` and the wave
// concurrency precondition are all computed from them, and a relation carried in prose cannot
// be computed against. So they live here, once, and every shard's front-matter is GENERATED.
//
// `outputs` is what a shard WRITES. It is the contention set: `∀ t,u ∈ wave(n) : t ≠ u ⇒
// outputs(t) ∩ outputs(u) = ∅`. Over-broad outputs invent conflicts and serialize a plan that
// could fan out; under-broad ones let two agents collide. Both are defects, so each glob below
// was measured against the tree, not guessed.
//
// `refs` is what a shard's outputs COMPILE AGAINST — read, not written. Disjoint outputs are
// NECESSARY, NOT SUFFICIENT: a deletion in `t` dangles a reference in `u`.
//
// `static` is cited evidence. `∀ t : ∀ p ∈ static(t) : p exists at authoring`.
//
// `slice` is a partition, and `praxis` requires `slices = argmin over ADMISSIBLE cuts of the
// cross-slice edge count`. That law is UNFALSIFIABLE until `admissible` is named, and nothing in
// the corpus names it — measured here the hard way: the unconstrained argmin is 10 cross edges
// and puts 20 of 33 shards in ONE slice. Minimal, and useless: a 20-shard slice cannot be fanned
// out, which is the only reason slices exist. So ADMISSIBLE ≜ every slice holds MIN..MAX shards,
// with MAX scaled to the corpus so a good cut is not convicted merely for growing.
//
// What the gate checks is LOCAL OPTIMALITY: no admissible swap of two shards' slices lowers the
// cross-edge count. It used to claim the global argmin, on the strength of the best value 40
// restarts of a randomized search happened to reach — a threshold set by the search's luck, not
// by the plan. It reded when a shard with `deps: []`, which cannot change any cut's edge count,
// was added. The global optimum over 8^46 assignments is not computable here; claiming to have
// found it was the overreach. `praxis-execution-spec.test.ts` decides the weaker claim exactly.
//
// `blockedBy` is a RULING owed, not a shard. A shard with a non-empty `blockedBy` may not be
// dispatched however clear its wave is — which is why it is separate from `deps`: `deps` is
// mechanical sequencing, `blockedBy` is a decision nobody has taken.

/** @type {Record<string, {slice: string, deps: string[], outputs: string[], refs: string[], static: string[], blockedBy?: string}>} */
export const SHARDS = {
  // ── slice: canon-corpus ────────────────────────────────────────────────
  // 169 of 192 canon files import `anatomy.js`, so this rename IS the contention set for the
  // whole package. Everything that writes a canon file sequences behind it. That is the work's
  // real shape, not a mis-cut — and it is why the tight output sets below matter: an over-broad
  // glob anywhere else would serialize a plan that can otherwise fan out 6 wide.
  't-manifest-file-basename': {
    slice: 'corpus-rename',
    deps: [],
    outputs: [
      'packages/canon/src/**',
      'packages/canon/test/**',
      'packages/forge/test/**',
    ],
    refs: ['packages/schema/src/index.ts'],
    static: ['packages/canon/src/manifest.ts', 'ARCHITECTURE.md'],
  },
  't-anatomy-root-compose': {
    slice: 'plan-machinery',
    deps: ['t-manifest-file-basename'],
    outputs: [
      'packages/canon/src/toolkit/plan-set.ts',
      'packages/canon/src/toolkit/project-targets.ts',
      'packages/canon/src/toolkit/project-template.ts',
      'packages/canon/src/toolkit/scaffold-cli.ts',
      'packages/canon/src/toolkit/plan-states.ts',
      'packages/canon/test/cratylism.test.ts',
      'packages/canon/test/projection-stability.test.ts',
      'packages/canon/test/symbols.test.ts',
      'packages/canon/test/reader-density.test.ts',
      'packages/canon/test/hook-rule-boundary.test.ts',
    ],
    refs: ['packages/schema/src/index.ts'],
    static: [
      'packages/canon/src/toolkit/plan-set.ts',
      'packages/canon/src/toolkit/scaffold-cli.ts',
    ],
  },
  't-shim-path-from-capability': {
    slice: 'skill-cells',
    deps: ['t-manifest-file-basename'],
    outputs: [
      'packages/canon/src/skills/wake/**',
      'packages/canon/src/skills/dream/**',
      'packages/canon/src/skills/handoff/**',
      'packages/memory/test/cell-verb-roster.test.ts',
    ],
    refs: ['packages/forge/src/project/runtime-shim.ts'],
    static: [
      'packages/canon/src/skills/wake/skill.ts',
      'packages/forge/src/project/runtime-shim.ts',
    ],
  },
  'retire-relocates-but-the-operator-deletes': {
    slice: 'plan-machinery',
    deps: ['t-anatomy-root-compose'],
    outputs: [
      'packages/canon/src/skills/praxis/**',
      'packages/canon/src/toolkit/praxis/**',
      'packages/canon/src/toolkit/plan-set-cli.ts',
      'packages/canon/test/plan-set.test.ts',
      'packages/canon/test/record-retrofit-notice.test.ts',
      'packages/canon/test/command-veracity.test.ts',
      'packages/canon/src/toolkit/plan-set.ts',
    ],
    refs: ['packages/canon/src/toolkit/plan-set.ts'],
    static: [
      'packages/canon/src/skills/praxis/skill.ts',
      'packages/canon/src/toolkit/plan-set.ts',
    ],
  },

  // ── slice: forge-deploy ────────────────────────────────────────────────
  // `SOUL` is broad-and-shallow across the adapter/deploy tree, so it lands FIRST and the four
  // narrow deploy shards rebase once instead of four times.
  't-soul-to-target-in-forge': {
    slice: 'projection-and-ground',
    deps: [],
    outputs: [
      'packages/forge/src/adapters/**',
      'packages/forge/src/core/**',
      'packages/forge/src/deploy/**',
      'packages/forge/src/project/index.ts',
      'packages/schema/src/index.ts',
      'packages/memory/src/seeds.ts',
    ],
    refs: ['packages/forge/src/validate/accept.ts'],
    static: [
      'packages/forge/src/deploy/seeds.ts',
      'packages/forge/src/validate/accept.ts',
    ],
  },
  't-kind-root-ignores-agent-ext': {
    slice: 'deploy-surface',
    deps: ['t-soul-to-target-in-forge'],
    outputs: [
      'packages/forge/src/deploy/manifest.ts',
      'packages/forge/src/deploy/deploy.ts',
      'packages/forge/test/deploy/**',
    ],
    refs: ['packages/forge/src/core/harness-adapter.ts'],
    static: [
      'packages/forge/src/deploy/manifest.ts',
      'packages/forge/src/core/harness-adapter.ts',
    ],
  },
  't-init-hardcodes-harness-dir': {
    slice: 'deploy-surface',
    deps: ['t-soul-to-target-in-forge'],
    outputs: ['packages/forge/src/deploy/init.ts'],
    refs: ['packages/forge/src/deploy/scope.ts'],
    static: [
      'packages/forge/src/deploy/init.ts',
      'packages/forge/src/deploy/scope.ts',
    ],
  },
  't-seed-prose-has-drifted': {
    slice: 'projection-and-ground',
    deps: ['t-soul-to-target-in-forge'],
    outputs: [
      'packages/forge/src/deploy/seeds.ts',
      'packages/memory/src/seeds.ts',
      'packages/memory/test/seed-parity.test.ts',
    ],
    refs: [
      'packages/forge/src/deploy/local.ts',
      'packages/memory/src/strategy.ts',
    ],
    static: [
      'packages/forge/src/deploy/seeds.ts',
      'packages/memory/src/seeds.ts',
      'ARCHITECTURE.md',
    ],
  },
  'deployed-drifts-from-rendered-unwatched': {
    slice: 'deploy-surface',
    // also reads `cli/commands/project.ts`, which `project-never-cleans-its-out-dir`
    // rewrites — the writer changes before the checker that reads it
    deps: [
      't-kind-root-ignores-agent-ext',
      't-init-hardcodes-harness-dir',
      'project-never-cleans-its-out-dir',
    ],
    // MEASURED. A drift CHECKER is a new deploy-layer capability plus the tests that
    // convict it; `deploy/local.ts` alone named the writer and not the checker's own home.
    outputs: [
      'packages/forge/src/cli/**',
      'packages/forge/src/deploy/local.ts',
      'packages/forge/src/deploy/index.ts',
      'packages/forge/test/deploy/**',
    ],
    refs: ['packages/forge/src/deploy/manifest.ts'],
    static: ['packages/forge/src/deploy/manifest.ts', 'MODEL.md'],
  },

  // ── slice: forge-seams ─────────────────────────────────────────────────
  't-signify-marker': {
    slice: 'deploy-surface',
    deps: [],
    outputs: ['packages/forge/src/catalog/**'],
    refs: ['packages/schema/src/index.ts'],
    static: ['packages/forge/src/catalog/index.ts'],
  },
  't-canon-package-default': {
    slice: 'corpus-rename',
    deps: ['t-manifest-file-basename'],
    outputs: [
      'packages/forge/src/config/**',
      'packages/forge/src/cli/**',
      'packages/forge/README.md',
      'packages/forge/test/config/**',
      'packages/forge/test/cli/**',
    ],
    refs: ['packages/forge/src/cli/commands/init.ts'],
    static: [
      'packages/forge/src/config/scaffold.ts',
      'packages/forge/src/cli/commands/init.ts',
    ],
  },
  't-policy-seam-unused': {
    // moved from `host-and-config` 2026-08-05: it depends on the corpus rename and the SOUL
    // sweep, so grouping it there cost a cross-slice edge the argmin does not have to pay.
    slice: 'corpus-rename',
    deps: ['t-manifest-file-basename', 't-soul-to-target-in-forge'],
    outputs: [
      'packages/forge/src/validate/policy.ts',
      'packages/forge/src/validate/oracle.ts',
      'packages/forge/src/validate/structural-parsimony.ts',
      'packages/forge/src/core/exemplify/register.ts',
      'packages/canon/src/toolkit/cold-oracle/**',
      'packages/forge/src/core/exemplify/**',
      'packages/forge/src/cli/commands/optimize.ts',
      'packages/forge/test/stories/E6/**',
    ],
    refs: ['packages/forge/src/core/exemplify/register.ts'],
    static: [
      'packages/forge/src/validate/policy.ts',
      'packages/canon/src/toolkit/cold-oracle/policy.ts',
    ],
  },
  'project-never-cleans-its-out-dir': {
    slice: 'corpus-rename',
    deps: ['t-soul-to-target-in-forge', 't-manifest-file-basename'],
    outputs: [
      'packages/forge/src/project/write.ts',
      'packages/canon/src/toolkit/render-oracle/**',
      'packages/forge/src/prune/**',
      'packages/forge/src/deploy/manifest.ts',
      'packages/forge/src/cli/commands/project.ts',
      'packages/forge/test/project/**',
    ],
    refs: ['packages/forge/src/cli/commands/project.ts'],
    static: [
      'packages/forge/src/project/write.ts',
      'packages/canon/src/toolkit/render-oracle/render-oracle.sh',
    ],
  },
  't-project-human-vs-engine': {
    slice: 'projection-and-ground',
    deps: ['t-soul-to-target-in-forge'],
    outputs: [
      'packages/forge/src/project/project-human.ts',
      'ENGINE.md',
      'packages/forge/test/project/project-human.test.ts',
    ],
    refs: ['packages/forge/src/core/body.ts'],
    static: ['packages/forge/src/project/project-human.ts', 'ENGINE.md'],
  },

  // ── slice: runtime-capability ──────────────────────────────────────────
  't-capture-row': {
    slice: 'event-vocabulary',
    deps: [],
    outputs: [
      'packages/runtime/src/ports/event-tap.ts',
      'packages/runtime/src/capabilities/event-tap/**',
    ],
    refs: ['packages/runtime/src/loader.ts'],
    static: ['packages/runtime/src/ports/event-tap.ts'],
  },
  't-tap-anchor': {
    slice: 'event-vocabulary',
    deps: ['t-capture-row', 't-manifest-file-basename'],
    outputs: [
      'packages/runtime/src/loader.ts',
      'packages/runtime/src/main.ts',
      'packages/canon/src/skills/event-tap/**',
      'packages/runtime/src/**',
      'packages/runtime/test/**',
      'packages/canon/test/capability-keyspace.test.ts',
      'packages/canon/test/event-tap-cell.test.ts',
      'packages/invoke/README.md',
      'packages/runtime/README.md',
    ],
    refs: ['packages/runtime/src/ports/provisional-v9.ts'],
    static: [
      'packages/runtime/src/loader.ts',
      'packages/runtime/src/ports/provisional-v9.ts',
    ],
  },

  // ── slice: schema-contract ─────────────────────────────────────────────
  't-worker-payload-seam-and-property-1': {
    slice: 'cell-contract',
    deps: ['t-anatomy-root-compose'],
    outputs: [
      'packages/schema/src/hook-cell.ts',
      'packages/canon/src/hooks/**',
      'packages/canon/src/toolkit/guardrail/**',
      'packages/canon/test/architecture.test.ts',
      'packages/canon/test/bin-name-single-home.test.ts',
      'packages/canon/test/reader-density.test.ts',
      'packages/canon/src/toolkit/project-targets.ts',
      'packages/canon/test/hook-rule-boundary.test.ts',
      'ARCHITECTURE.md',
    ],
    refs: ['packages/runtime/src/bin-name.ts'],
    static: [
      'packages/canon/src/hooks/memory-consolidation-nudge.ts',
      'packages/canon/test/bin-name-single-home.test.ts',
      'ARCHITECTURE.md',
    ],
  },
  't-lifecycle-vocabulary': {
    slice: 'event-vocabulary',
    deps: ['t-tap-anchor', 't-projection-file-anchor'],
    // Measured against what the ruling assigns this shard, MINUS three files that
    // intersect shards added to this wave after it was cut
    // (`canon/src/hooks/praxis-continuity.ts`, `canon/test/gate-convicts.test.ts`,
    // `forge/src/deploy/local.ts`). The intersection is REAL and is recorded rather
    // than dissolved by under-declaring: this shard does write those files, and the
    // wave that contains all three cannot be fanned out until the plan is re-cut.
    outputs: [
      'packages/schema/src/hook/**',
      'packages/canon/src/manifest.ts',
      'packages/canon/test/event-vocabulary.test.ts',
      'packages/runtime/src/events.ts',
      'packages/runtime/src/runtime-config.ts',
      'packages/runtime/src/capabilities/event-tap/**',
      'packages/forge/src/adapters/claude/events.ts',
      'packages/forge/src/adapters/codex/events.ts',
      'packages/forge/src/deploy/runtime-config.ts',
      // Re-measured from the landing commit. The event vocabulary is CONSUMED by the
      // renderers and by the hook cell, so retiring the generated union moved them too.
      // `schema/package.json` loses the generator's dependency — the deletion is not
      // finished while the dep that fed it is still declared.
      'packages/forge/src/adapters/claude/render.ts',
      'packages/forge/src/adapters/codex/render.ts',
      'packages/forge/src/adapters/codex/index.ts',
      'packages/schema/src/hook-cell.ts',
      'packages/schema/package.json',
      'packages/runtime/src/ports/event-tap.ts',
      'packages/runtime/test/event-tap.test.ts',
      'packages/canon/src/index.ts',
      'packages/canon/src/toolkit/hooks.ts',
      'packages/canon/src/hooks/**',
      'packages/canon/test/cell-gloss-census.test.ts',
    ],
    refs: ['packages/forge/src/adapters/claude/events.ts'],
    // `packages/schema/src/hook/generated.ts` WAS here — the emitted union that was
    // one of the two homes. It is deleted by this shard, so the evidence moves to
    // the one home that replaced both.
    static: [
      'packages/canon/src/manifest.ts',
      'packages/runtime/src/events.ts',
      'ARCHITECTURE.md',
    ],
  },
  't-definiens-vs-residue': {
    slice: 'cell-contract',
    deps: ['t-worker-payload-seam-and-property-1'],
    outputs: [
      'packages/schema/src/rule-cell.ts',
      'packages/canon/src/rules/**',
      'packages/canon/test/hook-rule-boundary.test.ts',
      'packages/canon/test/reader-density.test.ts',
      'packages/canon/test/reader-register.ts',
      'packages/canon/test/cell-gloss-census.test.ts',
      'packages/forge/src/validate/accept.ts',
    ],
    refs: ['packages/schema/src/hook-cell.ts'],
    static: [
      'packages/schema/src/rule-cell.ts',
      'packages/schema/src/hook-cell.ts',
      'MODEL.md',
    ],
  },
  't-rule-cell-body': {
    slice: 'cell-contract',
    deps: ['t-definiens-vs-residue'],
    outputs: [
      'packages/canon/src/rules/**',
      'packages/schema/src/rule-cell.ts',
      'packages/canon/test/reader-density.test.ts',
      'packages/canon/test/reader-register.ts',
    ],
    refs: ['packages/schema/src/rule-cell.ts'],
    static: ['packages/schema/src/rule-cell.ts', 'MODEL.md'],
  },
  't-accept-fifth-kind': {
    slice: 'projection-and-ground',
    deps: ['t-soul-to-target-in-forge', 't-definiens-vs-residue'],
    outputs: [
      'packages/forge/src/validate/accept.ts',
      'packages/canon/test/hook-rule-boundary.test.ts',
      'packages/canon/src/toolkit/project-targets.ts',
      'packages/canon/test/ground-conformance.test.ts',
      'packages/canon/test/gate-convicts.test.ts',
    ],
    refs: ['packages/schema/src/hook-cell.ts'],
    static: ['packages/forge/src/validate/accept.ts', 'MODEL.md'],
  },

  // ── slice: signification ───────────────────────────────────────────────
  't-projection-file-anchor': {
    slice: 'event-vocabulary',
    // The edge to `t-tap-anchor` is DISCHARGED, not satisfied: it existed only because a dead
    // derivation leg proposed `capabilities`. `render` is disjoint from runtime's keyspace.
    // `t-project-human-vs-engine` DELETES a duplicate `dimensionTitle` beside the module this
    // renames — delete dead code before moving the file, or the rename carries it along.
    deps: ['t-soul-to-target-in-forge', 't-project-human-vs-engine'],
    outputs: [
      'packages/forge/src/adapters/claude/**',
      'packages/forge/src/adapters/codex/**',
      'packages/forge/src/core/body.ts',
      'packages/forge/src/project/index.ts',
      'packages/forge/src/core/harness-adapter.ts',
      'packages/forge/test/**',
      'packages/forge/src/adapters/registry/index.ts',
    ],
    refs: ['packages/forge/src/project/index.ts'],
    static: [
      'packages/forge/src/adapters/claude/render.ts',
      'packages/forge/src/core/body.ts',
    ],
  },
  't-coined-classification': {
    // moved from `plan-machinery` 2026-08-05: its dependents are the skill-cell shards,
    // so grouping it there costs a cross-slice edge the argmin does not pay.
    slice: 'skill-cells',
    // also writes `schema/src/index.ts`, which `t-soul-to-target-in-forge` sweeps for `SOUL`
    deps: ['t-anatomy-root-compose', 't-soul-to-target-in-forge'],
    outputs: [
      'packages/schema/src/index.ts',
      'packages/canon/src/manifest.ts',
      'packages/canon/src/skills/create-agent/**',
      'packages/forge/src/catalog/**',
      'packages/forge/test/catalog/**',
      'packages/forge/test/cli/**',
      'packages/forge/test/fixture-manifest.ts',
      'packages/schema/README.md',
    ],
    refs: ['packages/canon/src/dimensions/**'],
    static: ['packages/schema/src/index.ts', 'packages/canon/src/manifest.ts'],
  },
  't-substrate-concept': {
    slice: 'skill-cells',
    deps: ['t-manifest-file-basename'],
    outputs: ['packages/canon/src/skills/create-agent/**'],
    refs: ['packages/canon/src/dimensions/model/claude.ts'],
    static: [
      'packages/canon/src/skills/create-agent/skill.ts',
      'packages/schema/src/index.ts',
    ],
  },
  't-authoring-surface': {
    slice: 'skill-cells',
    deps: ['t-manifest-file-basename'],
    outputs: [
      'packages/canon/src/skills/create-skill/**',
      'packages/canon/src/skills/materialize/**',
    ],
    refs: ['packages/forge/src/core/exemplify/skill-cell.ts'],
    static: [
      'packages/canon/src/skills/create-skill/skill.ts',
      'packages/forge/src/deploy/manifest.ts',
    ],
  },
  't-tool-class-vocabulary': {
    slice: 'cell-contract',
    deps: ['t-worker-payload-seam-and-property-1', 't-lifecycle-vocabulary'],
    // MEASURED after execution, not authored before it. The declaration was one file; landing it
    // touched twelve. `stance-guardrail-pre.ts` was declared a `ref` and then WRITTEN — a ref is a
    // read-only compile target, so that entry was wrong in kind, not merely in extent. Adding an
    // act to the event vocabulary is not a schema-local edit: it reaches every adapter that must
    // bind the act to a native event, and the one hook cell that names the acts.
    outputs: [
      'packages/schema/src/hook/index.ts',
      'packages/schema/src/hook-cell.ts',
      'packages/canon/src/manifest.ts',
      'packages/canon/src/hooks/stance-guardrail-pre.ts',
      'packages/canon/test/hook-act-selector.test.ts',
      'packages/canon/test/event-vocabulary.test.ts',
      'packages/forge/src/adapters/claude/**',
      'packages/forge/src/adapters/codex/**',
      // The worker script is BYTE-LOCKED to the cell that embeds it, so a comment that
      // goes false in one goes false in both. `tsconfig.srccheck.json` was listed here
      // from a mid-flight report and is NOT an output: it was a throwaway path-mapped
      // config, created to typecheck against source and deleted after. A declaration for
      // a file that does not exist is the same defect as a missing one, pointed the other
      // way — it makes the contention set claim territory nothing occupies.
      'packages/canon/src/toolkit/guardrail/stance-guardrail-pre.sh',
    ],
    refs: ['packages/canon/src/toolkit/guardrail/stance-guardrail-pre.sh'],
    static: [
      'packages/canon/src/hooks/stance-guardrail-pre.ts',
      'packages/schema/src/hook-cell.ts',
    ],
  },
  't-canon-soul': {
    slice: 'skill-cells',
    deps: [
      't-shim-path-from-capability',
      't-substrate-concept',
      't-authoring-surface',
      't-coined-classification',
    ],
    outputs: [
      'packages/canon/src/genus/**',
      'packages/canon/src/skills/dream/**',
      'packages/canon/src/skills/introspect/**',
    ],
    refs: ['packages/schema/src/index.ts'],
    static: ['packages/canon/src/genus/founding-doctrine.ts'],
  },

  // ── slice: ground-and-record ───────────────────────────────────────────
  't-ground-numbers-are-unmeasured': {
    slice: 'corpus-rename',
    deps: ['t-manifest-file-basename'],
    outputs: ['ARCHITECTURE.md'],
    refs: ['packages/canon/test/architecture.test.ts'],
    static: ['ARCHITECTURE.md', 'packages/canon/test/architecture.test.ts'],
  },
  't-config-dotfile-was-shipped-underived': {
    slice: 'host-and-config',
    deps: [],
    outputs: [
      'packages/memory/src/**',
      'packages/memory/test/**',
      'packages/runtime/src/ports/memory.ts',
      '.cratylus.memory.json.example',
    ],
    refs: ['packages/runtime/src/runtime-config.ts'],
    static: [
      'packages/memory/src/node.ts',
      'packages/runtime/src/runtime-config.ts',
    ],
  },

  // ── slice: host-and-gates ──────────────────────────────────────────────
  'the-host-install-is-a-symlink-nobody-authored': {
    slice: 'host-and-config',
    deps: ['t-soul-to-target-in-forge'],
    outputs: [
      'packages/invoke/**',
      'packages/forge/src/deploy/bundle.ts',
      'packages/forge/src/deploy/local.ts',
      'packages/forge/src/deploy/index.ts',
      'packages/forge/test/deploy/**',
    ],
    refs: ['packages/runtime/src/bin-name.ts'],
    static: ['packages/invoke/README.md', 'packages/runtime/src/bin-name.ts'],
  },
  'bin-name-gate-stops-at-the-language-boundary': {
    slice: 'cell-contract',
    deps: ['t-worker-payload-seam-and-property-1'],
    outputs: ['packages/canon/test/bin-name-single-home.test.ts'],
    refs: ['packages/runtime/src/bin-name.ts'],
    static: ['packages/canon/test/bin-name-single-home.test.ts'],
  },
  'memory-nudge-is-flaky-under-the-full-verify': {
    slice: 'host-and-config',
    deps: [
      't-manifest-file-basename',
      'the-host-install-is-a-symlink-nobody-authored',
    ],
    outputs: ['packages/canon/test/memory-nudge.test.ts'],
    refs: ['packages/invoke/src/bin.ts'],
    static: ['packages/canon/test/memory-nudge.test.ts'],
  },
  'elevate-installs-no-mechanism': {
    slice: 'plan-machinery',
    // The last two deps are SEQUENCING, not derivation — this shard needs nothing either one
    // produces. It contends with them on files: `canon/src/manifest.ts` with the tool-class
    // shard (one adds acts to the event tuple, the other a runtime capability) and
    // `canon/test/symbol-altitude.test.ts` with the soul sweep (one adds a row, the other
    // rewrites prose throughout). I dispatched all three concurrently on declarations that
    // named neither file, so two agents wrote one test file at the same time. It did not
    // corrupt — the edits fell in different regions — but nothing about the cut made that
    // true, and a wave is not safe because its collisions happened to miss.
    deps: [
      't-anatomy-root-compose',
      't-lifecycle-vocabulary',
      't-tool-class-vocabulary',
      'soul-survives-in-canon-test-prose',
    ],
    // The mechanism is RUNTIME's — a build-time hook projection cannot be installed by `elevate`
    // and removed by `release`. And it must NOT compile against `plan-set.ts`: property 4 forbids
    // a runtime→sibling edge, so plan state reaches it as projected configuration.
    // MEASURED: 2 globs declared, 13 files written. A CAPABILITY cannot be confined to
    // `capabilities/**` — `capability-keyspace.test.ts` enforces a biconditional, so a new
    // capability necessarily reaches the port file, the keyspace, the plugin surface, the
    // dispatch route, the barrel, and canon's `RUNTIME_CAPABILITIES`. The declaration named
    // where the code LIVES; the contract names where it must be REGISTERED.
    //
    // `manifest.ts` and `plan-states.ts` are the honest part of this record. `manifest.ts` is
    // ALSO written by `t-tool-class-vocabulary`, and I dispatched both concurrently — so that
    // wave violated `∀ t,u ∈ wave(n) : outputs(t) ∩ outputs(u) = ∅`. It did not corrupt
    // anything (the edits fell in different regions), but it was not disjoint, and it read as
    // disjoint only because both declarations understated their reach. `outputs` IS the
    // concurrency-precondition input: an under-declared array does not make a wave safe, it
    // makes an unsafe wave look safe. `plan-states.ts` was declared a `ref` and then WRITTEN.
    outputs: [
      'packages/canon/src/skills/carry-on/**',
      'packages/runtime/src/capabilities/**',
      'packages/runtime/src/ports/carry-on.ts',
      'packages/runtime/src/loader.ts',
      'packages/runtime/src/plugin.ts',
      'packages/runtime/src/main.ts',
      'packages/runtime/src/index.ts',
      'packages/runtime/test/carry-on.test.ts',
      'packages/canon/src/manifest.ts',
      'packages/canon/src/toolkit/plan-states.ts',
      'packages/canon/test/carry-on-cell.test.ts',
      'packages/canon/test/symbol-altitude.test.ts',
    ],
    refs: [],
    static: [
      'packages/canon/src/skills/carry-on/skill.ts',
      'packages/canon/src/hooks/stance-guardrail-pre.ts',
    ],
  },
  't-kind-is-triple-booked': {
    slice: 'cell-contract',
    deps: ['t-definiens-vs-residue', 't-coined-classification'],
    // MEASURED from the landing commit, not authored before it. `resolve/**` was the
    // DEFINITION site; this shard renames a sign (`kind` → `repertoire` ∧ `valueShape`),
    // and a rename's blast radius is every REFERENCE. Declaring only where a name is
    // born, for a task whose whole content is changing that name everywhere, understates
    // the footprint by an order of magnitude — 1 glob declared, 15 files written.
    outputs: [
      'packages/forge/src/resolve/**',
      'packages/forge/src/catalog/index.ts',
      'packages/forge/src/cli/commands/catalog.ts',
      'packages/forge/src/cli/commands/explain.ts',
      'packages/forge/test/catalog/**',
      'packages/forge/test/cli/catalog.test.ts',
      'packages/forge/test/cli/explain.test.ts',
      'packages/forge/test/resolve/**',
      'packages/forge/test/fixture-manifest.ts',
      'packages/schema/src/index.ts',
    ],
    refs: ['packages/schema/src/index.ts', 'packages/schema/src/rule-cell.ts'],
    static: [
      'packages/schema/src/index.ts',
      'packages/forge/src/resolve/resolve.ts',
      'MODEL.md',
    ],
  },
  't-classification-wears-three-signs': {
    slice: 'skill-cells',
    deps: ['t-coined-classification', 't-authoring-surface'],
    outputs: ['packages/canon/src/skills/create-agent/**'],
    refs: ['packages/schema/src/index.ts'],
    static: [
      'packages/schema/src/index.ts',
      'packages/canon/src/skills/create-agent/skill.ts',
    ],
  },
  't-harness-adapter-surface-is-genus-and-species': {
    slice: 'event-vocabulary',
    deps: ['t-projection-file-anchor'],
    // MEASURED. Splitting the adapter surface into genus and species moves what the
    // PROJECT layer calls, so the callers move with it — the seam is not repositionable
    // from one side alone.
    outputs: [
      'packages/forge/src/core/harness-adapter.ts',
      'packages/forge/src/project/index.ts',
      'packages/forge/src/project/realization.ts',
      'packages/forge/test/project/tree.test.ts',
    ],
    refs: ['packages/forge/src/adapters/**'],
    static: ['packages/forge/src/core/harness-adapter.ts'],
  },
  't-memory-config-scope-is-incoherent': {
    slice: 'host-and-config',
    deps: ['t-config-dotfile-was-shipped-underived'],
    outputs: [
      'packages/memory/src/audit.ts',
      'packages/memory/src/node.ts',
      'packages/memory/test/**',
    ],
    refs: ['packages/memory/src/node.ts'],
    static: ['packages/memory/src/audit.ts', 'packages/memory/src/node.ts'],
  },
  't-engine-internal-names-await-decode': {
    slice: 'deploy-surface',
    // reads `Arity` from the schema module `t-coined-classification` rewrites
    deps: ['t-coined-classification'],
    // The rename reaches every importer, not just the declaring module: the loader consumes all
    // three types and the discovery test names the verb. Declaring only `catalog/**` would have
    // been convicted by `shard-scope` the moment it landed.
    outputs: [
      'packages/forge/src/catalog/**',
      'packages/forge/src/config/loader.ts',
      'packages/forge/test/catalog/discover.test.ts',
      'packages/forge/test/catalog/signify-marker-class.test.ts',
      // MEASURED at landing. `project/index.ts` IMPORTS two of the four renamed signs, so
      // omitting it would not have left stale prose — it would have failed the typecheck.
      // The declared reach was read off where the names are DEFINED; a rename is bounded
      // by where they are USED, and only the call graph knows that.
      'packages/forge/src/project/index.ts',
      'packages/forge/src/cli/commands/catalog.ts',
    ],
    refs: ['packages/schema/src/index.ts'],
    static: ['packages/forge/src/catalog/index.ts'],
    // RULING 2026-08-05 — decode discharged. Three independent blind derivations (no repository
    // access, current names withheld) converged: `Discovered*` names the pipeline STAGE and not
    // the thing, and every value in a pipeline came from some stage, so the participle never
    // distinguishes; `Source` was rejected twice over as colliding with authored source text —
    // the fragment BODY is the source here. Signs: `PluginFragmentRoot` (where to scan, an input)
    // · `FragmentEntry` (identity + axis + body — the one type all three defended without
    // qualification) · `PluginFragmentCatalog` (what one plugin yielded; the `Fragment` infix is
    // what blocks the "catalog OF plugins" misread) · `enumeratePluginFragmentCatalogs` (the verb
    // is attested by the single-corpus sibling `enumerateCatalog`; the long infix is paid on
    // purpose — the cold audit found this the ONLY one of the four to fail a naive decode, and a
    // sibling pair is where a misread costs most).
  },
  'namespaced-pairs-are-a-hand-rolled-map': {
    slice: 'deploy-surface',
    // sequenced AFTER the decode: collapsing the types on top of a rename would make both
    // unreviewable — a reader could not tell which edit followed from which cut
    deps: ['t-engine-internal-names-await-decode'],
    // MEASURED, and the shortfall has a NAMED CAUSE worth more than the repair. This shard
    // was CUT OUT of `t-engine-internal-names-await-decode`, and the split copied that
    // shard's two catalog globs while dropping its two consumer entries
    // (`src/project/index.ts`, `src/cli/commands/catalog.ts`). The rename and the collapse
    // reach the SAME consumers — `project/index.ts` imports the type being collapsed — so
    // the derived array understated by construction, not by oversight.
    //
    // SPLITTING A SHARD DOES NOT SPLIT ITS BLAST RADIUS. When one concern is lifted out of
    // another, the outputs of the child are not a subset of the parent's chosen by which
    // globs look topical; they must be re-derived from the child's own call graph. Every
    // under-declaration found in this plan traces to reading a footprint off a definition
    // site instead of a reference set, and this is that error committed at the plan tier
    // rather than the code tier.
    outputs: [
      'packages/forge/src/catalog/**',
      'packages/forge/src/config/loader.ts',
      'packages/forge/test/catalog/**',
      'packages/forge/src/project/index.ts',
      'packages/forge/test/project/resolver-parity.test.ts',
    ],
    refs: ['packages/schema/src/index.ts'],
    static: ['packages/forge/src/catalog/index.ts'],
  },
  'source-can-go-invisible-to-every-text-tool': {
    slice: 'deploy-surface',
    // No deps. The repair already landed with `t-tool-class-vocabulary`; what is owed is
    // the gate, and it reads `git ls-files` — it depends on nothing in the corpus.
    deps: [],
    outputs: [
      'packages/canon/test/authored-source-is-text.test.ts',
      'packages/canon/test/gate-convicts.test.ts',
    ],
    refs: [],
    static: ['packages/canon/test/gate-convicts.test.ts'],
  },
  'the-drift-worker-infers-three-things-it-should-be-told': {
    slice: 'deploy-surface',
    // ONE shard, and the plan's own law is why. Filed as three (bin name · harness identity ·
    // exit-code contract) it produced two singleton non-terminal waves — because all three
    // rewrite `deploy-drift-notice.ts` and its byte-locked target. The worker IS the
    // contention set, so splitting by concern buys a chain and no parallelism. The concerns
    // stay distinct in the shard's prose; the cut is one because the artifact is one.
    deps: ['drift-is-checkable-but-nothing-checks-it'],
    // MEASURED: 8 declared, 20 written. Two causes, and only one of them is an authoring
    // slip. (1) The shard said the bin name had NO home; it had no home and FIFTEEN
    // SPELLINGS, in live operator-facing strings across six CLI modules. Giving it a home
    // means every spelling interpolates it, so the footprint is the spellings, not the
    // declaration site — the same definition-site-versus-reference-set error this plan has
    // now paid for six times, committed by me in the shard's own prose. (2) The shard named
    // no home for the things it demanded EXIST: a module for the derived bin, one for the
    // exit-code contract it said must be "named in one place", and a test for the
    // projector-side property. A shard that requires a new single home must declare where
    // that home goes, or its outputs describe only the half of the work that edits.
    outputs: [
      'packages/schema/src/hook-cell.ts',
      'packages/forge/src/project/index.ts',
      'packages/forge/src/cli/**',
      'packages/forge/src/bin-name.ts',
      'packages/forge/src/deploy/check-exit.ts',
      'packages/forge/src/deploy/index.ts',
      'packages/forge/package.json',
      'packages/forge/test/deploy/check.test.ts',
      'packages/forge/test/project/projection-facts.test.ts',
      'packages/forge/test/project/fixtures-facts/**',
      'packages/canon/src/hooks/deploy-drift-notice.ts',
      'packages/canon/src/toolkit/guardrail/deploy-drift-notice.sh',
      'packages/canon/src/toolkit/project-targets.ts',
      'packages/canon/test/deploy-drift-notice.test.ts',
      'packages/canon/test/bin-name-single-home.test.ts',
    ],
    refs: [
      'packages/runtime/src/bin-name.ts',
      'packages/forge/src/core/harness-adapter.ts',
    ],
    static: [
      'packages/schema/src/hook-cell.ts',
      'packages/runtime/src/bin-name.ts',
      'packages/forge/package.json',
    ],
  },
  'spec-arrays-can-silently-truncate': {
    slice: 'plan-machinery',
    deps: [],
    outputs: [
      'packages/canon/test/praxis-execution-spec.test.ts',
      'packages/canon/test/shard-scope.test.ts',
    ],
    refs: ['packages/canon/src/toolkit/plan-set.ts'],
    static: ['packages/canon/test/praxis-execution-spec.test.ts'],
  },
  'memory-test-hermetic-sentinel-has-six-homes': {
    slice: 'host-and-config',
    deps: ['t-memory-config-scope-is-incoherent'],
    outputs: ['packages/memory/test/**'],
    refs: ['packages/memory/src/node.ts'],
    static: [
      'packages/memory/src/node.ts',
      'packages/memory/test/node.test.ts',
    ],
  },
  'retire-lost-its-open-shard-guard': {
    slice: 'plan-machinery',
    deps: ['retire-relocates-but-the-operator-deletes'],
    outputs: [
      'packages/canon/src/toolkit/plan-set.ts',
      'packages/canon/test/plan-set.test.ts',
    ],
    refs: ['packages/canon/src/skills/praxis/skill.ts'],
    static: [
      'packages/canon/src/toolkit/plan-set.ts',
      'packages/canon/test/plan-set.test.ts',
    ],
  },
  'structural-parsimony-belongs-to-canon': {
    slice: 'corpus-rename',
    deps: ['t-policy-seam-unused'],
    outputs: [
      'packages/forge/src/validate/structural-parsimony.ts',
      'packages/canon/src/toolkit/structural-parsimony.ts',
      'packages/canon/test/structural-parsimony.test.ts',
      'packages/canon/test/gate-convicts.test.ts',
      'packages/forge/src/validate/index.ts',
    ],
    refs: ['packages/canon/src/manifest.ts'],
    static: [
      'packages/forge/src/validate/structural-parsimony.ts',
      'packages/canon/test/structural-parsimony.test.ts',
    ],
  },
  'soul-survives-in-canon-test-prose': {
    slice: 'skill-cells',
    deps: ['t-canon-soul'],
    // Enumerated, not `canon/test/**`. The glob was an OVER-claim: this shard rewrites prose in
    // seven known files and creates nothing. Holding the whole dir made it contend with every
    // other shard that adds a fixture there — a contention that does not exist. `outputs` IS the
    // wave-disjointness input, so an over-claim mis-cuts the wave exactly as an under-claim does.
    outputs: [
      'packages/canon/test/cratylism.test.ts',
      'packages/canon/test/null-dimension.test.ts',
      'packages/canon/test/projection-stability.test.ts',
      'packages/canon/test/reader-density.test.ts',
      'packages/canon/test/reader-register.ts',
      'packages/canon/test/structural-parsimony.test.ts',
      'packages/canon/test/symbol-altitude.test.ts',
    ],
    refs: ['packages/canon/src/genus/founding-doctrine.ts'],
    static: ['packages/canon/test/null-dimension.test.ts', 'MODEL.md'],
  },
  'drift-is-checkable-but-nothing-checks-it': {
    slice: 'deploy-surface',
    // also writes `canon/test/**`, which `soul-survives-in-canon-test-prose` sweeps —
    // sequenced rather than dissolved by under-declaring either one
    // The third dep is a CHOKEPOINT, not a derivation. Every shard that adds a gate must
    // register it in the one `gate-convicts.test.ts` REGISTRY, so any two gate-adding shards
    // contend on that file by construction and can never share a wave. That is the meta-gate
    // working as designed — a gate with no registry entry is a gate nobody can find — and the
    // cost is that gate work serializes. Sequencing is the only honest answer; the alternative
    // is under-declaring one of them, which buys a wave by lying about what it writes.
    deps: [
      'deployed-drifts-from-rendered-unwatched',
      'soul-survives-in-canon-test-prose',
      'source-can-go-invisible-to-every-text-tool',
    ],
    // MEASURED. `hooks/**` names where a cell LIVES and not where it is REGISTERED:
    // `toolkit/hooks.ts` is the composition root, and without those two lines the cell never
    // reaches settings.json and the shard delivers nothing. The `.sh` is the committed deploy
    // target, GENERATED by `project-targets-cli.ts` and byte-locked to the cell — the cell and
    // its target are one artifact in two files, so a glob over one of them is half a claim.
    outputs: [
      'packages/canon/src/hooks/**',
      'packages/canon/test/**',
      'packages/canon/src/toolkit/hooks.ts',
      'packages/canon/src/toolkit/guardrail/deploy-drift-notice.sh',
    ],
    refs: ['packages/forge/src/deploy/local.ts'],
    static: ['packages/forge/src/deploy/local.ts', 'ARCHITECTURE.md'],
  },
};
