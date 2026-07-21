// The claude-code realization of the five activation modes — the adapter's
// `HarnessMechanismMap` consumed by the engine's `realize(mode, mechanisms)`.
// The `Record<ActivationMode, HarnessMechanism>` type forces ALL FIVE modes to be
// present: a missing mode is a COMPILE error, so this table is exhaustive by
// construction. It NAMES, per mode, where a projected cell lands in a `.claude/`
// tree — the same placements the deploy layer performs (agents/, skills/,
// settings.json + hooks/), lifted to a declared contract.

import type { HarnessMechanismMap } from '../../core/engine/boundary.js';

/** claude-code's realization of every `ActivationMode` → its `.claude/` mechanism. */
export const claudeMechanisms: HarnessMechanismMap = {
  // A dimension value-fragment has no artifact of its own — it inlines into the SOUL
  // of each agent that selects it (`agentBody` composes the `## Dimension` sections).
  'compose-only': {
    mode: 'compose-only',
    injection: 'compose',
    artifact: 'agents/<name>.md',
    note: "inlined into the composing agent's SOUL — no standalone file",
  },
  // An agent is its own identity artifact: the SOUL markdown.
  identity: {
    mode: 'identity',
    injection: 'file',
    artifact: 'agents/<name>.md',
    note: 'the agent SOUL (front-matter + composed dimension sections)',
  },
  // A rule activates at a directory scope — a nested `AGENTS.md` (project scope)
  // the harness loads for cells under that path.
  scope: {
    mode: 'scope',
    injection: 'file',
    artifact: '<dir>/AGENTS.md',
    note: 'a directory-scoped rule file the harness loads for that subtree',
  },
  // A skill is a `/trigger`-invoked unit: a `skills/<name>/` dir led by SKILL.md.
  trigger: {
    mode: 'trigger',
    injection: 'dir',
    artifact: 'skills/<name>/SKILL.md',
    note: 'a /trigger-invoked skill directory (SKILL.md + companion assets)',
  },
  // A hook is event-fired: its block MERGES into the host `settings.json` (never
  // clobbering permissions/env/sibling hooks) and its workers land under `hooks/<id>/`.
  event: {
    mode: 'event',
    injection: 'merge',
    artifact: 'settings.json#/hooks + hooks/<id>/',
    note: 'an event hook merged into settings.json, workers staged under hooks/<id>/',
  },
};
