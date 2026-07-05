// boundary-projection gate (E2): the SOLE path to a human-view is `project-human`.
// For every projection-OWNED organ, the committed `organs/<organ>/README.md` MUST
// equal its re-projection byte-for-byte — a hand-edit (or a stale README after a
// value-cell edit) diverges and fails here. This is how "no hand path to a Target/
// human-view" is ENFORCED, not merely documented: the committed artifact is locked
// to `deploy`/`project-human` output. Regenerate with `pnpm anatomy:project:human`.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ORGAN_DOCS, PROJECTED_ORGANS } from '../src/toolkit/organ-docs.js';
import {
  organReadmePath,
  renderOrganReadme,
} from '../src/toolkit/project-human.js';

describe('project-human — committed organ READMEs are byte-stable projections', () => {
  it('there is at least one projection-owned organ (the witness)', () => {
    expect(PROJECTED_ORGANS.length).toBeGreaterThan(0);
  });

  it.each([...PROJECTED_ORGANS])(
    '%s/README.md == project-human(%s) byte-for-byte',
    async (organ) => {
      const projected = await renderOrganReadme(organ);
      const committed = readFileSync(organReadmePath(organ), 'utf8');
      // Byte equality: a hand-edit or a stale README after a cell edit fails here.
      expect(committed).toBe(projected);
    },
  );

  it('re-projection is idempotent (deterministic, no clock/host)', async () => {
    for (const organ of PROJECTED_ORGANS) {
      const a = await renderOrganReadme(organ);
      const b = await renderOrganReadme(organ);
      expect(a).toBe(b);
    }
  });

  it('every projection-owned organ has an OrganDoc gloss (E2 witness invariant)', () => {
    for (const organ of PROJECTED_ORGANS) {
      expect(ORGAN_DOCS[organ], organ).toBeDefined();
    }
  });
});
