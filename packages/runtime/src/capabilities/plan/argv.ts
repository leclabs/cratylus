// ─────────────────────────────────────────────────────────────────────────────
// THE ARGUMENTS the three domain capabilities read (`design`, `plan`, `note`).
//
// `--flag value` or `--flag=value`; a flag holding a set or a list
// (`--realizes`, `--deps`, `--factors`, `--blocks`, …) is repeated, one member
// each, and `--flag ''` gives the empty one. A bare `--flag` holds `''`. The
// first positional names what the verb acts on. Every write takes `--author`,
// `--reason` and `--cause`: who wrote it, why, and what caused it.
// ─────────────────────────────────────────────────────────────────────────────

import type { Invocation } from '../../ports/design.js';

/** An argv tail: its positionals, and each flag's values in the order given. */
export interface Argv {
  readonly positionals: readonly string[];
  readonly flags: ReadonlyMap<string, readonly string[]>;
}

/** Read an argv tail into its positionals and flags. */
export function parseArgv(argv: readonly string[]): Argv {
  const positionals: string[] = [];
  const flags = new Map<string, string[]>();
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i] as string;
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }
    const body = token.slice(2);
    const eq = body.indexOf('=');
    let key = body;
    let value = '';
    if (eq !== -1) {
      key = body.slice(0, eq);
      value = body.slice(eq + 1);
    } else if (argv[i + 1] !== undefined && !argv[i + 1]?.startsWith('--')) {
      value = argv[++i] as string;
    }
    flags.set(key, [...(flags.get(key) ?? []), value]);
  }
  return { positionals, flags };
}

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
  const [author, reason, cause] = ['author', 'reason', 'cause'].map((f) =>
    one(args, f),
  );
  if (author === undefined || reason === undefined || cause === undefined)
    throw new Error(
      `${capability} ${verb}: give --author, --reason and --cause — every write says who made it, why, and what caused it`,
    );
  return { author, reason, cause };
}

/** The verb `argv` opens with, refusing one `verbs` does not hold. */
export function verbOf<V extends string>(
  argv: readonly string[],
  capability: string,
  verbs: readonly V[],
): V {
  const verb = argv[0];
  if (verb === undefined || !(verbs as readonly string[]).includes(verb))
    throw new Error(
      `${capability}: unknown verb '${verb ?? ''}' (expected ${verbs.join('|')})`,
    );
  return verb as V;
}
