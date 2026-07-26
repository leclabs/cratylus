// Shared deploy-layer types — the render-tree input and the placer reports.

import type { SkillCompanions } from './bundle.js';

/** The already-projected render tree the deploy layer consumes: a flat
 *  `agents/<name>.md` set + a `skills/<name>/` dir set (each with a SKILL.md
 *  plus any staged companions). The PROJECTION (agent-canon → claude adapter) writes
 *  this; deploy applies the scope accident to a host `.claude/` root. */
export interface RenderTree {
  // Absolute dir holding `<name>.md` agent defs.
  agentsDir: string;
  // Absolute dir holding `<name>/SKILL.md` skill dirs.
  skillsDir: string;
  // Per-skill committed `assets:` companion declarations, keyed by skill name.
  // Optional; a skill absent here ships exactly its already-present dir files.
  companions?: Record<string, SkillCompanions>;
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
  // Non-fatal warnings (missing def / SKILL.md / asset).
  warnings: string[];
  // The placer's TESTIMONY for the prune manifest: claudeDir-relative POSIX
  // paths written, grouped by name. This — and only this — is what a later
  // deploy may delete, so a placer must record every path it lays down and
  // nothing it merely touches. Populated in dry runs too, so a dry-run prune
  // reports the true deletion set.
  written: Record<string, string[]>;
  // Names whose source was MISSING (warned + skipped). Not a statement that the
  // name retired, so the prune carries their prior paths instead of sweeping.
  skipped: string[];
  // settings.json hook commands registered this run (`hooks` kind only) — the
  // registration half of the same testimony.
  registered: string[];
}

export function emptyReport(): PlaceReport {
  return {
    copied: 0,
    seeded: [],
    present: [],
    warnings: [],
    written: {},
    skipped: [],
    registered: [],
  };
}

/** A placer's result code: 0 landed (or dry-run) · 2 target unavailable. */
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
