// ─────────────────────────────────────────────────────────────────────────────
// The DEPENDENCY GRAPH of a cut's work packages, computed with @dagrejs/graphlib
// (decisions 0010, 0017) and wrapped here so nothing else names the library.
//
// An edge runs from a package to each package it depends on. Its CYCLES are the
// packages that depend on each other, each cycle named by its packages. Its
// LEVELS exist only without a cycle: a package's level is 1 plus the longest
// chain of dependencies below it, so the packages of a level depend only on
// lower levels and are handed out together.
// ─────────────────────────────────────────────────────────────────────────────

import { Graph, alg } from '@dagrejs/graphlib';

/** A package as the graph reads it: its name and the packages it depends on. */
export interface Node {
  readonly name: string;
  readonly dependsOn: readonly string[];
}

/** The dependency graph of `nodes`, given in the order they were submitted. */
export interface DependencyGraph {
  /** Each cycle by its packages, sorted; none when the graph has no cycle. */
  readonly cycles: readonly (readonly string[])[];
  /** The packages of each level from level 1, in submission order; `null`
   *  while the graph has a cycle. */
  readonly levels: readonly (readonly string[])[] | null;
  /** Every package `name` depends on, directly or through others. */
  dependencies(name: string): ReadonlySet<string>;
}

export function dependencyGraph(nodes: readonly Node[]): DependencyGraph {
  const graph = new Graph({ directed: true });
  for (const { name } of nodes) graph.setNode(name);
  for (const { name, dependsOn } of nodes)
    for (const dependency of dependsOn) graph.setEdge(name, dependency);
  const cycles = alg
    .findCycles(graph)
    .map((cycle) => [...cycle].sort())
    .sort((a, b) => (a[0] ?? '').localeCompare(b[0] ?? ''));
  return {
    cycles,
    levels: cycles.length > 0 ? null : levelsOf(graph, nodes),
    dependencies(name) {
      // A package in a cycle reaches itself; it never depends on itself here.
      return new Set(alg.preorder(graph, [name]).filter((n) => n !== name));
    },
  };
}

/** The levels of the acyclic `graph`: dependencies are sorted first, and each
 *  package sits one above its highest dependency. */
function levelsOf(graph: Graph, nodes: readonly Node[]): string[][] {
  const level = new Map<string, number>();
  for (const name of alg.topsort(graph).reverse())
    level.set(
      name,
      1 +
        Math.max(
          0,
          ...(graph.successors(name) ?? []).map((d) => level.get(d) ?? 0),
        ),
    );
  const levels: string[][] = [];
  for (const { name } of nodes) {
    const at = (level.get(name) as number) - 1;
    for (let i = levels.length; i <= at; i++) levels.push([]);
    (levels[at] as string[]).push(name);
  }
  return levels;
}
