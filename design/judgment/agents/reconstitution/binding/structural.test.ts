import { afterEach, expect, it } from 'vitest';
import type { Fixture } from '../../../../../packages/cli/test/agent-launch/fixture.js';
import type { LoadedExtension } from '../../../../../packages/cli/test/reconstitution/binding/fixture.js';
import {
  assignment,
  bindingFixture,
  brief,
  load,
} from '../../../../../packages/cli/test/reconstitution/binding/fixture.js';

let f: Fixture | undefined;
let extension: LoadedExtension | undefined;
afterEach(() => {
  extension?.restore();
  f?.dispose();
});

it('held-out agents/1 — direct lead launch with missing examples is warned, naming them, and starts', async () => {
  f = bindingFixture();
  extension = await load(f, { role: 'lead' });
  const { examples: _omitted, ...incomplete } = brief;
  const answer = await extension.fire('before_agent_start', {
    type: 'before_agent_start',
    prompt: assignment(incomplete),
    systemPrompt: ['The ordinary harness prompt.'],
  });
  expect(answer?.block, 'the launch is never refused').not.toBe(true);
  const warned = extension.notices
    .filter((n) => n.level === 'warning')
    .map((n) => n.text)
    .join('\n');
  expect(warned, 'missing input is named').toContain('examples');
  expect(warned, 'the agent is named').toMatch(/lead/i);
});
