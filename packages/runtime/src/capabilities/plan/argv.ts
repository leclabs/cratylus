// ─────────────────────────────────────────────────────────────────────────────
// THE VERB a capability's argv opens with: the one home of the refusal of a verb
// the capability does not declare, spoken alike by the command line and by every
// dispatcher called as a library.
// ─────────────────────────────────────────────────────────────────────────────

import { CLI_BIN } from '../../bin-name.js';
import type { VerbFlags } from '../../verb-flags.js';

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
