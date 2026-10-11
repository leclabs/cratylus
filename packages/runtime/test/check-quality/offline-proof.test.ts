import { expect, it } from 'vitest';
import {
  type BehavioralCheck,
  type Example,
  type ProofFinding,
  type ProofRecordings,
  createExampleLedger,
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

const acceptanceWording = 'Your request has been approved.';
const acceptanceExample = 'tell the customer the request was accepted';
const accepted: BehavioralCheck<Transcript> = {
  example: acceptanceExample,
  assertions: [{ id: 'accepted', binds: ['the request was accepted'] }],
  judge: ({ text }) => ({ accepted: /accepted|approved/i.test(text) }),
};
const acceptedRecordings: ProofRecordings<Transcript> = {
  golden: [
    { name: 'literal', recording: { text: 'the request was accepted' } },
    { name: 'paraphrase', recording: { text: acceptanceWording } },
  ],
  negative: [
    {
      name: 'rejected',
      recording: { text: 'Your request was rejected.' },
      breaks: 'accepted',
    },
  ],
};

type ProofCase = {
  name: string;
  check: BehavioralCheck<Transcript>;
  recordings: ProofRecordings<Transcript>;
  proven: boolean;
  finding?: Partial<ProofFinding>;
};
const proofCases: ProofCase[] = [
  {
    name: 'example 1: differently worded goldens and one-specific-way negatives',
    check: totals,
    recordings,
    proven: true,
  },
  {
    name: 'example 2: rejecting a golden',
    check: {
      ...totals,
      judge: async (recording) => ({
        ...(await totals.judge(recording)),
        total: false,
      }),
    },
    recordings,
    proven: false,
    finding: { kind: 'golden-rejected', assertion: 'total' },
  },
  {
    name: 'example 2: accepting a negative',
    check: { ...totals, judge: () => ({ total: true, currency: true }) },
    recordings,
    proven: false,
    finding: { kind: 'negative-accepted', recording: 'wrong-total' },
  },
  {
    name: 'example 3: a requirement never seen failing',
    check: totals,
    recordings: {
      ...recordings,
      negative: recordings.negative.filter(
        (recording) => recording.breaks === 'total',
      ),
    },
    proven: false,
    finding: { kind: 'never-seen-failing', assertion: 'currency' },
  },
  {
    name: 'example 4: correct judgments with no bound words',
    check: {
      ...totals,
      assertions: [{ id: 'total', binds: [] }, totals.assertions[1]!],
    },
    recordings,
    proven: false,
    finding: { kind: 'unbound', assertion: 'total' },
  },
  {
    name: 'example 5: binding literal wording the example never fixed',
    check: {
      example: acceptanceExample,
      assertions: [{ id: 'accepted', binds: [acceptanceWording] }],
      judge: ({ text }) => ({ accepted: text === acceptanceWording }),
    },
    recordings: {
      golden: [
        { name: 'literal', recording: { text: acceptanceWording } },
        {
          name: 'also-accepted',
          recording: { text: 'We accepted your request.' },
        },
      ],
      negative: [
        {
          name: 'also-accepted',
          recording: { text: 'We accepted your request.' },
          breaks: 'accepted',
        },
      ],
    },
    proven: false,
    finding: {
      kind: 'binds-unfixed',
      assertion: 'accepted',
      words: expect.arrayContaining([acceptanceWording]),
    },
  },
  {
    name: 'example 5: literal-only judging despite declaring the example words',
    check: {
      ...accepted,
      judge: ({ text }) => ({ accepted: text === 'the request was accepted' }),
    },
    recordings: acceptedRecordings,
    proven: false,
    finding: {
      kind: 'golden-rejected',
      assertion: 'accepted',
      recording: 'paraphrase',
    },
  },
  {
    name: 'example 5: no goldens means not proven',
    check: accepted,
    recordings: { ...acceptedRecordings, golden: [] },
    proven: false,
  },
  {
    name: 'example 5: identical golden recordings are not varied',
    check: accepted,
    recordings: {
      ...acceptedRecordings,
      golden: [
        { name: 'first', recording: { text: acceptanceWording } },
        { name: 'second', recording: { text: acceptanceWording } },
      ],
    },
    proven: false,
    finding: { kind: 'goldens-not-varied' },
  },
  {
    name: 'example 6: an unnamed real host read',
    check: {
      ...totals,
      judge: (recording) => {
        // Read the real setting, but do not make the result depend on its value.
        void process.env.HOME;
        return totals.judge(recording);
      },
    },
    recordings,
    proven: false,
    finding: { kind: 'host-read', read: 'env:HOME' },
  },
  {
    name: 'example 6: a setting named by the example and declared by the check',
    check: {
      example: 'greet the operator by the name in their USER setting',
      assertions: [{ id: 'greeting', binds: ['greet the operator'] }],
      host: [{ read: 'env:USER', binds: ['USER setting'] }],
      judge: ({ text }) => {
        void process.env.USER;
        return { greeting: /^(Hello|Welcome), operator\.$/.test(text) };
      },
    },
    recordings: {
      golden: [
        { name: 'hello', recording: { text: 'Hello, operator.' } },
        { name: 'welcome', recording: { text: 'Welcome, operator.' } },
      ],
      negative: [
        { name: 'no-greeting', recording: { text: '' }, breaks: 'greeting' },
      ],
    },
    proven: true,
  },
];

for (const { name, check, recordings, proven, finding } of proofCases) {
  it(`${name}: offline proof`, async () => {
    const result = await proveOffline(check, recordings);
    expect.soft(result.proven).toBe(proven);
    if (proven) expect(result.findings).toEqual([]);
    if (finding)
      expect(result.findings).toEqual(
        expect.arrayContaining([expect.objectContaining(finding)]),
      );
  });

  it(`${name}: ${proven ? 'may' : 'cannot'} be frozen without live runs`, async () => {
    let liveRuns = 0;
    const example: Example = {
      id: 'behavioral-example',
      concept: 'offline proof',
      situation: 'a behavioral check has golden and negative recordings',
      trigger: 'the architect confirms the example',
      outcome: check.example,
      check: {
        kind: 'behavioral',
        check,
        recordings,
        threshold: { atLeast: 1, of: 1 },
        runner: async () => {
          liveRuns += 1;
          return { text: '' };
        },
      },
    };
    const ledger = createExampleLedger([example], 'architect');
    if (proven) {
      await expect(ledger.architect.confirm(example.id)).resolves.toMatchObject(
        {
          example,
        },
      );
    } else {
      await expect(ledger.architect.confirm(example.id)).rejects.toThrow();
      expect(ledger.builder.get(example.id)).toEqual(example);
      // A rejected proof must not create a confirmed example.
      expect(() =>
        ledger.architect.approveChange(example.id, 'not frozen', {}),
      ).toThrow();
    }
    expect(liveRuns).toBe(0);
  });
}

it('example 1: each negative fails only the assertion it breaks', async () => {
  for (const negative of recordings.negative) {
    const verdict = await totals.judge(negative.recording);
    expect(Object.keys(verdict).filter((id) => !verdict[id])).toEqual([
      negative.breaks,
    ]);
  }
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
