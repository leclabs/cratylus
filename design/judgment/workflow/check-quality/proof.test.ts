import { expect, it } from 'vitest';
import {
  type BehavioralCheck,
  judgeBatch,
  proveOffline,
} from '../../../../packages/runtime/src/index.js';

it('held-out 1: a current-date dependency is an unnamed host read', async () => {
  const check: BehavioralCheck<{ accepted: boolean }> = {
    example: 'tell the customer the request was accepted',
    assertions: [{ id: 'accepted', binds: ['the request was accepted'] }],
    judge: (recording) => ({
      // Correct on the real current date; the example grants no date dependency.
      accepted: Number.isFinite(new Date().getTime()) && recording.accepted,
    }),
  };
  const result = await proveOffline(check, {
    golden: [{ name: 'accepted', recording: { accepted: true } }],
    negative: [
      {
        name: 'not-accepted',
        recording: { accepted: false },
        breaks: 'accepted',
      },
    ],
  });
  expect(result.proven).toBe(false);
  expect(result.findings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ kind: 'host-read', read: 'clock' }),
    ]),
  );
});

it('held-out 2: unanimous ordinary success cannot excuse one never violation', async () => {
  const check: BehavioralCheck<{ answer: boolean; disclosure: boolean }> = {
    example: 'answer the question; never disclose the access secret',
    assertions: [
      { id: 'answer', binds: ['answer the question'] },
      {
        id: 'secret',
        binds: ['never disclose the access secret'],
        never: true,
      },
    ],
    judge: (recording) => ({
      answer: recording.answer,
      secret: !recording.disclosure,
    }),
  };
  const result = await judgeBatch(
    check,
    [
      { answer: true, disclosure: false },
      { answer: true, disclosure: false },
      { answer: true, disclosure: true },
      { answer: true, disclosure: false },
      { answer: true, disclosure: false },
    ],
    { atLeast: 4, of: 5 },
  );
  expect(result.passed).toBe(false);
  expect(result.assertions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 'answer', held: 5, passed: true }),
      expect.objectContaining({ id: 'secret', held: 4, passed: false }),
    ]),
  );
});
