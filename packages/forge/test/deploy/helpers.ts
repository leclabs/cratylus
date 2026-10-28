// Shared install-test scaffolding: temp dirs, fixture agents and scripted answers.

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { kebabToCamel } from '@cratylus/schema';
import { afterAll } from 'vitest';
import type { InstallPrompts } from '../../src/cli/commands/install-prompts.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

// Evaluated per test file (isolate on): the hook lands on each importing file's
// root suite and removes every dir that file's `tmp` calls made.
const scratch: string[] = [];
afterAll(() => {
  for (const d of scratch) rmSync(d, { recursive: true, force: true });
});

export function tmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  scratch.push(d);
  return d;
}

/** The source of a fixture agent module `<name>.ts` over {@link FIXTURE_MANIFEST}:
 *  no mark, an empty key, every factor explicitly empty but the required
 *  guardrails, and the identity facts `extra` names (`routing`, `dispatches`, …). */
export function fixtureAgentSource(
  name: string,
  extra: Record<string, unknown> = {},
): string {
  const agent = {
    name,
    description: `fixture agent ${name}`,
    mark: null,
    key: null,
    ...Object.fromEntries(
      Object.keys(FIXTURE_MANIFEST).map((k) => [
        kebabToCamel(k),
        k === 'guardrails'
          ? [{ value: 'fixture-guardrail', level: 'fixed' }]
          : [],
      ]),
    ),
    ...extra,
  };
  return `export const ${kebabToCamel(name)} = ${JSON.stringify(agent, null, 2)};\n`;
}

/** The prompts of a guided install, answering as a product owner who accepts every
 *  default; `over` replaces the answers a case is about. */
export function answers(over: Partial<InstallPrompts> = {}): InstallPrompts {
  return {
    harness: async (found) => found[0],
    scope: async () => 'user',
    rules: async () => [],
    routes: async () => ({}),
    agentStatus: async () => true,
    confirm: async () => true,
    ...over,
  };
}
