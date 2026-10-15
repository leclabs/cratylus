// ─────────────────────────────────────────────────────────────────────────────
// LIFECYCLE — the one way the harness's own agent events reach the ledger:
// `cratylus lifecycle '<event-json>'`, called by the harness binding, never
// offered to an agent as a tool and never a capability verb.
//
// The event is one JSON object: `kind`, then the fields of its kind:
//   dispatched  call (the harness's id of the dispatching call), agent (the
//               dispatched agent's id), role, story? and task? (what the
//               dispatch's assignment named)
//   returned    call, agent, tokens? (a whole number, when reported)
// It is appended to the ledger of the repository holding the working
// directory. A dispatch naming a story or a task not yet recorded records it
// in flight first. A dispatch naming neither is recorded for nothing and is no
// failure, and so is the return of a dispatch the ledger does not hold. An
// event of another shape, or one already recorded (by its call and agent), is
// refused with nothing written and a non-zero exit.
// ─────────────────────────────────────────────────────────────────────────────

import { Command } from 'commander';
import { CLI_BIN } from '../bin-name.js';
import { inFlightDrafts } from '../capabilities/ledger/dispatch.js';
import { topOf } from '../capabilities/ledger/git.js';
import {
  LIFECYCLE_KINDS,
  type LedgerDraft,
  type LedgerEntry,
  ledgerAt,
} from '../capabilities/ledger/store.js';

/** A lifecycle event as the ledger records it. */
export type LifecycleEvent = Extract<
  LedgerDraft,
  { kind: (typeof LIFECYCLE_KINDS)[number] }
>;

const refuse = (message: string) => new Error(`lifecycle: ${message}`);

/** `event` read as a lifecycle event, its transition made from its kind, call
 *  and agent; refuses any other shape, naming each missing or ill-typed
 *  field. */
export function lifecycleEvent(event: unknown): LifecycleEvent {
  if (typeof event !== 'object' || event === null || Array.isArray(event))
    throw refuse('the event is not a JSON object');
  const e = event as Record<string, unknown>;
  if (!LIFECYCLE_KINDS.some((k) => k === e.kind))
    throw refuse(
      `the event's kind is ${JSON.stringify(e.kind)}; give one of ${LIFECYCLE_KINDS.join(', ')}`,
    );
  const wrong: string[] = [];
  const text = (field: string, optional = false) => {
    const value = e[field];
    if (value === undefined && optional) return;
    if (typeof value !== 'string' || value.trim() === '') wrong.push(field);
  };
  text('call');
  text('agent');
  if (e.kind === 'dispatched') {
    text('role');
    text('story', true);
    text('task', true);
  } else if (
    e.tokens !== undefined &&
    !(Number.isInteger(e.tokens) && (e.tokens as number) >= 0)
  )
    wrong.push('tokens');
  if (wrong.length > 0)
    throw refuse(
      `the ${String(e.kind)} event is missing or mistypes: ${wrong.join(', ')}; nothing is written`,
    );
  const run = `${e.call}/${e.agent}`;
  return e.kind === 'dispatched'
    ? {
        kind: 'dispatched',
        transition: `dispatched:${run}`,
        call: e.call as string,
        agent: e.agent as string,
        role: e.role as string,
        ...(e.story === undefined ? {} : { story: e.story as string }),
        ...(e.task === undefined ? {} : { task: e.task as string }),
      }
    : {
        kind: 'returned',
        transition: `returned:${run}`,
        call: e.call as string,
        agent: e.agent as string,
        ...(e.tokens === undefined ? {} : { tokens: e.tokens as number }),
      };
}

/** Append lifecycle `event` to the ledger of the repository holding `from`,
 *  answering the entry written; `undefined`, writing nothing, for a dispatch
 *  naming no story or task, or the return of a dispatch the ledger does not
 *  hold. Refused, writing nothing, for another shape or a repeated event. */
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
  if (draft.kind === 'dispatched') {
    if (draft.story === undefined && draft.task === undefined) return;
    // Recording what it names and the dispatch itself is one append under the
    // ledger's lock: a story or task another dispatch recorded first counts as
    // recorded, and this dispatch is always written.
    return ledger
      .appendAfter((reading) => [
        ...inFlightDrafts(reading, draft, refuse),
        draft,
      ])
      .at(-1) as LifecycleEvent & Pick<LedgerEntry, 'id' | 'at'>;
  }
  const [written] = ledger.appendAfter((reading) =>
    reading.entries.some(
      (e) =>
        e.kind === 'dispatched' &&
        e.call === draft.call &&
        e.agent === draft.agent,
    )
      ? [draft]
      : [],
  );
  return written as
    | (LifecycleEvent & Pick<LedgerEntry, 'id' | 'at'>)
    | undefined;
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
                'the event names no story or task, or returns a dispatch the ledger does not hold; it is not recorded',
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
