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
// The cell shapes are forge's type kernel (`@leclabs/agent-forge/anatomy`); this
// module is the composition root that NAMES the concrete cells and nothing more.
// It used to also LIFT them to the `Hook` IR here, which forced a command string to
// exist before any adapter was chosen — so every cell spelled out a claude path.
// The lift is the projector's, per adapter, from `HarnessAdapter.hookCommand`.

import type { HookCell } from '@leclabs/agent-forge/anatomy';
import { memoryConsolidationNudge } from '../hooks/memory-consolidation-nudge.js';
import { resumeAvailabilityNotice } from '../hooks/resume-availability-notice.js';
import { stanceGuardrailPre } from '../hooks/stance-guardrail-pre.js';
import { stanceGuardrail } from '../hooks/stance-guardrail.js';

/** The harness-substrate hook cells agent-forge projects into settings.json + hooks/<id>/. */
export const harnessHookCells: readonly HookCell[] = [
  stanceGuardrail,
  stanceGuardrailPre,
  memoryConsolidationNudge,
  resumeAvailabilityNotice,
];
