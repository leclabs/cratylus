// A SECOND value under one factor, deliberately shaped to make two legs bite.
//
//  1. SHORTLEX has something to sort. `valuesOf` reads modules in FILENAME order,
//     then sorts bodies shortlex. `fixture-standing.ts` sorts BEFORE
//     `mission-command.ts` on disk while its body is LONGER, so scan order and
//     emitted order disagree — a dropped sort call changes the output. With one
//     value per factor the sort was unobservable and the leg was decoration.
//  2. A PRECISING DEFINITION exists to survive. A body is `⟨term, precising
//     definition⟩`; the catalog must emit it verbatim, never reduced to its term by
//     a `termOf` where a `bodyOf` belongs. Every other fixture value is a bare term,
//     so that reduction was invisible — `term === body` when the precising definition is ∅.

import type { FixtureValue } from '../../fixture-manifest.js';

export const fixtureStanding: FixtureValue<'autonomy'> =
  'fixture-standing ⟨a fixture value bearing a precising definition⟩';
