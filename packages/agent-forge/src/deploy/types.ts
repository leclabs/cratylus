// Shared deploy-layer types — the render-tree input, placer reports, and the
// injectable IO seams that keep the ssh placer hermetically testable.

import type { SkillCompanions } from './bundle.js';

/** The already-projected render tree the deploy layer consumes: a flat
 *  `agents/<name>.md` set + a `skills/<name>/` dir set (each with a SKILL.md
 *  plus any staged companions). The PROJECTION (mind → claude adapter) writes
 *  this; deploy applies the scope accident to a host `.claude/` root. */
export interface RenderTree {
  // Absolute dir holding `<name>.md` agent defs.
  agentsDir: string;
  // Absolute dir holding `<name>/SKILL.md` skill dirs.
  skillsDir: string;
  // Per-skill companion declarations (bundle / assets), keyed by skill name.
  // Optional; a skill absent here ships exactly its already-present dir files.
  companions?: Record<string, SkillCompanions>;
  // Root the `bundle:` specs resolve against (Python: cells.ROOT). Required
  // only when some skill declares `bundle`.
  bundleBaseRoot?: string;
  // Dir holding the projected hooks fragment: `<hooksDir>/settings.json` (the
  // `{hooks}` block) + `<hooksDir>/hooks/<id>/<asset>` (worker scripts). Used
  // by the `hooks` deploy kind. Optional; absent ⇒ nothing to place.
  hooksDir?: string;
}

/** What a placer did for one agent/skill kind on one host. */
export interface PlaceReport {
  // Agent defs (or skills) copied — generated substance, overwritten freely.
  copied: number;
  // Sidecar layers freshly seeded (agent placer only): "<name>/<file>".
  seeded: string[];
  // Sidecar layers found present and left UNTOUCHED (never clobbered).
  present: string[];
  // Skill bundles staged this run: "<skill>/<basename>".
  bundled: string[];
  // Non-fatal warnings (missing def / SKILL.md / asset).
  warnings: string[];
}

export function emptyReport(): PlaceReport {
  return { copied: 0, seeded: [], present: [], bundled: [], warnings: [] };
}

/** A placer's result code, mirroring deploy.py's per-host rc:
 *  0 landed (or dry-run) · 2 unreachable-deferred. */
export interface PlaceResult {
  rc: 0 | 2;
  report: PlaceReport;
}

export type DeployKind = 'agent' | 'skill' | 'hooks';

export interface PlaceOpts {
  dry: boolean;
  log?: (line: string) => void;
  warn?: (line: string) => void;
}

// ── ssh IO seam ──────────────────────────────────────────────────────────
// The ssh placer shells out to `ssh`/`scp`. A `CommandRunner` injection point
// lets a hermetic test substitute a fake fleet (no real network) while the
// production default runs the real binaries.

export interface CommandResult {
  rc: number;
  out: string;
}

export type CommandRunner = (cmd: string[]) => CommandResult;
