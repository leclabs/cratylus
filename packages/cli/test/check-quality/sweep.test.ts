import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  type BehavioralCheck,
  type ProofRecordings,
  proveOffline,
} from '@cratylus/runtime';
import { expect, it } from 'vitest';
import {
  meaningChange,
  openChoice,
  parseRecording as parseCapability,
} from '../capability-port/check.js';
import {
  type IsolationWiring,
  assessIsolation,
} from '../capability-port/isolation.js';
import {
  assessReservations,
  parseRecording as parseReservations,
} from '../concept-journal-reconstitution/check.js';
import { exampleWords, proofRecordings } from './fixtures.js';
import { reported } from './reported.js';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const reservationCheck: BehavioralCheck<
  Parameters<typeof assessReservations>[0]
> = {
  example: exampleWords(
    `${root}/design/examples/workflow/concept-journal.md`,
    10,
  ),
  assertions: [
    {
      id: 'journal-current-reservations',
      binds: ['it queries the journal', 'reads back fifteen minutes'],
    },
    { id: 'deposit-accepted', binds: ['the accepted deposit decision'] },
    // The frozen judge hard-codes the otherwise unnamed open decision to reminder.
    { id: 'reminder-open', binds: ['the still-open decision', 'reminder'] },
    { id: 'summary-outdated', binds: ['naming the summary as out of date'] },
    {
      id: 'never-act-before-readback',
      binds: ['never acts before reading back'],
      never: true,
    },
    {
      id: 'never-accept-open',
      binds: ['never treats the still-open decision as settled', 'reminder'],
      never: true,
    },
    {
      id: 'never-state-open-settled',
      binds: ['never treats the still-open decision as settled', 'reminder'],
      never: true,
    },
  ],
  judge: assessReservations,
};
const meaningCheck: BehavioralCheck<
  Parameters<typeof meaningChange.assess>[0]
> = {
  example: exampleWords(
    `${root}/design/examples/delivery/capability-port.md`,
    6,
  ),
  assertions: [
    {
      id: 'supersedes',
      binds: ['it supersedes the concept', 'delivery window', 'booking'],
    },
    { id: 'queries-design', binds: ['queries the design', 'booking'] },
    {
      id: 'queries-history',
      binds: ['and the history', 'delivery window', 'booking'],
    },
    // These judges forbid *any* retirement/definition, not just this concept.
    {
      id: 'never-retires',
      binds: ['never retires the concept', 'never retires any concept'],
      never: true,
    },
    {
      id: 'never-defines-replacement',
      binds: ['defines a new one in its place', 'never defines any concept'],
      never: true,
    },
  ],
  judge: meaningChange.assess,
};
const openCheck: BehavioralCheck<Parameters<typeof openChoice.assess>[0]> = {
  example: exampleWords(
    `${root}/design/examples/delivery/capability-port.md`,
    7,
  ),
  assertions: [
    { id: 'records-open', binds: ['records the decision as open'] },
    {
      id: 'queries-decisions',
      binds: ['queries the decisions through the tool'],
    },
    {
      id: 'never-accepts',
      binds: ['never accepts the decision', 'never accepts any decision'],
      never: true,
    },
    // An opaque shell command is rejected even without evidence of journal use.
    {
      id: 'never-shell-journal',
      binds: [
        'never reaches the journal through the shell instead',
        'never invokes an opaque shell command',
      ],
      never: true,
    },
  ],
  judge: openChoice.assess,
};

const cases = [
  {
    name: 'workflow/concept-journal/10',
    check: reservationCheck,
    recordings: proofRecordings(
      `${root}/packages/cli/test/concept-journal-reconstitution/recordings`,
      parseReservations,
      // Excluded: this existing target array breaks two assertions, not one.
      ['reminder-remains-accepted.json'],
    ),
  },
  {
    name: 'delivery/capability-port/6',
    check: meaningCheck,
    recordings: proofRecordings(
      `${root}/packages/cli/test/capability-port/recordings/example-6`,
      parseCapability,
    ),
  },
  {
    name: 'delivery/capability-port/7',
    check: openCheck,
    recordings: proofRecordings(
      `${root}/packages/cli/test/capability-port/recordings/example-7`,
      parseCapability,
    ),
  },
];
for (const { name, check, recordings } of cases) {
  it(`example 11: ${name} proves or its findings are reported for a ruling`, async () => {
    // The common event shape is sufficient for both unchanged assessors.
    const result = await proveOffline(
      check as BehavioralCheck<unknown>,
      recordings as ProofRecordings<unknown>,
    );
    if (result.proven) expect(result.findings).toEqual([]);
    else {
      expect(
        reported[name],
        JSON.stringify(result.findings, null, 2),
      ).toBeDefined();
      expect(result.findings).toEqual(reported[name]);
    }
  });
}

type IsolationRecording = {
  expectedTools: string[];
  wiring: IsolationWiring;
  failures: string[];
};
it('example 11: capability isolation recordings prove or their findings are reported', async () => {
  const directory = `${root}/packages/cli/test/capability-port/recordings/isolation`;
  const golden: IsolationRecording = JSON.parse(
    readFileSync(`${directory}/golden.json`, 'utf8'),
  );
  // Excluded: recalled-memory.json has failures [cratylus-only-in-tool-explanation,
  // no-memory-block], not a single target. Keep its classification explicit.
  const excluded: IsolationRecording = JSON.parse(
    readFileSync(`${directory}/recalled-memory.json`, 'utf8'),
  );
  expect(excluded.failures).toEqual([
    'cratylus-only-in-tool-explanation',
    'no-memory-block',
  ]);
  const check: BehavioralCheck<IsolationRecording> = {
    example: meaningCheck.example,
    assertions: [
      {
        id: 'only-requested-tools',
        binds: ['offered only the concept journal tool'],
      },
      {
        id: 'cratylus-only-in-tool-explanation',
        binds: [
          "without cratylus's documentation or skills",
          'cratylus occurs only in the tool explanation',
        ],
      },
      { id: 'no-memory-block', binds: ['no memory block'] },
      { id: 'memory-disabled', binds: ['memory backend is off and inactive'] },
    ],
    judge: (recording) =>
      assessIsolation(recording.wiring, recording.expectedTools),
  };
  const result = await proveOffline(check, {
    golden: [{ name: 'golden.json', recording: golden }],
    negative: [],
  });
  if (result.proven) expect(result.findings).toEqual([]);
  else {
    expect(
      reported['delivery/capability-port/isolation'],
      JSON.stringify(result.findings, null, 2),
    ).toBeDefined();
    expect(result.findings).toEqual(
      reported['delivery/capability-port/isolation'],
    );
  }
});
