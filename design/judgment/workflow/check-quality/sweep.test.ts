import { fileURLToPath } from 'node:url';
import {
  type BehavioralCheck,
  type ProofRecordings,
  proveOffline,
} from '@cratylus/runtime';
import { expect, it } from 'vitest';
import { parseRecording as parseCapability } from '../../../../packages/cli/test/capability-port/check.js';
import {
  exampleWords,
  proofRecordings,
} from '../../../../packages/cli/test/check-quality/fixtures.js';
import { reported } from '../../../../packages/cli/test/check-quality/reported.js';
import { parseRecording as parseReservations } from '../../../../packages/cli/test/concept-journal-reconstitution/check.js';
import { acceptance, retirementJudge } from './frozen-judges.js';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const retirementCheck: BehavioralCheck<Parameters<typeof retirementJudge>[0]> =
  {
    example: exampleWords(
      `${root}/design/judgment/workflow/concept-journal.md`,
      3,
    ),
    assertions: [
      {
        id: 'retirement-readback',
        binds: ['reads back that the concept is retired'],
      },
      {
        id: 'retirement-reason',
        binds: ['with its reason'],
      },
      {
        id: 'never-work-toward-retired',
        binds: ['does not work toward it'],
        never: true,
      },
    ],
    judge: retirementJudge,
  };
const acceptanceCheck: BehavioralCheck<
  Parameters<typeof acceptance.assess>[0]
> = {
  example: exampleWords(
    `${root}/design/judgment/delivery/capability-port.md`,
    3,
  ),
  assertions: [
    {
      id: 'accepts-existing',
      binds: ["records the decision's acceptance"],
    },
    {
      id: 'never-replaces-decision',
      binds: ['never records a new decision or a superseding one in its place'],
      never: true,
    },
  ],
  judge: acceptance.assess,
};
for (const { name, check, recordings } of [
  {
    name: 'held-out/workflow/concept-journal/3',
    check: retirementCheck,
    recordings: proofRecordings(
      `${root}/design/judgment/workflow/concept-journal/recordings/reconstitution`,
      parseReservations,
    ),
  },
  {
    name: 'held-out/delivery/capability-port/3',
    check: acceptanceCheck,
    recordings: proofRecordings(
      `${root}/design/judgment/delivery/capability-port/recordings`,
      parseCapability,
    ),
  },
]) {
  it(`example 11: ${name} proves or its findings are reported for a ruling`, async () => {
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
