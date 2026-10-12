import { describe, expect, it, vi } from 'vitest';
import {
  type Example,
  checkExample,
  createExampleLedger,
  createHeldOutSet,
} from '../src/index.js';

const visible = (check: Example['check']): Example => ({
  id: 'visible-1',
  concept: 'the agent notifies its peer',
  situation: 'a review is ready',
  trigger: 'review ready',
  outcome: 'notification is sent',
  check,
});

describe('example checks', () => {
  it('runs execution and checks the produced output assertion', async () => {
    const execute = vi.fn(async () => ({ status: 'ready', count: 2 }));
    const result = await checkExample(
      visible({
        kind: 'execution',
        execute,
        expect: { status: 'ready', count: 2 },
      }),
    );
    expect(execute).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ status: 'pass' });

    const output = await checkExample(
      visible({
        kind: 'output-assertion',
        path: 'count',
        operator: 'equals',
        value: 3,
        produce: async () => ({ count: 2 }),
      }),
    );
    expect(output).toMatchObject({
      status: 'fail',
      shortfall: expect.stringContaining('count'),
    });
  });

  it('refuses missing or vague outcomes before running a check', async () => {
    const execute = vi.fn();
    await expect(
      checkExample({
        ...visible({ kind: 'execution', execute, expect: undefined }),
        outcome: '',
      }),
    ).rejects.toThrow(/outcome/i);
    expect(execute).not.toHaveBeenCalled();
  });
  it('refuses execution checks without an explicit expected result', async () => {
    const execute = vi.fn(async () => undefined);
    const malformed = {
      ...visible({ kind: 'execution', execute, expect: undefined }),
      check: { kind: 'execution', execute },
    };
    await expect(
      Reflect.apply(checkExample, undefined, [malformed]),
    ).rejects.toThrow(/explicit expected result/);
    expect(execute).not.toHaveBeenCalled();
  });

  it('uses the rubric captured before the producer runs', async () => {
    const rubric = [
      {
        id: 'complete',
        points: 2,
        assertion: {
          kind: 'output-equals' as const,
          path: 'done',
          value: true,
        },
      },
    ];
    const example = visible({
      kind: 'rubric',
      rubric,
      produce: async () => {
        const criterion = rubric[0];
        if (!criterion) throw new Error('rubric criterion missing');
        Reflect.set(criterion, 'points', 99);
        return { done: true };
      },
    });
    const result = await checkExample(example);

    expect(result).toMatchObject({
      status: 'pass',
      score: 2,
      maxScore: 2,
      rubric: [{ id: 'complete', points: 2 }],
    });
    expect(rubric[0]?.points).toBe(99);
  });
});

describe('held-out judgment', () => {
  it('keeps cases private and reveals/replaces a failed case through judgment access', async () => {
    const secret = visible({
      kind: 'output-assertion',
      path: 'sent',
      operator: 'equals',
      value: true,
      produce: async () => ({ sent: false }),
    });
    const replacement = {
      ...visible({
        kind: 'execution',
        execute: async () => false,
        expect: true,
      }),
      id: 'replacement-1',
    };
    const baseline = {
      ...visible({
        kind: 'output-assertion',
        path: 'ready',
        operator: 'equals',
        value: true,
        produce: async () => ({ ready: true }),
      }),
      id: 'visible-baseline',
    };
    const set = createHeldOutSet([baseline], [secret]);
    const builder = set.builderAccess();
    expect('judgmentAccess' in builder).toBe(false);
    expect(builder.visible()).toContainEqual(baseline);
    const judgment = set.judgmentAccess();
    expect('builderAccess' in judgment).toBe(false);
    expect(() => judgment.revealFailure(secret.id)).toThrow(/not failed/);
    expect(builder.visible()).toContainEqual(baseline);
    const report = await judgment.judge();
    expect(JSON.stringify(report)).not.toContain(secret.trigger);
    expect(JSON.stringify(report)).not.toContain(secret.outcome);
    expect(JSON.stringify(report)).not.toContain(secret.situation);
    expect(report.results).toEqual([{ status: 'fail' }]);
    expect(report.failures).toEqual([
      { concept: secret.concept, shortfall: expect.any(String) },
    ]);
    expect(judgment.revealFailure(secret.id)).toEqual(secret);
    judgment.replaceRevealed(secret.id, replacement);
    expect(builder.visible()).toContainEqual(secret);
    expect(builder.visible()).toContainEqual(baseline);
    expect(() => judgment.revealFailure('replacement-1')).toThrow(/not failed/);
  });
});
describe('example freeze', () => {
  it('requires a red check and exposes no replacement or approval capability to builders', async () => {
    const passing = visible({
      kind: 'execution',
      execute: async () => true,
      expect: true,
    });
    const passingLedger = createExampleLedger([passing], 'architect');
    await expect(passingLedger.architect.confirm(passing.id)).rejects.toThrow(
      /fail/i,
    );

    const example = visible({
      kind: 'output-assertion',
      path: 'ready',
      operator: 'equals',
      value: true,
      produce: async () => ({ ready: false }),
    });
    const ledger = createExampleLedger([example], 'architect');
    const frozen = await ledger.architect.confirm(example.id);
    const builder = ledger.builder;
    expect('architect' in builder).toBe(false);
    expect('replaceExample' in builder).toBe(false);
    expect('approveChange' in builder).toBe(false);
    const view = builder.get(example.id);
    if (!view) throw new Error('The confirmed example should be visible.');
    expect(Object.isFrozen(view)).toBe(true);
    expect(Reflect.set(view, 'situation', 'changed')).toBe(false);
    expect(Reflect.set(builder, 'replaceExample', () => {})).toBe(false);
    expect(frozen.example.situation).toBe(example.situation);
  });

  it('freezes callback properties that can change a confirmed check', async () => {
    type MutableProducer = (() => Promise<{ ready: boolean }>) & {
      expected: boolean;
    };
    const produce = (async () => ({
      ready: produce.expected,
    })) as MutableProducer;
    produce.expected = false;
    const example = visible({
      kind: 'output-assertion',
      path: 'ready',
      operator: 'equals',
      value: true,
      produce,
    });
    const ledger = createExampleLedger([example], 'architect');
    await ledger.architect.confirm(example.id);
    const view = ledger.builder.get(example.id);
    if (!view || view.check.kind !== 'output-assertion')
      throw new Error('The confirmed check should be visible.');

    expect(Reflect.set(view.check.produce, 'expected', true)).toBe(false);
    expect(await ledger.builder.check(example.id)).toMatchObject({
      status: 'fail',
    });
  });

  it('accepts only architect-approved same-id changes and requires a new red result', async () => {
    const example = visible({
      kind: 'output-assertion',
      path: 'ready',
      operator: 'equals',
      value: true,
      produce: async () => ({ ready: false }),
    });
    const ledger = createExampleLedger([example], 'architect');
    const frozen = await ledger.architect.confirm(example.id);
    const forged = {
      example: { ...example, situation: 'forged same-id replacement' },
      history: [{ approvedBy: 'builder', reason: 'forged' }],
    };
    await expect(
      Reflect.apply(ledger.architect.refreeze, undefined, [forged]),
    ).rejects.toThrow(/approved by this architect/);

    const changed = ledger.architect.approveChange(
      example.id,
      'Clarify the expected behavior',
      { situation: 'updated' },
    );
    expect(changed.history[0]?.reason).toBe('Clarify the expected behavior');
    const refrozen = await ledger.architect.refreeze(changed);
    expect(refrozen.history).toEqual(changed.history);
    const passingChange = ledger.architect.approveChange(
      example.id,
      'The output is now correct',
      {
        check: {
          kind: 'output-assertion',
          path: 'ready',
          operator: 'equals',
          value: true,
          produce: async () => ({ ready: true }),
        },
      },
    );
    await expect(ledger.architect.refreeze(passingChange)).rejects.toThrow(
      /fail/i,
    );
    expect(ledger.builder.get(example.id)?.situation).toBe('updated');
    expect(frozen.example.id).toBe(example.id);
  });
});
