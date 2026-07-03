/**
 * E10.S5 · renames, sunsets, no-ops are roster facts, not folklore.
 * Ground truth: RETURN-1 §0 consolidation events. Refs [GM7][WS7][RO5].
 * Operator ruling: canonical ids `antigravity` and `devin`; `gemini` and
 * `windsurf` retained as aliases resolving to the identical adapter.
 */

import { describe, expect } from 'vitest';
import type { Adapter } from '../../../src/core/index.js';
import { ALL_ADAPTERS, adapterById, story } from '../helpers.js';
import { importAdapter } from './probe.js';

describe('E10.S5 · roster consolidation facts', () => {
  story.tracked(
    'E10.S5',
    'canonical id antigravity exists; gemini resolves to the identical adapter [GM7]',
    () => {
      expect(adapterById.has('antigravity')).toBe(true);
      expect(adapterById.get('gemini')).toBe(adapterById.get('antigravity'));
    },
  );

  story.tracked(
    'E10.S5',
    'canonical id devin exists; windsurf resolves to the identical adapter [WS7]',
    () => {
      expect(adapterById.has('devin')).toBe(true);
      expect(adapterById.get('windsurf')).toBe(adapterById.get('devin'));
    },
  );

  story.tracked(
    'E10.S5',
    'per-adapter status metadata exists on the roster [GM7][WS7][RO5]',
    () => {
      const withStatus = ALL_ADAPTERS.filter(
        (a: Adapter) => 'status' in (a as unknown as Record<string, unknown>),
      );
      expect(withStatus.length).toBe(ALL_ADAPTERS.length);
    },
  );

  story.tracked(
    'E10.S5',
    'roo carries sunset status pointing at cline [RO5]',
    async () => {
      const roo = await importAdapter('roo');
      const status = (roo as unknown as Record<string, unknown>).status as
        | { kind?: string; successor?: string }
        | undefined;
      expect(status?.kind).toBe('sunset');
      expect(status?.successor).toBe('cline');
    },
  );
});
