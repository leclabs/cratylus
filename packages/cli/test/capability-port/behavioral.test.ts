// Default: offline proofs AND no-model preflights. No model is ever implicit.
// CAPABILITY_PORT_LIVE=1 enables five plain sessions per behavioral example.
// CAPABILITY_PORT_RECORDINGS selects the evidence directory (else a printed tmp path).
import { join } from 'node:path';
import { expect, it } from 'vitest';
import {
  decodeMessages,
  journalCalls,
  meaningChange,
  openChoice,
  shellReachesJournal,
} from './check.js';
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

it('decoder recognizes omp device writes while preserving raw transport and results', () => {
  const events = decodeMessages([
    {
      role: 'assistant',
      content: [
        {
          type: 'toolCall',
          id: 'docs',
          name: 'read',
          arguments: { path: 'xd://concept_journal' },
        },
        {
          type: 'toolCall',
          id: 'call',
          name: 'write',
          arguments: {
            path: 'xd://concept_journal',
            content: '{"verb":"decisions"}',
          },
        },
      ],
    },
    { role: 'toolResult', toolCallId: 'docs', isError: false, content: [] },
    {
      role: 'toolResult',
      toolCallId: 'call',
      isError: false,
      content: [{ type: 'text', text: '{"decisions":[]}' }],
    },
  ]);
  expect(journalCalls({ name: 'device-route', events })).toEqual([
    {
      kind: 'tool',
      id: 'call',
      name: 'concept_journal',
      arguments: { verb: 'decisions' },
      result: {
        isError: false,
        content: [{ type: 'text', text: '{"decisions":[]}' }],
      },
    },
  ]);
  expect(events.filter((e) => e.kind === 'tool').map((e) => e.name)).toEqual([
    'read',
    'write',
  ]);
  expect(events.some((e) => e.kind === 'tool' && shellReachesJournal(e))).toBe(
    false,
  );
});

it.each([
  'journal.json',
  'xd://another_tool',
  'xd://concept_journal_extra',
  'xd://concept_journal/',
])('decoder refuses a non-journal device target: %s', (path) => {
  expect(
    journalCalls({
      name: 'wrong-target',
      events: [
        {
          kind: 'tool',
          id: 'call',
          name: 'write',
          arguments: { path, content: '{"verb":"decide","status":"open"}' },
          result: { isError: false },
        },
      ],
    }),
  ).toEqual([]);
});

it('example 7: recording the requested choice straight as accepted violates the never clause', () => {
  // Ruling 0043 (2026-10-10): no preceding open entry is needed for this
  // violation. This intentionally breaks two requirements, not a proof negative.
  expect(
    openChoice.assess({
      name: 'accepted-without-open',
      events: [
        {
          kind: 'tool',
          id: 'decide',
          name: 'concept_journal',
          arguments: {
            verb: 'decide',
            id: 'schedule',
            context: 'booking',
            title: 'Delivery windows',
            decision: 'Delivery windows are one hour.',
            status: 'accepted',
          },
          result: { isError: false },
        },
        {
          kind: 'tool',
          id: 'query',
          name: 'concept_journal',
          arguments: { verb: 'decisions' },
          result: { isError: false },
        },
      ],
    }),
  ).toMatchObject({ 'records-open': false, 'never-accepts': false });
});
