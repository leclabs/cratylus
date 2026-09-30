// The deploy layer — forge's placement stage. Consumes an
// already-projected render tree (agents/ + skills/) and applies the scope
// accident to the LOCAL `.claude/` root: ships the generated defs (Target,
// overwritten freely), stages skill-dir committed `assets:` companions, and
// scaffolds a greenfield project (`scaffoldProject`), and PRUNES what a prior
// deploy of the same tree left orphaned (`manifest.ts` — attribution by
// record, never by naming convention, because this root also holds artifacts
// that are not ours).
//
// The PROJECTION itself is forge's claude adapter; this layer consumes its
// output and places it locally. Reaching another machine is transport, not a
// stage — see `deploy.ts`'s stage-boundary note.

export {
  projectScope,
  type ScopeNote,
  type ScopeResult,
  userScope,
} from './scope.js';

export {
  type AssertShimsOpts,
  assertShimsResolvable,
  type ProbeRuntimeBinOpts,
  probeRuntimeBin,
  resetRuntimeBinProbe,
  type RuntimeBinProbe,
  runtimeBinRefusal,
  salientStderr,
  shimsSpawningRuntimeBin,
  type SkillCompanions,
  type StageAssetsOpts,
  stageAssets,
  walkSkillFiles,
  whichOnPath,
} from './bundle.js';

export {
  type DeployKind,
  emptyReport,
  type PlaceOpts,
  type PlaceReport,
  type PlaceResult,
  type RenderTree,
} from './types.js';

export {
  auditLocal,
  hostModelClaim,
  type ModelLine,
  type PlacedFileState,
  placedFileState,
  placeAgentsLocal,
  placeSkillsLocal,
  renderedFiles,
} from './local.js';

export {
  hookTreeNames,
  mergeHooksSettings,
  placeHooksLocal,
} from './hooks.js';

// The host runtime config — the only deploy target that lands OUTSIDE the harness
// home, because the runtime is harness-independent. ARCHITECTURE property 4's
// producer: everything corpus-specific reaches the runtime as configuration the
// projection emitted.
export {
  type EmitRuntimeConfigOpts,
  type EmitRuntimeConfigResult,
  type EmittedEvents,
  type EmittedHarness,
  type EmittedRuntimeConfig,
  emitRuntimeConfig,
  RUNTIME_CONFIG_ENV,
  RUNTIME_CONFIG_NAME,
  runtimeConfigDocument,
  runtimeConfigTarget,
  serializeRuntimeConfig,
} from './runtime-config.js';

export {
  applyPrune,
  adoptedHunk,
  type DeployManifest,
  digestFile,
  digestWritten,
  emptyManifest,
  hasManifest,
  type HostEdit,
  type HunkState,
  type HunkUndo,
  type KindRecord,
  type LineHunk,
  lineHunks,
  markMigratedConfig,
  MANIFEST_REL,
  MANIFEST_VERSION,
  nextDigests,
  nextKindRecord,
  noteHostEdit,
  readManifest,
  staleFiles,
  unattributable,
  undoHunks,
  recordsHostEdits,
  unregisterHookCommands,
  unregisterHookCommandsAt,
  writeManifest,
} from './manifest.js';

export {
  type DeployOpts,
  type DeploySingleOpts,
  type DeploySingleResult,
  type Scope,
  deploySingle,
  resolveNames,
  treeNames,
} from './deploy.js';

export {
  DEPLOY_CHECK_EXIT,
  type DeployCheckExit,
} from './check-exit.js';

export {
  DEFAULT_PROJECT_TEMPLATE,
  type ProjectTemplate,
} from './project-template.js';

export {
  DEFAULT_SUBJECT,
  type ScaffoldProjectOpts,
  type ScaffoldProjectResult,
  scaffoldProject,
} from './init.js';

// The host's `modelRoles` mapping: entries a held role needs, added by text
// insertion so every other byte of the host-owned config survives.
export {
  type AddModelRolesOpts,
  type AddModelRolesResult,
  addModelRoles,
  type ModelRoleEntry,
  modelRoleLine,
} from './model-roles.js';

// The persona commands: a command named after each installed persona, linked into the
// user's bin dir to the harness's launcher — never over anything this install did not
// place, and removed only as recorded.
export {
  describePersonaCommands,
  describePersonaRemoval,
  PERSONA_BIN_REL,
  type PersonaCommandsOpts,
  type PersonaCommandsReport,
  type PersonaLauncher,
  type PersonaLink,
  type PersonaLinkState,
  type PersonaRemoval,
  type PersonaRemovalReport,
  type PersonaRemovalState,
  personaLauncherOf,
  placePersonaCommands,
  planPersonaCommands,
  removePersonaCommands,
} from './persona-commands.js';

// The host's status line, where the persona badge becomes visible: Claude Code's one
// `settings.statusLine` command (set where the host has none, wrapped only on request,
// never replaced) and omp's `statusLine` layout (the `status` segment listed, under
// the `custom` preset that reads a list at all).
export {
  type BadgeStatusLineResult,
  type BadgeStatusLineState,
  type EnsureBadgeStatusLineOpts,
  type EnsureStatusSegmentOpts,
  ensureBadgeStatusLine,
  ensureStatusSegment,
  restoreHostStatusLine,
  type StatusLineRestore,
  type StatusSegmentResult,
  type StatusSegmentState,
} from './status-line.js';
