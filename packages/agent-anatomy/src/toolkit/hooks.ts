// The agent-forge `Hook` deploy-IR + worker payloads, DERIVED from the first-class
// `hook` source cells (`src/hooks/*.ts`). The source of truth is now the cell:
// `hooks.ts` no longer hand-authors a `Hook` nor points at on-disk `.sh` assets —
// it lifts the harness-substrate cells into the agent-forge `Hook` IR the projector
// serializes into `.claude/settings.json` (claude adapter: `turn.end` → Stop,
// `subagent.end` → SubagentStop) and carries their VERBATIM worker payloads so the
// projector stages them under `hooks/<id>/` (no file copy — the bytes come from the
// cell). Only `harness`-substrate cells register in settings.json; a `git`-substrate
// cell (praxis-continuity) fires in git's process and is byte-locked but not
// serialized here.

import type { CanonicalEvent, Hook } from '@leclabs/agent-forge';
import { stanceGuardrail } from '../hooks/stance-guardrail.js';
import type { HookCell, HookWorker } from './hook-cell.js';

/** The harness-substrate hook cells agent-forge projects into settings.json + hooks/<id>/. */
export const harnessHookCells: readonly HookCell[] = [stanceGuardrail];

/**
 * Lift a harness-substrate hook cell into the agent-forge `Hook` deploy-IR. A
 * harness hook's events are all `CanonicalEvent` (the 28-event vendor-neutral
 * pivot); a `git`-substrate event (`vcs.commit.post`) has no canonical peer, so it
 * is rejected here — a git hook must not reach settings.json.
 */
export function hookIrOf(cell: HookCell): Hook {
  if (cell.substrate !== 'harness') {
    throw new Error(
      `hookIrOf: '${cell.id}' is substrate=${cell.substrate}; only harness hooks serialize to settings.json`,
    );
  }
  const events = cell.events as readonly CanonicalEvent[];
  return {
    id: cell.id,
    events: [...events] as [CanonicalEvent, ...CanonicalEvent[]],
    command: cell.command,
    ...(cell.matcher !== undefined ? { matcher: cell.matcher } : {}),
    ...(cell.timeout !== undefined ? { timeout: cell.timeout } : {}),
  };
}

/** One source-of-truth entry per harness hook: the `Hook` IR + its verbatim workers.
 *  The projector serializes `hook` into settings.json and writes each worker's
 *  `content` under `hooks/<hook.id>/` (byte-anchor — no on-disk copy). */
export interface HookSource {
  readonly hook: Hook;
  readonly workers: readonly HookWorker[];
}

export const hookSources: readonly HookSource[] = harnessHookCells.map(
  (cell) => ({ hook: hookIrOf(cell), workers: cell.workers }),
);
