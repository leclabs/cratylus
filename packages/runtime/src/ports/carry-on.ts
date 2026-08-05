// ─────────────────────────────────────────────────────────────────────────────
// The carry-on capability PORT — a harness-neutral TURN-END GATE contract.
//
// A gate is the exact inverse of the {@link EventTapHost} tap: the tap observes and
// is forbidden to block, this one exists ONLY to block. What it may block on is
// narrow by contract — a predicate over PLAN STATE ON DISK — and this file is where
// that narrowness is stated, because it is the property the mechanism is for:
// its predecessor judged EMITTED TEXT and mis-fired on mid-turn narration that
// preceded further tool calls. Nothing behind this port reads a transcript, a
// message, or a turn's characters; the port has no channel by which it could.
//
// PURE INTERFACE — no implementation. Each runtime target (a claude host, a codex
// host, …) supplies exactly one realization; a runtime domain module codes against
// this port. The DECISION is not the host's: the host installs a command and takes
// it away again, and the command is what answers the question at turn end.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The refusal a gate installs: one command the harness runs when a turn tries to
 * end. Its STDOUT carries the verdict (the harness's own block/allow protocol), so
 * a fresh process answers the question every time and nothing is held in memory
 * between turns.
 */
export interface TurnGate {
  /** The command line the harness runs at turn end. */
  command: string;
}

/**
 * Whether a gate is currently attached, and the command it will run. Derived from
 * the target artifact rather than from process state, so `status` in a fresh
 * process reads the same truth an installing process wrote.
 */
export interface CarryOnStatus {
  attached: boolean;
  /** The installed gate command, when one is attached. */
  command?: string;
}

/**
 * Harness-neutral port: attach a turn-end refusal, read whether one is attached,
 * and detach it cleanly (zero residue — every foreign key and every foreign hook
 * entry in the target survives byte-untouched).
 *
 * The methods are BARE (`install`, not `installGate`): the receiver already carries
 * the sign, so re-spelling it in the member is stutter — the same reading
 * {@link EventTapHost} landed on.
 */
export interface CarryOnHost {
  install(gate: TurnGate): void;
  remove(): void;
  status(): CarryOnStatus;
}
