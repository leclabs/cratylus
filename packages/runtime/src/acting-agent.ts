// ─────────────────────────────────────────────────────────────────────────────
// The ACTING AGENT: the agent a capability call is made by, named by the harness
// in the environment variable `CRATYLUS_AGENT` on every call. Absent or empty,
// the agent is unknown, and an unknown agent is never a cut's architect.
// ─────────────────────────────────────────────────────────────────────────────

/** The environment variable naming the agent a capability call is made by. */
export const ACTING_AGENT_ENV = 'CRATYLUS_AGENT';

/** The agent the call is made by, or `undefined` when it is unknown. */
export function actingAgent(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const name = env[ACTING_AGENT_ENV];
  return name === undefined || name === '' ? undefined : name;
}
