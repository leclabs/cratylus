// ─────────────────────────────────────────────────────────────────────────────
// THE CAPABILITY KEYSPACE — each capability declared once, with its scope.
//
// A capability is SESSION-SCOPED when its state belongs to one agent session,
// so an invocation that names no session is wrong rather than merely anonymous:
// `memory` binds every write to `$AGENT_SESSION_ID`, and a sessionless call
// mints a fresh session and leaves a lock held against a pid that has exited.
// The others name no session at all: `design`, `plan` and `note` are
// repository-scoped (attribution rides `--author`, the repository is the
// working directory), and `eventTap` and `heartbeat` read no session either.
// Census at this writing: `memory` is the only capability whose implementation
// reads a session id.
//
// A LEAF, like `bin-name`: the projector reads this to decide what a projected
// shim demands, and must not drag the loader's lineage in to learn it.
// ─────────────────────────────────────────────────────────────────────────────

/** Every capability, and whether its state belongs to one agent session. */
export const SESSION_SCOPED = {
  memory: true,
  eventTap: false,
  heartbeat: false,
  design: false,
  plan: false,
  note: false,
} as const satisfies Record<string, boolean>;

/** A capability name — the dispatch `<capability>`. */
export type Capability = keyof typeof SESSION_SCOPED;

/**
 * The capability keyspace, in declaration order — the dispatch `<capability>`
 * axis, one entry per capability port a `RuntimePlugin` may provide.
 */
export const CAPABILITIES = Object.keys(
  SESSION_SCOPED,
) as readonly Capability[];
