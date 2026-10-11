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
import type { OfferedPractice } from '../../project/index.js';

/** One model role the host binds no model to, which the operator may bind: a tier the
 *  installed agents fall back to, or a persona's own role (decision 0112). */
export interface RoleQuestion {
  /** The model role, as the host's settings name it. */
  readonly role: string;
  /** A tier, or the role named for a persona, which otherwise runs on its tier. */
  readonly roleOf: 'tier' | 'persona';
  /** The agents that run on it. */
  readonly agents: readonly string[];
  /** The models offered for it, besides a typed one: those the host already binds. */
  readonly options: readonly string[];
}

export interface InstallPrompts {
  /** Which harness to install into; `found` are those the host has (possibly none),
   *  `supported` all that can be named. */
  harness(
    found: readonly string[],
    supported: readonly string[],
  ): Promise<string | undefined>;
  /** Which practices to install, each offered with its description; `initial` are
   *  preselected: those already installed here, or on a fresh host the corpus's own.
   *  At least one is required. */
  practices(
    offered: readonly Pick<OfferedPractice, 'name' | 'description'>[],
    initial: readonly string[],
  ): Promise<string[] | undefined>;
  /** The model per role asked: the answer of each role bound, a role left unbound
   *  absent. */
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
const UNBOUND = 'leave unbound';

async function askRoute(q: RoleQuestion): Promise<string | undefined> {
  const picked = answer(
    await clack.select<string>({
      message:
        q.roleOf === 'tier'
          ? `Model for the ${q.role} tier (${q.agents.join(', ')} fall back to it)`
          : `Model for the ${q.role} persona`,
      options: [
        ...q.options.map((o) => ({ value: o, label: o })),
        { value: OTHER, label: 'another model…' },
        {
          value: UNBOUND,
          label:
            q.roleOf === 'tier'
              ? 'none now (bind it in your settings later)'
              : 'none (it runs on its tier)',
        },
      ],
      initialValue: q.roleOf === 'persona' ? UNBOUND : (q.options[0] ?? OTHER),
    }),
  );
  if (picked === undefined) return undefined;
  if (picked === UNBOUND) return '';
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

  async practices(offered, initial) {
    return answer(
      await clack.multiselect({
        message:
          'Which practices should be installed? (space toggles, enter accepts)',
        options: offered.map((p) => ({
          value: p.name,
          label: `${p.name} — ${p.description}`,
        })),
        initialValues: [...initial],
        required: true,
      }),
    );
  },

  async routes(questions) {
    const picked: Record<string, string> = {};
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
