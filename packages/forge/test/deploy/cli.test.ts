// CLI-level parsing for deploy asset declarations.

import { describe, expect, it } from 'vitest';
import { parseCompanions } from '../../src/cli/commands/deploy.js';

describe('parseCompanions', () => {
  it('parses <skill>=<spec> asset declarations into a companions map', () => {
    const c = parseCompanions('memory=logo.png');
    expect(c).toEqual({ memory: { assets: ['logo.png'] } });
  });

  it('accumulates repeated keys', () => {
    const c = parseCompanions('memory=logo.png,memory=banner.png');
    expect(c).toEqual({ memory: { assets: ['logo.png', 'banner.png'] } });
  });

  it('hard-errors on a malformed (no `=`) declaration', () => {
    expect(() => parseCompanions('memory')).toThrow(/must be <skill>=<spec>/);
  });

  it('returns undefined when nothing is declared', () => {
    expect(parseCompanions(null)).toBeUndefined();
  });
});
