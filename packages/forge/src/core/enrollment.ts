// ENROLLMENT — which personas a scope-activated cell binds, stated once for every harness.
//
// A guard that no agent composes still has a scope: the personas whose composition
// includes it. A harness carries that scope in the form it offers, and the workers read
// ONE thing on every harness — a persona's manifest, at
// `<harness home>/<persona root>/<persona>/stance/manifest.json`. Enrollment is its
// PRESENCE. This module is the only place the manifest's shape is spelled, so the
// scope cannot be stated twice and drift between harnesses.

import type { Hook } from '@cratylus/schema/hook';
import type { HarnessAdapter } from './harness-adapter.js';

/**
 * A persona's own enrollment manifest — scope-relative, so a worker addresses it as
 * `<scope>/stance/manifest.json` and no caller ever spells a gate.
 *
 * ONE FILE, EVERY GATE, keyed by the cell that owns it and carrying that cell's
 * moments. A second gated dimension is a second ENTRY rather than a second file, a
 * second field, or a line in any dispatcher — which is the whole reason it replaces an
 * allowlist. That list named agents in a shell default, and had already drifted from
 * the corpus it was copying: every persona projected here carries the guard, and the
 * list enforced two of them.
 */
export const STANCE_MANIFEST = 'stance/manifest.json';

/** One persona's manifest, staged under `enforcing/<scope>/` by the projector. */
export interface EnrollmentManifest {
  readonly scope: string;
  readonly filename: typeof STANCE_MANIFEST;
  readonly content: string;
}

/**
 * The manifests of a projection: one per persona, each carrying a gate for every cell
 * with an event this adapter realizes, keyed by the cell and listing those moments.
 *
 * The gate is recorded per CELL and per REALIZED event: an event the harness cannot
 * fire is no moment of it, because a manifest naming it would read as coverage.
 * Nothing realized ⇒ no gate ⇒ no manifest at all, and the persona stays unenrolled.
 *
 * ONLY A PERSONA IS ENROLLED. The session scope gets no manifest on any harness, so a
 * launch that named no persona finds nothing to judge and stays silent.
 */
export function enrollmentManifests(
  hooks: readonly Hook[],
  adapter: Pick<HarnessAdapter, 'realizes'>,
  agentNames: readonly string[],
): EnrollmentManifest[] {
  const gates: Record<string, { moments: string[]; timeout?: number }> = {};
  for (const hook of hooks) {
    for (const event of hook.events) {
      if (!adapter.realizes(event)) continue;
      const id = hook.id ?? event;
      const gate = gates[id] ?? { moments: [], timeout: hook.timeout };
      if (!gate.moments.includes(event)) gate.moments.push(event);
      gates[id] = gate;
    }
  }
  if (Object.keys(gates).length === 0) return [];
  const sorted = Object.entries(gates)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, g]) => [
      id,
      { moments: [...g.moments].sort(), timeout: g.timeout },
    ]);
  return [...agentNames].sort().map((agent) => ({
    scope: agent,
    filename: STANCE_MANIFEST,
    content: `${JSON.stringify({ agent, gates: Object.fromEntries(sorted) }, null, 2)}\n`,
  }));
}

/**
 * Where a harness keeps its persona scopes, harness-home relative — the directory
 * whose children are `<persona>/stance/manifest.json`. EMPTY for a harness that places
 * no scoped artifact.
 *
 * DERIVED FROM `scopedRel`, never a second table: the adapter already answers where a
 * persona's manifest lands, and the root is what that answer has in front of the
 * persona's name. A worker that names the running agent resolves its scope by joining
 * this root to the harness home, so the layout keeps one home.
 */
export function personaRootOf(
  adapter: Pick<HarnessAdapter, 'scopedRel' | 'name'>,
): string {
  if (!adapter.scopedRel) return '';
  const probe = '<persona>';
  const rel = adapter.scopedRel(STANCE_MANIFEST, probe);
  const tail = `/${probe}/${STANCE_MANIFEST}`;
  if (!rel.endsWith(tail)) {
    throw new Error(
      `${adapter.name}: scopedRel places a persona's manifest at '${rel}', which is not '<root>${tail}' — a worker cannot derive the persona scope from it.`,
    );
  }
  return rel.slice(0, -tail.length);
}
