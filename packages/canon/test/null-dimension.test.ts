// NULL-DIMENSION gate — the explicit omit-to-inherit sentinel, end to end.
//
// Law (explicit-omit-to-inherit): a dimension key on an `Agent` vector holds a
// concrete fragment OR `null`; `null` ⇒ the dimension is OMITTED from the
// projection (inherited from the harness). This gate proves the whole chain per
// agent module:
//   vector dimension = null  ⇔  no `## Title` section in the projected Target
// (the composed `Resolved` intermediate is gone — `agentToClaudeMd` projects
// straight from the `Agent` vector), and, for concrete dimensions, the converse
// (section present).

import {
  agentToClaudeMd,
  dimensionTitle,
} from '@cratylus/forge/adapters/claude';
import { describe, expect, it } from 'vitest';
import type { Agent } from '../src/manifest.js';
import { DIMENSION_NAMES, MANIFEST } from '../src/manifest.js';

import * as mav from '../src/agents/mav.js';
import * as nico from '../src/agents/nico.js';

/** kebab dimension name → the `Agent` field name (camelCase). */
const fieldOf = (dimension: string): keyof Agent =>
  dimension.replace(/-(\w)/g, (_, c: string) => c.toUpperCase()) as keyof Agent;

/** Every live agent vector (2 — the ten-agent roster shrank to build/mav, build/nico). */
const AGENTS: readonly Agent[] = [mav.mav, nico.nico];

describe('NULL-DIMENSION gate — null ⇔ no Target section', () => {
  it('exactly the 2 live agents are under test', () => {
    expect(AGENTS.length).toBe(2);
  });

  it('is non-vacuous — the gate FAILS an agent whose null-set contradicts its Target', () => {
    // Every assertion below is over CLEAN vectors, so both pass whether the
    // correspondence is really checked or the section lookup silently stopped
    // matching. Convict it: null a dimension the agent actually carries, and the
    // projected Target must still show its section — the exact contradiction the
    // gate exists to catch.
    const carrier = AGENTS.find((a) => a.transparency !== null) as Agent;
    expect(carrier, 'an agent carrying transparency').toBeDefined();

    const target = agentToClaudeMd(carrier, { manifest: MANIFEST });
    const section = `## ${dimensionTitle('transparency')}`;

    // control: a CARRIED dimension does render its section, so the lookup works
    expect(target.includes(section), 'control: carried ⇒ section present').toBe(
      true,
    );

    // conviction: an agent CLAIMING null while the Target still renders the section
    // is exactly the contradiction the per-agent assertions above test for —
    // `target.includes(section)` must be !isNull, and here both are true.
    const liar = { ...carrier, transparency: null } as Agent;
    const isNull = liar[fieldOf('transparency')] === null;
    expect(isNull).toBe(true);
    expect(target.includes(section) === !isNull).toBe(false);
  });

  for (const agent of AGENTS) {
    it(`${agent.name}: vector null-set matches the projected Target`, () => {
      const target = agentToClaudeMd(agent, { manifest: MANIFEST });
      for (const dimension of DIMENSION_NAMES) {
        const title = dimensionTitle(dimension);
        const isNull = agent[fieldOf(dimension)] === null;
        expect(
          target.includes(`## ${title}`),
          `${agent.name}.${dimension}: ${isNull ? 'null ⇒ no' : 'concrete ⇒ a'} \`## ${title}\` Target section`,
        ).toBe(!isNull);
      }
    });
  }
});
