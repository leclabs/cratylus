// NULL-ORGAN gate — the explicit omit-to-inherit sentinel, end to end.
//
// Law (explicit-omit-to-inherit): an organ key on an `Agent` vector holds a
// concrete fragment OR `null`; `null` ⇒ the organ is OMITTED from the
// projection (inherited from the harness). This gate proves the whole chain per
// agent module:
//   vector organ = null  ⇔  no `[Title, …]` row in `<name>Resolved.organs`
//                        ⇔  no `## Title` section in the projected SOUL
// and, for concrete organs, the converse (row present ∧ section present).
// It therefore also catches vector↔Resolved drift in either direction.

import {
  agentToClaudeMd,
  organTitle,
} from '@leclabs/agent-forge/adapters/claude';
import type { ResolvedAgent } from '@leclabs/agent-forge/adapters/claude';
import type { Agent } from '@leclabs/agent-forge/anatomy';
import { ORGAN_NAMES } from '@leclabs/agent-forge/anatomy';
import { describe, expect, it } from 'vitest';

import * as archDocWriter from '../src/agents/arch-doc-writer.js';
import * as boswell from '../src/agents/boswell.js';
import * as cognizant from '../src/agents/cognizant.js';
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

/** Every agent module: [vector, resolved]. */
const MODULES: ReadonlyArray<readonly [Agent, ResolvedAgent]> = [
  [archDocWriter.archDocWriter, archDocWriter.archDocWriterResolved],
  [boswell.boswell, boswell.boswellResolved],
  [cognizant.cognizant, cognizant.cognizantResolved],
  [developer.developer, developer.developerResolved],
  [investigator.investigator, investigator.investigatorResolved],
  [mav.mav, mav.mavResolved],
  [nico.nico, nico.nicoResolved],
  [planner.planner, planner.plannerResolved],
  [
    principalEngineerReviewer.principalEngineerReviewer,
    principalEngineerReviewer.principalEngineerReviewerResolved,
  ],
  [principalIc.principalIc, principalIc.principalIcResolved],
  [tester.tester, tester.testerResolved],
];

describe('NULL-ORGAN gate — null ⇔ no Resolved row ⇔ no SOUL section', () => {
  for (const [agent, resolved] of MODULES) {
    it(`${agent.name}: vector null-set matches Resolved + projection`, () => {
      const soul = agentToClaudeMd(resolved);
      const resolvedTitles = new Set(resolved.organs.map(([t]) => t));
      for (const organ of ORGAN_NAMES) {
        const title = organTitle(organ);
        const isNull = agent[fieldOf(organ)] === null;
        expect(
          resolvedTitles.has(title),
          `${agent.name}.${organ}: ${isNull ? 'null ⇒ no' : 'concrete ⇒ a'} Resolved row`,
        ).toBe(!isNull);
        expect(
          soul.includes(`## ${title}`),
          `${agent.name}.${organ}: ${isNull ? 'null ⇒ no' : 'concrete ⇒ a'} \`## ${title}\` SOUL section`,
        ).toBe(!isNull);
      }
    });
  }
});
