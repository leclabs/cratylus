// The agent-forge `Hook` deploy-IR + worker payloads, DERIVED from the first-class
// `hook` source cells (`src/hooks/*.ts`). The source of truth is the cell:
// `hooks.ts` no longer hand-authors a `Hook` nor points at on-disk `.sh` assets —
// it lifts the harness-substrate cells (via forge's doctrine-free `hookIrOf`) into
// the agent-forge `Hook` IR the projector serializes into `.claude/settings.json`
// (claude adapter: `turn.end` → Stop, `subagent.end` → SubagentStop) and carries
// their VERBATIM worker payloads so the projector stages them under `hooks/<id>/`
// (no file copy — the bytes come from the cell). Only `harness`-substrate cells
// register in settings.json; a `git`-substrate cell (praxis-continuity) fires in
// git's process and is byte-locked but not serialized here.
//
// The cell shapes (`HookCell`/`HookWorker`/`HookSource`) and the lift (`hookIrOf`)
// are forge's type kernel (`@leclabs/agent-forge/anatomy`); this module is the
// composition root that names the concrete harness cells and derives their IR.

import {
  type HookCell,
  type HookSource,
  hookIrOf,
} from '@leclabs/agent-forge/anatomy';
import { memoryConsolidationNudge } from '../hooks/memory-consolidation-nudge.js';
import { stanceGuardrailPre } from '../hooks/stance-guardrail-pre.js';
import { stanceGuardrail } from '../hooks/stance-guardrail.js';

/** The harness-substrate hook cells agent-forge projects into settings.json + hooks/<id>/. */
export const harnessHookCells: readonly HookCell[] = [
  stanceGuardrail,
  stanceGuardrailPre,
  memoryConsolidationNudge,
];

export const hookSources: readonly HookSource[] = harnessHookCells.map(
  (cell) => ({ hook: hookIrOf(cell), workers: cell.workers }),
);
