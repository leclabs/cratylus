// A SECOND value under one dimension, deliberately shaped to make two legs bite.
//
//  1. SHORTLEX has something to sort. `valuesOf` reads modules in FILENAME order,
//     then sorts bodies shortlex. `fixture-standing.ts` sorts BEFORE
//     `mission-command.ts` on disk while its body is LONGER, so scan order and
//     emitted order disagree — a dropped sort call changes the output. With one
//     value per dimension the sort was unobservable and the leg was decoration.
//  2. A RESIDUE exists to survive. A body is `⟨α, residue⟩`; the catalog must emit
//     it verbatim, never reduced to its anchor by an `anchorOf` where a `bodyOf`
//     belongs. Every other fixture value is a bare anchor, so that reduction was
//     invisible — `α === body` when the residue is ∅.

import type { FixtureValue } from '../../fixture-manifest.js';

export const fixtureStanding: FixtureValue<'autonomy'> =
  'fixture-standing ⟨a residue-bearing fixture value⟩';
