// ─────────────────────────────────────────────────────────────────────────────
// VERB FLAGS — the verbs each capability has, declared once beside the
// capability: what each does, the positional it acts on, and the flags it
// takes, each with the line its help prints; the one reader of a verb's
// arguments against that declaration, and the one refusal of a flag the verb
// does not take.
//
// A capability declares, for each of its verbs, a one-line summary, its
// positional, and the flags it takes (named without their leading `--`), each
// with whether it takes a value and a one-line description. A flag cannot be
// taken without being described: the declaration does not compile otherwise.
// A flag that takes a value is given as `--flag value` or `--flag=value`; it
// takes the next token unless that token begins with `--`, so `-` and `-5` are
// values, and given bare it holds `''`. A flag that takes no value (a switch)
// is given as `--flag` alone and never takes the next token. Either may be
// repeated; the reader keeps each flag's values in the order given. A token
// not spelled with a dash, or a lone `-`, is a positional.
//
// A verb takes a flag only as `--name`; one spelled with a single dash (`-x`,
// `-gloss`) is an attempted flag no verb takes, and a switch given a value
// (`--repin=x`) is one its verb does not take. A flag the verb does not take,
// given without `=value`, takes the next token as its value unless that token
// is flag-shaped: `--` anything, or a single dash, a letter, then letters,
// digits and dashes, with an optional `=value`. So `--bdy '- a list'` and
// `--snk -s.jsonl` name one flag each, and `--bdy -x` names two. Every flag
// given that the verb does not take is refused, in one refusal, as the
// arguments are read and so before the verb acts: nothing is written. The
// refusal names each such flag as it was given, the verb's nearest flag to
// each when one is close, and every flag the verb takes, and asks the caller
// to correct the call and run it again.
//
// Close means within one edit for every three letters of the flag's name, and
// at least one; an edit inserts, deletes or changes a letter, or swaps two
// neighbours. A flag farther than that from every flag the verb takes gets no
// suggestion.
// ─────────────────────────────────────────────────────────────────────────────

/** One flag a verb takes: whether it `takes` a value or is a `switch`, taking
 *  none, and the line its help prints for it. */
export interface Flag {
  readonly takes: 'value' | 'switch';
  readonly description: string;
}

/** A flag that takes a value, with the line its help prints for it. */
export const valueFlag = (description: string) =>
  ({ takes: 'value', description }) as const;

/** A flag that takes no value, with the line its help prints for it. */
export const switchFlag = (description: string) =>
  ({ takes: 'switch', description }) as const;

/** The flags one verb takes, in the order its refusal lists them, each with
 *  the line its help prints for it: a flag cannot be taken undescribed. */
export type Flags = { readonly [flag: string]: Flag };

/** One verb, declared once: what it does in a line, the positional it acts on
 *  (`<unit>` where it must be given, `[plan]` where it may be, `null` for
 *  none), and the flags it takes. Its help is printed from this, and its
 *  arguments are read against it. */
export interface Verb {
  readonly summary: string;
  readonly positional: string | null;
  readonly flags: Flags;
}

/** The verbs of a capability, by verb. */
export type VerbFlags<V extends string = string> = {
  readonly [verb in V]: Verb;
};

/** An argv tail: its positionals, and each flag's values in the order given;
 *  a switch holds `''` each time it is given. */
export interface Argv {
  readonly positionals: readonly string[];
  readonly flags: ReadonlyMap<string, readonly string[]>;
}

/** The edits between `a` and `b`: letters inserted, deleted or changed, and
 *  neighbours swapped. */
function edits(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      const row = d[i] as number[];
      const up = d[i - 1] as number[];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(
        (up[j] as number) + 1,
        (row[j - 1] as number) + 1,
        (up[j - 1] as number) + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        row[j] = Math.min(
          row[j] as number,
          ((d[i - 2] as number[])[j - 2] as number) + 1,
        );
    }
  return (d[a.length] as number[])[b.length] as number;
}

/** The flag `declared` takes nearest `flag`, spelled as given, when one is
 *  close, measured on its name without any `=value`; the first declared wins a
 *  tie. */
export function nearest(flag: string, declared: Verb): string | undefined {
  const name = flag.replace(/^-+/, '').split('=')[0] as string;
  const within = Math.max(1, Math.floor(name.length / 3));
  let best: { flag: string; edits: number } | undefined;
  for (const taken of Object.keys(declared.flags)) {
    const n = edits(name, taken);
    if (n <= within && (best === undefined || n < best.edits))
      best = { flag: taken, edits: n };
  }
  return best?.flag;
}

/** `items` as a reader lists them, the last joined by `last`: `a`,
 *  `a and b`, `a, b and c`. */
function listed(items: readonly string[], last: 'and' | 'or'): string {
  return items.length < 2
    ? items.join('')
    : `${items.slice(0, -1).join(', ')} ${last} ${items.at(-1)}`;
}

/** The refusal of `flags`, spelled as given, which `verb` of `capability`
 *  does not take, `declared` being the verb and so every flag it does. */
export function refused(
  capability: string,
  verb: string,
  flags: readonly string[],
  declared: Verb,
): string {
  const named = flags.map((flag) => {
    const near = nearest(flag, declared);
    return near === undefined
      ? flag
      : `${flag} (the nearest flag it takes is --${near})`;
  });
  const every = Object.keys(declared.flags);
  return [
    `${capability} ${verb}: it does not take ${listed(named, 'or')}.`,
    every.length === 0
      ? ' It takes no flags.'
      : ` It takes ${listed(
          every.map((f) => `--${f}`),
          'and',
        )}.`,
    ' Nothing was written; correct the call and run it again.',
  ].join('');
}

/** A token read as an attempted flag even after a flag the verb does not
 *  take: `--` anything, or a single dash, a letter, then letters, digits and
 *  dashes, with an optional `=value`. */
const FLAG_SHAPED = /^(?:--|-[A-Za-z][A-Za-z0-9-]*(?:=|$))/;

/** Read `argv`, the tail of `verb` of `capability`, against `declared`, the
 *  verb and so every flag it takes: its positionals and each flag's values in
 *  the order given. Refuses, in one refusal, every flag given that the verb
 *  does not take. */
export function readArgv(
  argv: readonly string[],
  capability: string,
  verb: string,
  declared: Verb,
): Argv {
  const positionals: string[] = [];
  const flags = new Map<string, string[]>();
  const untaken = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i] as string;
    if (!token.startsWith('-') || token === '-') {
      positionals.push(token);
      continue;
    }
    const eq = token.indexOf('=');
    const flag = eq === -1 ? token : token.slice(0, eq);
    const name = token.startsWith('--') ? flag.slice(2) : undefined;
    const kind =
      name !== undefined && Object.hasOwn(declared.flags, name)
        ? declared.flags[name]?.takes
        : undefined;
    if (name !== undefined && kind === 'value') {
      let value = '';
      if (eq !== -1) value = token.slice(eq + 1);
      else if (!(argv[i + 1] ?? '--').startsWith('--'))
        value = argv[++i] as string;
      flags.set(name, [...(flags.get(name) ?? []), value]);
    } else if (name !== undefined && kind === 'switch') {
      if (eq === -1) flags.set(name, [...(flags.get(name) ?? []), '']);
      else untaken.add(token);
    } else {
      untaken.add(flag);
      if (eq === -1 && !FLAG_SHAPED.test(argv[i + 1] ?? '--')) i++;
    }
  }
  if (untaken.size > 0)
    throw new Error(refused(capability, verb, [...untaken], declared));
  return { positionals, flags };
}
