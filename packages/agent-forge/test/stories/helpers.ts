/**
 * Story-test harness for the interop-hardening coverage wave.
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

import { aiderAdapter } from '../../src/adapters/aider/index.js';
import { ampAdapter } from '../../src/adapters/amp/index.js';
import { claudeAdapter } from '../../src/adapters/claude/index.js';
import { clineAdapter } from '../../src/adapters/cline/index.js';
import { codexAdapter } from '../../src/adapters/codex/index.js';
import { continueAdapter } from '../../src/adapters/continue/index.js';
import { copilotAdapter } from '../../src/adapters/copilot/index.js';
import { crushAdapter } from '../../src/adapters/crush/index.js';
import { cursorAdapter } from '../../src/adapters/cursor/index.js';
import { devinAdapter } from '../../src/adapters/devin/index.js';
import { geminiAdapter } from '../../src/adapters/gemini/index.js';
import { kiloAdapter } from '../../src/adapters/kilo/index.js';
import { opencodeAdapter } from '../../src/adapters/opencode/index.js';
import { piAdapter } from '../../src/adapters/pi/index.js';
import { standardsAdapter } from '../../src/adapters/standards/index.js';
import { zedAdapter } from '../../src/adapters/zed/index.js';
import type { Adapter } from '../../src/core/index.js';
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

/** All shipped adapters, id-sorted. */
export const ALL_ADAPTERS: Adapter[] = [
  aiderAdapter,
  ampAdapter,
  claudeAdapter,
  clineAdapter,
  codexAdapter,
  continueAdapter,
  copilotAdapter,
  crushAdapter,
  cursorAdapter,
  devinAdapter,
  geminiAdapter,
  kiloAdapter,
  opencodeAdapter,
  piAdapter,
  standardsAdapter,
  zedAdapter,
].sort((a, b) => a.id.localeCompare(b.id));

/**
 * Id → adapter, alias-inclusive: a renamed harness resolves through EITHER
 * its legacy id or its field-canonical id to the identical object (E10.S5;
 * `Adapter.status.{canonicalId,aliases}`).
 */
export const adapterById = new Map<string, Adapter>();
for (const a of ALL_ADAPTERS) {
  adapterById.set(a.id, a);
  if (a.status.canonicalId) adapterById.set(a.status.canonicalId, a);
  for (const alias of a.status.aliases ?? []) adapterById.set(alias, a);
}

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
