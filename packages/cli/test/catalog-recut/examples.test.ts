import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  candidateSource,
  canon,
  composedRole,
  consumer,
  expectProjection,
  hostModelRoles,
  repo,
  vectorOf,
} from './fixture.js';
import type { Factor, PersonaName, RoleName } from './master.js';
import {
  agentNames,
  anchorOf,
  body,
  camel,
  descriptions,
  expectedBody,
  factorNames,
  factors,
  marks,
  personaResidue,
  personaVector,
  requireDefined,
  retired,
  roleNames,
  roleVector,
  valueFile,
  values,
} from './master.js';

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
});
function fixture(source?: string, name?: string) {
  const fixture = consumer(source, name);
  cleanups.push(() => fixture.dispose());
  return fixture;
}
function composedPersona(name: PersonaName) {
  expect(canon.persona, 'canon exports persona').toBeTypeOf('function');
  const residue = personaResidue(name);
  // The residue states values and slots; firmness must come from catalog defaults.
  const stated = Object.fromEntries(
    Object.entries(residue.values).map(([field, entries]) => [
      field,
      entries.map(({ level: _level, ...entry }) => entry),
    ]),
  );
  return canon.persona(canon.architectRole, { ...residue, values: stated });
}
const candidateIdentity = {
  name: 'candidate',
  description: 'A consumer architect',
  mark: marks.kino,
};

describe('catalog re-cut: the visible examples', () => {
  it('example 1: the catalog is exactly the eighteen ordered factors and their metadata', () => {
    expect(canon.MANIFEST, 'canon exports MANIFEST').toBeDefined();
    expect(Object.keys(canon.MANIFEST)).toEqual(factorNames);
    expect(canon.MANIFEST).toEqual(factors);
    for (const identity of ['name', 'description', 'mark', 'key'])
      expect(canon.MANIFEST).not.toHaveProperty(identity);
    for (const role of roleNames)
      expect(composedRole(role)).not.toHaveProperty('enforcementLevel');
  });

  it('example 2: all six generic holders have the complete role vectors and entry levels', () => {
    for (const name of roleNames) {
      const agent = composedRole(name);
      expect(vectorOf(agent), name).toEqual(roleVector(name));
      expect(agent).toMatchObject({
        name,
        description: descriptions[name],
        holds: name,
        mark: null,
        key: null,
      });
      const expected = roleVector(name);
      expect(agent.routing).toEqual({
        tier: anchorOf(
          requireDefined(expected.model?.[0], `${name}.model tier`).value,
        ),
        effort: anchorOf(
          requireDefined(expected.model?.[1], `${name}.model effort`).value,
        ),
      });
      expect(agent.readOnly, name).toBeUndefined();
    }
    // The shipped holders, not just calls to holder(), must carry the same vectors.
    const f = fixture();
    f.projectCanon();
    for (const name of roleNames)
      expectProjection(
        f.declaration(name),
        name,
        requireDefined(descriptions[name], `${name} description`),
        roleVector(name),
      );
  });

  it('example 3: nico replaces single coordinates, extends sets and inherits every other factor', () => {
    const agent = composedPersona('nico');
    expect(vectorOf(agent)).toEqual(personaVector('nico'));
    expect(agent).toMatchObject({
      name: 'nico',
      holds: 'architect',
      mark: marks.nico,
      key: null,
    });
    const f = fixture();
    f.projectCanon();
    expectProjection(
      f.declaration('nico'),
      'nico',
      requireDefined(descriptions.nico, 'nico description'),
      personaVector('nico'),
      marks.nico.emoji,
    );
  });

  it('example 4: kino and mav carry only their specified residue and their own marks', () => {
    const f = fixture();
    f.projectCanon();
    for (const name of ['kino', 'mav'] as const) {
      const agent = composedPersona(name);
      expect(vectorOf(agent), name).toEqual(personaVector(name));
      expect(agent).toMatchObject({
        name,
        holds: 'architect',
        mark: marks[name],
        key: null,
      });
      expectProjection(
        f.declaration(name),
        name,
        requireDefined(descriptions[name], `${name} description`),
        personaVector(name),
        marks[name].emoji,
      );
    }
  });

  it('example 5: consumer personas can narrow each reach ceiling, and a widened one composes as stated', () => {
    const narrowed = {
      ...candidateIdentity,
      removes: {
        perceptionScope: [
          body('perception-scope', 'held-out-examples'),
          body('perception-scope', 'outside-research'),
        ],
        actionScope: [body('action-scope', 'write-examples')],
      },
    };
    const f = fixture(candidateSource('architect', narrowed));
    const composed = f.compose();
    expect(composed.agent, composed.message).toBeDefined();
    const expected = roleVector('architect');
    expected.perceptionScope = requireDefined(
      expected.perceptionScope,
      'architect.perceptionScope',
    ).filter(
      // Reach values are never owned glosses: each is the master's text.
      (entry) =>
        !narrowed.removes.perceptionScope.includes(entry.value as string),
    );
    expected.actionScope = requireDefined(
      expected.actionScope,
      'architect.actionScope',
    ).filter(
      (entry) => !narrowed.removes.actionScope.includes(entry.value as string),
    );
    expect(vectorOf(composed.agent!)).toEqual(expected);
    f.install();
    const installed = f.declaration('candidate', true);
    expect(installed.front.spawns).toBe('*');
    // 0051: perception/action purpose does not invent premature tool restrictions.
    expect(installed.front).not.toHaveProperty('tools');
    expectProjection(
      installed,
      'candidate',
      narrowed.description,
      expected,
      narrowed.mark.emoji,
    );
    for (const [factor, anchor] of [
      ['perception-scope', 'work'],
      ['action-scope', 'edit-own-outputs'],
    ] as const) {
      const wider = fixture(
        candidateSource('architect', {
          ...candidateIdentity,
          values: { [camel(factor)]: [body(factor, anchor)] },
        }),
      );
      const composed = wider.compose();
      expect(
        composed.agent,
        `${factor} ${anchor}: ${composed.message}`,
      ).toBeDefined();
    }
  });

  it('example 6: a persona removing or weakening an architect guardrail composes, carrying what it states', () => {
    for (const guardrail of [
      'honesty',
      'scope-of-authority',
      'append-only',
      'no-implementation',
    ]) {
      for (const level of ['firm', 'advisory', null, 'remove'] as const) {
        const residue =
          level === 'remove'
            ? { removes: { guardrails: [body('guardrails', guardrail)] } }
            : {
                values: {
                  guardrails: [{ value: body('guardrails', guardrail), level }],
                },
              };
        const f = fixture(
          candidateSource('architect', { ...candidateIdentity, ...residue }),
        );
        const composed = f.compose();
        expect(
          composed.agent,
          `${guardrail} ${level}: ${composed.message}`,
        ).toBeDefined();
      }
    }
  });

  it('example 7: projected text presents identity and ordered explained values, never reach or model', () => {
    const f = fixture();
    f.projectCanon();
    for (const name of agentNames) {
      const persona = name in marks ? (name as PersonaName) : undefined;
      const vector = persona
        ? personaVector(persona)
        : roleVector(name as RoleName);
      expectProjection(
        f.declaration(name),
        name,
        requireDefined(descriptions[name], `${name} description`),
        vector,
        persona ? marks[persona].emoji : undefined,
      );
    }
  });

  it('example 8: omp settings retain default tools for every agent and never limit whom it dispatches', () => {
    const f = fixture();
    f.install();
    expect(f.names(true)).toEqual([...agentNames].sort());
    for (const name of agentNames) {
      const { front } = f.declaration(name, true);
      expect(front.spawns, name).toBe('*');
      expect(front, name).not.toHaveProperty('tools');
    }
  });

  it('example 9: each installed agent has its own tier-and-effort model role', () => {
    const f = fixture();
    f.install();
    expect
      .soft(f.modelRoles(), 'install preserves only the host’s own model roles')
      .toEqual(hostModelRoles);
    const expected = {
      architect: '@frontier:high',
      lead: '@frontier:high',
      builder: '@frontier:medium',
      assayer: '@frontier:xhigh',
      illustrator: '@frontier-other-family:high',
      'check-writer': '@frontier-other-family:high',
      kino: '@frontier:high',
      nico: '@frontier:high',
      mav: '@frontier:high',
    };
    for (const [name, selector] of Object.entries(expected)) {
      const { front } = f.declaration(name, true);
      expect.soft(front.model, name).toEqual([`@${name}`, selector]);
    }
  });

  it('example 10: retired dimensions and binder disappear and stopping rules belong to objective', () => {
    expect(canon.MANIFEST).toBeDefined();
    expect(Object.keys(canon.MANIFEST)).toEqual(factorNames);
    const directories = readdirSync(
      join(repo, 'packages/canon/src/dimensions'),
      { withFileTypes: true },
    )
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(directories).toEqual([...factorNames].sort());
    for (const name of agentNames) {
      const agent =
        name in marks
          ? composedPersona(name as PersonaName)
          : composedRole(name);
      for (const dimension of [...retired, 'satisficing']) {
        expect(agent).not.toHaveProperty(camel(dimension));
        expect(agent).not.toHaveProperty(dimension);
      }
      const expected =
        name in marks
          ? personaVector(name as PersonaName)
          : roleVector(name as RoleName);
      expect(vectorOf(agent)).toEqual(expected);
    }
    const f = fixture();
    f.projectCanon();
    expect(f.names()).toEqual([...agentNames].sort());
    for (const name of agentNames) {
      const { body: text } = f.declaration(name);
      for (const dimension of [...retired, 'satisficing'])
        expect(text).not.toMatch(new RegExp(`^### ${dimension}$`, 'm'));
      expect(text).not.toMatch(/\*\*binder\*\*/);
      expect(text).toMatch(/^- stopping-rule: \*\*(optimize|satisfice)\*\*/m);
    }
  });

  it('example 11: every catalog module has exactly its name and explanation under the decisions in force', async () => {
    for (const factor of factorNames) {
      const directory = join(repo, 'packages/canon/src/dimensions', factor);
      const expectedFiles = Object.keys(values[factor])
        .map((anchor) => `${valueFile(factor, anchor)}.ts`)
        .sort();
      expect(readdirSync(directory).sort(), factor).toEqual(expectedFiles);
      for (const anchor of Object.keys(values[factor])) {
        const file = valueFile(factor as Factor, anchor);
        // Runtime-selected catalog modules: every declared value, not a hand-picked subset.
        const module = await import(
          pathToFileURL(join(directory, `${file}.ts`)).href
        );
        expect(Object.keys(module), `${factor}/${file}`).toEqual([camel(file)]);
        const value = module[camel(file)];
        const text = typeof value === 'string' ? value : value.body;
        expect(text, `${factor}/${file}`).toEqual(
          expectedBody(factor as Factor, anchor),
        );
      }
    }
  });

  it('example 12: every installed identity reserves an explicitly empty key slot', () => {
    const f = fixture();
    f.install();
    expect(f.names(true)).toEqual([...agentNames].sort());
    for (const name of agentNames) {
      const { front, body } = f.declaration(name, true);
      expect(front, name).toHaveProperty('key', null);
      expect(body).not.toMatch(/^#+ key\b/im);
    }
  });
});

// Rulings 0084–0085: isolate the rebound assertions so one old coordinate cannot
// mask another's red proof. Other assertions above keep their original meaning.
describe('catalog re-cut: rulings 0084–0085', () => {
  it('0068: the assayer has no read-only restriction', () => {
    expect(composedRole('assayer').readOnly).toBeUndefined();
  });

  it("0070: the architect is the operator's principal architect", () => {
    const architect = composedRole('architect');
    expect.soft(architect.description).toBe(descriptions.architect);
    expect.soft(vectorOf(architect).role).toEqual(roleVector('architect').role);
  });

  it('0078: ordering is an optional communication-style slot', () => {
    expect(canon.MANIFEST['communication-style']).toEqual(
      factors['communication-style'],
    );
  });

  it('0078: ordering is fixed bottom-line-up-front for the architect and otherwise unset', () => {
    for (const name of roleNames) {
      const ordering = requireDefined(
        vectorOf(composedRole(name)).communicationStyle,
        `${name}.communicationStyle`,
      ).filter((entry) => entry.slot === 'ordering');
      expect(ordering, name).toEqual(
        requireDefined(
          roleVector(name).communicationStyle,
          `${name}.communicationStyle`,
        ).filter((entry) => entry.slot === 'ordering'),
      );
    }
  });

  it('0085: reconstitution reads context overviews before detail and readback', () => {
    const procedure = requireDefined(
      vectorOf(composedRole('architect')).procedure,
      'architect.procedure',
    );
    expect(
      procedure.find((entry) => anchorOf(entry.value) === 'reconstitution'),
    ).toEqual(
      requireDefined(
        roleVector('architect').procedure,
        'architect.procedure',
      ).find((entry) => anchorOf(entry.value) === 'reconstitution'),
    );
  });
});
