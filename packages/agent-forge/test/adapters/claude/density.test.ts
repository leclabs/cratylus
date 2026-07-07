import { describe, expect, it } from 'vitest';
import {
  type ReaderDensity,
  type ResolvedSkill,
  agentToClaudeMd,
  densityProfile,
  densityRef,
  isReaderDensity,
  skillToClaudeMd,
} from '../../../src/adapters/claude/index.js';
import type { Agent } from '../../../src/anatomy/index.js';

// Reader density (T2.3) is a PROJECTION PARAMETER, not a property of the source.
// These tests pin the ported list-ref mechanism (`densityRef`) and the SOUL
// projection invariants (no build-provenance banner; deterministic body from the
// `Agent` vector alone).

const DENSITIES: readonly ReaderDensity[] = [
  'strong-llm-lean',
  'strong-llm',
  'weak-llm',
];

/** A minimal mav-like `Agent` vector: persona + mark + a set organ, rest null. */
function agentFixture(): Agent {
  return {
    name: 'mav',
    persona: 'the master-builder — ship end-to-end',
    provenance: { mark: { emoji: '✈️', hue: 'green' } },
    autonomy: null,
    role: null,
    formality: null,
    audienceAdaptation: null,
    transparency: null,
    objective: null,
    guardrails: null,
    engineeringPrinciples: null,
    heuristics: null,
    capabilities: null,
    learning: null,
    situationAwareness: null,
    actions: ['file-ops ≜ mutate files', 'code-execution ≜ run code'],
    modalities: null,
    model: null,
    memory: null,
    trigger: null,
    framing: null,
    reasoningStrategy: null,
    satisficing: null,
    outputFormat: null,
    selfEvaluation: null,
  };
}

function skillFixture(): ResolvedSkill {
  return {
    name: 'dream',
    trigger: '/dream',
    delineation: 'consolidate an agent’s memory',
    body: '# dream — consolidate memory\n\nDistil the EPISODIC stream.\n',
    composedFrom: ['/wake', '**signify**'],
    sourcePath: 'packages/agent-anatomy/skill/dream.md',
  };
}

// The ref projector agent-anatomy's project-cli uses: a known skill → its /trigger, else
// **slug** (harness-only; density-blind, mirroring compose.harness.ref_text).
const refProject = (slug: string): string =>
  slug === 'wake' ? '/wake' : `**${slug}**`;

describe('isReaderDensity — the CLI guard', () => {
  it('accepts exactly the three densities', () => {
    expect(isReaderDensity('strong-llm-lean')).toBe(true);
    expect(isReaderDensity('strong-llm')).toBe(true);
    expect(isReaderDensity('weak-llm')).toBe(true);
  });
  it('rejects anything else (no permissive default)', () => {
    expect(isReaderDensity('bogus')).toBe(false);
    expect(isReaderDensity('')).toBe(false);
    expect(isReaderDensity('strong')).toBe(false);
  });
});

describe('densityProfile — <density>/<harness>', () => {
  it('derives the recorded profile line', () => {
    expect(densityProfile('strong-llm-lean')).toBe(
      'strong-llm-lean/claude-code',
    );
    expect(densityProfile('weak-llm')).toBe('weak-llm/claude-code');
    expect(densityProfile('strong-llm', 'codex')).toBe('strong-llm/codex');
  });
});

describe('densityRef — port of reader.py render_ref (the density mechanism)', () => {
  it('strong-llm-lean: the name is the pointer (density → 0)', () => {
    expect(
      densityRef('/exemplify', 'strong-llm-lean', 'optimize a corpus'),
    ).toBe('- /exemplify');
    // a cue is ignored at lean — the name carries everything.
    expect(
      densityRef(
        '**nico**',
        'strong-llm-lean',
        'the founder',
        'agent, reference',
      ),
    ).toBe('- **nico**');
  });

  it('strong-llm: name + delineation', () => {
    expect(densityRef('/exemplify', 'strong-llm', 'optimize a corpus')).toBe(
      '- /exemplify -- optimize a corpus',
    );
  });

  it('weak-llm with a cue: name + cue + delineation (max scaffold)', () => {
    expect(
      densityRef(
        '/exemplify',
        'weak-llm',
        'optimize a corpus',
        'skill, invoke',
      ),
    ).toBe('- /exemplify _(skill, invoke)_ -- optimize a corpus');
  });

  it('weak-llm without a cue: falls back to name + delineation', () => {
    expect(densityRef('**x**', 'weak-llm', 'a bound')).toBe(
      '- **x** -- a bound',
    );
  });

  it('the three densities are genuinely distinct where a list-ref surface exists', () => {
    const rendered = DENSITIES.map((d) =>
      densityRef('/exemplify', d, 'optimize a corpus', 'skill, invoke'),
    );
    expect(new Set(rendered).size).toBe(3); // not a no-op: a real parameter
  });
});

describe('agent projection — no provenance header, deterministic body', () => {
  it('injects NO build-provenance banner', () => {
    const md = agentToClaudeMd(agentFixture());
    // Build-provenance the running agent never consumes: not injected.
    expect(md).not.toContain('GENERATED from');
    expect(md).not.toContain('profile:');
    expect(md).not.toMatch(/content-hash: sha256:/);
  });

  it('projects the vector deterministically — persona + organ sections, mark color', () => {
    const md = agentToClaudeMd(agentFixture());
    expect(md).toContain('## Persona');
    expect(md).toContain('the master-builder — ship end-to-end');
    expect(md).toContain('## Actions');
    expect(md).toContain('file-ops ≜ mutate files');
    expect(md).toContain('color: green');
    // Deterministic: the same vector projects byte-identically every call.
    expect(agentToClaudeMd(agentFixture())).toBe(md);
  });
});

describe('skill projection — lean provenance is density-invariant by spec', () => {
  it('records the density profile but keeps the same lean "Composed from" line', () => {
    const strip = (md: string): string =>
      md
        .split('\n')
        .filter((l) => !l.trim().startsWith('profile:'))
        .join('\n');
    const bodies = DENSITIES.map((d) =>
      strip(skillToClaudeMd(skillFixture(), refProject, densityProfile(d))),
    );
    // The "Composed from … " provenance is names-only at EVERY density (skill.py:
    // "names only, never the full delineations").
    for (const b of bodies) {
      expect(b).toContain('Composed from /wake · **signify**.');
    }
    expect(bodies[1]).toBe(bodies[0]);
    expect(bodies[2]).toBe(bodies[0]);
  });
});
