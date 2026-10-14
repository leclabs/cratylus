// ─────────────────────────────────────────────────────────────────────────────
// LIFECYCLE — the one way a lifecycle entry reaches the ledger:
// `cratylus lifecycle '<event-json>'`, called by the harness binding from the
// harness's own agent events, never offered to an agent as a tool and never a
// capability verb.
//
// The event is one JSON object: `kind` (`dispatched`, `returned`, `verdict`,
// `reported`), `transition` (an id the binding derives from the harness's own
// ids, so the same harness event delivered twice is refused), `cut`, and the
// fields of its kind:
//   dispatched  role, run, workPackage? (set for a builder)
//   returned    role, run, workPackage?, tokens? (a whole number)
//   verdict     assayer, run, verdicts [{workPackage, concept, passes,
//               evidence, finding?}], hardeningNotes []
//   reported    run, report (the lead's deliverable, an object)
// It is appended to the ledger of the repository holding the working
// directory, and only for a cut opened in that ledger (a `cut` entry of its
// name): an event naming no opened cut, the dispatch of work outside any cut
// (decision 0201(5)), writes nothing and is no failure, so the dispatch goes
// ahead unrecorded. An event of another shape, or a transition already
// recorded, is refused with nothing written and a non-zero exit.
// ─────────────────────────────────────────────────────────────────────────────

import { Command } from 'commander';
import { CLI_BIN } from '../bin-name.js';
import { topOf } from '../capabilities/work-package/git.js';
import {
  LIFECYCLE_KINDS,
  type LedgerDraft,
  type LedgerEntry,
  ledgerAt,
} from '../capabilities/work-package/ledger.js';

/** A lifecycle event as the ledger records it. */
export type LifecycleEvent = Extract<
  LedgerDraft,
  { kind: (typeof LIFECYCLE_KINDS)[number] }
>;

const refuse = (message: string) => new Error(`lifecycle: ${message}`);

/** `event` read as a lifecycle event; refuses any other shape, naming each
 *  missing or ill-typed field. */
export function lifecycleEvent(event: unknown): LifecycleEvent {
  if (typeof event !== 'object' || event === null || Array.isArray(event))
    throw refuse('the event is not a JSON object');
  const e = event as Record<string, unknown>;
  const wrong: string[] = [];
  const text = (field: string, optional = false) => {
    const value = e[field];
    if (value === undefined && optional) return;
    if (typeof value !== 'string' || value.trim() === '') wrong.push(field);
  };
  if (!LIFECYCLE_KINDS.some((k) => k === e.kind))
    throw refuse(
      `the event's kind is ${JSON.stringify(e.kind)}; give one of ${LIFECYCLE_KINDS.join(', ')}`,
    );
  text('transition');
  text('cut');
  text('run');
  switch (e.kind) {
    case 'dispatched':
    case 'returned':
      text('role');
      text('workPackage', true);
      if (
        e.kind === 'returned' &&
        e.tokens !== undefined &&
        !(Number.isInteger(e.tokens) && (e.tokens as number) >= 0)
      )
        wrong.push('tokens');
      break;
    case 'verdict':
      text('assayer');
      if (
        !Array.isArray(e.verdicts) ||
        e.verdicts.length === 0 ||
        !e.verdicts.every(
          (v: unknown) =>
            typeof v === 'object' &&
            v !== null &&
            typeof (v as Record<string, unknown>).workPackage === 'string' &&
            typeof (v as Record<string, unknown>).concept === 'string' &&
            typeof (v as Record<string, unknown>).passes === 'boolean' &&
            typeof (v as Record<string, unknown>).evidence === 'string' &&
            ['string', 'undefined'].includes(
              typeof (v as Record<string, unknown>).finding,
            ),
        )
      )
        wrong.push('verdicts');
      if (!Array.isArray(e.hardeningNotes)) wrong.push('hardeningNotes');
      break;
    case 'reported':
      if (
        typeof e.report !== 'object' ||
        e.report === null ||
        Array.isArray(e.report)
      )
        wrong.push('report');
      break;
  }
  if (wrong.length > 0)
    throw refuse(
      `the ${String(e.kind)} event is missing or mistypes: ${wrong.join(', ')}; nothing is written`,
    );
  return e as unknown as LifecycleEvent;
}

/** Append lifecycle `event` to the ledger of the repository holding `from`,
 *  answering the entry written; `undefined`, writing nothing, when the event
 *  names no cut opened in that ledger. Refused, writing nothing, for another
 *  shape or a repeated transition. */
export function appendLifecycle(
  from: string,
  event: unknown,
): (LifecycleEvent & Pick<LedgerEntry, 'id' | 'at'>) | undefined {
  const draft = lifecycleEvent(event);
  const top = topOf(from);
  if (top === undefined)
    throw refuse(
      `${from} is not inside a git repository; the ledger is kept in one`,
    );
  const ledger = ledgerAt(top, refuse);
  const opened = ledger
    .entries()
    .some((e) => e.kind === 'cut' && e.cut === draft.cut);
  return opened ? ledger.append(draft) : undefined;
}

/** `lifecycle '<event-json>'`: harness-facing, hidden from help, never a tool. */
export function lifecycleCommand(): Command {
  return new Command('lifecycle')
    .description(
      'Append one lifecycle entry from the harness’s own agent event to the ledger (harness-facing, never an agent tool)',
    )
    .argument('<event-json>', 'The event, one JSON object')
    .action((json: string) => {
      try {
        let event: unknown;
        try {
          event = JSON.parse(json);
        } catch {
          throw refuse('the event is not JSON');
        }
        const entry = appendLifecycle(process.cwd(), event);
        process.stdout.write(
          `${JSON.stringify(
            entry ?? {
              recorded: false,
              reason:
                'the event names no cut opened in the ledger; work outside a cut is not recorded',
            },
            null,
            2,
          )}\n`,
        );
        process.exitCode = 0;
      } catch (error) {
        process.stderr.write(
          `${CLI_BIN} ${error instanceof Error ? error.message : String(error)}\n`,
        );
        process.exitCode = 1;
      }
    });
}
