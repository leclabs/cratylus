// The questions `cratylus install` may ask, behind one seam.
//
// `runInstall` decides WHICH decisions are open and WHAT to ask about each; how a
// question reaches an operator is this file's. Tests hand `runInstall` their own
// `InstallPrompts`, so a guided run is driven answer by answer with no terminal, and
// the terminal implementation (`@clack/prompts`) is the only place a prompt library
// is named.
//
// EVERY QUESTION MAY BE ANSWERED `undefined`, which is the operator cancelling
// (Ctrl-C, Esc). `runInstall` treats it as "stop": nothing has been written yet, and
// nothing is written after.

import * as clack from '@clack/prompts';

/** One held role whose model the operator may route, and what is offered for it. */
export interface RoleQuestion {
  readonly role: string;
  /** The agents holding the role, for the operator to recognise it by. */
  readonly holders: readonly string[];
  /** The models offered for it, besides a typed one. */
  readonly options: readonly string[];
  /** Preselected: cratylus's own routing for the role, or `undefined` where it routes
   *  none (the session's model). Answering it is leaving the role at its default. */
  readonly initial: string | undefined;
}

export interface InstallPrompts {
  /** Which harness to install into; `found` are those the host has (possibly none),
   *  `supported` all that can be named. */
  harness(
    found: readonly string[],
    supported: readonly string[],
  ): Promise<string | undefined>;
  /** Which of the optional personas to install; `initial` are the ones already
   *  installed here. */
  personas(
    offered: readonly string[],
    initial: readonly string[],
  ): Promise<string[] | undefined>;
  /** Whether to link the launch commands; `question` says what a yes does. */
  linkCommands(question: string): Promise<boolean | undefined>;
  /** The model per role: the answer of every role asked, a role left at its default
   *  answering its `initial` (or absent, where it has none). */
  routes(
    questions: readonly RoleQuestion[],
  ): Promise<Record<string, string> | undefined>;
  /** The one confirmation before anything is written. */
  confirm(question: string): Promise<boolean | undefined>;
}

/** Whether the process has a terminal to ask on: stdin and stdout both. */
export function hasTerminal(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

/** A value from a clack prompt, or `undefined` where it was cancelled. */
function answer<T>(value: T): Exclude<T, symbol> | undefined {
  return clack.isCancel(value) ? undefined : (value as Exclude<T, symbol>);
}

// Sentinels among the model names offered: no model name holds a space.
const OTHER = 'another model';
const DEFAULT = "the session's model";

async function askRoute(q: RoleQuestion): Promise<string | undefined> {
  const holders = q.holders.join(', ');
  const picked = answer(
    await clack.select<string>({
      message: `Model for the ${q.role} role (${holders})`,
      options: [
        ...(q.initial === undefined
          ? [{ value: DEFAULT, label: DEFAULT }]
          : []),
        ...q.options.map((o) => ({
          value: o,
          label: o === q.initial ? `${o} (default)` : o,
        })),
        { value: OTHER, label: 'another model…' },
      ],
      initialValue: q.initial ?? DEFAULT,
    }),
  );
  if (picked === undefined) return undefined;
  if (picked === DEFAULT) return '';
  if (picked !== OTHER) return picked;
  const typed = answer(
    await clack.text({
      message: `Model for ${q.role}`,
      validate: (v) => ((v ?? '').trim() === '' ? 'name a model' : undefined),
    }),
  );
  return typed?.trim();
}

export const terminalPrompts: InstallPrompts = {
  async harness(found, supported) {
    const options = found.length > 0 ? found : supported;
    return answer(
      await clack.select({
        message:
          found.length > 0
            ? 'Which harness should the corpus be installed into?'
            : 'No harness found on this host. Which one should the corpus be installed into?',
        options: options.map((value) => ({ value, label: value })),
      }),
    );
  },

  async personas(offered, initial) {
    return answer(
      await clack.multiselect({
        message:
          'Which optional personas should be installed? (space toggles, enter accepts; every other agent is always installed)',
        options: offered.map((value) => ({ value, label: value })),
        initialValues: [...initial],
        required: false,
      }),
    );
  },

  async linkCommands(question) {
    return answer(
      await clack.confirm({ message: question, initialValue: false }),
    );
  },

  async routes(questions) {
    const customize = answer(
      await clack.confirm({
        message: `Choose the model for each of ${questions.length} role${questions.length === 1 ? '' : 's'}? (No keeps the default routing.)`,
        initialValue: false,
      }),
    );
    if (customize === undefined) return undefined;
    const picked: Record<string, string> = {};
    if (!customize) return picked;
    for (const q of questions) {
      const model = await askRoute(q);
      if (model === undefined) return undefined;
      if (model !== '') picked[q.role] = model;
    }
    return picked;
  },

  async confirm(question) {
    return answer(
      await clack.confirm({ message: question, initialValue: true }),
    );
  },
};
