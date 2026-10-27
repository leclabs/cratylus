// The questions `cratylus install` may ask, behind one seam.
//
// `runInstall` decides WHICH decisions are open and WHAT to ask about each; how a
// question reaches the product owner is this file's. Tests hand `runInstall` their own
// `InstallPrompts`, so a guided run is driven answer by answer with no terminal, and
// the terminal implementation (`@clack/prompts`) is the only place a prompt library
// is named.
//
// EVERY QUESTION MAY BE ANSWERED `undefined`, which is the product owner cancelling
// (Ctrl-C, Esc). `runInstall` treats it as "stop": nothing has been written yet, and
// nothing is written after.

import * as clack from '@clack/prompts';
import type { InstallScope } from '@cratylus/runtime/runtime-config';
import type { OfferedRuleset } from '../../project/index.js';

/** One model role the host binds no model to, which the product owner may bind: a tier the
 *  installed agents fall back to, or a persona's own role
 *  (design/decisions/install-keeps-each-tiers-model-as-the-hosts-setting.md). */
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
  /** Where to install: for the user, every project offered it (preselected), or
   *  inside `project` only, which then loads it in place of the user's. */
  scope(project: string): Promise<InstallScope | undefined>;
  /** Which rules to place, each ruleset offered whole, rule by rule, or not at all;
   *  nothing is chosen unless the product owner chooses it. The answer is the rules chosen,
   *  by name, possibly none. */
  rules(offered: readonly OfferedRuleset[]): Promise<string[] | undefined>;
  /** The model per role asked: the answer of each role bound, a role left unbound
   *  absent. */
  routes(
    questions: readonly RoleQuestion[],
  ): Promise<Record<string, string> | undefined>;
  /** Whether the status line, which the host hides, should show the session's agent:
   *  true to show it, false to keep it hidden. */
  agentStatus(): Promise<boolean | undefined>;
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
  async scope(project) {
    return answer(
      await clack.select<InstallScope>({
        message: 'Install for whom?',
        options: [
          {
            value: 'user',
            label: 'for you, in every project (your home directory)',
          },
          {
            value: 'project',
            label: `for this project only, committable for its team (${project})`,
          },
        ],
        initialValue: 'user',
      }),
    );
  },

  async harness(found, supported) {
    const options = found.length > 0 ? found : supported;
    return answer(
      await clack.select({
        message:
          found.length > 0
            ? 'Which harness should the canon be installed into?'
            : 'No harness found on this host. Which one should the canon be installed into?',
        options: options.map((value) => ({ value, label: value })),
      }),
    );
  },

  async rules(offered) {
    const picked: string[] = [];
    for (const set of offered) {
      const how = answer(
        await clack.select({
          message: `Rules: ${set.name} — ${set.description}`,
          options: [
            { value: 'none', label: 'none' },
            {
              value: 'whole',
              label: `all ${set.rules.length} (${set.rules.map((r) => r.name).join(', ')})`,
            },
            { value: 'each', label: 'rule by rule…' },
          ],
          initialValue: 'none',
        }),
      );
      if (how === undefined) return undefined;
      if (how === 'whole') picked.push(...set.rules.map((r) => r.name));
      if (how !== 'each') continue;
      const some = answer(
        await clack.multiselect({
          message: `Which ${set.name} rules? (space toggles, enter accepts)`,
          options: set.rules.map((r) => ({
            value: r.name,
            label: `${r.name} — ${r.description}`,
          })),
          required: false,
        }),
      );
      if (some === undefined) return undefined;
      picked.push(...some);
    }
    return picked;
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

  async agentStatus() {
    return answer(
      await clack.confirm({
        message:
          "Your status line hides an extension's status. Show the agent each session was started as there?",
        initialValue: true,
      }),
    );
  },

  async confirm(question) {
    return answer(
      await clack.confirm({ message: question, initialValue: true }),
    );
  },
};
