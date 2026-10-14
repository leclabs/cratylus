import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { run } from '../../../../packages/cli/test/capability-port/fixture.js';
import {
  type Delivered,
  type Host,
  assertDelivered,
  deliveredPath,
  installed,
  putDocument,
  snapshot,
  success,
  views,
} from '../../../../packages/cli/test/workflow-delivery/fixture.js';

let h: Host | undefined;
beforeEach(() => {
  vi.stubEnv('CRATYLUS_INSTALLATION', undefined);
  h = installed();
  h.env.CRATYLUS_INSTALLATION = undefined;
});
afterEach(() => {
  h?.dispose();
  vi.unstubAllEnvs();
});

it('held-out delivery/1 — a release remains complete when its source checkout no longer exists', () => {
  const host = h!;
  const source = join(host.root, 'release-source');
  mkdirSync(source);
  success(run('git', ['init', '-q'], source, host.env));
  const append = (...args: string[]) =>
    JSON.parse(success(host.command(['concepts', ...args], source)));
  const first = append(
    'context',
    'workflow',
    '--subject',
    'Earlier subject.',
    '--relation',
    'Earlier relation.',
  );
  append(
    'context',
    'workflow',
    '--subject',
    'Release subject.',
    '--relation',
    'Release relation.',
    '--reason',
    'Release description.',
  );
  append(
    'define',
    'record',
    '--context',
    'workflow',
    '--wording',
    'The released record.',
    '--reason',
    'Initial.',
  );
  append(
    'define',
    'practice',
    '--context',
    'workflow',
    '--wording',
    'Earlier practice.',
    '--reason',
    'Initial.',
  );
  append(
    'supersede',
    'practice',
    '--context',
    'workflow',
    '--wording',
    'The released practice.',
    '--built-from',
    'record',
    '--reason',
    'Release meaning.',
  );
  append(
    'define',
    'obsolete',
    '--context',
    'workflow',
    '--wording',
    'Retired practice.',
    '--reason',
    'Initial.',
  );
  append(
    'retire',
    'obsolete',
    '--context',
    'workflow',
    '--reason',
    'Not released.',
  );
  const version = success(host.command(['--version'])).trim();
  const expected: Delivered = {
    origin: 'cratylus',
    version,
    context: 'workflow',
    identity: first.id,
    subject: 'Release subject.',
    relation: 'Release relation.',
    concepts: [
      {
        name: 'practice',
        wording: 'The released practice.',
        builtFrom: ['record'],
      },
      { name: 'record', wording: 'The released record.', builtFrom: [] },
    ],
  };
  // Invoke the public projection from the packed runtime, not workspace source.
  const project = () =>
    JSON.parse(
      success(
        run(
          process.execPath,
          [
            '--input-type=module',
            '--eval',
            'import { deliverContext } from "@cratylus/runtime"; console.log(JSON.stringify(deliverContext({ from: process.argv[1], context: "workflow", origin: "cratylus", version: process.argv[2] })));',
            source,
            version,
          ],
          host.prefix,
          host.env,
        ),
      ),
    ) as Delivered;
  const release = project();
  expect({
    ...release,
    concepts: [...release.concepts].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  }).toEqual(expected);
  putDocument(host, release);
  const bytes = readFileSync(deliveredPath(host), 'utf8');
  // There is now no source journal to locate, and no project journal to copy from.
  rmSync(source, { recursive: true, force: true });
  expect(existsSync(source)).toBe(false);
  expect(existsSync(join(host.cwd, 'design/journal'))).toBe(false);
  for (const verb of ['design', 'state', 'overview']) {
    // Opt-in stand-in: a reader that tries to project the source on every read.
    // The very same read assertions must reject it once the checkout is gone.
    if (process.env.WORKFLOW_DELIVERY_NEGATIVE_CONTROL === 'source-required')
      project();
    const answer = views(host, verb);
    expect(answer).toHaveLength(1);
    assertDelivered(answer[0], verb, expected);
  }
  expect(readFileSync(deliveredPath(host), 'utf8')).toBe(bytes);
  expect(snapshot(host.cwd)).toEqual({});
  expect(existsSync(join(host.cwd, 'design/journal'))).toBe(false);
});
