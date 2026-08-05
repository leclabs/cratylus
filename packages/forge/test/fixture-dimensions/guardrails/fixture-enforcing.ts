// An ENFORCING value — the object-shaped member of `Value<O>`, present so the
// catalog scan is exercised against BOTH faces of that union.
//
// `catalog/index.ts` names this exact hazard on the scan it guards: a value that
// carries its own enforcement is an OBJECT, and a `typeof === 'string'` filter
// DROPS IT silently, leaving a catalog that under-reports and reads exactly like
// a smaller corpus. `bodyOf` reaches the declaration face of either shape, which
// is why the scan is correct — but no corpus in this repo held an enforcing
// dimension value, so nothing ever demonstrated it. A hazard the source names and
// no fixture reproduces is an untested claim.

import type { FixtureValue } from '../../fixture-manifest.js';

export const fixtureEnforcing: FixtureValue<'guardrails'> = {
  body: 'fixture-enforcing ≜ a rule that carries its own enforcement',
  substrate: 'harness',
  events: ['turn.end'],
  realizedBy: 'fixture-enforcing',
};
