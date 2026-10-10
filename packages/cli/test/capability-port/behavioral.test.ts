// Default: offline proofs AND no-model preflights. No model is ever implicit.
// CAPABILITY_PORT_LIVE=1 enables five plain sessions per behavioral example.
// CAPABILITY_PORT_RECORDINGS selects the evidence directory (else a printed tmp path).
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { decodeMessages, meaningChange, openChoice } from './check.js';
import { here } from './fixture.js';
import { offline } from './offline.js';
import { behavioral } from './omp.js';

for (const scenario of [meaningChange, openChoice]) {
  offline(scenario, join(here, 'recordings', scenario.name));
  behavioral(scenario);
}
it('decoder reads the verb argument, matches results by id, and ignores reasoning', () => {
  expect(
    decodeMessages([
      {
        role: 'assistant',
        content: [
          { type: 'thinking', thinking: 'private' },
          { type: 'text', text: 'Before' },
          {
            type: 'toolCall',
            id: 'one',
            name: 'concept_journal',
            arguments: { verb: 'supersede' },
          },
        ],
      },
      {
        role: 'toolResult',
        toolCallId: 'one',
        content: [{ type: 'text', text: 'output' }],
        isError: false,
      },
    ]),
  ).toEqual([
    { kind: 'text', text: 'Before' },
    {
      kind: 'tool',
      id: 'one',
      name: 'concept_journal',
      arguments: { verb: 'supersede' },
      result: { isError: false, content: [{ type: 'text', text: 'output' }] },
    },
  ]);
});
