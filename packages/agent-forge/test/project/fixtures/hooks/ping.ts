// A minimal harness-substrate hook cell + one worker byte-anchor, so the fixture
// covers the settings.json + `hooks/<id>/<worker>` legs of the artifact tree.

import type { HookCell } from '../../../../src/anatomy/index.js';

export const ping: HookCell = {
  id: 'ping',
  residue: 'a fixture hook',
  substrate: 'harness',
  order: 10,
  events: ['session.start'],
  command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/ping/ping.sh',
  workers: [
    {
      filename: 'ping.sh',
      targetPath: 'test/project/fixtures/hooks/ping.sh',
      content: '#!/bin/sh\nexit 0\n',
      executable: true,
    },
  ],
};
