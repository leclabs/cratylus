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
      // Architect ruling 0043 (2026-10-10): "in its place" concerns the open
      // window decision, not unrelated journal work. A replacement either
      // names it as superseded or restates its one-hour window choice as new.
      'never-replaces-decision': !calls.some((c) => {
        if (c.arguments.verb !== 'decide') return false;
        if (c.arguments.supersedes === 'window') return true;
        if (c.arguments.supersedes || c.arguments.context !== 'booking')
          return false;
        const choice = String(c.arguments.decision ?? '');
        const title = String(c.arguments.title ?? '');
        return (
          /\b(?:(?:one|1|an?)[ -]hour|(?:60|sixty)[ -]minutes?)\b/i.test(
            choice,
          ) &&
          (/\bwindows?\b/i.test(`${title} ${choice}`) ||
            /^(?:one|1|an?)[ -]hour[.!]?$/i.test(choice.trim()))
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
