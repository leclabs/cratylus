// ─────────────────────────────────────────────────────────────────────────────
// The CONTEXT OVERVIEW: one bounded context as a reader of it is first told
// about it, computed from the concept journal and the ledger on every request
// and never stored.
//
// It gives the context's subject and its relation in the context map, then its
// live concepts WHOLE BEFORE PARTS, then its open decisions, then the cuts in
// flight whose contexts include it, and the same as plain prose (`account`).
//
// ORDER: first the concepts no other live concept is built from, in recorded
// order; then breadth-first, each remaining concept right after the first
// already-shown concept built from it, ties in recorded order; the concepts
// reachable only through a cycle follow in recorded order, and each cycle is
// named. Each concept appears once.
// ─────────────────────────────────────────────────────────────────────────────

import type { CutPhase } from '../work-package/index.js';
import type { ContextView, DecisionView, Meaning } from './views.js';

/** A concept as the overview gives it: its name, current meaning and parts. */
export interface OverviewConcept {
  readonly name: string;
  readonly meaning: string;
  readonly builtFrom: readonly string[];
}

/** One context's overview. */
export interface ContextOverview {
  readonly context: string;
  readonly subject: string | null;
  readonly relation: string | null;
  readonly concepts: readonly OverviewConcept[];
  readonly cycles: readonly (readonly string[])[];
  readonly openDecisions: readonly { id: string; title: string }[];
  readonly cutsInFlight: readonly {
    cut: string;
    phase: CutPhase;
    branch: string;
  }[];
  readonly account: string;
}

/** A cut as the ledger records it, with its phase now. */
export interface LedgerCut {
  readonly cut: string;
  readonly branch: string;
  readonly contexts: readonly string[];
  readonly phase: CutPhase;
}

/** `concepts`, in recorded order, whole before parts, and the cycles among
 *  those no root reaches, each in recorded order. */
export function wholeBeforeParts<C extends Meaning>(
  concepts: readonly C[],
): {
  ordered: C[];
  cycles: string[][];
} {
  const byName = new Map(concepts.map((c) => [c.name, c]));
  const rank = new Map(concepts.map((c, i) => [c.name, i]));
  const parts = (c: Meaning) =>
    [...new Set(c.builtFrom)]
      .filter((name) => byName.has(name))
      .sort((a, b) => (rank.get(a) as number) - (rank.get(b) as number));
  const wholes = new Set(concepts.flatMap((c) => parts(c)));
  const ordered = concepts.filter((c) => !wholes.has(c.name));
  const shown = new Set(ordered.map((c) => c.name));
  for (let i = 0; i < ordered.length; i++)
    for (const name of parts(ordered[i] as C))
      if (!shown.has(name)) {
        shown.add(name);
        ordered.push(byName.get(name) as C);
      }
  const unreached = concepts.filter((c) => !shown.has(c.name));
  ordered.push(...unreached);
  return { ordered, cycles: cyclesAmong(unreached, parts) };
}

/** The cycles among `concepts` by the parts each is built from: each strongly
 *  connected set of two or more, or one built from itself, in recorded order. */
function cyclesAmong(
  concepts: readonly Meaning[],
  parts: (c: Meaning) => string[],
): string[][] {
  const among = new Map(concepts.map((c) => [c.name, c]));
  const next = (name: string) =>
    parts(among.get(name) as Meaning).filter((p) => among.has(p));
  const reach = (from: string): Set<string> => {
    const seen = new Set<string>();
    const queue = next(from);
    while (queue.length > 0) {
      const name = queue.shift() as string;
      if (seen.has(name)) continue;
      seen.add(name);
      queue.push(...next(name));
    }
    return seen;
  };
  const reaches = new Map(concepts.map((c) => [c.name, reach(c.name)]));
  const placed = new Set<string>();
  const cycles: string[][] = [];
  for (const { name } of concepts) {
    if (placed.has(name) || !reaches.get(name)?.has(name)) continue;
    const cycle = concepts
      .map((c) => c.name)
      .filter(
        (other) =>
          reaches.get(name)?.has(other) && reaches.get(other)?.has(name),
      );
    for (const member of cycle) placed.add(member);
    cycles.push(cycle);
  }
  return cycles;
}

/** A list of words in prose: `a`, `a and b`, `a, b and c`. */
const listed = (words: readonly string[]): string =>
  words.length <= 1
    ? (words[0] ?? '')
    : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;

/** A sentence ending as one. */
const sentence = (text: string): string => {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

/** The overview of `design`'s context, given every decision and every cut the
 *  ledger records. */
export function overviewOf(
  design: Omit<ContextView, 'concepts'> & {
    readonly concepts: readonly Meaning[];
  },
  decisions: readonly DecisionView[],
  cuts: readonly LedgerCut[],
): ContextOverview {
  const context = design.name;
  const { ordered, cycles } = wholeBeforeParts(design.concepts);
  const open = decisions
    .filter((d) => d.context === context && d.status === 'open')
    .map((d) => ({ id: d.id, title: d.title }));
  const inFlight = cuts
    .filter((c) => c.phase === 'in flight' && c.contexts.includes(context))
    .map(({ cut, phase, branch }) => ({ cut, phase, branch }));

  const opening =
    design.subject !== null
      ? [
          `The ${context} context is about this: ${sentence(design.subject)}`,
          (design.relation ?? '').trim() === ''
            ? 'No relation to other contexts in the context map is recorded.'
            : `In the context map: ${sentence(design.relation as string)}`,
        ]
      : design.competingDescriptions.length === 0
        ? [
            `The ${context} context has no current description of its subject or its place in the context map.`,
          ]
        : [
            `The ${context} context has competing descriptions that no later one has settled: ${design.competingDescriptions
              .map(
                (d) =>
                  `“${d.subject.trim()}”${d.relation.trim() === '' ? '' : ` relating to the others as “${d.relation.trim()}”`}`,
              )
              .join('; ')}.`,
          ];
  const conceptProse =
    ordered.length === 0
      ? ['It has no live concept yet.']
      : [
          `Its concepts, each whole before the parts it is built from: ${listed(ordered.map((c) => c.name))}.`,
          ...ordered.map((c) => {
            const built = c.builtFrom.length
              ? ` It is built from ${listed(c.builtFrom)}.`
              : '';
            return `${c.name[0]?.toUpperCase()}${c.name.slice(1)} means: ${sentence(c.wording)}${built}`;
          }),
        ];
  const cycleProse = cycles.map(
    (cycle) =>
      `${listed(cycle)} are built from one another in a cycle, so no whole among them comes first.`,
  );
  const competingProse =
    design.competing.length === 0
      ? []
      : [
          `Competing versions of ${listed(design.competing.map((c) => c.name))} await a later version that settles them, so no current meaning is given for ${design.competing.length === 1 ? 'it' : 'them'}.`,
        ];
  const decisionProse =
    open.length === 0
      ? 'No decision is open.'
      : `Still open, not settled meaning: ${open
          .map((d) => `the decision ${d.id}, “${d.title}”`)
          .join('; ')}.`;
  const cutProse =
    inFlight.length === 0
      ? 'No cut is in flight.'
      : `In flight: ${inFlight
          .map((c) => `the cut ${c.cut}, on the branch ${c.branch}`)
          .join('; ')}.`;

  return {
    context,
    subject: design.subject,
    relation: design.relation,
    concepts: ordered.map((c) => ({
      name: c.name,
      meaning: c.wording,
      builtFrom: [...c.builtFrom],
    })),
    cycles,
    openDecisions: open,
    cutsInFlight: inFlight,
    account: [
      opening.join(' '),
      [...conceptProse, ...cycleProse, ...competingProse].join(' '),
      decisionProse,
      cutProse,
    ].join('\n\n'),
  };
}
