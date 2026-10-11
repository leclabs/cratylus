import { expect, it } from 'vitest';
import { assertReplacement } from './fixture.js';

// Offline proof of the preservation assertion: the negative differs only in the
// missing host replacement; its target survives, and the owned root is gone.
it('delivery/3 — a negative uninstall result cannot erase the host replacement', () => {
  const before = { link: '/fixture/home/mira/skills' };
  const golden = {
    replacement: before,
    target: 'Host skill.',
    ownedRoot: false,
  };
  const negative = {
    replacement: undefined,
    target: 'Host skill.',
    ownedRoot: false,
  };
  const result =
    process.env.DELIVERY_REPLACEMENT_RED === '1' ? negative : golden;
  assertReplacement(result.replacement, before);
  expect(result.target).toBe('Host skill.');
  expect(result.ownedRoot).toBe(false);
});
