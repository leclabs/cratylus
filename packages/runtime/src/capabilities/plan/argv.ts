// ─────────────────────────────────────────────────────────────────────────────
// THE ARGUMENTS the three domain capabilities read (`design`, `plan`, `note`).
//
// Read through `../../verb-flags.ts` against the flags each verb takes,
// declared beside the verbs: `--flag value` or `--flag=value`, a bare `--flag`
// holding `''`, and a switch (`--repin`) given alone. A flag holding a set or
// a list (`--realizes`, `--deps`, `--factors`, `--blocks`, …) is repeated, one
// member each, and `--flag ''` gives the empty one. Every flag the verb does
// not take is refused as the arguments are read, before the verb reads
// anything else or writes. The first positional names what the verb acts on.
// Every write takes `--author`, `--reason` and `--cause`: who wrote it, why,
// and what caused it.
// ─────────────────────────────────────────────────────────────────────────────

import { CLI_BIN } from '../../bin-name.js';
import type { Invocation } from '../../ports/design.js';
import { type Argv, type VerbFlags, valueFlag } from '../../verb-flags.js';

/** The flags every write takes, each taking a value: who wrote it, why, and
 *  what caused it. */
export const INVOCATION = {
  author: valueFlag('Who makes this write'),
  reason: valueFlag('Why this write is made'),
  cause: valueFlag('What caused this write'),
} as const;

/** The last value of `flag`, `undefined` when it is not given. */
export function one(args: Argv, flag: string): string | undefined {
  return args.flags.get(flag)?.at(-1);
}

/** Every value of `flag` but the empty one, `undefined` when it is not given:
 *  `--flag ''` alone gives the empty list. */
export function many(args: Argv, flag: string): string[] | undefined {
  return args.flags.get(flag)?.filter((v) => v !== '');
}

/** The first positional, naming what `verb` acts on; refuses its absence. */
export function subject(
  args: Argv,
  capability: string,
  verb: string,
  what: string,
): string {
  const named = args.positionals[0];
  if (named === undefined || named.trim() === '')
    throw new Error(`${capability} ${verb}: name the ${what} it acts on`);
  return named;
}

/** Who writes, why, and what caused it, as a write's flags give them; refuses
 *  one left out. */
export function invocation(
  args: Argv,
  capability: string,
  verb: string,
): Invocation {
  const [author, reason, cause] = Object.keys(INVOCATION).map((f) =>
    one(args, f),
  );
  if (author === undefined || reason === undefined || cause === undefined)
    throw new Error(
      `${capability} ${verb}: give --author, --reason and --cause — every write says who made it, why, and what caused it`,
    );
  return { author, reason, cause };
}

/** The verb `argv` opens with, refusing one `verbs` does not declare. This is
 *  the refusal's ONE spelling: the command line prints this text, and every
 *  dispatcher, called as a library or from the command line, throws it. */
export function verbOf<V extends string>(
  argv: readonly string[],
  capability: string,
  verbs: VerbFlags<V>,
): V {
  const verb = argv[0];
  const declared = Object.keys(verbs);
  if (verb === undefined || !declared.includes(verb))
    throw new Error(
      `${capability}: unknown verb '${verb ?? ''}'; the verbs are ${declared.join(', ')}; run ${CLI_BIN} ${capability} --help`,
    );
  return verb as V;
}
