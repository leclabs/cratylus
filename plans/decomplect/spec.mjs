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
// out, which is the only reason slices exist. So ADMISSIBLE ≜ every slice holds 3..6 shards, and
// under that constraint the argmin is 16. The cut below IS that argmin, found by local search,
// and `praxis-execution-spec.test.ts` re-derives it rather than trusting this comment.
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
    outputs: [
      'packages/forge/src/cli/**',
      'packages/forge/src/deploy/local.ts',
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
    outputs: ['packages/forge/src/project/project-human.ts', 'ENGINE.md'],
    refs: ['packages/forge/src/core/anatomy-body.ts'],
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
    outputs: [
      'packages/schema/src/hook/**',
      'packages/runtime/src/events.ts',
      'packages/runtime/src/capabilities/event-tap/claude-serialize.ts',
    ],
    refs: ['packages/forge/src/adapters/claude/events.ts'],
    static: [
      'packages/schema/src/hook/generated.ts',
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
    outputs: ['packages/canon/src/rules/**'],
    refs: ['packages/schema/src/rule-cell.ts'],
    static: ['packages/schema/src/rule-cell.ts', 'MODEL.md'],
  },
  't-accept-fifth-kind': {
    slice: 'projection-and-ground',
    deps: ['t-soul-to-target-in-forge', 't-definiens-vs-residue'],
    outputs: ['packages/forge/src/validate/accept.ts', 'MODEL.md'],
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
      'packages/forge/src/core/anatomy-body.ts',
    ],
    refs: ['packages/forge/src/project/index.ts'],
    static: [
      'packages/forge/src/adapters/claude/anatomy.ts',
      'packages/forge/src/core/anatomy-body.ts',
    ],
  },
  't-coined-classification': {
    // moved from `plan-machinery` 2026-08-05: its dependents are the skill-cell shards,
    // so grouping it there costs a cross-slice edge the argmin does not pay.
    slice: 'skill-cells',
    // also writes `schema/src/index.ts`, which `t-soul-to-target-in-forge` sweeps for `SOUL`
    deps: ['t-anatomy-root-compose', 't-soul-to-target-in-forge'],
    outputs: ['packages/schema/src/index.ts'],
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
    outputs: ['packages/schema/src/hook/index.ts'],
    refs: ['packages/canon/src/hooks/stance-guardrail-pre.ts'],
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
    outputs: ['packages/invoke/**'],
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
    deps: ['t-anatomy-root-compose', 't-lifecycle-vocabulary'],
    // The mechanism is RUNTIME's — a build-time hook projection cannot be installed by `elevate`
    // and removed by `release`. And it must NOT compile against `plan-set.ts`: property 4 forbids
    // a runtime→sibling edge, so plan state reaches it as projected configuration.
    outputs: [
      'packages/canon/src/skills/carry-on/**',
      'packages/runtime/src/capabilities/**',
    ],
    refs: ['packages/canon/src/toolkit/plan-states.ts'],
    static: [
      'packages/canon/src/skills/carry-on/skill.ts',
      'packages/canon/src/hooks/stance-guardrail-pre.ts',
    ],
  },
  't-kind-is-triple-booked': {
    slice: 'cell-contract',
    deps: ['t-definiens-vs-residue', 't-coined-classification'],
    outputs: ['packages/forge/src/resolve/**'],
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
    outputs: ['packages/forge/src/core/harness-adapter.ts'],
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
    outputs: ['packages/forge/src/catalog/**'],
    refs: ['packages/schema/src/index.ts'],
    static: ['packages/forge/src/catalog/index.ts'],
    blockedBy:
      'a four-sign family decode for the catalog engine internals, derived together',
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
    ],
    refs: ['packages/canon/src/manifest.ts'],
    static: [
      'packages/forge/src/validate/structural-parsimony.ts',
      'packages/canon/test/structural-parsimony.test.ts',
    ],
  },
};
