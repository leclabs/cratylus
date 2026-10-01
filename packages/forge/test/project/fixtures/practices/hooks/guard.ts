// A guard: binds any composed autonomy value, so it travels with the agents that compose one.
import type { HookCell } from '@cratylus/schema';

export const guard: HookCell = {
  id: 'guard',
  residue: 'a fixture hook: guard',
  substrate: 'harness',
  order: 10,
  events: ['turn.end'],
  binds: { dimension: 'autonomy' },
  entry: 'guard.sh',
  workers: [
    {
      filename: 'guard.sh',
      targetPath: 'test/project/fixtures/practices/hooks/guard.sh',
      content: '#!/bin/sh\nexit 0\n',
      executable: true,
    },
  ],
};
