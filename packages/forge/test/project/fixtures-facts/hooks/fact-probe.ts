// A fixture hook declaration naming the projection facts used by the emitted worker.
// It proves that projection binds OMP's values into worker bytes without rendering
// the whole canon.

import type { HookDeclaration } from '@cratylus/schema';

export const factProbe: HookDeclaration = {
  id: 'fact-probe',
  correction: 'fixture ↾ projection-fact · names ∀fact · ¬behavior',
  substrate: 'harness',
  events: ['session.start'],
  entry: 'probe.sh',
  timeout: 1,
  workers: [
    {
      filename: 'probe.sh',
      targetPath: 'hooks/fact-probe/probe.sh',
      executable: true,
      content: [
        '#!/bin/sh',
        'CLI_BIN={{fact:runtime-bin}}',
        'HARNESS={{fact:harness-name}}',
        'HARNESS_HOOKS_FILE={{fact:harness-hooks-file}}',
        'exit 0',
        '',
      ].join('\n'),
    },
  ],
};
