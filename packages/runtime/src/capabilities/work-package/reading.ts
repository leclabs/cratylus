// ─────────────────────────────────────────────────────────────────────────────
// What a cut's work packages make of its visible examples: the packages SERVING
// each concept, the package OWNING each example, and the LEVELS of their
// dependency graph. Pure: a cut and its packages in, the reading out.
//
// A package names a concept by its plain name, or as `<context>/<name>` where
// the cut's contexts share the name; it serves the concept of that name in
// each context the name resolves to. An example's candidates are the packages
// serving any concept it names in its own context; its owner is its one
// candidate, or else the one candidate every other candidate lies below in the
// dependency graph (a spanning example goes downstream), or none.
// ─────────────────────────────────────────────────────────────────────────────

import type { Cut, CutConcept, CutExample } from './cut.js';
import { type DependencyGraph, dependencyGraph } from './graph.js';

/** A package as the reading needs it: its name, what it serves, what it
 *  depends on. */
export interface ReadPackage {
  readonly name: string;
  readonly concepts: readonly string[];
  readonly dependsOn: readonly string[];
}

/** One concept of the cut and the packages serving it. */
export interface ServedConcept extends CutConcept {
  readonly servedBy: readonly string[];
}

/** One visible example, its candidate packages and its owner. */
export interface OwnedExample extends CutExample {
  readonly candidates: readonly string[];
  readonly package: string | null;
}

/** The reading of a cut by its packages. */
export interface CutReading {
  readonly graph: DependencyGraph;
  readonly concepts: readonly ServedConcept[];
  readonly examples: readonly OwnedExample[];
  /** Every concept no package serves, by its label (see `conceptLabel`). */
  readonly unserved: readonly string[];
  /** Every example with no owner, by its ref. */
  readonly unowned: readonly string[];
}

/** How a concept of `cut` is named where a name is wanted: its plain name, or
 *  `<context>/<name>` when the cut's contexts share the name. */
export function conceptLabel(cut: Cut, concept: CutConcept): string {
  return cut.concepts.some(
    (c) => c.name === concept.name && c.context !== concept.context,
  )
    ? `${concept.context}/${concept.name}`
    : concept.name;
}

/** The concepts of `cut` that `given`, a package's concept as given, names:
 *  none when it names no concept of the cut, several when a plain name is
 *  shared by the cut's contexts. */
export function conceptsNamed(cut: Cut, given: string): CutConcept[] {
  return cut.concepts.filter(
    (c) => c.name === given || `${c.context}/${c.name}` === given,
  );
}

/** The reading of `cut` by `packages`. */
export function readCut(
  cut: Cut,
  packages: readonly ReadPackage[],
): CutReading {
  const graph = dependencyGraph(packages);
  const serves = (p: ReadPackage, concept: CutConcept) =>
    p.concepts.some(
      (given) =>
        given === concept.name ||
        given === `${concept.context}/${concept.name}`,
    );
  const concepts = cut.concepts.map((concept) => ({
    ...concept,
    servedBy: packages.filter((p) => serves(p, concept)).map((p) => p.name),
  }));
  const examples = cut.examples.map((e) => {
    const candidates = packages
      .filter((p) =>
        e.concepts.some((name) => serves(p, { name, context: e.context })),
      )
      .map((p) => p.name);
    const downstream = candidates.filter((c) => {
      const below = graph.dependencies(c);
      return candidates.every((o) => o === c || below.has(o));
    });
    const owner =
      candidates.length === 1
        ? candidates[0]
        : downstream.length === 1
          ? downstream[0]
          : undefined;
    return { ...e, candidates, package: owner ?? null };
  });
  return {
    graph,
    concepts,
    examples,
    unserved: concepts
      .filter((c) => c.servedBy.length === 0)
      .map((c) => conceptLabel(cut, c)),
    unowned: examples.filter((e) => e.package === null).map((e) => e.ref),
  };
}
