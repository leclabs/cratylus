// A fixture GUARD: it binds the agents composing one autonomy value, and fires at a
// moment the claude adapter realizes (`turn.end`) and one it does not
// (`git.commit.post`), so the manifest's gate can be read for realized events only.

import type { HookCell } from '@cratylus/schema';

export const guard: HookCell = {
  id: 'fixture-guard',
  residue: 'a fixture guard',
  substrate: 'harness',
  binds: { dimension: 'autonomy', value: 'mission-command' },
  order: 0,
  events: ['turn.end', 'git.commit.post'],
  entry: 'guard.sh',
  timeout: 30,
  workers: [
    {
      filename: 'guard.sh',
      targetPath: 'test/adapters/fixtures-stance/hooks/guard.sh',
      content: '#!/bin/sh\nexit 0\n',
      executable: true,
    },
  ],
};
