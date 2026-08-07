// ─────────────────────────────────────────────────────────────────────────────
// The carry-on capability's VERB SURFACE — `carryOn <verb> [args]`.
//
//   elevate   install the turn-end gate, then PROVE it attached
//   revert    remove exactly what elevate installed, and stand the loop-position down
//   terminus  answer the question — the verb the installed gate itself runs
//   status    is a gate attached, and what does the plan set say right now
//
// WHY `elevate` VERIFIES. The defect this capability exists to close is an
// ASSERTION with no mechanism behind it: a skill said `loop-position :=
// out-of-the-loop` and installed nothing, so the elevation held exactly as far as a
// model's compliance with prose. An `elevate` that installed and returned would
// reproduce that defect one layer down — it would report an elevation whenever the
// write silently did nothing (an unwritable target, a host whose port is a stub, a
// settings file some other process rewrote underneath it). So `elevate` re-reads
// {@link CarryOnHost.status} FROM THE TARGET after installing and REFUSES —
// loudly, with no elevation reported — unless the gate is there. The only success
// path runs through an attached gate.
//
// WHY `elevate` ALSO REFUSES AT TERMINUS. Elevating into a terminal state installs a
// gate that would allow the very next stop; with nothing bound there is not even a
// plan for the elevation to be bound TO. Both are refusals rather than no-ops,
// because "I asserted autonomy over nothing" is the failure, not a corner case.
//
// THE ARG GRAMMAR IS THE CONFIGURATION CHANNEL. Every plan-vocabulary name reaches
// this package through flags (`--plan-root`, `--states`, `--completed`,
// `--frontier`, `--bound-marker`, `--ruling-owed-marker`) and the canonical
// turn-end event through `--event`. Nothing here defaults: the runtime depends on
// nothing and therefore knows no plan layout, and a bundled default would be the
// second home the event-tap vocabulary repair was fought over.
// ─────────────────────────────────────────────────────────────────────────────

import { CLI_BIN } from '../../bin-name.js';
import { parseArgs } from '../../dispatch.js';
import type { CarryOnHost } from '../../ports/carry-on.js';
import { type RuntimeConfig, loadRuntimeConfig } from '../../runtime-config.js';
import { CarryOnHostClaude } from './claude.js';
import {
  type Ground,
  type PlanLayout,
  type TerminusReadout,
  terminusOf,
} from './terminus.js';

/** The verbs the carry-on capability exposes. */
export type CarryOnVerb = 'elevate' | 'revert' | 'terminus' | 'status';

/**
 * A verb's outcome, discriminated by verb — the value the kernel serializes to
 * stdout. The `terminus` member is ALSO the harness's turn-end protocol payload:
 * `decision: 'block'` + `reason` is what refuses the stop, and its absence is what
 * allows it, so the gate needs no second serializer to speak to the harness.
 */
export type CarryOnResult =
  | { verb: 'elevate'; plan: string; gate: string; attached: true }
  | { verb: 'revert'; attached: false }
  | {
      verb: 'terminus';
      terminus: boolean;
      ground: Ground;
      plan?: string;
      detail: string;
      decision?: 'block';
      reason?: string;
    }
  | {
      verb: 'status';
      attached: boolean;
      gate?: string;
      plan?: string;
      ground?: Ground;
      detail?: string;
    };

const VERBS: ReadonlySet<string> = new Set([
  'elevate',
  'revert',
  'terminus',
  'status',
]);

/** POSIX single-quoting, so a path with a space survives the harness's shell. */
function quote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function unquote(value: string): string {
  return value.replace(/'\\''/g, `'`);
}

/**
 * The command the gate runs at turn end: this same capability, `terminus` verb,
 * carrying the layout it was elevated with. The layout travels IN the command
 * rather than being re-derived, so the gate process needs no config of its own and
 * `revert`/`status` can read the elevation's own terms back off the target.
 */
export function gateCommand(layout: PlanLayout): string {
  return [
    CLI_BIN,
    'carryOn',
    'terminus',
    '--plan-root',
    quote(layout.root),
    '--states',
    quote(layout.states.join(',')),
    '--completed',
    quote(layout.completed),
    '--frontier',
    quote(layout.frontier.join(',')),
    '--bound-marker',
    quote(layout.boundMarker),
    '--ruling-owed-marker',
    quote(layout.rulingOwedMarker),
  ].join(' ');
}

/** Read one `--flag 'value'` back out of a gate command (the inverse of `quote`). */
function flagOf(command: string, flag: string): string | undefined {
  const m = command.match(new RegExp(`--${flag} '((?:[^']|'\\\\'')*)'`));
  return m?.[1] === undefined ? undefined : unquote(m[1]);
}

/**
 * Recover the {@link PlanLayout} an installed gate carries — the inverse of
 * {@link gateCommand}. This is what lets `status` answer from the target alone: the
 * elevation's terms are on disk, not in a process that has long since exited.
 */
export function layoutFromCommand(command: string): PlanLayout | undefined {
  const root = flagOf(command, 'plan-root');
  const states = flagOf(command, 'states');
  const completed = flagOf(command, 'completed');
  const frontier = flagOf(command, 'frontier');
  const boundMarker = flagOf(command, 'bound-marker');
  const rulingOwedMarker = flagOf(command, 'ruling-owed-marker');
  if (
    root === undefined ||
    states === undefined ||
    completed === undefined ||
    frontier === undefined ||
    boundMarker === undefined ||
    rulingOwedMarker === undefined
  ) {
    return undefined;
  }
  return {
    root,
    states: states.split(',').filter(Boolean),
    completed,
    frontier: frontier.split(',').filter(Boolean),
    boundMarker,
    rulingOwedMarker,
  };
}

type Flags = Record<string, string | boolean>;

function str(flags: Flags, name: string): string | undefined {
  const v = flags[name];
  return typeof v === 'string' && v.trim() !== '' ? v : undefined;
}

/** The one message every missing-configuration refusal carries. */
function missing(flag: string): Error {
  const why =
    "the plan vocabulary is CANON's (`packages/canon/src/plan-states.ts`) and " +
    'reaches this capability as the projected invocation the `carry-on` cell carries. ' +
    'The runtime depends on nothing and holds no plan layout of its own, so there is ' +
    'nothing here to fall back to.';
  return new Error(`carry-on: --${flag} is required — ${why}`);
}

/** Build the layout from flags, refusing per-flag rather than half-configured. */
function layoutFromFlags(flags: Flags): PlanLayout {
  const root = str(flags, 'plan-root');
  if (root === undefined) throw missing('plan-root');
  const states = str(flags, 'states');
  if (states === undefined) throw missing('states');
  const completed = str(flags, 'completed');
  if (completed === undefined) throw missing('completed');
  const frontier = str(flags, 'frontier');
  if (frontier === undefined) throw missing('frontier');
  const boundMarker = str(flags, 'bound-marker');
  if (boundMarker === undefined) throw missing('bound-marker');
  const rulingOwedMarker = str(flags, 'ruling-owed-marker');
  if (rulingOwedMarker === undefined) throw missing('ruling-owed-marker');

  const stateList = states.split(',').filter(Boolean);
  if (!stateList.includes(completed)) {
    throw new Error(
      `carry-on: --completed '${completed}' is not one of --states [${stateList.join(', ')}]`,
    );
  }
  const frontierList = frontier.split(',').filter(Boolean);
  for (const s of frontierList) {
    if (!stateList.includes(s)) {
      throw new Error(
        `carry-on: --frontier names '${s}', which is not one of --states [${stateList.join(', ')}]`,
      );
    }
  }
  return {
    root,
    states: stateList,
    completed,
    frontier: frontierList,
    boundMarker,
    rulingOwedMarker,
  };
}

/**
 * This harness's own name for the canonical event named by `--event`, from the host
 * config the projection emitted. Absence REFUSES and names the fix: with no map a
 * gate would attach to a moment this harness never fires, and report success while
 * gating nothing — the silent-no-op failure this whole capability exists to end.
 */
function nativeTurnEnd(config: RuntimeConfig | null, event: string): string {
  const events = config?.events;
  if (events === undefined || events.vocabulary.length === 0) {
    throw new Error(
      'carry-on: this host has no lifecycle-event vocabulary — the corpus declares it and ' +
        '`cratylus deploy` emits it into the host runtime config ($AGENT_RUNTIME_CONFIG, ' +
        'else ~/.cratylus.json). Run a deploy for this harness; the runtime does not ' +
        'carry a vocabulary of its own.',
    );
  }
  if (!events.vocabulary.includes(event)) {
    throw new Error(
      `carry-on: unknown lifecycle event '${event}' — this host's vocabulary is [${events.vocabulary.join(', ')}]`,
    );
  }
  const native = events.native[event];
  if (native === undefined) {
    const why =
      'a gate on a moment that never arrives would report an elevation it does not enforce';
    throw new Error(
      `carry-on: '${event}' is a declared event this harness cannot fire (no native peer in the host config) — ${why}`,
    );
  }
  return native;
}

/** What a caller may inject in place of what this dispatcher would resolve itself. */
export interface CarryOnDispatchOpts {
  /** The port realization. Defaults to the claude one targeting `--settings`. */
  readonly host?: CarryOnHost;
  /** The host config. Defaults to the one on disk; injectable so a test drives the
   *  same path a host does rather than a second one. */
  readonly config?: RuntimeConfig | null;
}

/** The refusal an un-attached elevation raises — the acceptance criterion in code. */
function notAttached(): Error {
  return new Error(
    'carry-on elevate: REFUSING to report an elevation — the turn-end gate is not attached to the ' +
      'target after install. An elevation with no mechanism behind it is the defect this ' +
      'capability exists to close: it would hold exactly as far as compliance with prose. ' +
      'Check the target settings file is writable and re-run `elevate`.',
  );
}

/**
 * What a refusal tells the agent — and every on-disk act that would END it. A block
 * that named no exit is how a gate becomes a wedge: the agent must be able to read,
 * from the refusal alone, what to write so the next turn may close.
 */
const KEEP_GOING =
  'The elevation to out-of-the-loop persists across turns, so keep executing. The turn ' +
  'may end when the plan is done, when a ruling is owed and RECORDED (write the fork to ' +
  "the plan's `ruling-owed` marker and surface it), when the frontier is empty because " +
  'the cut is ill-formed, or when the operator stands the elevation down (`carryOn revert`).';

/** Render a readout as the harness's turn-end verdict + this capability's own record. */
function verdict(readout: TerminusReadout): CarryOnResult {
  const base = {
    verb: 'terminus' as const,
    terminus: readout.terminus,
    ground: readout.ground,
    detail: readout.detail,
    ...(readout.plan !== undefined ? { plan: readout.plan } : {}),
  };
  if (readout.terminus) return base;
  return {
    ...base,
    decision: 'block',
    reason: `carry-on: the bound plan is NOT at its terminus — ${readout.detail}. ${KEEP_GOING}`,
  };
}

/**
 * Route `carryOn <verb> [args]`. Every refusal throws with a message naming the
 * fix; nothing here returns a quiet no-op, because a quiet no-op is precisely how
 * an un-enforced elevation looks from the outside.
 */
export function dispatchCarryOn(
  argv: string[],
  opts: CarryOnDispatchOpts = {},
): CarryOnResult {
  const [verb, ...rest] = argv;
  if (verb === undefined || !VERBS.has(verb)) {
    throw new Error(
      `carry-on: unknown verb '${verb ?? ''}' (expected elevate|revert|terminus|status)`,
    );
  }
  const { flags } = parseArgs(rest);
  const settings = str(flags, 'settings');

  // The port is built only where it is needed, and `terminus` — the verb the gate
  // itself runs on every turn end — needs NO host at all: it reads plan files and
  // says what it found. That is the decomplection the predecessor never had.
  if (verb === 'terminus') {
    const layout =
      str(flags, 'plan-root') !== undefined
        ? layoutFromFlags(flags)
        : recoveredLayout(opts, settings);
    return verdict(terminusOf(layout));
  }

  // The native turn-end name is resolved ONLY for `elevate`, the one verb that
  // writes it. `revert` must lift a gate on a host whose config has since gone
  // missing — a mechanism you cannot remove without a config is a trap, not a gate.
  const host = (nativeEvent = ''): CarryOnHost =>
    opts.host ?? new CarryOnHostClaude(settings, nativeEvent);

  switch (verb as Exclude<CarryOnVerb, 'terminus'>) {
    case 'elevate': {
      const layout = layoutFromFlags(flags);
      const readout = terminusOf(layout);
      if (readout.terminus) {
        const why =
          'There is nothing to stay out of the loop FOR; bind a plan with live work first.';
        throw new Error(
          `carry-on elevate: REFUSING — the plan set is already at its terminus (${readout.ground}): ${readout.detail}. ${why}`,
        );
      }
      const event = str(flags, 'event');
      if (event === undefined) {
        throw new Error(
          'carry-on elevate: --event <lifecycle-event> is required — the cell names the ' +
            "turn-end moment in the CORPUS's vocabulary and this host maps it to its own " +
            'native word; the runtime signifies no moment itself.',
        );
      }
      const port = host(
        nativeTurnEnd(opts.config ?? loadRuntimeConfig(), event),
      );
      port.install({ command: gateCommand(layout) });
      // THE VERIFICATION. Read the target back; an elevation is reported only when
      // the gate is provably there.
      const after = port.status();
      if (!after.attached) throw notAttached();
      // `plan` is defined whenever `terminus` is false — the first disjunct IS
      // `unbound`, so a non-terminus readout always names the bound plan.
      if (readout.plan === undefined) {
        throw new Error(
          'carry-on elevate: a non-terminus readout named no plan — the terminus disjuncts are inconsistent',
        );
      }
      return {
        verb: 'elevate',
        plan: readout.plan,
        gate: after.command ?? gateCommand(layout),
        attached: true,
      };
    }
    case 'revert': {
      const port = host();
      port.remove();
      if (port.status().attached) {
        throw new Error(
          'carry-on revert: the gate is STILL attached after removal — the target was not ' +
            'written (unwritable file?), and reporting a revert here would leave a session ' +
            'gated by a mechanism nothing believes is there.',
        );
      }
      return { verb: 'revert', attached: false };
    }
    case 'status': {
      const st = host().status();
      if (!st.attached || st.command === undefined) {
        return { verb: 'status', attached: false };
      }
      const layout = layoutFromCommand(st.command);
      if (layout === undefined)
        return { verb: 'status', attached: true, gate: st.command };
      const readout = terminusOf(layout);
      return {
        verb: 'status',
        attached: true,
        gate: st.command,
        ground: readout.ground,
        detail: readout.detail,
        ...(readout.plan !== undefined ? { plan: readout.plan } : {}),
      };
    }
  }
}

/**
 * The layout of the gate already installed — what `terminus` uses when it is run
 * with no flags. Refuses rather than guessing: an un-elevated host has no elevation
 * whose terms could be recovered.
 */
function recoveredLayout(
  opts: CarryOnDispatchOpts,
  settings: string | undefined,
): PlanLayout {
  const port = opts.host ?? new CarryOnHostClaude(settings, '');
  const st = port.status();
  const layout =
    st.command === undefined ? undefined : layoutFromCommand(st.command);
  if (layout === undefined) {
    throw new Error(
      'carry-on terminus: no plan layout — pass --plan-root … (see `elevate`), or run this ' +
        'verb from an installed gate, whose command carries the layout it was elevated with.',
    );
  }
  return layout;
}
