// Composition over action-scope: `none` is the absence of every action, so a persona
// that removes it widens its reach and is refused; `readOnly` holds when action-scope
// holds no value other than `none`, an empty action-scope included.

import { describe, expect, it } from 'vitest';
import { architect } from '../src/agents/architect.js';
import { assayer } from '../src/agents/assayer.js';
import { builder } from '../src/agents/builder.js';
import { checkWriter } from '../src/agents/check-writer.js';
import { illustrator } from '../src/agents/illustrator.js';
import { lead } from '../src/agents/lead.js';
import { CompositionRefusal, persona } from '../src/compose.js';
import { commitOwnPaths } from '../src/dimensions/action-scope/commit-own-paths.js';
import { editOwnOutputs } from '../src/dimensions/action-scope/edit-own-outputs.js';
import { none } from '../src/dimensions/action-scope/none.js';
import { runChecks } from '../src/dimensions/action-scope/run-checks.js';
import { assayerRole } from '../src/roles/assayer.js';
import { builderRole } from '../src/roles/builder.js';

const mark = { emoji: '🧪', hue: 'cyan' } as const;

describe('composition over action-scope', () => {
  it('refuses a persona that removes none from action-scope', () => {
    const compose = () =>
      persona(assayerRole, {
        name: 'widener',
        description: 'An assayer that would act.',
        mark,
        removes: { actionScope: [none] },
      });
    expect(compose).toThrow(CompositionRefusal);
    expect(compose).toThrow(/action-scope/);
    expect(compose).toThrow(/\bnone\b/);
  });

  it('holds a persona whose action-scope is narrowed to empty read-only', () => {
    const narrowed = persona(builderRole, {
      name: 'onlooker',
      description: 'A builder that only reads.',
      mark,
      removes: { actionScope: [editOwnOutputs, runChecks, commitOwnPaths] },
    });
    expect(narrowed.readOnly).toBe(true);
  });

  it('holds only the assayer read-only among the six holders', () => {
    const holders = {
      architect,
      assayer,
      builder,
      checkWriter,
      illustrator,
      lead,
    };
    const readOnly = Object.entries(holders)
      .filter(([, agent]) => agent.readOnly === true)
      .map(([name]) => name);
    expect(readOnly).toEqual(['assayer']);
  });
});
