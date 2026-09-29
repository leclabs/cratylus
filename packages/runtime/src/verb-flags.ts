// ─────────────────────────────────────────────────────────────────────────────
// VERB FLAGS — the flags each capability verb takes, declared once beside the
// verb, and the one refusal of a flag the verb does not take.
//
// A capability declares, for each of its verbs, the flags it takes (named
// without their leading `--`). A flag given that the verb does not take is
// refused before the verb acts, so nothing is written. The refusal names the
// flag, the verb's nearest flag when one is close, and every flag the verb
// takes, and asks the caller to correct the call and run it again.
//
// Close means within one edit for every three letters of the flag given, and
// at least one; an edit inserts, deletes or changes a letter, or swaps two
// neighbours. A flag farther than that from every flag the verb takes gets no
// suggestion.
// ─────────────────────────────────────────────────────────────────────────────

/** The flags each verb of a capability takes, by verb. */
export type VerbFlags<V extends string = string> = {
  readonly [verb in V]: readonly string[];
};

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

/** The flag of `takes` nearest `flag`, when one is close; the first declared
 *  wins a tie. */
export function nearest(
  flag: string,
  takes: readonly string[],
): string | undefined {
  const within = Math.max(1, Math.floor(flag.length / 3));
  let best: { flag: string; edits: number } | undefined;
  for (const taken of takes) {
    const n = edits(flag, taken);
    if (n <= within && (best === undefined || n < best.edits))
      best = { flag: taken, edits: n };
  }
  return best?.flag;
}

/** `flags` as a reader lists them: `--a`, `--a and --b`, `--a, --b and --c`. */
function listed(flags: readonly string[]): string {
  const shown = flags.map((f) => `--${f}`);
  return shown.length < 2
    ? shown.join('')
    : `${shown.slice(0, -1).join(', ')} and ${shown.at(-1)}`;
}

/** The refusal of `flag`, which `verb` of `capability` does not take, `takes`
 *  being every flag it does. */
export function refused(
  capability: string,
  verb: string,
  flag: string,
  takes: readonly string[],
): string {
  const near = nearest(flag, takes);
  return [
    `${capability} ${verb}: it does not take --${flag}`,
    near === undefined ? '' : `; the nearest flag it takes is --${near}`,
    takes.length === 0
      ? '. It takes no flags.'
      : `. It takes ${listed(takes)}.`,
    ' Nothing was written; correct the call and run it again.',
  ].join('');
}

/** Refuse the first of `given` that `verb` of `capability` does not take,
 *  `takes` being every flag it does. */
export function refuseUnknown(
  capability: string,
  verb: string,
  given: Iterable<string>,
  takes: readonly string[],
): void {
  for (const flag of given)
    if (!takes.includes(flag))
      throw new Error(refused(capability, verb, flag, takes));
}
