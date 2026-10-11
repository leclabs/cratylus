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

it('held-out agents/1 — direct lead launch cannot bypass the missing-examples contract', async () => {
  f = bindingFixture();
  extension = await load(f, { role: 'lead' });
  const { examples: _omitted, ...incomplete } = brief;
  let refusal: unknown;
  try {
    const answer = await extension.fire('before_agent_start', {
      type: 'before_agent_start',
      prompt: assignment(incomplete),
      systemPrompt: ['The ordinary harness prompt.'],
    });
    if (answer?.block) refusal = answer.reason;
  } catch (error) {
    refusal = error;
  }
  expect(
    refusal,
    'same contract is checked on direct launch, not only task dispatch',
  ).toBeDefined();
  expect(String(refusal), 'missing input is named').toContain('examples');
  expect(String(refusal), 'the refused agent is named').toMatch(/lead/i);
});
