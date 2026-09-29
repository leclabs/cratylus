// ─────────────────────────────────────────────────────────────────────────────
// VERB FLAGS — the flags each capability verb takes, declared once beside the
// verb, the one reader of a verb's arguments against that declaration, and the
// one refusal of a flag the verb does not take.
//
// A capability declares, for each of its verbs, the flags it takes (named
// without their leading `--`) and whether each takes a value. A flag that
// takes a value is given as `--flag value` or `--flag=value`; it takes the
// next token unless that token begins with `--`, so `-` and `-5` are values,
// and given bare it holds `''`. A flag that takes no value (a switch) is given
// as `--flag` alone and never takes the next token. Either may be repeated;
// the reader keeps each flag's values in the order given. A token not spelled
// with a dash, or a lone `-`, is a positional.
//
// A verb takes a flag only as `--name`; one spelled with a single dash (`-x`,
// `-gloss`) is an attempted flag no verb takes, and a switch given a value
// (`--repin=x`) is one its verb does not take. Every flag given that the verb
// does not take is refused, in one refusal, as the arguments are read and so
// before the verb acts: nothing is written. The refusal names each such flag
// as it was given, the verb's nearest flag to each when one is close, and
// every flag the verb takes, and asks the caller to correct the call and run
// it again.
//
// Close means within one edit for every three letters of the flag's name, and
// at least one; an edit inserts, deletes or changes a letter, or swaps two
// neighbours. A flag farther than that from every flag the verb takes gets no
// suggestion.
// ─────────────────────────────────────────────────────────────────────────────

/** The flags one verb takes, in the order its refusal lists them, and whether
 *  each takes a `value` or is a `switch`, taking none. */
export type Flags = { readonly [flag: string]: 'value' | 'switch' };

/** The flags each verb of a capability takes, by verb. */
export type VerbFlags<V extends string = string> = {
  readonly [verb in V]: Flags;
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

/** The flag of `takes` nearest `flag`, spelled as given, when one is close;
 *  the first declared wins a tie. */
export function nearest(flag: string, takes: Flags): string | undefined {
  const name = flag.replace(/^-+/, '');
  const within = Math.max(1, Math.floor(name.length / 3));
  let best: { flag: string; edits: number } | undefined;
  for (const taken of Object.keys(takes)) {
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
 *  does not take, `takes` being every flag it does. */
export function refused(
  capability: string,
  verb: string,
  flags: readonly string[],
  takes: Flags,
): string {
  const named = flags.map((flag) => {
    const near = nearest(flag, takes);
    return near === undefined
      ? flag
      : `${flag} (the nearest flag it takes is --${near})`;
  });
  const every = Object.keys(takes);
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

/** Read `argv`, the tail of `verb` of `capability`, against `takes`, every
 *  flag it takes: its positionals and each flag's values in the order given.
 *  Refuses, in one refusal, every flag given that the verb does not take. */
export function readArgv(
  argv: readonly string[],
  capability: string,
  verb: string,
  takes: Flags,
): Argv {
  const positionals: string[] = [];
  const flags = new Map<string, string[]>();
  const untaken = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i] as string;
    if (!token.startsWith('--')) {
      if (token.startsWith('-') && token !== '-')
        untaken.add(token.split('=')[0] as string);
      else positionals.push(token);
      continue;
    }
    const eq = token.indexOf('=');
    const flag = eq === -1 ? token : token.slice(0, eq);
    const name = flag.slice(2);
    const kind = Object.hasOwn(takes, name) ? takes[name] : undefined;
    if (kind === undefined || (kind === 'switch' && eq !== -1)) {
      untaken.add(kind === undefined ? flag : token);
      continue;
    }
    let value = '';
    if (eq !== -1) value = token.slice(eq + 1);
    else if (kind === 'value' && !(argv[i + 1] ?? '--').startsWith('--'))
      value = argv[++i] as string;
    flags.set(name, [...(flags.get(name) ?? []), value]);
  }
  if (untaken.size > 0)
    throw new Error(refused(capability, verb, [...untaken], takes));
  return { positionals, flags };
}
