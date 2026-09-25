// ─────────────────────────────────────────────────────────────────────────────
// THE VIEW — a domain's current state rendered at query time for its reader, an
// agent, in three layers:
//
//   1. a header naming the commit the state was computed at, with counts;
//   2. everything that must be resolved before the rest is trusted;
//   3. the whole domain in its own structure, one line for every live item,
//      including one the structure cannot yet place, with the reason why.
//
// Naming one item drills into it in full, and into every version of a diverged
// item: the header and the resolve-first layer stay, and the item replaces the
// body.
//
// Every item and every reference to one arrives as a `Name`: its name, or, where
// a merge left that name held by more than one entity, its name with its
// identity beside it. A name is held by every live entity carrying it, by a
// withdrawn entity keeping it, and by a diverged entity for every name its
// heads carry. The caller decides which names carry an identity; the view
// prints each `Name` as given, everywhere it prints, and joins and selects items
// by it, a diverged item by any of its names. Every identity printed drills to
// an item: a withdrawn holder to its last version, marked withdrawn. An identity
// is never printed otherwise, and no output carries a record id, an envelope, a
// head as such or a file path.
//
// The view computes nothing a domain owns. It declares the shapes it renders and
// receives every state, kind, wave, frontier and flag already computed, as
// display text or as given; `domain-interface` maps each domain's fold onto
// these shapes. Arranging the given items is the view's: the lattice root to
// primitive from the factors it is given, units by the wave they are given,
// notes by kind and topic.
//
// This module holds what the three domains' views share; each domain's view is
// its own module (`design.ts`, `plan.ts`, `notebook.ts`).
// ─────────────────────────────────────────────────────────────────────────────

/** How the view names an item: its name, or its name with its identity where a
 *  merge left the name held by more than one entity and it cannot address one
 *  alone. */
export type Name =
  | string
  | { readonly name: string; readonly identity: string };

/** A `Name` as it prints: `gamma`, or `gamma (identity <identity>)`. */
export function named(name: Name): string {
  return typeof name === 'string'
    ? name
    : `${name.name} (identity ${name.identity})`;
}

/** Whether `query` names the item named `name`: exactly, or, when `query` is a
 *  bare name, every item carrying it, identified or not. */
export function denotes(query: Name, name: Name): boolean {
  return typeof query === 'string'
    ? (typeof name === 'string' ? name : name.name) === query
    : named(query) === named(name);
}

/** An entity with more than one head: the version each head holds, and whether
 *  a retraction stands among them. */
export interface Diverged<T> {
  /** Every name its heads carry, supplied by the caller, and a name it keeps
   *  when no version is left to carry one. */
  readonly names: readonly Name[];
  readonly versions: readonly T[];
  readonly retracted: boolean;
}

/** One holder of a name held by more than one entity: its identity, and whether
 *  it holds the name as a live, a withdrawn or a diverged entity. */
export interface Holder {
  readonly identity: string;
  readonly as: 'live' | 'withdrawn' | 'diverged';
}

/** A domain law broken across entities by a merge: a live entity referencing a
 *  withdrawn one, a cycle, one name held by more than one entity (each holder
 *  printed with its identity beside the name and how it holds it), or more than
 *  one plan holding the state that admits one. */
export type Incoherence =
  | {
      readonly kind: 'retracted';
      readonly name: Name;
      readonly reference: Name;
    }
  | { readonly kind: 'cycle'; readonly names: readonly Name[] }
  | {
      readonly kind: 'name';
      readonly name: string;
      readonly holders: readonly Holder[];
    }
  | {
      readonly kind: 'exclusive';
      /** The state admitting one plan, as display text. */
      readonly state: string;
      readonly names: readonly Name[];
    };

/** One line of `text`: every run of whitespace collapsed to one space. */
export function inline(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** `n` and the noun that counts it. */
export function count(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Layer 1: the subject, the commit and the counts, on the first line. */
export function header(
  subject: string,
  commit: string,
  counts: readonly string[],
): string {
  return `${subject} at ${commit}: ${counts.join(' · ')}`;
}

/** Layer 2: every item to resolve first, or a line saying there is none. */
export function resolveFirst(items: readonly string[]): string[] {
  return items.length === 0
    ? ['resolve first: none']
    : ['resolve first:', ...items.map((item) => `  ${item}`)];
}

/** A diverged entity: its names, then each version it holds as `render` draws
 *  it — on the version's own line when that is one line, else beneath it. */
export function divergedLines<T>(
  diverged: Diverged<T>,
  render: (version: T) => readonly string[],
): string[] {
  return [
    `diverged: ${diverged.names.map(named).join(' or ')}`,
    ...diverged.versions.flatMap((version) => {
      const lines = render(version);
      return lines.length === 1
        ? [`  version: ${lines[0]}`]
        : ['  version:', ...lines.map((line) => `    ${line}`)];
    }),
    ...(diverged.retracted ? ['  retracted'] : []),
  ];
}

export function incoherenceLine(incoherence: Incoherence): string {
  switch (incoherence.kind) {
    case 'retracted':
      return `incoherent: ${named(incoherence.name)} references withdrawn ${named(incoherence.reference)}`;
    case 'cycle':
      return `incoherent: cycle among ${incoherence.names.map(named).join(', ')}`;
    case 'name': {
      const { name, holders } = incoherence;
      return `incoherent: ${name} is held by ${holders.length} items: ${holders.map(({ identity, as }) => `${named({ name, identity })} ${as}`).join(', ')}`;
    }
    case 'exclusive':
      return `incoherent: ${incoherence.names.length} plans in ${incoherence.state}, which admits one: ${incoherence.names.map(named).join(', ')}`;
  }
}

/** Whether `query` names a diverged item by any of its names. */
export function denotesAny(query: Name, names: readonly Name[]): boolean {
  return names.some((name) => denotes(query, name));
}

/** The drilled items, or a line saying `query` names nothing the view holds. */
export function drilled(query: Name, items: readonly string[][]): string[] {
  return items.length === 0
    ? [`nothing live, withdrawn or diverged is named ${named(query)}`]
    : items.flat();
}

/** A labelled field of an item in full: inline when `text` is one line, else
 *  the label and the text indented beneath it. */
export function field(label: string, text: string): string[] {
  const lines = text.trim().split('\n');
  return lines.length === 1
    ? [`  ${label}: ${lines[0]}`]
    : [`  ${label}:`, ...lines.map((line) => `    ${line}`)];
}

/** A labelled list of an item in full, one entry per line. */
export function list(label: string, entries: readonly string[]): string[] {
  return entries.length === 0
    ? [`  ${label}: none`]
    : [`  ${label}:`, ...entries.map((entry) => `    - ${inline(entry)}`)];
}
