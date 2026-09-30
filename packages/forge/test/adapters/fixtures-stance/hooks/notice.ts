// A fixture NOTICE: a cell that only has to fire. It binds no composition, so it is
// no guard and no stance manifest may ever list it.

import type { HookCell } from '@cratylus/schema';

export const notice: HookCell = {
  id: 'fixture-notice',
  residue: 'a fixture notice',
  substrate: 'harness',
  order: 1,
  events: ['session.start'],
  entry: 'notice.sh',
  workers: [
    {
      filename: 'notice.sh',
      targetPath: 'test/adapters/fixtures-stance/hooks/notice.sh',
      content: '#!/bin/sh\nexit 0\n',
      executable: true,
    },
  ],
};
