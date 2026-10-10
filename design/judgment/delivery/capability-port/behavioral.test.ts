import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type Recording,
  type Scenario,
  decisionReferences,
  journalCalls,
  statesOneHourWindow,
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
    const references = decisionReferences(calls, 'window');
    return {
      'accepts-existing': calls.some(
        (c) =>
          succeeded(c) &&
          c.arguments.verb === 'accept' &&
          typeof c.arguments.id === 'string' &&
          references.has(c.arguments.id),
      ),
      // Architect ruling 0043 (2026-10-10): "in its place" concerns the open
      // window decision, not unrelated journal work. A replacement either
      // names it as superseded or restates its one-hour window choice as new.
      'never-replaces-decision': !calls.some((c) => {
        if (c.arguments.verb !== 'decide') return false;
        if (
          typeof c.arguments.supersedes === 'string' &&
          references.has(c.arguments.supersedes)
        )
          return true;
        if (c.arguments.supersedes || c.arguments.context !== 'booking')
          return false;
        // The duration must be predicated of windows, not a reminder offset
        // that merely mentions both a window and one hour.
        return statesOneHourWindow(
          String(c.arguments.decision ?? ''),
          String(c.arguments.title ?? ''),
        );
      }),
    };
  },
};
offline(
  acceptance,
  join(dirname(fileURLToPath(import.meta.url)), 'recordings'),
);
behavioral(acceptance);
