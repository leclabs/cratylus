// ─────────────────────────────────────────────────────────────────────────────
// THE COMMAND'S SELF-DESCRIPTION — the one place its words live.
//
// What the command is for, how using it starts, and where its theory is. The
// command's help opens with the purpose, its bare call prints the orientation,
// `--explain` gives the explanation as data, install ends with the start line, and
// the omp extension shows the orientation it reads from `--explain` in every
// session. None of them restates a word of it.
// ─────────────────────────────────────────────────────────────────────────────

import { CLI_BIN } from './bin-name.js';

/** What the command is for. */
export const PURPOSE = `${CLI_BIN} lets you settle what you mean once and have AI agents build exactly that, across sessions, without the meaning drifting.`;

/** How using it starts. */
export const START = `To start, launch the business analyst with \`omp --agent business-analyst\` and say what you want: it holds the domain model and hands the work to the other agents ${CLI_BIN} installed, so you write none of your own.`;

/** Where its theory is, for when someone asks why it works. */
export const THEORY =
  'Why it works, when asked: cratylic context design, whose domain model is at https://github.com/leclabs/cratylus/tree/main/design/model/cratylic-context-design.';

/** What a newcomer needs first: the purpose, the start and the theory, a line each. */
export const ORIENTATION = [PURPOSE, START, THEORY].join('\n');

/** The command, as it explains itself. */
export interface CommandExplanation {
  readonly name: string;
  readonly purpose: string;
  readonly orientation: string;
}

/** The command's explanation, as `--explain` gives it. */
export const EXPLANATION: CommandExplanation = {
  name: CLI_BIN,
  purpose: PURPOSE,
  orientation: ORIENTATION,
};
