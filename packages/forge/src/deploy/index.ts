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

// The capability configuration install writes into the owned root, and the earlier
// layout's host config beside the harness home, which an upgrade or uninstall takes
// back while it is what was written.
export {
  capabilityConfiguration,
  runtimeConfigTarget,
  serializeRuntimeConfig,
  withoutRuntimeParts,
} from './runtime-config.js';

// The owned root: everything install places for a user on a harness, and the
// references the harness's own surfaces hold into it.
export {
  type DeliveredDocument,
  INSTALLATION_RECORD,
  type InstallationRecord,
  type OwnedReference,
  type PlaceRootResult,
  type RenderedFile,
  holdsRenderTree,
  linkOwnedRoot,
  ownedRootIn,
  placeOwnedRoot,
  readInstallationRecord,
  readRenderTree,
  rootFiles,
  unlinkOwnedRoot,
} from './owned-root.js';

// Where an installation is: for the user, or inside one project.
export {
  type InstallScope,
  type Placement,
  placementOf,
  projectOf,
} from './install-scope.js';

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
  MANIFEST_REL,
  MANIFEST_VERSION,
  nextDigests,
  nextKindRecord,
  mergeHostEdit,
  readManifest,
  recordedLines,
  type RuntimeConfigRecord,
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

// The host's `modelRoles` mapping: the entries agents' model roles need, added by text
// insertion so every other byte of the host-owned config survives.
export {
  type AddModelRolesOpts,
  type AddModelRolesResult,
  addModelRoles,
  type ModelRoleEntry,
  modelRoleLine,
} from './model-roles.js';

// The persona commands earlier installs linked into the user's bin dir, removed as
// recorded: install links none any more, and takes away what an earlier one placed.
export {
  type PersonaRemoval,
  type PersonaRemovalOpts,
  type PersonaRemovalReport,
  type PersonaRemovalState,
  removePersonaCommands,
} from './persona-commands.js';

// The host's status line, where an agent's name and mark become visible: Claude Code's
// one `settings.statusLine` command (set where the host has none; where it has one,
// install wraps that command so the badge prints before its output; never replaced) and
// omp's `statusLine` layout (the `status` segment listed, under the `custom` preset that
// reads a list at all).
export {
  type EnsureStatusSegmentOpts,
  ensureStatusSegment,
  hidesExtensionStatus,
  restoreHostStatusLine,
  type StatusLineRestore,
  type StatusSegmentResult,
  type StatusSegmentState,
} from './status-line.js';
