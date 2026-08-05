/**
 * The pipeline composition `exemplify(D) ≜ accept( realize( name( produce(D) ) ) )`
 * over the LLM-authored plan, plus the writing wrapper `optimize`.
 *
 * Stage validators (`produce` · `name` · `realize`) check the mechanical laws
 * of each stage's OUTPUT — the stage act itself is an LLM pass (see
 * `types.ts`, SEMANTIC SEAM). `accept` is the gate: REC ≽ (mechanical leg:
 * the signifier carries the load, so every routed concept's anchor — and its
 * factor anchors — must appear in its home artifact), `minimal` (α injective:
 * no two concepts share an anchor), `conform` (register = ρ = LLM), and the
 * coverage equation routes ∪ delta = C_R, each concept exactly once.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { canonicalText, fragmentDigest } from './digest.js';
import { classifyRegister, humanMarkerHits } from './register.js';
import {
  type ArtifactSpec,
  type ConceptRecord,
  type DeltaEntry,
  type ExemplifyInput,
  ExemplifyRefusal,
  type OptimizeInput,
  type OptimizeResult,
  type RouteEntry,
  type RoutingManifest,
} from './types.js';

/** produce-leg laws: a non-empty lattice (`C_R = ∅ ⇒ ⊥`) of non-empty glosses. */
export function produce(
  concepts: readonly ConceptRecord[],
  reasons: string[],
): void {
  if (concepts.length === 0) {
    reasons.push('C_R = ∅ — an empty concept lattice is a malfunction');
    return;
  }
  concepts.forEach((c, i) => {
    if (!c.gloss || canonicalText(c.gloss).length === 0) {
      reasons.push(`concept[${i}]: empty gloss (produce fills gloss first)`);
    }
  });
}

/** name-leg laws: routed concepts carry anchors; α is injective (`minimal`). */
export function name(
  concepts: readonly ConceptRecord[],
  reasons: string[],
): void {
  const byAnchor = new Map<string, string>();
  concepts.forEach((c, i) => {
    if (c.home !== undefined && !c.anchor) {
      reasons.push(
        `concept[${i}] ('${c.gloss.slice(0, 40)}…'): routed but unnamed — anchor(k) = ⊥ ⇒ realize(k) = ⊥`,
      );
    }
    if (!c.anchor) return;
    const digest = fragmentDigest(c.gloss);
    const holder = byAnchor.get(c.anchor);
    if (holder !== undefined && holder !== digest) {
      reasons.push(
        `minimal fails: two concepts share the anchor '${c.anchor}' (one name ⇔ one concept)`,
      );
    }
    byAnchor.set(c.anchor, digest);
  });
}

/** realize-leg + accept laws over the artifact set: homes exist, register
 *  conforms, anchors (and factor anchors) are carried by their homes. */
export function realize(
  concepts: readonly ConceptRecord[],
  artifacts: readonly ArtifactSpec[],
  reasons: string[],
): void {
  if (artifacts.length === 0) {
    reasons.push('no realized artifact — cannot judge an unrealized concept');
  }
  const byPath = new Map(artifacts.map((a) => [a.path, a.body]));
  const anchors = new Set(
    concepts.map((c) => c.anchor).filter((a): a is string => Boolean(a)),
  );
  // conform: every emitted body holds its reader's register (ρ = LLM).
  for (const a of artifacts) {
    if (classifyRegister(a.body) === 'human') {
      const markers = [...new Set(humanMarkerHits(a.body))].slice(0, 6);
      reasons.push(
        `conform fails at '${a.path}': human-register emission (ρ = LLM); markers: ${markers.join(', ')}`,
      );
    }
  }
  for (const [i, c] of concepts.entries()) {
    if (c.home === undefined) continue;
    const body = byPath.get(c.home);
    if (body === undefined) {
      reasons.push(
        `concept[${i}] routed to '${c.home}' but no artifact realizes that home`,
      );
      continue;
    }
    // REC ≽, mechanical leg: the signifier carries the load — the anchor
    // must be recoverable from the home artifact. (The semantic ≽ judgment
    // against the gloss set is the LLM's, made at plan time.)
    if (c.anchor && !body.includes(c.anchor)) {
      reasons.push(
        `REC fails: anchor '${c.anchor}' not carried by its home '${c.home}'`,
      );
    }
    // cite-by-ref: a composite's factors are anchors of sibling concepts.
    for (const f of c.factors ?? []) {
      if (!anchors.has(f)) {
        reasons.push(
          `concept[${i}]: factor '${f}' is not the anchor of any concept (cite-by-ref broken)`,
        );
      }
    }
  }
}

/** Coverage equation: every concept in exactly one of routes[]/delta[]. */
function coverage(concepts: readonly ConceptRecord[], reasons: string[]): void {
  concepts.forEach((c, i) => {
    const routed = c.home !== undefined;
    if (routed && c.delta) {
      reasons.push(
        `concept[${i}] ('${c.gloss.slice(0, 40)}…'): in both routes[] and delta[] — exactly one`,
      );
    }
    if (!routed && !c.delta) {
      reasons.push(
        `withheld concept ('${c.gloss.slice(0, 40)}…'): unrouted and not in delta[] — the dropped idea R3 catches`,
      );
    }
  });
}

/**
 * The accept gate over an LLM-authored plan. Returns the R3 routing manifest
 * on pass; throws {@link ExemplifyRefusal} (loud, never a silent drop) on any
 * violated law. Digests found in `prior` route as `reuse` (idempotence:
 * re-optimizing accepted output is all-`reuse`, `delta = ∅`).
 */
export function exemplify(input: ExemplifyInput): RoutingManifest {
  const reasons: string[] = [];
  produce(input.concepts, reasons);
  name(input.concepts, reasons);
  realize(input.concepts, input.artifacts, reasons);
  coverage(input.concepts, reasons);
  if (reasons.length > 0) throw new ExemplifyRefusal(reasons);

  const priorDigests = new Set(
    (input.prior?.routes ?? []).map((r) => r.fragment_digest),
  );
  const routes: RouteEntry[] = [];
  const delta: DeltaEntry[] = [];
  for (const c of input.concepts) {
    const digest = fragmentDigest(c.gloss);
    if (c.home !== undefined) {
      routes.push({
        fragment_digest: digest,
        idea_gloss: c.gloss,
        home_slug: c.home,
        disposition: priorDigests.has(digest) ? 'reuse' : 'mint',
        rank: c.rank ?? 0,
      });
    } else {
      delta.push({ fragment_digest: digest, idea_gloss: c.gloss });
    }
  }
  return {
    source: input.source,
    exemplified_at: new Date().toISOString(),
    reader: input.reader ?? 'LLM',
    routes,
    delta,
  };
}

/**
 * `optimize` — the writing wrapper: run the gate, then write the artifact set
 * under `outDir` and the manifest at `manifestPath` (default:
 * `<dirname(source)>/.manifests/<basename(source)>.json`). Artifact rendering
 * is deterministic, so accepted re-runs are byte-identical.
 */
export function optimize(input: OptimizeInput): OptimizeResult {
  const manifest = exemplify(input);
  const written: string[] = [];
  for (const a of input.artifacts) {
    const path = isAbsolute(a.path) ? a.path : join(input.outDir, a.path);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, a.body, 'utf8');
    written.push(path);
  }
  const manifestPath =
    input.manifestPath ??
    join(dirname(input.source), '.manifests', `${basename(input.source)}.json`);
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  written.push(manifestPath);
  return { manifest, written };
}

/** Load a previously accepted manifest (the `prior` of an idempotent re-run). */
export function readManifest(path: string): RoutingManifest | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8')) as RoutingManifest;
}

/** The mechanical coverage equation `routes ∪ delta = C_R`, digest-exact:
 *  `missing` = concepts absent from the manifest; `extra` = manifest entries
 *  no concept produced. Both empty ⇔ the equation holds. */
export function checkCoverage(
  manifest: RoutingManifest,
  concepts: readonly ConceptRecord[],
): { missing: string[]; extra: string[] } {
  const conceptDigests = new Set(concepts.map((c) => fragmentDigest(c.gloss)));
  const manifestDigests = new Set([
    ...manifest.routes.map((r) => r.fragment_digest),
    ...manifest.delta.map((d) => d.fragment_digest),
  ]);
  return {
    missing: [...conceptDigests].filter((d) => !manifestDigests.has(d)),
    extra: [...manifestDigests].filter((d) => !conceptDigests.has(d)),
  };
}
