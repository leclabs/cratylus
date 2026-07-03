/**
 * E9.S2 — Rule gains activation + placement metadata.
 *
 * The convergent vocabulary across dialects [S19][WS1][CL1][CP3][CT2]:
 * `description`, one canonical globs field, `activation`
 * (always|auto|glob|manual), `dir` (nested-AGENTS.md subtree placement).
 * rule.schema.json is additionalProperties:false, so absence is a real
 * validation failure.
 */

import { describe, expect } from 'vitest';

import { validateRule } from '../../../src/core/index.js';
import { story } from '../helpers.js';

describe('E9.S2 · rule activation + placement', () => {
  story('E9.S2', 'plain rules (no metadata) validate exactly as today', () => {
    expect(validateRule({ id: 'main', body: '# Rules\n\nBe terse.' })).toBe(
      true,
    );
    // The full currently-documented surface stays valid too.
    expect(
      validateRule({
        id: 'style',
        body: 'x',
        targets: ['claude'],
        excludes: ['aider'],
        concat: false,
        order: 2,
      }),
    ).toBe(true);
  });

  story(
    'E9.S2',
    'activation metadata validates: description + globs + activation + dir [WS1][CL1][CP3][CT2][CU1][CC1]',
    () => {
      expect(
        validateRule({
          id: 'frontend',
          body: '# Frontend rules',
          description: 'Applies to the web package',
          globs: ['packages/web/**'],
          activation: 'glob',
          dir: 'packages/web',
        }),
      ).toBe(true);
    },
  );

  story(
    'E9.S2',
    'each documented activation mode is schema-representable (always|auto|glob|manual)',
    () => {
      for (const activation of ['always', 'auto', 'glob', 'manual']) {
        expect(
          validateRule({ id: 'r', body: 'x', activation }),
          `activation: ${activation}`,
        ).toBe(true);
      }
    },
  );
});
