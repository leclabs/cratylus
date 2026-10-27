// ─────────────────────────────────────────────────────────────────────────────
// THE VERB a capability's argv opens with: the one home of the refusal of a verb
// the capability does not declare, and of any token after the verb, which takes
// none; spoken alike by the command line and by every dispatcher called as a
// library.
// ─────────────────────────────────────────────────────────────────────────────

import { CLI_BIN } from '../../bin-name.js';
import type { Verbs } from '../../verbs.js';

/** The verb `argv` opens with, refusing one `verbs` does not declare, and any
 *  token after it: a verb takes no arguments. These refusals have this ONE
 *  spelling: the command line prints this text, and every dispatcher, called as
 *  a library or from the command line, throws it. */
export function verbOf<V extends string>(
  argv: readonly string[],
  capability: string,
  verbs: Verbs<V>,
): V {
  const [verb, ...rest] = argv;
  const declared = Object.keys(verbs);
  if (verb === undefined || !declared.includes(verb))
    throw new Error(
      `${capability}: unknown verb '${verb ?? ''}'; the verbs are ${declared.join(', ')}; run ${CLI_BIN} ${capability} --help`,
    );
  if (rest.length > 0)
    throw new Error(
      `${capability} ${verb}: it takes no arguments, and was given ${rest.map((token) => `'${token}'`).join(' ')}; run ${CLI_BIN} ${capability} ${verb} alone, or ${CLI_BIN} ${capability} ${verb} --help`,
    );
  return verb as V;
}
