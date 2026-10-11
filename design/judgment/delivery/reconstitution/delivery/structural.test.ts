import { expect, it } from 'vitest';
import {
  type Explanation,
  checkToolExplanation,
  sentinelExplanation,
} from '../../../../../packages/cli/test/capability-port/explanation.js';
import {
  host,
  success,
} from '../../../../../packages/cli/test/capability-port/fixture.js';
import { replaceRuntime } from '../../../../../packages/cli/test/capability-port/replacement.js';

it('held-out delivery/1 — changed capability explanation reaches redelivery without a hand-rewritten adapter account', () => {
  const h = host();
  try {
    const original = h.concepts<Explanation>('--explain');
    const originalTool = h.offered(h.inspect());
    const changed = sentinelExplanation(original);
    replaceRuntime(h, changed);
    success(
      h.command([
        'install',
        '--harness',
        'omp',
        '--home',
        h.home,
        '--all',
        '--model-roles',
        'default',
      ]),
    );
    const delivered = h.offered(h.inspect());
    const observed =
      process.env.RECONSTITUTION_RED === '1' ? originalTool : delivered;
    checkToolExplanation(observed, changed, true);
    expect(
      observed.description,
      'no stale adapter-authored account survives',
    ).not.toContain(original.purpose);
    expect(
      observed.description,
      'accepted changed explanation reaches the harness',
    ).toContain(changed.purpose);
  } finally {
    h.dispose();
  }
});
