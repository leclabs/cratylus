/**
 * E9.S6 — agent + skill schemas carry the documented frontmatter surface.
 *
 * Richest documented dialects: claude agent frontmatter (permissionMode,
 * maxTurns, memory, effort…) [CC2], Kilo/opencode `mode` [KL1][OC2], gemini
 * temperature/max_turns [GM2]; skill spec + claude/cursor/crush extensions
 * (license/compatibility/metadata/paths/user-invocable/
 * disable-model-invocation) [S3][CC3][CU4][CR1]. Both schemas are
 * additionalProperties:false, so an unmodeled field genuinely fails.
 */

import { describe, expect } from 'vitest';

import { validateAgent, validateSkill } from '../../../src/core/index.js';
import { story } from '../helpers.js';

describe('E9.S6 · agent + skill frontmatter surface', () => {
  story(
    'E9.S6',
    'current core agent + skill surfaces validate unchanged',
    () => {
      expect(
        validateAgent({
          name: 'planner',
          body: 'You are the planner.',
          description: 'Plans tasks',
          model: 'claude-sonnet-4-6',
          tools: ['Read', 'Bash'],
          color: 'blue',
        }),
      ).toBe(true);
      expect(
        validateSkill({
          name: 'review',
          description: 'Review code',
          body: '# Review',
          allowed_tools: ['Read'],
          files: ['references/guide.md'],
        }),
      ).toBe(true);
    },
  );

  story.tracked(
    'E9.S6',
    'agent schema represents permission_mode, max_turns, temperature, mode, memory, effort [CC2][KL1][OC2][GM2][CU3][CP1]',
    () => {
      expect(
        validateAgent({
          name: 'dev',
          body: 'Build things.',
          permission_mode: 'plan',
          max_turns: 30,
          temperature: 0.2,
          mode: 'subagent',
          memory: 'project',
          effort: 'high',
        }),
      ).toBe(true);
    },
  );

  story.tracked(
    'E9.S6',
    'agent mode carries the documented enum primary|subagent|all [KL1][OC2]',
    () => {
      for (const mode of ['primary', 'subagent', 'all']) {
        expect(
          validateAgent({ name: 'dev', body: 'x', mode }),
          `mode: ${mode}`,
        ).toBe(true);
      }
    },
  );

  story.tracked(
    'E9.S6',
    'skill schema represents license, compatibility, metadata, paths, user_invocable, disable_model_invocation [S3][CC3][CU4][CR1]',
    () => {
      expect(
        validateSkill({
          name: 'review',
          description: 'Review code',
          body: '# Review',
          license: 'MIT',
          compatibility: 'claude-code>=2',
          metadata: { author: 'acme' },
          paths: ['src/**'],
          user_invocable: true,
          disable_model_invocation: false,
        }),
      ).toBe(true);
    },
  );
});
