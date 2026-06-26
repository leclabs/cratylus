// T2.2 — the DELTA-over-target projection: projecting an agent through the claude
// adapter's `projectAgentDelta` (subtracting the claude harness reset) must omit
// the harness-provided organs and emit only the agent's distinctive delta. This
// is the ADDITIVE capability (DECISION 1): the DEFAULT `agentToClaudeMd` stays
// byte-identical (covered by `agent-roundtrip.test.ts`); THIS exercises the new
// separate subtraction path on the worked example, the real `nicoResolved`.

import {
  claudeHarnessReset,
  projectAgentDelta,
  subtractReset,
} from '@leclabs/koine/adapters/claude';
import { describe, expect, it } from 'vitest';
import { nicoResolved } from '../src/agents/nico.js';

describe('T2.2 nico delta-over-target (subtract the claude harness reset)', () => {
  it('omits every harness-provided organ (all of nico match the reset)', () => {
    const delta = subtractReset(nicoResolved, claudeHarnessReset);
    const titles = delta.organs.map(([t]) => t);
    // Scalar organs whose value == the reset slug → omitted entirely.
    for (const omitted of [
      'Autonomy', // human-on-the-loop
      'Model', // claude
      'Trigger', // user-message
      'Output-Format', // natural-language
      'Reasoning-Strategy', // react
      'Satisficing', // satisfice
    ]) {
      expect(titles, `${omitted} should be omitted`).not.toContain(omitted);
    }
    // Set organs whose every member is harness-provided → emptied → dropped.
    for (const omitted of [
      'Actions', // {file-ops, delegation} ⊆ reset
      'Modalities', // {text} ⊆ reset
      'Guardrails', // {harm-avoidance, honesty, helpfulness, input-untrusted} == reset
    ]) {
      expect(
        titles,
        `${omitted} should be dropped (fully provided)`,
      ).not.toContain(omitted);
    }
  });

  it('emits nico distinctive delta (organs with no reset entry, kept verbatim)', () => {
    const delta = subtractReset(nicoResolved, claudeHarnessReset);
    const titles = delta.organs.map(([t]) => t);
    for (const present of [
      'Persona',
      'Role', // curate
      'Formality', // formal != reset's neutral → KEPT
      'Audience-Adaptation',
      'Transparency',
      'Provenance',
      'Objective',
      'Engineering-Principles',
      'Capabilities',
      'Situation-Awareness',
      'Memory',
      'Framing',
      'Learning',
      'Self-Evaluation',
    ]) {
      expect(titles, `${present} should be emitted`).toContain(present);
    }
  });

  it("keeps Formality because nico's `formal` != the reset's `neutral`", () => {
    const delta = subtractReset(nicoResolved, claudeHarnessReset);
    const comport = delta.organs.find(([t]) => t === 'Formality');
    expect(comport?.[1][0]?.slug).toBe('formal');
  });

  it('the rendered delta SOUL has the distinctive headings and none of the dropped', () => {
    const md = projectAgentDelta(nicoResolved, claudeHarnessReset);
    expect(md).toContain('## Persona');
    expect(md).toContain('## Role');
    expect(md).toContain('## Formality');
    expect(md).toContain('## Objective');
    expect(md).not.toContain('## Autonomy');
    expect(md).not.toContain('## Actions');
    expect(md).not.toContain('## Guardrails');
    expect(md).not.toContain('## Model');
    expect(md).not.toContain('## Modalities');
    // No empty `## Organ` heading left behind by subtraction.
    expect(md).not.toMatch(/##[^\n]*\n+## /);
    // Still framed: front-matter description + the genus block.
    expect(md).toContain('## Memory');
  });
});
