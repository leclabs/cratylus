import { describe, expect, it } from 'vitest';
import {
  type ResolvedSkill,
  skillBody,
} from '../../../src/adapters/claude/index.js';

// Falsifier for the absorbed-declarations regression: the preamble pass must
// drop ONLY the composition-formula line (`<name> ≜ …`), never the
// absorbed-declaration bullets (`- **x** ≜ …`) — those are the cell's
// self-sufficiency mechanism ("no concept is referenced out"). The regression
// shipped SKILL.md files with an `Absorbed declarations …:` header over an
// EMPTY body. The codex adapter reuses this same `skillBody`, so this pins
// both projections.

const refProject = (slug: string): string =>
  slug === 'wake' ? '/wake' : `**${slug}**`;

function fixture(): ResolvedSkill {
  return {
    name: 'demo',
    trigger: '/demo',
    description: 'a demo skill',
    body: [
      '',
      '',
      '# demo',
      '',
      'demo ≜ composes [[wake]] · a formula consumed not emitted',
      '',
      'The verb prose.',
      '',
      'Absorbed declarations (this skill stands alone):',
      '',
      '- **alpha** ≜ the first absorbed concept',
      '- **beta** ≜ the second, citing [[wake]]',
      '',
      '## Sequence',
      '',
      '```text',
      'demo ≜ fenced re-statement kept verbatim',
      '```',
      '',
    ].join('\n'),
    composedFrom: ['/wake'],
    sourcePath: 'packages/agent-anatomy/skill/demo.md',
  };
}

describe('skillBody — absorbed declarations survive the formula drop', () => {
  const md = skillBody(fixture(), refProject);

  it('drops the composition-formula line (and only it)', () => {
    expect(md).not.toContain('a formula consumed not emitted');
  });

  it('renders every absorbed-declaration bullet, refs projected', () => {
    expect(md).toContain('- **alpha** ≜ the first absorbed concept');
    expect(md).toContain('- **beta** ≜ the second, citing /wake');
  });

  it('never emits the header-over-empty-body shape', () => {
    // The header's first following non-blank line is a bullet, not the next
    // section — the exact shape the regression violated.
    expect(md).toMatch(/Absorbed declarations[^\n]*:\n\n- \*\*alpha\*\*/);
  });

  it('keeps a fenced `<name> ≜` line verbatim (fence mask still wins)', () => {
    expect(md).toContain('demo ≜ fenced re-statement kept verbatim');
  });
});
