/**
 * Story-test harness for the story library.
 *
 * Every test in test/stories/E<n>/ MUST be declared through `story` /
 * `story.tracked` — never bare `it`/`test` (enforced by coverage.test.ts).
 *
 * - `story(id, name, fn)` — the asserted (documented) behavior holds today.
 * - `story.tracked(id, name, fn)` — the asserted behavior is DOCUMENTED truth
 *   the library does not yet deliver. Implemented via vitest `it.fails`: the
 *   body runs and its failure is asserted, so the suite stays green while the
 *   gap exists, and the day the capability lands the test FAILS loudly —
 *   graduation is forced (flip to `story`, delete the TRACKED-FAILING.md row).
 *   This is not skip/todo: the assertions execute on every run.
 *
 * Fixture discipline: tmp dirs only (makeTmpDir); user-scope surfaces ONLY via
 * fakeHome() — never the real $HOME; never write inside the repo tree.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { it } from 'vitest';

import { EXCLUDED, STORY_IDS } from './registry.js';

export const TRACKED_TAG = '[TRACKED-FAILING]';

type TestBody = () => void | Promise<void>;

function assertKnown(id: string): void {
  if (!STORY_IDS.includes(id)) {
    throw new Error(`story id '${id}' is not in the registry`);
  }
  if (id in EXCLUDED) {
    throw new Error(
      `story '${id}' is excluded-by-marker (${EXCLUDED[id]}) — no test may reference it`,
    );
  }
}

interface StoryFn {
  (id: string, name: string, fn: TestBody, timeout?: number): void;
  /** Documented-truth test the library does not yet pass; see module docs. */
  tracked: (id: string, name: string, fn: TestBody, timeout?: number) => void;
}

export const story: StoryFn = (id, name, fn, timeout) => {
  assertKnown(id);
  it(`${id} · ${name}`, fn, timeout);
};

story.tracked = (id, name, fn, timeout) => {
  assertKnown(id);
  it.fails(`${id} · ${name} ${TRACKED_TAG}`, fn, timeout);
};

/** Fresh tmp dir; caller removes (rmSync recursive) in afterEach. */
export function makeTmpDir(prefix = 'af-stories-'): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

/**
 * Point $HOME (and USERPROFILE) at a fresh tmp dir so user-scope reads/writes
 * never touch the real home. os.homedir() honors $HOME on POSIX per call.
 */
export function fakeHome(): { home: string; restore: () => void } {
  const home = makeTmpDir('af-home-');
  const prevHome = process.env.HOME;
  const prevProfile = process.env.USERPROFILE;
  process.env.HOME = home;
  process.env.USERPROFILE = home;
  return {
    home,
    restore() {
      if (prevHome === undefined) Reflect.deleteProperty(process.env, 'HOME');
      else process.env.HOME = prevHome;
      if (prevProfile === undefined)
        Reflect.deleteProperty(process.env, 'USERPROFILE');
      else process.env.USERPROFILE = prevProfile;
      rmSync(home, { recursive: true, force: true });
    },
  };
}
