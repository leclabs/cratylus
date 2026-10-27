// The practice skills hold their bounded contexts' concepts exactly as the domain
// model records them, and every agent whose procedure names a practice loads its
// skill. The records are read here, from `design/model`, at test time.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { businessAnalyst } from '../src/agents/business-analyst.js';
import { codeReviewer } from '../src/agents/code-reviewer.js';
import { kino } from '../src/agents/kino.js';
import { mav } from '../src/agents/mav.js';
import { nico } from '../src/agents/nico.js';
import { softwareEngineer } from '../src/agents/software-engineer.js';
import { techLead } from '../src/agents/tech-lead.js';
import { testEngineer } from '../src/agents/test-engineer.js';
import { behaviourDrivenDevelopment } from '../src/skills/behaviour-driven-development/skill.js';
import { cratylicContextDesign } from '../src/skills/cratylic-context-design/skill.js';

const model = fileURLToPath(new URL('../../../design/model/', import.meta.url));

/** Each concept record of `context`: its `# term` and the paragraph after it. */
function records(context: string): { term: string; correction: string }[] {
  const dir = join(model, context);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'context.md')
    .map((f) => {
      const [heading = '', , correction = ''] = readFileSync(
        join(dir, f),
        'utf8',
      ).split('\n');
      return { term: heading.replace(/^# /, ''), correction };
    });
}

describe('the practice skills', () => {
  for (const skill of [cratylicContextDesign, behaviourDrivenDevelopment]) {
    it(`${skill.name} holds each concept of its context, term and correction`, () => {
      const lines = skill.formalBlock.split('\n');
      const concepts = records(skill.name);
      expect(concepts.length).toBeGreaterThan(0);
      for (const { term, correction } of concepts)
        expect(lines).toContain(`${term} ≜ ${correction}`);
      expect(skill.composition()).toEqual([]);
    });

    it(`${skill.name} opens with its context's name and subject`, () => {
      const text = readFileSync(join(model, skill.name, 'context.md'), 'utf8');
      const name = /^# (.+)$/m.exec(text)?.[1];
      const subject = /^\*\*Subject:\*\* (.+)$/m.exec(text)?.[1];
      expect(skill.formalBlock.split('\n')[0]).toBe(`${name} ≜ ${subject}`);
    });
  }
});

describe('an agent whose procedure names a practice loads its skill', () => {
  const both = ['behaviour-driven-development', 'cratylic-context-design'];
  const bdd = ['behaviour-driven-development'];
  const expected = {
    businessAnalyst: both,
    mav: both,
    nico: both,
    kino: both,
    techLead: bdd,
    softwareEngineer: bdd,
    testEngineer: bdd,
    codeReviewer: bdd,
  };
  const agents = {
    businessAnalyst,
    mav,
    nico,
    kino,
    techLead,
    softwareEngineer,
    testEngineer,
    codeReviewer,
  };
  for (const [name, skills] of Object.entries(expected))
    it(`${name} carries ${skills.join(' and ')}`, () => {
      expect(agents[name as keyof typeof agents].skills).toEqual(skills);
    });
});
