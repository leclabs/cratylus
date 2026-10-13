// A fixture hook cell naming the projection facts used by the emitted worker.
// It proves that projection binds OMP's values into worker bytes without rendering
// the whole canon corpus.

import type { HookCell } from '@cratylus/schema';

export const factProbe: HookCell = {
  id: 'fact-probe',
  residue: 'fixture ↾ projection-fact · names ∀fact · ¬behavior',
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
        'DEPLOY_BIN={{fact:deploy-bin}}',
        'HARNESS={{fact:harness-name}}',
        'HARNESS_HOOKS_FILE={{fact:harness-hooks-file}}',
        'DRIFT_RC={{fact:deploy-check-drift-code}}',
        'exit 0',
        '',
      ].join('\n'),
    },
  ],
};
