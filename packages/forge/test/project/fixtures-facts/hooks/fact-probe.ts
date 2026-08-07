// A FIXTURE hook cell whose only job is to name every projection fact and be
// projected. It exists so the pass-through from `opts.adapter` to the bytes a
// worker template resolves to can be convicted WITHOUT rendering the whole canon
// corpus: the property under test is the projector's, not the corpus's.
//
// It names EVERY member of `ProjectionFact`, so a fact added to the union and not
// bound by `projectionFacts()` fails here — `resolveWorker` throws on a name it
// cannot resolve — rather than on the day a real cell first asks for it.

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
