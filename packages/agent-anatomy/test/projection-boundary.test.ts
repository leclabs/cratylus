// boundary-projection gate (E2): the SOLE path to a human-view is `project-human`.
// For every projection-OWNED dimension, the committed `dimensions/<dimension>/README.md` MUST
// equal its re-projection byte-for-byte — a hand-edit (or a stale README after a
// value-cell edit) diverges and fails here. This is how "no hand path to a Target/
// human-view" is ENFORCED, not merely documented: the committed artifact is locked
// to `deploy`/`project-human` output. Regenerate with `pnpm anatomy:project:human`.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DIMENSION_DOCS,
  PROJECTED_DIMENSIONS,
} from '../src/toolkit/dimension-docs.js';
import {
  dimensionReadmePath,
  renderDimensionReadme,
} from '../src/toolkit/project-human.js';

describe('project-human — committed dimension READMEs are byte-stable projections', () => {
  it('there is at least one projection-owned dimension (the witness)', () => {
    expect(PROJECTED_DIMENSIONS.length).toBeGreaterThan(0);
  });

  it.each([...PROJECTED_DIMENSIONS])(
    '%s/README.md == project-human(%s) byte-for-byte',
    async (dimension) => {
      const projected = await renderDimensionReadme(dimension);
      const committed = readFileSync(dimensionReadmePath(dimension), 'utf8');
      // Byte equality: a hand-edit or a stale README after a cell edit fails here.
      expect(committed).toBe(projected);
    },
  );

  it('re-projection is idempotent (deterministic, no clock/host)', async () => {
    for (const dimension of PROJECTED_DIMENSIONS) {
      const a = await renderDimensionReadme(dimension);
      const b = await renderDimensionReadme(dimension);
      expect(a).toBe(b);
    }
  });

  it('every projection-owned dimension has an DimensionDoc gloss (E2 witness invariant)', () => {
    for (const dimension of PROJECTED_DIMENSIONS) {
      expect(DIMENSION_DOCS[dimension], dimension).toBeDefined();
    }
  });
});
