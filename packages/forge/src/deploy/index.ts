// The deploy layer — forge's placement stage, as `install` and `uninstall` use it.
// It places an already-projected render tree in an owned root the harness's own
// surfaces refer into, edits the host's own settings where the operator chose so, and
// takes back what an earlier installation recorded placing (`manifest.ts` —
// attribution by record, never by naming convention, because the harness's roots also
// hold artifacts that are not ours).
//
// The PROJECTION itself is forge's harness adapter; this layer consumes its output.

export { placedFileState } from './local.js';

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
  holdsRenderTree,
  linkOwnedRoot,
  ownedRootIn,
  placeOwnedRoot,
  readInstallationRecord,
  rootFiles,
} from './owned-root.js';

// Where an installation is: for the user, or inside one project.
export { placementOf, projectOf } from './install-scope.js';

// The record an earlier installation kept of what it placed and edited, by which an
// upgrade or uninstall takes it back.
export {
  applyPrune,
  type DeployManifest,
  type HostEdit,
  MANIFEST_REL,
  MANIFEST_VERSION,
  readManifest,
  recordsHostEdits,
  undoHunks,
  unregisterHookCommands,
} from './manifest.js';

// The host's `modelRoles` mapping: the entries agents' model roles need, added by text
// insertion so every other byte of the host-owned config survives.
export { addModelRoles } from './model-roles.js';

// The persona commands earlier installs linked into the user's bin dir, removed as
// recorded: install links none any more, and takes away what an earlier one placed.
export { removePersonaCommands } from './persona-commands.js';

// The host's status line, where an agent's name and mark become visible: Claude Code's
// one `settings.statusLine` command (set where the host has none; where it has one,
// install wraps that command so the badge prints before its output; never replaced) and
// omp's `statusLine` layout (the `status` segment listed, under the `custom` preset that
// reads a list at all).
export {
  ensureStatusSegment,
  hidesExtensionStatus,
  restoreHostStatusLine,
} from './status-line.js';
