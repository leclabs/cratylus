import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import {
  argv,
  host,
  seedWindow,
  snapshot,
  success,
  toolJSON,
  toolText,
} from '../../../../packages/cli/test/capability-port/fixture.js';

it('held-out 1: unknown context preserves the journal and returns the runtime refusal', () => {
  const h = host();
  try {
    seedWindow(h);
    const before = snapshot(join(h.cwd, 'design/journal'));
    const args = {
      verb: 'define',
      concept: 'promise',
      context: 'absent',
      wording: 'A promised delivery.',
      reason: 'Record it.',
    };
    const command = h.command(['concepts', ...argv(args)]);
    expect(command.code).toBe(1);
    expect(command.stderr.trim().length).toBeGreaterThan(0);
    expect(snapshot(join(h.cwd, 'design/journal'))).toEqual(before);
    const call = h.call(args);
    expect(call.result.isError).toBe(true);
    expect(toolText(call.result)).toContain(command.stderr.trim());
    expect(snapshot(join(h.cwd, 'design/journal'))).toEqual(before);
  } finally {
    h.dispose();
  }
});
it('held-out 2: a session in a nested directory reaches the same project journal', () => {
  const h = host();
  try {
    seedWindow(h);
    const cwd = join(h.cwd, 'src', 'delivery');
    mkdirSync(cwd, { recursive: true });
    const command = JSON.parse(success(h.command(['concepts', 'state'], cwd)));
    expect(command).toEqual(h.concepts('state'));
    expect(JSON.stringify(command)).toContain('delivery window');
    expect(toolJSON(h.call({ verb: 'state' }, cwd).result)).toEqual(command);
  } finally {
    h.dispose();
  }
});
