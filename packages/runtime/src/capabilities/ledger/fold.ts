// ─────────────────────────────────────────────────────────────────────────────
// The LEDGER FOLD: what the ledger's entries make of the work, computed on
// every request and never stored.
//
// Each story and task is IN FLIGHT from the entry recording it (its verb's, or
// the one the first dispatch naming it wrote) until an `end` entry records how
// it ended, merged or dropped. Its COST is taken from what the harness saw: its
// agent runs, each dispatch naming it, in total and by the role dispatched (a
// task's runs also count toward its story, and a run naming both counts once
// toward each); the tokens its runs' returns reported, summed (`null` when none
// reported any); and its elapsed time, from the entry recording it to its end,
// or to now while it is in flight, read from the entries' own timestamps.
// ─────────────────────────────────────────────────────────────────────────────

import type { LedgerEntry, Outcome } from './store.js';

/** What one story or task cost. */
export interface Cost {
  readonly agentRuns: {
    readonly total: number;
    readonly byRole: Readonly<Record<string, number>>;
  };
  /** The tokens its runs reported, summed; `null` when none reported any. */
  readonly tokens: number | null;
  /** From the entry recording it to its end, or to now while in flight. */
  readonly elapsedSeconds: number;
}

/** How one story or task ended, and when. */
export interface Ending {
  readonly outcome: Outcome;
  readonly at: string;
}

/** A story as the ledger records it. */
export interface Story {
  readonly story: string;
  /** The bounded contexts it touches; absent, it touches every context. */
  readonly contexts?: readonly string[];
  readonly tasks: readonly string[];
  readonly recorded: string;
  readonly ended?: Ending;
  readonly cost: Cost;
}

/** A task as the ledger records it. */
export interface Task {
  readonly task: string;
  readonly story?: string;
  readonly recorded: string;
  readonly ended?: Ending;
  readonly cost: Cost;
}

/** The ledger's work: every story and task, in the order recorded. */
export interface Work {
  readonly stories: readonly Story[];
  readonly tasks: readonly Task[];
}

/** One run's dispatch, with the tokens its return reported. */
interface Run {
  readonly role: string;
  readonly toward: ReadonlySet<string>;
  tokens?: number;
}

/** The work `entries` record, its elapsed times measured to `now` for what is
 *  still in flight. */
export function foldWork(entries: readonly LedgerEntry[], now: number): Work {
  const stories = new Map<
    string,
    { contexts?: readonly string[]; recorded: string }
  >();
  const tasks = new Map<string, { story?: string; recorded: string }>();
  const ended = new Map<string, Ending>();
  const runs = new Map<string, Run>();
  for (const entry of entries)
    switch (entry.kind) {
      case 'story':
        stories.set(entry.story, {
          ...(entry.contexts === undefined ? {} : { contexts: entry.contexts }),
          recorded: entry.at,
        });
        break;
      case 'task':
        tasks.set(entry.task, {
          ...(entry.story === undefined ? {} : { story: entry.story }),
          recorded: entry.at,
        });
        break;
      case 'end':
        ended.set('story' in entry ? entry.story : entry.task, {
          outcome: entry.outcome,
          at: entry.at,
        });
        break;
      case 'dispatched': {
        const toward = new Set<string>();
        if (entry.story !== undefined) toward.add(entry.story);
        if (entry.task !== undefined) {
          toward.add(entry.task);
          const of = tasks.get(entry.task)?.story;
          if (of !== undefined) toward.add(of);
        }
        runs.set(`${entry.call}/${entry.agent}`, { role: entry.role, toward });
        break;
      }
      case 'returned': {
        const run = runs.get(`${entry.call}/${entry.agent}`);
        if (run !== undefined && entry.tokens !== undefined)
          run.tokens = (run.tokens ?? 0) + entry.tokens;
        break;
      }
    }

  const costOf = (name: string, recorded: string): Cost => {
    const byRole: Record<string, number> = {};
    let total = 0;
    let tokens: number | null = null;
    for (const run of runs.values()) {
      if (!run.toward.has(name)) continue;
      total++;
      byRole[run.role] = (byRole[run.role] ?? 0) + 1;
      if (run.tokens !== undefined) tokens = (tokens ?? 0) + run.tokens;
    }
    const end = ended.get(name);
    const until = end === undefined ? now : Date.parse(end.at);
    return {
      agentRuns: { total, byRole },
      tokens,
      elapsedSeconds: Math.max(
        0,
        Math.floor((until - Date.parse(recorded)) / 1000),
      ),
    };
  };
  const endOf = (name: string) => {
    const end = ended.get(name);
    return end === undefined ? {} : { ended: end };
  };

  return {
    stories: [...stories].map(([story, { contexts, recorded }]) => ({
      story,
      ...(contexts === undefined ? {} : { contexts }),
      tasks: [...tasks]
        .filter(([, t]) => t.story === story)
        .map(([task]) => task),
      recorded,
      ...endOf(story),
      cost: costOf(story, recorded),
    })),
    tasks: [...tasks].map(([task, { story, recorded }]) => ({
      task,
      ...(story === undefined ? {} : { story }),
      recorded,
      ...endOf(task),
      cost: costOf(task, recorded),
    })),
  };
}
