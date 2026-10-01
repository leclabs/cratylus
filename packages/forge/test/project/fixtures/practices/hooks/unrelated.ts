// Neither plumbing nor a guard: no practice places it.
import type { HookCell } from '@cratylus/schema';

export const unrelated: HookCell = {
  id: 'unrelated',
  residue: 'a fixture hook: unrelated',
  substrate: 'harness',
  order: 10,
  events: ['session.start'],
  entry: 'unrelated.sh',
  workers: [
    {
      filename: 'unrelated.sh',
      targetPath: 'test/project/fixtures/practices/hooks/unrelated.sh',
      content: '#!/bin/sh\nexit 0\n',
      executable: true,
    },
  ],
};
