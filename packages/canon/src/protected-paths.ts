// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED PATHS — the directory an action-scope value reserves for the agents
// holding it, and what any other agent is told when it writes there.
//
// The path is DATA its action-scope value carries, paired here with that value.
// Composition copies the pair onto each agent holding the value (`Agent.writes`), and
// a harness that judges tool calls refuses a write to the path by every other agent's
// session (design/decisions/a-protected-path-is-guarded-in-the-extension.md).
// ─────────────────────────────────────────────────────────────────────────────

import { type ProtectedPath, termOf } from '@cratylus/schema';
import { writeDomainModel } from './factors/action-scope/write-domain-model.js';

/** Each action-scope value's protected path, by the value's term. */
export const PROTECTED_PATHS: Readonly<Record<string, ProtectedPath>> = {
  [termOf(writeDomainModel)]: {
    path: 'design/model/',
    name: 'the domain model',
    refusal:
      'design/model/ is the domain model, which only the business analyst writes. To change it, raise a meaning question to the business analyst.',
  },
};
