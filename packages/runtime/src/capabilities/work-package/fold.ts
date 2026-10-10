// ─────────────────────────────────────────────────────────────────────────────
// The STATE of a cut, folded from its log: its work packages in the order
// submitted, each with its fields and its state (`submitted`, `dispatched`,
// `finished`) and the commits made as its; its whole-check runs; its agent runs.
//
// Each whole-check run is the run of its own ROUND: run n closes round n, and
// any fixes before it belong to that round. A round RESOLVES the failures of
// the previous run absent from its own, and makes NO PROGRESS when the previous
// run had failures and it resolves none of them.
// ─────────────────────────────────────────────────────────────────────────────

import type { CommitRecord, Event, PackageFields } from './store.js';

/** Where a work package stands. */
export type PackageState = 'submitted' | 'dispatched' | 'finished';

/** A work package as its verbs answer it. */
export interface WorkPackage extends PackageFields {
  readonly name: string;
  readonly state: PackageState;
}

/** One round, closed by its whole-check run. */
export interface Round {
  readonly round: number;
  readonly wholeCheckRuns: 1;
  readonly failures: readonly string[];
  readonly resolved: readonly string[];
  readonly noProgress: boolean;
}

/** A cut's efficiency figures. */
export interface Figures {
  readonly agentRuns: {
    readonly total: number;
    readonly byRole: Readonly<Record<string, number>>;
  };
  readonly rounds: number;
  readonly wholeCheckRuns: number;
  readonly tokens: number | null;
  readonly noProgressRounds: readonly number[];
}

/** The cut's log folded. */
export class Folded {
  /** Each work package by name, in the order submitted. */
  readonly packages = new Map<string, WorkPackage>();
  /** The commits made as each package's, in the order made. */
  readonly histories = new Map<string, CommitRecord[]>();
  /** The failures of each whole-check run, in the order run. */
  readonly checks: (readonly string[])[] = [];
  /** Each agent run's role and tokens, in the order recorded. */
  readonly runs: { readonly role: string; readonly tokens: number | null }[] =
    [];

  constructor(events: readonly Event[]) {
    for (const event of events)
      switch (event.type) {
        case 'submit': {
          const { name, outputs, concepts, dependsOn, needs } = event;
          this.packages.set(name, {
            name,
            outputs,
            concepts,
            dependsOn,
            needs,
            state: 'submitted',
          });
          this.histories.set(name, []);
          break;
        }
        case 'update':
          this.change(event.name, event.changes);
          break;
        case 'dispatch':
          for (const name of event.packages)
            this.change(name, { state: 'dispatched' });
          break;
        case 'finish':
          this.change(event.name, { state: 'finished' });
          break;
        case 'commit':
          this.histories.get(event.name)?.push(event.commit);
          break;
        case 'check':
          this.checks.push(event.failures);
          break;
        case 'run':
          this.runs.push({ role: event.role, tokens: event.tokens });
          break;
      }
  }

  private change(name: string, changes: Partial<WorkPackage>): void {
    const current = this.packages.get(name);
    if (current !== undefined)
      this.packages.set(name, { ...current, ...changes });
  }

  /** Every round, one per whole-check run. */
  rounds(): Round[] {
    return this.checks.map((failures, i) => {
      const previous = this.checks[i - 1] ?? [];
      const resolved = previous.filter((f) => !failures.includes(f));
      return {
        round: i + 1,
        wholeCheckRuns: 1,
        failures,
        resolved,
        noProgress: previous.length > 0 && resolved.length === 0,
      };
    });
  }

  /** The cut's efficiency figures. */
  figures(): Figures {
    const byRole: Record<string, number> = {};
    for (const { role } of this.runs) byRole[role] = (byRole[role] ?? 0) + 1;
    const carried = this.runs.flatMap((r) =>
      r.tokens === null ? [] : [r.tokens],
    );
    return {
      agentRuns: { total: this.runs.length, byRole },
      rounds: this.checks.length,
      wholeCheckRuns: this.checks.length,
      tokens: carried.length === 0 ? null : carried.reduce((a, b) => a + b, 0),
      noProgressRounds: this.rounds()
        .filter((r) => r.noProgress)
        .map((r) => r.round),
    };
  }
}
