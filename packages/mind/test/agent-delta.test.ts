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
      'Address', // human-on-the-loop
      'Substrate', // claude
      'Percept', // user-message
      'Enaction', // natural-language
      'Deliberation', // react
      'Resolve', // satisfice
    ]) {
      expect(titles, `${omitted} should be omitted`).not.toContain(omitted);
    }
    // Set organs whose every member is harness-provided → emptied → dropped.
    for (const omitted of [
      'Effectors', // {file-ops, delegation} ⊆ reset
      'Sensors', // {text} ⊆ reset
      'Charter', // {harm-avoidance, honesty, helpfulness, input-untrusted} == reset
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
      'Mandate', // curate
      'Comportment', // formal != reset's neutral → KEPT
      'Register-Fit',
      'Disclosure',
      'Provenance',
      'Telos',
      'Instructions',
      'Competence',
      'Gestalt',
      'Ledger',
      'Construal',
      'Disposition-Memory',
      'Appraisal',
    ]) {
      expect(titles, `${present} should be emitted`).toContain(present);
    }
  });

  it("keeps Comportment because nico's `formal` != the reset's `neutral`", () => {
    const delta = subtractReset(nicoResolved, claudeHarnessReset);
    const comport = delta.organs.find(([t]) => t === 'Comportment');
    expect(comport?.[1][0]?.slug).toBe('formal');
  });

  it('the rendered delta SOUL has the distinctive headings and none of the dropped', () => {
    const md = projectAgentDelta(nicoResolved, claudeHarnessReset);
    expect(md).toContain('## Persona');
    expect(md).toContain('## Mandate');
    expect(md).toContain('## Comportment');
    expect(md).toContain('## Telos');
    expect(md).not.toContain('## Address');
    expect(md).not.toContain('## Effectors');
    expect(md).not.toContain('## Charter');
    expect(md).not.toContain('## Substrate');
    expect(md).not.toContain('## Sensors');
    // No empty `## Organ` heading left behind by subtraction.
    expect(md).not.toMatch(/##[^\n]*\n+## /);
    // Still framed: front-matter description + the genus block.
    expect(md).toContain('## Memory');
  });
});
