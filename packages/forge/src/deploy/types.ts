// Shared deploy-layer types — the render-tree input and the placer reports.

import type { SkillCompanions } from './bundle.js';

/** The already-projected render tree the deploy layer consumes: a flat
 *  `agents/<name>.md` set + a `skills/<name>/` dir set (each with a SKILL.md
 *  plus any staged companions). The PROJECTION (canon → claude adapter) writes
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
  // The placer's TESTIMONY for the prune manifest: harnessDir-relative POSIX
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
  /**
   * The harness's agent-definition extension (`HarnessAdapter.agentExt`).
   * Defaults to `.md` for callers that predate it — a default, not an
   * assumption. A placer that guessed here placed zero codex agents and
   * reported success, because "no matching file" is indistinguishable from
   * "nothing to do".
   */
  agentExt?: string;
  /**
   * The harness's DESTINATION layout for one agent (`HarnessAdapter.agentRel`) —
   * harnessDir-relative, POSIX.
   *
   * Defaults to `agents/<name><agentExt>`, which is the render tree's own staging
   * layout and was until now assumed to be every harness's layout too. It is not:
   * omp reads a persona from `profiles/<name>/agent/APPEND_SYSTEM.md`. A placer
   * that cannot be told otherwise can only ever deploy harnesses shaped like the
   * projector.
   */
  agentRel?: (name: string) => string;
  /** The harness's hook-config filename (`HarnessAdapter.hooksFile`). */
  hooksFile?: string;
  log?: (line: string) => void;
  warn?: (line: string) => void;
}
