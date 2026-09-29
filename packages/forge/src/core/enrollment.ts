// THE STANCE MANIFEST — which guards a persona is bound to, stated once for every harness.
//
// A guard fires for exactly the agents whose composition includes what it enforces, on
// every supported harness. A harness carries that scope in the form it offers, and the
// workers read ONE thing on all of them: the persona's stance manifest, at
// `<harness home>/<persona root>/<persona>/<STANCE_MANIFEST>`. The persona is enrolled
// by its PRESENCE. This module is the only place the manifest's shape is spelled, so the
// scope cannot be stated twice and drift between harnesses.

import {
  type Agent,
  type DimensionManifest,
  anchorOf,
  dimensionValueOf,
} from '@cratylus/schema';
import type { Hook } from '@cratylus/schema/hook';
import { dimensionFieldsOf } from './exemplify/dimension-fields.js';
import type { HarnessAdapter } from './harness-adapter.js';

/**
 * A persona's stance manifest — scope-relative, so a worker addresses it as
 * `<scope>/stance/manifest.json` and no caller ever spells a gate. Workers receive this
 * as the projection fact `stance-manifest`; none of them spells it.
 *
 * ONE FILE, EVERY GATE, keyed by the cell that owns it and carrying that cell's
 * moments. A second gated dimension is a second ENTRY rather than a second file, a
 * second field, or a line in any dispatcher — which is the whole reason it replaces an
 * allowlist. That list named agents in a shell default, and had already drifted from
 * the corpus it was copying: every persona projected here carries the guard, and the
 * list enforced two of them.
 */
export const STANCE_MANIFEST = 'stance/manifest.json';

/** One persona's stance manifest, staged under `enforcing/<scope>/` by the projector. */
export interface StanceManifest {
  readonly scope: string;
  readonly filename: typeof STANCE_MANIFEST;
  readonly content: string;
}

/** A hook cell as enrollment reads it: the deploy IR, and the composition that binds it. */
export interface GuardCandidate {
  readonly hook: Hook;
  /** `HookCell.binds` — absent ⇒ the cell is no guard and enrolls nobody. */
  readonly binds?: { readonly dimension: string; readonly value?: string };
}

/**
 * Does `agent` compose what `binds` names?
 *
 * The value is compared by ANCHOR, never by body, because a fold may rewrite a body and
 * the anchor is what the value IS. With no value, composing ANY value of the dimension
 * binds. A dimension the manifest does not declare THROWS: a guard bound to a name no
 * plugin declares would bind nobody, silently, while its cell deployed and read as
 * coverage.
 */
export function composes(
  agent: Agent,
  binds: NonNullable<GuardCandidate['binds']>,
  manifest: DimensionManifest,
  guard: string,
): boolean {
  const field = dimensionFieldsOf(manifest)[binds.dimension];
  if (field === undefined) {
    throw new Error(
      `guard '${guard}' binds the dimension '${binds.dimension}', which no plugin's manifest declares. A guard bound to an undeclared dimension binds no agent and would deploy as coverage it does not give.`,
    );
  }
  const held = dimensionValueOf(agent, field);
  if (held === null || held === undefined) return false;
  const values = Array.isArray(held) ? held : [held];
  if (binds.value === undefined) return values.length > 0;
  const anchor = anchorOf(binds.value);
  return values.some((v) => anchorOf(v as string) === anchor);
}

/**
 * The stance manifests of a projection: one per persona that composes at least one
 * guard this adapter realizes, each carrying a gate for exactly those guards, keyed by
 * the cell and listing the moments the adapter fires it at.
 *
 * SCOPE IS FIXED BY COMPOSITION, taken from the composed agent. A cell with no `binds`
 * is no guard and is never listed, however many personas project; a guard is listed
 * only for the personas composing what it binds. A persona composing none gets no
 * manifest, so it is unenrolled — silence by placement, not by a runtime filter.
 *
 * The gate records realized events only: an event the harness cannot fire is no moment
 * of the cell, and a manifest naming it would read as coverage.
 *
 * The session scope is never enrolled, on any harness.
 */
export function stanceManifests(
  cells: readonly GuardCandidate[],
  adapter: Pick<HarnessAdapter, 'realizes'>,
  agents: readonly Agent[],
  manifest: DimensionManifest,
): StanceManifest[] {
  const out: StanceManifest[] = [];
  for (const agent of [...agents].sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  )) {
    const gates: Record<string, { moments: string[]; timeout?: number }> = {};
    for (const { hook, binds } of cells) {
      if (!binds) continue;
      const id = hook.id ?? hook.events[0];
      if (!composes(agent, binds, manifest, id)) continue;
      for (const event of hook.events) {
        if (!adapter.realizes(event)) continue;
        const gate = gates[id] ?? { moments: [], timeout: hook.timeout };
        if (!gate.moments.includes(event)) gate.moments.push(event);
        gates[id] = gate;
      }
    }
    const entries = Object.entries(gates)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([id, g]) => [
        id,
        { moments: [...g.moments].sort(), timeout: g.timeout },
      ]);
    if (entries.length === 0) continue;
    out.push({
      scope: agent.name,
      filename: STANCE_MANIFEST,
      content: `${JSON.stringify({ agent: agent.name, gates: Object.fromEntries(entries) }, null, 2)}\n`,
    });
  }
  return out;
}

/**
 * Where a harness keeps its persona scopes, harness-home relative — the directory
 * whose children are the persona scopes. EMPTY for a harness that places no scoped
 * artifact.
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
      `${adapter.name}: scopedRel places a persona's stance manifest at '${rel}', which is not '<root>${tail}' — a worker cannot derive the persona scope from it.`,
    );
  }
  return rel.slice(0, -tail.length);
}
