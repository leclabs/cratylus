// delete this file and set the values in the agent definitions directly i.e. packages/agent-anatomy/src/agents/*.ts.

export const memoryProtocol = `` // duplicative garbage, memory should be set on the organ in the agent
export const personaProtocol = `` // same as above except for persona.

export const base = {
  memoryProtocol,
  personaProtocol,
} as const;
