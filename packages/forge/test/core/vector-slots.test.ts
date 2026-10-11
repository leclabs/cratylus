import type { DimensionManifest } from '@cratylus/schema';
import { describe, expect, it } from 'vitest';
import {
  type DimensionPlan,
  type ElevationSpec,
  ExemplifyRefusal,
  renderAgentVector,
} from '../../src/core/exemplify/index.js';
import {
  FIXTURE_DIMENSION_NAMES,
  FIXTURE_MANIFEST,
} from '../fixture-manifest.js';

// The fixture's `model` dimension with a third slot a role may leave unfilled.
const MANIFEST: DimensionManifest = {
  ...FIXTURE_MANIFEST,
  model: {
    ...FIXTURE_MANIFEST.model,
    slots: [
      { name: 'tier' },
      { name: 'effort' },
      { name: 'pace', optional: true },
    ],
  },
};

const spec = (slots: readonly string[]): ElevationSpec => ({
  name: 'scheduler',
  description: 'Schedules shoots.',
  dimensions: {
    ...Object.fromEntries(
      FIXTURE_DIMENSION_NAMES.map((d) => [
        d,
        { kind: 'inherit' } satisfies DimensionPlan,
      ]),
    ),
    model: {
      kind: 'value',
      fragments: slots.map((slot) => ({
        slug: `${slot}-value`,
        definiens: `the ${slot}`,
        slot,
      })),
      evidence: { type: 'inference', note: 'stated by the role' },
    },
  },
});

describe('a slots dimension honors Slot.optional', () => {
  it('leaves an optional slot unfilled', () => {
    expect(() =>
      renderAgentVector(spec(['tier', 'effort']), { manifest: MANIFEST }),
    ).not.toThrow();
  });
  it('fills an optional slot once', () => {
    expect(() =>
      renderAgentVector(spec(['tier', 'effort', 'pace']), {
        manifest: MANIFEST,
      }),
    ).not.toThrow();
  });
  it('still refuses an unfilled required slot, a slot filled twice and an unknown slot', () => {
    for (const slots of [
      ['tier'],
      ['tier', 'effort', 'effort'],
      ['tier', 'effort', 'speed'],
    ])
      expect(
        () => renderAgentVector(spec(slots), { manifest: MANIFEST }),
        slots.join(', '),
      ).toThrow(ExemplifyRefusal);
  });
});
