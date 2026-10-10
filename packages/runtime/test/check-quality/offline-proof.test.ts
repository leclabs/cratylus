import { expect, it } from 'vitest';
import {
  type BehavioralCheck,
  type ProofRecordings,
  judgeBatch,
  proveOffline,
} from '../../src/index.js';

type Transcript = { text: string };
const totals: BehavioralCheck<Transcript> = {
  example: 'show the total as £12 and identify the currency as pounds',
  assertions: [
    { id: 'total', binds: ['show the total as £12'] },
    { id: 'currency', binds: ['identify the currency as pounds'] },
  ],
  judge: ({ text }) => ({
    total: /\b12\b|\btwelve\b/i.test(text),
    currency: /£|\bpounds\b/i.test(text),
  }),
};
const recordings: ProofRecordings<Transcript> = {
  golden: [
    { name: 'symbol', recording: { text: 'Your total is £12.' } },
    { name: 'words', recording: { text: 'Twelve pounds are due.' } },
  ],
  negative: [
    {
      name: 'wrong-total',
      recording: { text: '13 pounds are due.' },
      breaks: 'total',
    },
    {
      name: 'wrong-currency',
      recording: { text: '12 dollars are due.' },
      breaks: 'currency',
    },
  ],
};

it('example 1: two differently worded goldens and one-specific-way negatives prove offline', async () => {
  const result = await proveOffline(totals, recordings);
  expect(result).toMatchObject({ proven: true, findings: [] });
  for (const negative of recordings.negative) {
    const verdict = await totals.judge(negative.recording);
    expect(Object.keys(verdict).filter((id) => !verdict[id])).toEqual([
      negative.breaks,
    ]);
  }
});

it('example 2: rejecting a golden prevents freezing', async () => {
  const result = await proveOffline(
    {
      ...totals,
      judge: async (recording) => ({
        ...(await totals.judge(recording)),
        total: false,
      }),
    },
    recordings,
  );
  expect(result.proven).toBe(false);
  expect(result.findings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ kind: 'golden-rejected', assertion: 'total' }),
    ]),
  );
});

it('example 2: accepting a negative prevents freezing', async () => {
  const result = await proveOffline(
    { ...totals, judge: () => ({ total: true, currency: true }) },
    recordings,
  );
  expect(result.proven).toBe(false);
  expect(result.findings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: 'negative-accepted',
        recording: 'wrong-total',
      }),
    ]),
  );
});

it('example 3: a requirement never seen failing is not trusted', async () => {
  const result = await proveOffline(totals, {
    ...recordings,
    negative: recordings.negative.filter(
      (recording) => recording.breaks === 'total',
    ),
  });
  expect(result.proven).toBe(false);
  expect(result.findings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: 'never-seen-failing',
        assertion: 'currency',
      }),
    ]),
  );
});

it('example 4: correct judgments cannot rescue an assertion with no bound words', async () => {
  const result = await proveOffline(
    {
      ...totals,
      assertions: [{ id: 'total', binds: [] }, totals.assertions[1]!],
    },
    recordings,
  );
  expect(result.proven).toBe(false);
  expect(result.findings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ kind: 'unbound', assertion: 'total' }),
    ]),
  );
});

it('example 5: one literal acceptance wording binds what the example never fixed', async () => {
  const wording = 'Your request has been approved.';
  const result = await proveOffline<Transcript>(
    {
      example: 'tell the customer the request was accepted',
      assertions: [{ id: 'accepted', binds: [wording] }],
      judge: ({ text }) => ({ accepted: text === wording }),
    },
    {
      golden: [{ name: 'literal', recording: { text: wording } }],
      negative: [
        {
          name: 'also-accepted',
          recording: { text: 'We accepted your request.' },
          breaks: 'accepted',
        },
      ],
    },
  );
  expect(result.proven).toBe(false);
  expect(result.findings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: 'binds-unfixed',
        assertion: 'accepted',
        words: expect.arrayContaining([wording]),
      }),
    ]),
  );
});

it('example 6: an unnamed real host read defeats otherwise correct judging', async () => {
  const result = await proveOffline(
    {
      ...totals,
      judge: (recording) => {
        // Read the real setting, but do not make the result depend on its value.
        void process.env.HOME;
        return totals.judge(recording);
      },
    },
    recordings,
  );
  expect(result.proven).toBe(false);
  expect(result.findings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ kind: 'host-read', read: 'env:HOME' }),
    ]),
  );
});

it('example 6: a setting named by the example and declared by the check proves', async () => {
  const result = await proveOffline<Transcript>(
    {
      example: 'greet the operator by the name in their USER setting',
      assertions: [{ id: 'greeting', binds: ['greet the operator'] }],
      host: [{ read: 'env:USER', binds: ['USER setting'] }],
      judge: ({ text }) => {
        void process.env.USER;
        return { greeting: text === 'Hello, operator.' };
      },
    },
    {
      golden: [{ name: 'greeting', recording: { text: 'Hello, operator.' } }],
      negative: [
        { name: 'no-greeting', recording: { text: '' }, breaks: 'greeting' },
      ],
    },
  );
  expect(result).toMatchObject({ proven: true, findings: [] });
});

const batchCheck: BehavioralCheck<Transcript> = {
  example:
    'answer the question in at least four of five runs; never disclose the access secret',
  assertions: [
    {
      id: 'answer',
      binds: ['answer the question in at least four of five runs'],
    },
    { id: 'secret', binds: ['never disclose the access secret'], never: true },
  ],
  judge: ({ text }) => ({
    answer: text.includes('42'),
    secret: !text.includes('access-secret'),
  }),
};
for (const { name, texts, passed, answers, secrets } of [
  {
    name: 'four answers and one disclosure fail',
    texts: ['42', '42', '42', '42', 'access-secret'],
    passed: false,
    answers: 4,
    secrets: 4,
  },
  {
    name: 'four answers and no disclosure pass',
    texts: ['42', '42', '42', '42', 'I do not know'],
    passed: true,
    answers: 4,
    secrets: 5,
  },
  {
    name: 'three answers and no disclosure fail',
    texts: ['42', '42', '42', 'I do not know', 'No answer'],
    passed: false,
    answers: 3,
    secrets: 5,
  },
]) {
  it(`example 7: ${name}`, async () => {
    const result = await judgeBatch(
      batchCheck,
      texts.map((text) => ({ text })),
      { atLeast: 4, of: 5 },
    );
    expect(result.passed).toBe(passed);
    expect(result.assertions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'answer',
          never: false,
          held: answers,
          runs: 5,
          passed: answers >= 4,
        }),
        expect.objectContaining({
          id: 'secret',
          never: true,
          held: secrets,
          runs: 5,
          passed: secrets === 5,
        }),
      ]),
    );
  });
}
