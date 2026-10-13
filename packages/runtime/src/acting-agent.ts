// ─────────────────────────────────────────────────────────────────────────────
// The ACTING AGENT: the agent a capability call is made by, named by the harness
// in the environment variable `CRATYLUS_AGENT` on every call. Absent or empty,
// the agent is unknown. Who MAKES an append to the record is the acting agent,
// else git's user in the repository, when either is known (`makerAt`).
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';

/** The environment variable naming the agent a capability call is made by. */
export const ACTING_AGENT_ENV = 'CRATYLUS_AGENT';

/** The agent the call is made by, or `undefined` when it is unknown. */
export function actingAgent(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const name = env[ACTING_AGENT_ENV];
  return name === undefined || name === '' ? undefined : name;
}

/** Who makes an append to the record in the repository at `top`: the acting
 *  agent, else git's user there, or `undefined` when neither is known. */
export function makerAt(top: string): string | undefined {
  const agent = actingAgent();
  if (agent !== undefined) return agent;
  try {
    const name = execFileSync('git', ['config', 'user.name'], {
      cwd: top,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return name === '' ? undefined : name;
  } catch {
    return undefined;
  }
}
