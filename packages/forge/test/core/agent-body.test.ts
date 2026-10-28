// The agent BODY format: `# <emoji> <name>`, the description, then one `## <Group>`
// per factor group in catalog order and one `### <factor>` per TEXT factor, each
// held entry one line in held order. A binding factor and an attribute factor are
// never text; a group with no text factor is omitted; a factor with no entry states
// no departure and renders no section, and a group whose text factors are all empty
// is omitted.

import type { Agent, FactorManifest } from '@cratylus/schema';
import { describe, expect, it } from 'vitest';
import { agentBody } from '../../src/core/body.js';

/** A small catalog exercising every arity, both projections and a group that is
 *  interleaved with another and a group that holds only a binding factor. */
const CATALOG = {
  role: {
    group: 'Identity',
    repertoire: 'open',
    arity: 'scalar',
    level: 'fixed',
    projection: 'text',
  },
  'decision-rights': {
    group: 'Authority',
    repertoire: 'fixed',
    arity: 'slots',
    level: 'fixed',
    projection: 'text',
    slots: [
      { name: 'intent', correction: 'what is wanted and why' },
      { name: 'verdict' },
    ],
  },
  stance: {
    group: 'Identity',
    repertoire: 'curated',
    arity: 'set',
    level: 'firm',
    projection: 'text',
  },
  handoffs: {
    group: 'Reach',
    repertoire: 'fixed',
    arity: 'set',
    level: 'fixed',
    projection: 'binding',
  },
  'enforcement-level': {
    group: 'Governance',
    repertoire: 'fixed',
    arity: 'attribute',
    level: null,
    projection: 'text',
  },
  evaluation: {
    group: 'Governance',
    repertoire: 'curated',
    arity: 'set',
    level: null,
    projection: 'text',
  },
} as const satisfies FactorManifest;

const agent = {
  name: 'code-reviewer',
  description: 'Reviews a change before it lands.',
  mark: { emoji: '🔎', hue: 'cyan' },
  key: null,
  role: [{ value: 'code-reviewer ≜ judges a change', level: 'fixed' }],
  decisionRights: [
    { value: 'I ≜ gives input', level: 'fixed', slot: 'intent' },
    {
      value: 'D ≜ decides',
      level: 'fixed',
      slot: 'verdict',
      note: 'in verdict',
    },
  ],
  stance: [
    { value: 'zero-trust ≜ verifies before it trusts', level: 'firm' },
    { value: 'terse', level: 'advisory' },
  ],
  handoffs: [
    {
      value: 'software-engineer ≜ hands work to a software engineer',
      level: 'fixed',
    },
  ],
  evaluation: [],
} as Agent;

describe('agentBody — the projected text of an agent', () => {
  it('renders identity, then grouped text factors with explained entry lines', () => {
    expect(agentBody(agent, CATALOG)).toBe(
      [
        '# 🔎 code-reviewer',
        '',
        'Reviews a change before it lands.',
        '',
        '## Identity',
        '',
        '### role',
        '',
        '- **code-reviewer** — judges a change (fixed)',
        '',
        '### stance',
        '',
        '- **zero-trust** — verifies before it trusts',
        '- **terse**',
        '',
        '## Authority',
        '',
        '### decision-rights',
        '',
        '- intent (what is wanted and why): **I** — gives input (fixed)',
        '- verdict: **D** (in verdict) — decides (fixed)',
        '',
      ].join('\n'),
    );
  });

  it('renders no section for a factor with no entry, and no group whose factors are all empty', () => {
    const body = agentBody(
      { ...agent, stance: [] } as unknown as Agent,
      CATALOG,
    );
    expect(body).toContain('### role');
    expect(body).not.toContain('### stance');
    expect(body).not.toContain('### evaluation');
    expect(body).not.toContain('## Governance');
    expect(body).not.toContain('(none)');
    const bare = agentBody(
      {
        ...agent,
        role: [],
        stance: [],
        decisionRights: [],
      } as unknown as Agent,
      CATALOG,
    );
    expect(bare).toBe(
      '# 🔎 code-reviewer\n\nReviews a change before it lands.\n',
    );
  });

  it('heads an unmarked agent with its name alone', () => {
    const body = agentBody({ ...agent, mark: null }, CATALOG);
    expect(body.split('\n')[0]).toBe('# code-reviewer');
  });

  it('never renders a binding factor, an attribute factor or the key', () => {
    const body = agentBody(agent, CATALOG);
    expect(body).not.toContain('handoffs');
    expect(body).not.toContain('software-engineer');
    expect(body).not.toContain('## Reach');
    expect(body).not.toContain('enforcement-level');
    expect(body).not.toMatch(/^#+ key\b/im);
  });

  it('refuses a vector whose text factor is not a list of entries', () => {
    expect(() =>
      agentBody({ ...agent, stance: null } as unknown as Agent, CATALOG),
    ).toThrow(
      /agent 'code-reviewer': its 'stance' field is not a list of entries/,
    );
  });

  it('states the deliverable field by field, with what each field means', () => {
    const body = agentBody(
      {
        ...agent,
        contract: {
          deliverable: {
            type: 'object',
            description: 'The report of the cut.',
            properties: {
              outcomes: {
                type: 'array',
                minItems: 1,
                description: 'One per example.',
                items: {
                  type: 'object',
                  properties: {
                    outcome: {
                      type: 'string',
                      enum: ['pass', 'fail'],
                      description: 'Whether it holds.',
                    },
                    evidence: { type: 'string', description: 'In concepts.' },
                  },
                  required: ['outcome'],
                },
              },
            },
            required: ['outcomes'],
          },
        },
      },
      CATALOG,
    );
    expect(body).toContain(
      [
        '## Deliverable',
        '',
        'The report of the cut.',
        '',
        'Return it as one JSON object with these fields:',
        '',
        '- `outcomes` (list of objects, at least 1, required): One per example.',
        '  - `outcome` (string, `pass` or `fail`, required): Whether it holds.',
        '  - `evidence` (string, optional): In concepts.',
      ].join('\n'),
    );
    expect(agentBody(agent, CATALOG)).not.toContain('## Deliverable');
  });
});
