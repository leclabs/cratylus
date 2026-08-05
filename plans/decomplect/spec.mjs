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
    slice: 'canon-corpus',
    deps: [],
    outputs: [
      'packages/canon/src/**',
      'packages/canon/test/**',
      'packages/forge/test/fixture-anatomy.ts',
    ],
    refs: ['packages/schema/src/index.ts'],
    static: ['packages/canon/src/anatomy.ts', 'ARCHITECTURE.md'],
  },
  't-anatomy-root-compose': {
    slice: 'canon-corpus',
    deps: ['t-manifest-file-basename'],
    outputs: [
      'packages/canon/src/toolkit/plan-set.ts',
      'packages/canon/src/toolkit/project-targets.ts',
      'packages/canon/src/toolkit/project-template.ts',
      'packages/canon/src/toolkit/scaffold-cli.ts',
      'packages/canon/test/cratylism.test.ts',
      'packages/canon/test/projection-stability.test.ts',
      'packages/canon/test/symbols.test.ts',
    ],
    refs: ['packages/schema/src/index.ts'],
    static: [
      'packages/canon/src/toolkit/plan-set.ts',
      'packages/canon/src/toolkit/scaffold-cli.ts',
    ],
  },
  't-shim-path-from-capability': {
    slice: 'canon-corpus',
    deps: ['t-manifest-file-basename'],
    outputs: [
      'packages/canon/src/skills/wake/**',
      'packages/canon/src/skills/dream/**',
      'packages/canon/src/skills/handoff/**',
    ],
    refs: ['packages/forge/src/project/runtime-shim.ts'],
    static: [
      'packages/canon/src/skills/wake/skill.ts',
      'packages/forge/src/project/runtime-shim.ts',
    ],
  },
  'retire-relocates-but-the-operator-deletes': {
    slice: 'canon-corpus',
    deps: ['t-anatomy-root-compose'],
    outputs: [
      'packages/canon/src/skills/praxis/**',
      'packages/canon/src/toolkit/praxis/**',
      'packages/canon/src/toolkit/plan-set-cli.ts',
    ],
    refs: ['packages/canon/src/toolkit/plan-set.ts'],
    static: [
      'packages/canon/src/skills/praxis/skill.ts',
      'packages/canon/src/toolkit/plan-set.ts',
    ],
    blockedBy:
      'whether retire means relocate, means delete, or splits into two verbs',
  },

  // ── slice: forge-deploy ────────────────────────────────────────────────
  // `SOUL` is broad-and-shallow across the adapter/deploy tree, so it lands FIRST and the four
  // narrow deploy shards rebase once instead of four times.
  't-soul-to-target-in-forge': {
    slice: 'forge-deploy',
    deps: [],
    outputs: [
      'packages/forge/src/adapters/**',
      'packages/forge/src/core/**',
      'packages/forge/src/deploy/**',
      'packages/forge/src/project/index.ts',
    ],
    refs: ['packages/forge/src/validate/accept.ts'],
    static: [
      'packages/forge/src/deploy/seeds.ts',
      'packages/forge/src/validate/accept.ts',
    ],
  },
  't-kind-root-ignores-agent-ext': {
    slice: 'forge-deploy',
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
    slice: 'forge-deploy',
    deps: ['t-soul-to-target-in-forge'],
    outputs: ['packages/forge/src/deploy/init.ts'],
    refs: ['packages/forge/src/deploy/scope.ts'],
    static: [
      'packages/forge/src/deploy/init.ts',
      'packages/forge/src/deploy/scope.ts',
    ],
  },
  't-seed-prose-has-drifted': {
    slice: 'forge-deploy',
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
    slice: 'forge-deploy',
    deps: ['t-kind-root-ignores-agent-ext', 't-init-hardcodes-harness-dir'],
    outputs: [
      'packages/forge/src/cli/**',
      'packages/forge/src/deploy/local.ts',
    ],
    refs: ['packages/forge/src/deploy/manifest.ts'],
    static: ['packages/forge/src/deploy/manifest.ts', 'MODEL.md'],
  },

  // ── slice: forge-seams ─────────────────────────────────────────────────
  't-signify-marker': {
    slice: 'forge-seams',
    deps: [],
    outputs: ['packages/forge/src/catalog/**'],
    refs: ['packages/schema/src/index.ts'],
    static: ['packages/forge/src/catalog/index.ts'],
    blockedBy: 'an owed cold-decode for the arity→kind map concept',
  },
  't-canon-package-default': {
    slice: 'forge-seams',
    deps: ['t-manifest-file-basename'],
    outputs: [
      'packages/forge/src/config/**',
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
    slice: 'forge-seams',
    deps: ['t-manifest-file-basename', 't-soul-to-target-in-forge'],
    outputs: [
      'packages/forge/src/validate/policy.ts',
      'packages/forge/src/validate/oracle.ts',
      'packages/forge/src/validate/structural-parsimony.ts',
      'packages/canon/src/toolkit/cold-oracle/**',
    ],
    refs: ['packages/forge/src/core/exemplify/register.ts'],
    static: [
      'packages/forge/src/validate/policy.ts',
      'packages/canon/src/toolkit/cold-oracle/policy.ts',
    ],
  },
  'project-never-cleans-its-out-dir': {
    slice: 'forge-seams',
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
    blockedBy:
      'the three-way cut: who owns cleaning — the writer, the CLI, or the caller',
  },
  't-project-human-vs-engine': {
    slice: 'forge-seams',
    deps: ['t-soul-to-target-in-forge'],
    outputs: ['packages/forge/src/project/project-human.ts', 'ENGINE.md'],
    refs: ['packages/forge/src/core/anatomy-body.ts'],
    static: ['packages/forge/src/project/project-human.ts', 'ENGINE.md'],
    blockedBy:
      'ENGINE.md declares project-human a member of boundary-projection; deleting the sole implementation leaves ground declaring an unrealized operation',
  },

  // ── slice: runtime-capability ──────────────────────────────────────────
  't-capture-row': {
    slice: 'runtime-capability',
    deps: [],
    outputs: [
      'packages/runtime/src/ports/event-tap.ts',
      'packages/runtime/src/capabilities/event-tap/**',
    ],
    refs: ['packages/runtime/src/loader.ts'],
    static: ['packages/runtime/src/ports/event-tap.ts'],
  },
  't-tap-anchor': {
    slice: 'runtime-capability',
    deps: ['t-capture-row', 't-manifest-file-basename'],
    outputs: [
      'packages/runtime/src/loader.ts',
      'packages/runtime/src/main.ts',
      'packages/canon/src/skills/event-tap/**',
    ],
    refs: ['packages/runtime/src/ports/provisional-v9.ts'],
    static: [
      'packages/runtime/src/loader.ts',
      'packages/runtime/src/ports/provisional-v9.ts',
    ],
    blockedBy:
      'the capability anchor — event-tap vs tap vs neither — plus the provisional-v9 keyspace exemption',
  },

  // ── slice: schema-contract ─────────────────────────────────────────────
  't-worker-payload-seam-and-property-1': {
    slice: 'schema-contract',
    deps: ['t-anatomy-root-compose'],
    outputs: [
      'packages/schema/src/hook-cell.ts',
      'packages/canon/src/hooks/**',
      'packages/canon/src/toolkit/guardrail/**',
      'packages/canon/test/architecture.test.ts',
      'packages/canon/test/bin-name-single-home.test.ts',
      'packages/canon/test/reader-density.test.ts',
    ],
    refs: ['packages/runtime/src/bin-name.ts'],
    static: [
      'packages/canon/src/hooks/memory-consolidation-nudge.ts',
      'packages/canon/test/bin-name-single-home.test.ts',
      'ARCHITECTURE.md',
    ],
    blockedBy:
      'the seam by which a cell obtains a projection-owned value without importing the mechanism package — reshapes HookCell',
  },
  't-lifecycle-vocabulary': {
    slice: 'schema-contract',
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
    blockedBy:
      'ARCHITECTURE has no edge between schema and runtime in either direction; unifying needs one',
  },
  't-definiens-vs-residue': {
    slice: 'schema-contract',
    deps: ['t-worker-payload-seam-and-property-1'],
    outputs: [
      'packages/schema/src/rule-cell.ts',
      'packages/canon/test/hook-rule-boundary.test.ts',
    ],
    refs: ['packages/schema/src/hook-cell.ts'],
    static: [
      'packages/schema/src/rule-cell.ts',
      'packages/schema/src/hook-cell.ts',
      'MODEL.md',
    ],
    blockedBy:
      'disambiguating the field from the live ρ-class of the same name, which is a different referent',
  },
  't-rule-cell-body': {
    slice: 'schema-contract',
    deps: ['t-definiens-vs-residue'],
    outputs: ['packages/canon/src/rules/**'],
    refs: ['packages/schema/src/rule-cell.ts'],
    static: ['packages/schema/src/rule-cell.ts', 'MODEL.md'],
    blockedBy:
      'a mint for the payload concept — the thing a rule literally says',
  },
  't-accept-fifth-kind': {
    slice: 'schema-contract',
    deps: ['t-soul-to-target-in-forge'],
    outputs: ['packages/forge/src/validate/accept.ts', 'MODEL.md'],
    refs: ['packages/schema/src/hook-cell.ts'],
    static: ['packages/forge/src/validate/accept.ts', 'MODEL.md'],
    blockedBy:
      'the ground-conformance property is unstated: what makes a ground/source enumeration divergence a defect rather than a refinement',
  },

  // ── slice: signification ───────────────────────────────────────────────
  't-projection-file-anchor': {
    slice: 'signification',
    deps: ['t-soul-to-target-in-forge', 't-tap-anchor'],
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
    blockedBy:
      'the anchor for the harness-projection-surface concept; its one derivation leg returned `capabilities`, rejected on occupancy',
  },
  't-coined-classification': {
    slice: 'signification',
    deps: ['t-anatomy-root-compose'],
    outputs: ['packages/schema/src/index.ts'],
    refs: ['packages/canon/src/dimensions/**'],
    static: ['packages/schema/src/index.ts', 'packages/canon/src/anatomy.ts'],
    blockedBy: 'a mint, and occupancy against `open`, which may subsume it',
  },
  't-substrate-concept': {
    slice: 'signification',
    deps: ['t-manifest-file-basename'],
    outputs: ['packages/canon/src/skills/create-agent/**'],
    refs: ['packages/canon/src/dimensions/model/claude.ts'],
    static: [
      'packages/canon/src/skills/create-agent/skill.ts',
      'packages/schema/src/index.ts',
    ],
    blockedBy:
      'whether an instance-bound substrate concept exists distinct from the `model` dimension, and where it lives',
  },
  't-authoring-surface': {
    slice: 'signification',
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
    blockedBy:
      'what the canonical authoring surface IS — three live candidates and the cells describe none of them',
  },
  't-tool-class-vocabulary': {
    slice: 'signification',
    deps: ['t-worker-payload-seam-and-property-1', 't-lifecycle-vocabulary'],
    outputs: ['packages/schema/src/hook/index.ts'],
    refs: ['packages/canon/src/hooks/stance-guardrail-pre.ts'],
    static: [
      'packages/canon/src/hooks/stance-guardrail-pre.ts',
      'packages/schema/src/hook-cell.ts',
    ],
    blockedBy:
      'a canonical tool-class vocabulary does not exist, and which register owns `matcher` is unruled',
  },
  't-canon-soul': {
    slice: 'signification',
    deps: [
      't-shim-path-from-capability',
      't-substrate-concept',
      't-authoring-surface',
      't-projection-file-anchor',
    ],
    outputs: ['packages/canon/src/genus/**'],
    refs: ['packages/forge/src/core/anatomy-body.ts'],
    static: ['packages/canon/src/genus/founding-doctrine.ts'],
    blockedBy:
      "whether canon's own SOUL survives the metaphor ruling — it moves every projected agent",
  },

  // ── slice: ground-and-record ───────────────────────────────────────────
  't-ground-numbers-are-unmeasured': {
    slice: 'ground-and-record',
    deps: ['t-manifest-file-basename'],
    outputs: ['ARCHITECTURE.md'],
    refs: ['packages/canon/test/architecture.test.ts'],
    static: ['ARCHITECTURE.md', 'packages/canon/test/architecture.test.ts'],
  },
  't-config-dotfile-was-shipped-underived': {
    slice: 'ground-and-record',
    deps: [],
    outputs: ['packages/memory/src/node.ts', '.cratylus.config.example'],
    refs: ['packages/runtime/src/runtime-config.ts'],
    static: [
      'packages/memory/src/node.ts',
      'packages/runtime/src/runtime-config.ts',
    ],
    blockedBy:
      'whether the shipped name is ratified post-hoc or re-derived, and whether it is one concept with the runtime dotfile',
  },

  // ── slice: host-and-gates ──────────────────────────────────────────────
  'the-host-install-is-a-symlink-nobody-authored': {
    slice: 'host-and-gates',
    deps: ['t-soul-to-target-in-forge'],
    outputs: ['packages/invoke/**'],
    refs: ['packages/runtime/src/bin-name.ts'],
    static: ['packages/invoke/README.md', 'packages/runtime/src/bin-name.ts'],
  },
  'bin-name-gate-stops-at-the-language-boundary': {
    slice: 'host-and-gates',
    deps: ['t-worker-payload-seam-and-property-1'],
    outputs: ['packages/canon/test/bin-name-single-home.test.ts'],
    refs: ['packages/runtime/src/bin-name.ts'],
    static: ['packages/canon/test/bin-name-single-home.test.ts'],
  },
  'memory-nudge-is-flaky-under-the-full-verify': {
    slice: 'host-and-gates',
    deps: [
      't-manifest-file-basename',
      'the-host-install-is-a-symlink-nobody-authored',
    ],
    outputs: ['packages/canon/test/memory-nudge.test.ts'],
    refs: ['packages/invoke/src/bin.ts'],
    static: ['packages/canon/test/memory-nudge.test.ts'],
  },
  'elevate-installs-no-mechanism': {
    slice: 'host-and-gates',
    deps: ['t-anatomy-root-compose'],
    outputs: ['packages/canon/src/skills/carry-on/**'],
    refs: ['packages/canon/src/toolkit/plan-set.ts'],
    static: [
      'packages/canon/src/skills/carry-on/skill.ts',
      'packages/canon/src/hooks/stance-guardrail-pre.ts',
    ],
    blockedBy:
      'the terminus predicate a Stop hook can evaluate from plan state, and where the installed mechanism lives',
  },
};
