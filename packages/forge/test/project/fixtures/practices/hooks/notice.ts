// Plumbing: a session-wide notice that binds no agent.
import type { HookCell } from '@cratylus/schema';

export const notice: HookCell = {
  id: 'notice',
  residue: 'a fixture hook: notice',
  substrate: 'harness',
  order: 10,
  events: ['session.start'],
  entry: 'notice.sh',
  workers: [
    {
      filename: 'notice.sh',
      targetPath: 'test/project/fixtures/practices/hooks/notice.sh',
      content: '#!/bin/sh\nexit 0\n',
      executable: true,
    },
  ],
};
