// A minimal harness-substrate hook declaration + one byte-exact worker, so the fixture
// covers OMP's session module + shared `hooks/<id>/<worker>` artifact legs.

import type { HookDeclaration } from '@cratylus/schema';

export const ping: HookDeclaration = {
  id: 'ping',
  correction: 'a fixture hook',
  substrate: 'harness',
  order: 10,
  events: ['session.start'],
  entry: 'ping.sh',
  workers: [
    {
      filename: 'ping.sh',
      targetPath: 'test/project/fixtures/hooks/ping.sh',
      content: '#!/bin/sh\nexit 0\n',
      executable: true,
    },
  ],
};
