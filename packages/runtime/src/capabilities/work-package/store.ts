// ─────────────────────────────────────────────────────────────────────────────
// The WORK PACKAGE STORE: one append-only log per cut, under the repository's
// git common directory, `<common>/cratylus/work-packages/<context>/<name>.jsonl`,
// so every worktree of the repository shares it and git never tracks it.
//
// Each line is one event as JSON. An appending verb writes exactly one event in
// one append, and nothing is ever rewritten; the cut's state is folded from the
// whole log on every call (`fold.ts`).
// ─────────────────────────────────────────────────────────────────────────────

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** The store's place, relative to the git common directory. */
export const STORE_DIR = 'cratylus/work-packages';

/** The fields of a work package a submission sets and an update replaces. */
export interface PackageFields {
  readonly outputs: readonly string[];
  readonly concepts: readonly string[];
  readonly dependsOn: readonly string[];
  readonly needs: readonly string[];
}

/** One commit a builder made as its package's. */
export interface CommitRecord {
  readonly sha: string;
  readonly message: string;
  readonly paths: readonly string[];
}

/** What an appending verb records, before the store stamps it. */
export type Draft =
  | ({ readonly type: 'submit'; readonly name: string } & PackageFields)
  | {
      readonly type: 'update';
      readonly name: string;
      readonly changes: Partial<PackageFields>;
    }
  | {
      readonly type: 'dispatch';
      readonly level: number;
      readonly packages: readonly string[];
    }
  | { readonly type: 'finish'; readonly name: string }
  | {
      readonly type: 'commit';
      readonly name: string;
      readonly commit: CommitRecord;
    }
  | { readonly type: 'check'; readonly failures: readonly string[] }
  | {
      readonly type: 'run';
      readonly role: string;
      readonly tokens: number | null;
    };

/** One event of the log: a draft and when it was appended. */
export type Event = Draft & { readonly at: string };

/** The log of one cut. */
export interface Store {
  /** Every event, in the order appended. */
  events(): readonly Event[];
  /** Append `draft` as one event, stamped with the time. */
  append(draft: Draft): Event;
}

/** The log of `cut`, `<context>/<name>`, under the git common directory
 *  `common`; `refuse` words a refusal as the calling verb's own. */
export function storeAt(
  common: string,
  cut: string,
  refuse: (message: string) => Error,
): Store {
  const path = join(common, STORE_DIR, `${cut}.jsonl`);
  return {
    events() {
      if (!existsSync(path)) return [];
      return readFileSync(path, 'utf8')
        .split('\n')
        .filter((line) => line !== '')
        .map((line, i) => {
          try {
            // Appended only by this module and never edited.
            const event: Event = JSON.parse(line);
            return event;
          } catch {
            throw refuse(`line ${i + 1} of ${path} is not an event`);
          }
        });
    },
    append(draft) {
      const event: Event = { ...draft, at: new Date().toISOString() };
      mkdirSync(dirname(path), { recursive: true });
      appendFileSync(path, `${JSON.stringify(event)}\n`);
      return event;
    },
  };
}
