// NULL-ORGAN gate — the explicit omit-to-inherit sentinel, end to end.
//
// Law (explicit-omit-to-inherit): an organ key on an `Agent` vector holds a
// concrete fragment OR `null`; `null` ⇒ the organ is OMITTED from the
// projection (inherited from the harness). This gate proves the whole chain per
// agent module:
//   vector organ = null  ⇔  no `## Title` section in the projected SOUL
// (the composed `Resolved` intermediate is gone — `agentToClaudeMd` projects
// straight from the `Agent` vector), and, for concrete organs, the converse
// (section present).

import {
  agentToClaudeMd,
  organTitle,
} from '@leclabs/agent-forge/adapters/claude';
import type { Agent } from '@leclabs/agent-forge/anatomy';
import { ORGAN_NAMES } from '@leclabs/agent-forge/anatomy';
import { describe, expect, it } from 'vitest';

import * as archDocWriter from '../src/agents/arch-doc-writer.js';
import * as boz from '../src/agents/boz.js';
import * as developer from '../src/agents/developer.js';
import * as investigator from '../src/agents/investigator.js';
import * as mav from '../src/agents/mav.js';
import * as nico from '../src/agents/nico.js';
import * as planner from '../src/agents/planner.js';
import * as principalEngineerReviewer from '../src/agents/principal-engineer-reviewer.js';
import * as principalIc from '../src/agents/principal-ic.js';
import * as tester from '../src/agents/tester.js';

/** kebab organ name → the `Agent` field name (camelCase). */
const fieldOf = (organ: string): keyof Agent =>
  organ.replace(/-(\w)/g, (_, c: string) => c.toUpperCase()) as keyof Agent;

/** Every live agent vector (10 — boswell/cognizant deleted, `boz` added). */
const AGENTS: readonly Agent[] = [
  archDocWriter.archDocWriter,
  boz.boz,
  developer.developer,
  investigator.investigator,
  mav.mav,
  nico.nico,
  planner.planner,
  principalEngineerReviewer.principalEngineerReviewer,
  principalIc.principalIc,
  tester.tester,
];

describe('NULL-ORGAN gate — null ⇔ no SOUL section', () => {
  it('exactly the 10 live agents are under test', () => {
    expect(AGENTS.length).toBe(10);
  });

  for (const agent of AGENTS) {
    it(`${agent.name}: vector null-set matches the projected SOUL`, () => {
      const soul = agentToClaudeMd(agent);
      for (const organ of ORGAN_NAMES) {
        const title = organTitle(organ);
        const isNull = agent[fieldOf(organ)] === null;
        expect(
          soul.includes(`## ${title}`),
          `${agent.name}.${organ}: ${isNull ? 'null ⇒ no' : 'concrete ⇒ a'} \`## ${title}\` SOUL section`,
        ).toBe(!isNull);
      }
    });
  }
});
