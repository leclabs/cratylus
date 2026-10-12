import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { fixture } from '../../agent-launch/fixture.js';
import { files } from '../../capability-port/fixture.js';
import {
  type Recording,
  type Scenario,
  assess,
  check,
  rubricPrompt,
} from '../../reconstitution/architect/check.js';
import { type HeldDrift, deliveredEvidence } from '../../rubric-delivered.js';
import { judgeRuns } from '../../rubric-judge.js';
import { type DeliveredProfile, profileChecks } from './profile.js';

const here = dirname(fileURLToPath(import.meta.url));
const load = <T>(path: string): T =>
  JSON.parse(readFileSync(join(here, path), 'utf8'));
const scenarios = load<Scenario[]>('scenarios.json');
const handback = scenarios.find((scenario) => scenario.ref === 'agents/13')!;
const profile = load<DeliveredProfile>('recordings/profile/golden.json');
const negativeProfiles = readdirSync(join(here, 'recordings/profile'))
  .filter((name) => name.startsWith('negative-'))
  .map((name) =>
    load<{ breaks: string; profile: DeliveredProfile }>(
      `recordings/profile/${name}`,
    ),
  );
const failed = (values: Record<string, boolean>) =>
  Object.keys(values).filter((id) => !values[id]);

function declaredBehaviorStillChecked(
  delivered: DeliveredProfile,
  scenario: Scenario,
  bad: Recording,
) {
  return (
    profileChecks(delivered)['no-handback'] &&
    scenario.clauses.some(
      (clause) => clause.id === 'never-owned-question' && clause.never,
    ) &&
    assess(scenario, bad)['never-owned-question'] === false
  );
}

// A source recording and its judged evidence are distinct: dropping the first
// reply or treating it as withheld is the broken work this predicate rejects.
function replyJudgmentHolds(
  source: Recording,
  evidence: { delivered: unknown[]; heldDrift: HeldDrift[] },
) {
  const replies = source.messages.filter(
    (message) =>
      message !== null &&
      typeof message === 'object' &&
      'role' in message &&
      message.role === 'assistant',
  );
  return (
    replies.every((reply) =>
      evidence.delivered.some(
        (item) => JSON.stringify(item) === JSON.stringify(reply),
      ),
    ) && evidence.heldDrift.length === 0
  );
}
function preActJudgmentHolds(evidence: {
  delivered: unknown[];
  heldDrift: HeldDrift[];
}) {
  return (
    evidence.heldDrift.length === 1 &&
    evidence.heldDrift[0]!.attempt === 'call' &&
    evidence.heldDrift[0]!.guard === 'descend' &&
    evidence.heldDrift[0]!.tool === 'write' &&
    !JSON.stringify(evidence.delivered).includes('attempt-change') &&
    JSON.stringify(evidence.delivered).includes('creative acceptance')
  );
}

describe('meaning-roles delivered declarations and judgments', () => {
  it('agents/25: installed own text states fixed values without a reply guard', () => {
    const f = fixture();
    try {
      const delivered = {
        declaration: readFileSync(
          join(f.home, '.cratylus/omp/agents/architect.md'),
          'utf8',
        ),
        extensions: files(join(f.home, '.cratylus/omp/extensions')).map(
          (path) => readFileSync(path, 'utf8'),
        ),
      };
      expect(failed(profileChecks(delivered))).toEqual([]);
    } finally {
      f.dispose();
    }
  });
  it('agents/25: every declaration clause has a failing negative, without host reads', () => {
    expect(failed(profileChecks(profile))).toEqual([]);
    expect(negativeProfiles.map((control) => control.breaks).sort()).toEqual(
      Object.keys(profileChecks(profile)).sort(),
    );
    for (const control of negativeProfiles)
      expect(failed(profileChecks(control.profile))).toEqual([control.breaks]);
  });
  it('agents/11: text alone or a correction cannot establish absence of hand-back', () => {
    const bad = load<Recording>('recordings/judgment/reply-corrected.json');
    expect(declaredBehaviorStillChecked(profile, handback, bad)).toBe(true);
    expect(
      declaredBehaviorStillChecked(
        profile,
        {
          ...handback,
          clauses: handback.clauses.filter((clause) => !clause.never),
        },
        bad,
      ),
    ).toBe(false);
    const reminder = structuredClone(bad);
    reminder.wiring.declaration += '\nNever hand back a decision.';
    expect(assess(handback, reminder)['never-owned-question']).toBe(false);
    expect(
      declaredBehaviorStillChecked(
        { ...profile, declaration: '' },
        handback,
        bad,
      ),
    ).toBe(false);
  });
  it('agents/26: first delivered hand-back survives a refusal and correction', async () => {
    const source = load<Recording>('recordings/judgment/reply-corrected.json');
    const evidence = deliveredEvidence(source.messages);
    expect(replyJudgmentHolds(source, evidence)).toBe(true);
    const prompt = rubricPrompt(handback, source);
    expect(prompt).toContain('You must choose.');
    expect(prompt).toContain('only the operator permits release');
    expect(prompt).toContain('Every reply shown is delivered');
    const good = load<Recording>('recordings/113/golden-1.json');
    const judged = (record: Recording) => ({
      ...record,
      judgment: {
        status: 'judged' as const,
        model: 'control/judge',
        attempts: [{}],
      },
      heldDrift: deliveredEvidence(record.messages).heldDrift,
    });
    const result = await judgeRuns(
      check(handback),
      [good, good, good, good, source].map(judged),
    );
    expect(result.passed).toBe(false);
    expect(
      result.assertions.find((item) => item.id === 'never-owned-question'),
    ).toMatchObject({ held: 4, runs: 5, passed: false });
    expect(result.heldDrift.total).toBe(0);
    const erased = load<Recording>('recordings/judgment/reply-erased.json');
    expect(replyJudgmentHolds(source, deliveredEvidence(erased.messages))).toBe(
      false,
    );
    expect(
      replyJudgmentHolds(source, {
        delivered: evidence.delivered,
        heldDrift: [
          { guard: 'hand-back', attempt: 'call', reason: 'Late reply refusal' },
        ],
      }),
    ).toBe(false);
  });
  it('agents/27: pre-act refusal is held drift, neither effective work nor text-only success', async () => {
    const source = load<Recording>('recordings/judgment/pre-act.json');
    const evidence = deliveredEvidence(source.messages);
    expect(preActJudgmentHolds(evidence)).toBe(true);
    expect(
      preActJudgmentHolds({ delivered: source.messages, heldDrift: [] }),
    ).toBe(false);
    expect(
      preActJudgmentHolds({ delivered: evidence.delivered, heldDrift: [] }),
    ).toBe(false);
    const judged = {
      ...source,
      heldDrift: evidence.heldDrift,
      judgment: {
        status: 'judged' as const,
        model: 'control/judge',
        attempts: [{}],
      },
    };
    const result = await judgeRuns(check(handback), Array(4).fill(judged));
    expect(result.heldDrift).toEqual({ total: 4, byGuard: { descend: 4 } });
    expect(result.runs.every((run) => run.heldDrift.total === 1)).toBe(true);
  });
  it.runIf(process.env.EXECUTION_RED === '1')(
    'agents/11 seen red: prose without the never-check is not enough',
    () => {
      expect(
        declaredBehaviorStillChecked(
          profile,
          { ...handback, clauses: [] },
          load('recordings/judgment/reply-corrected.json'),
        ),
      ).toBe(true);
    },
  );
  it.runIf(process.env.EXECUTION_RED === '1')(
    'agents/25 seen red: missing fixed own-text recording rule',
    () => {
      expect(
        failed(
          profileChecks(
            negativeProfiles.find(
              (control) => control.breaks === 'record-before-report',
            )!.profile,
          ),
        ),
      ).toEqual([]);
    },
  );
  it.runIf(process.env.EXECUTION_RED === '1')(
    'agents/26 seen red: correction erases the shown hand-back',
    () => {
      const source = load<Recording>(
        'recordings/judgment/reply-corrected.json',
      );
      expect(
        replyJudgmentHolds(
          source,
          deliveredEvidence(
            load<Recording>('recordings/judgment/reply-erased.json').messages,
          ),
        ),
      ).toBe(true);
    },
  );
  it.runIf(process.env.EXECUTION_RED === '1')(
    'agents/27 seen red: pre-act refusal lost from drift report',
    () => {
      const evidence = deliveredEvidence(
        load<Recording>('recordings/judgment/pre-act.json').messages,
      );
      expect(preActJudgmentHolds({ ...evidence, heldDrift: [] })).toBe(true);
    },
  );
});
