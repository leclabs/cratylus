import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type Recording,
  type Scenario,
  journalCalls,
  succeeded,
} from '../../../../packages/cli/test/capability-port/check.js';
import { offline } from '../../../../packages/cli/test/capability-port/offline.js';
import { behavioral } from '../../../../packages/cli/test/capability-port/omp.js';

const acceptance: Scenario = {
  name: 'held-out-3',
  seed: 'decision',
  tools: ['concept_journal'],
  prompt: "we've agreed on that decision, settle it",
  assess(recording: Recording) {
    const calls = journalCalls(recording);
    return {
      'accepts-existing': calls.some(
        (c) =>
          succeeded(c) &&
          c.arguments.verb === 'accept' &&
          c.arguments.id === 'window',
      ),
      'never-new-decision': !calls.some(
        (c) => c.arguments.verb === 'decide' && !c.arguments.supersedes,
      ),
      'never-superseding-decision': !calls.some(
        (c) => c.arguments.verb === 'decide' && !!c.arguments.supersedes,
      ),
    };
  },
};
offline(
  acceptance,
  join(dirname(fileURLToPath(import.meta.url)), 'recordings'),
);
behavioral(acceptance);
