import { afterEach, describe, expect, it } from 'vitest';
import {
  candidateSource,
  consumer,
  expectProjection,
  expectRefusal,
  vectorOf,
} from '../../../../packages/cli/test/catalog-recut/fixture.js';
import {
  body,
  camel,
  descriptions,
  entry,
  marks,
  personaVector,
  retired,
  roleVector,
  values,
} from '../../../../packages/cli/test/catalog-recut/master.js';

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
});
function fixture(source?: string, name?: string) {
  const f = consumer(source, name);
  cleanups.push(() => f.dispose());
  return f;
}

describe('catalog re-cut judgment', () => {
  it('case 1: a consumer persona over lead adds expertise, inherits everything else and owns its model role', () => {
    const residue = {
      name: 'production-lead',
      description: 'A lead with film-production expertise',
      mark: marks.kino,
      values: { expertise: [body('expertise', 'film-production')] },
    };
    const f = fixture(candidateSource('lead', residue), residue.name);
    const result = f.compose();
    expect(result.agent, result.message).toBeDefined();
    const expected = roleVector('lead');
    expected.expertise.push(entry('expertise', 'film-production'));
    expect(vectorOf(result.agent!)).toEqual(expected);
    expect(result.agent).toMatchObject({
      name: residue.name,
      description: residue.description,
      mark: residue.mark,
      holds: 'lead',
      key: null,
      routing: { tier: 'frontier', effort: 'high' },
      dispatches: ['builder', 'check-writer', 'assayer', 'researcher'],
    });
    f.install();
    const installed = f.declaration(residue.name, true);
    expectProjection(
      installed,
      residue.name,
      residue.description,
      expected,
      residue.mark.emoji,
    );
    expect(installed.front).toMatchObject({
      name: residue.name,
      mark: residue.mark.emoji,
      key: null,
      model: '@production-lead',
    });
    expect(typeof installed.front.spawns).toBe('string');
    expect(
      String(installed.front.spawns)
        .split(',')
        .map((name) => name.trim()),
    ).toEqual(['builder', 'check-writer', 'assayer', 'scout']);
    expect(installed.front).not.toHaveProperty('tools');
    expect(f.modelRoles()['production-lead']).toBe('@frontier:high');
  });

  it('case 2: shipped kino projects provenance-attribution rather than the architect rationale', () => {
    const f = fixture();
    f.projectCanon();
    const declaration = f.declaration('kino');
    expectProjection(
      declaration,
      'kino',
      descriptions.kino,
      personaVector('kino'),
      marks.kino.emoji,
    );
    expect(declaration.body).toContain(
      `- rationale: **provenance-attribution** — ${values['communication-style']['provenance-attribution']}`,
    );
    expect(declaration.body).not.toContain('**decision-rationale**');
  });

  it('case 3: every retired dimension in a consumer persona is refused and named in kebab case', () => {
    for (const dimension of retired) {
      const f = fixture(
        candidateSource('architect', {
          name: 'legacy-persona',
          description: 'A declaration using a retired factor',
          mark: marks.mav,
          values: { [camel(dimension)]: [body('guardrails', 'honesty')] },
        }),
        'legacy-persona',
      );
      expectRefusal(f.compose(), dimension);
    }
  });
});
