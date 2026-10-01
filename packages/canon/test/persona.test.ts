// PERSONA — an agent named as an individual declares its residue over the role it holds,
// and an agent named for its role declares nothing.
//
// The agent named for a role is that role's generic holder: its description, archetype
// and mark are the role cell's, and it is built by `holds(role)`. A persona (`kino`,
// `mav`, `nico`) is named otherwise and owes the role its own description, archetype and
// mark. The live leg is a GATE over the shipped agents; its convicting fixtures hand the
// fold each way a persona can fail to be one and a role-named agent can declare more than
// its role, and every one must be refused when the cell is defined.

import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { anchorOf } from '@cratylus/schema';
import { describe, expect, it } from 'vitest';
import type { Agent } from '../src/manifest.js';
import { architectRole } from '../src/roles/architect.js';
import { assayerRole } from '../src/roles/assayer.js';
import { type Persona, type RoleCell, holds } from '../src/roles/hold.js';
import { implementerRole } from '../src/roles/implementer.js';
import { integratorRole } from '../src/roles/integrator.js';
import { plannerRole } from '../src/roles/planner.js';

const agentsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'agents',
);

const ROLES: readonly RoleCell[] = [
  architectRole,
  plannerRole,
  implementerRole,
  assayerRole,
  integratorRole,
];
const roleByAnchor: Record<string, RoleCell> = Object.fromEntries(
  ROLES.map((r) => [anchorOf(r.sign), r]),
);

// The module specifier is selected at run time from the directory listing, so a ninth
// agent is policed without this file being edited; a static import cannot do that.
async function shippedAgents(): Promise<Agent[]> {
  const names = readdirSync(agentsDir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => f.replace(/\.ts$/, ''))
    .sort();
  return Promise.all(
    names.map(
      async (n) =>
        (await import(pathToFileURL(join(agentsDir, `${n}.ts`)).href))[
          n
        ] as Agent,
    ),
  );
}

/** A persona over the architect role that is whole: the one the refusals each spoil. */
const whole: Persona = {
  name: 'someone',
  description: 'Use this agent for a thing of its own.',
  archetype: 'An individual of its own.',
  provenance: { mark: { emoji: '🎯', hue: 'teal' } },
};

describe('persona — the shipped agents', () => {
  it('reaches the agents it polices — a scan that found none is DARK, not clean', async () => {
    const agents = await shippedAgents();
    expect(agents.map((a) => a.name)).toEqual([
      'architect',
      'assayer',
      'implementer',
      'integrator',
      'kino',
      'mav',
      'nico',
      'planner',
    ]);
  });

  it('every role-named agent carries exactly the identity its role states', async () => {
    for (const agent of await shippedAgents()) {
      const role = roleByAnchor[agent.name];
      if (role === undefined) continue;
      expect(agent.holds, agent.name).toBe(agent.name);
      expect(agent.description, agent.name).toBe(role.description);
      expect(agent.archetype, agent.name).toBe(role.archetype);
      expect(agent.provenance, agent.name).toEqual(role.provenance);
    }
  });

  it('every persona has a description, archetype and mark of its own', async () => {
    const agents = await shippedAgents();
    const personas = agents.filter((a) => !(a.name in roleByAnchor));
    expect(personas.map((a) => a.name)).toEqual(['kino', 'mav', 'nico']);
    for (const persona of personas) {
      const role = roleByAnchor[persona.holds as string] as RoleCell;
      expect(role, persona.name).toBeDefined();
      expect(persona.archetype.trim(), persona.name).not.toBe('');
      expect(persona.archetype, persona.name).not.toBe(role.archetype);
      expect(persona.description, persona.name).not.toBe(role.description);
      expect(persona.provenance?.mark, persona.name).toBeDefined();
      expect(persona.provenance?.mark, persona.name).not.toEqual(
        role.provenance.mark,
      );
    }
  });

  it('no two agents share a mark', async () => {
    const marks = (await shippedAgents()).map((a) =>
      JSON.stringify(a.provenance?.mark),
    );
    expect(new Set(marks).size).toBe(marks.length);
  });
});

describe('persona — the fold refuses what is not one', () => {
  it('passes a whole persona, so the refusals below are the only thing that stops one', () => {
    const agent = holds(architectRole, whole);
    expect(agent.name).toBe('someone');
    expect(agent.holds).toBe('architect');
    expect(agent.archetype).toBe(whole.archetype);
  });

  it('REFUSES a persona with no archetype of its own', () => {
    expect(() => holds(architectRole, { ...whole, archetype: '  ' })).toThrow(
      /someone declares no archetype of its own/,
    );
    expect(() =>
      holds(architectRole, { ...whole, archetype: undefined } as never),
    ).toThrow(/someone declares no archetype of its own/);
  });

  it('REFUSES a persona with no mark of its own', () => {
    expect(() =>
      holds(architectRole, { ...whole, provenance: null } as never),
    ).toThrow(/someone declares no mark of its own/);
    expect(() =>
      holds(architectRole, { ...whole, provenance: undefined } as never),
    ).toThrow(/someone declares no mark of its own/);
  });

  it('REFUSES a persona whose mark is its role’s', () => {
    expect(() =>
      holds(architectRole, {
        ...whole,
        provenance: { mark: { ...architectRole.provenance.mark } },
      }),
    ).toThrow(/someone declares the mark of the architect role/);
  });

  it('accepts a persona that shares only half its role’s mark', () => {
    const { emoji } = architectRole.provenance.mark;
    expect(() =>
      holds(architectRole, {
        ...whole,
        provenance: { mark: { emoji, hue: 'teal' } },
      }),
    ).not.toThrow();
  });

  it('REFUSES a role-named agent that declares a dimension value', () => {
    expect(() =>
      holds(architectRole, {
        ...whole,
        name: 'architect',
        framing: architectRole.vector.framing,
      }),
    ).toThrow(/architect is named for the role it holds/);
  });

  it('REFUSES a role-named agent that declares only an identity', () => {
    expect(() => holds(plannerRole, { ...whole, name: 'planner' })).toThrow(
      /planner is named for the role it holds/,
    );
  });
});
