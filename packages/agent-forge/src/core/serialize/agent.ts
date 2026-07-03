import {
  parseFrontmatter,
  serializeFrontmatter,
} from '../engine/frontmatter.js';
import type { Agent } from '../ir/types.js';

export function parseAgent(text: string, defaultName: string): Agent {
  const { frontmatter, body } = parseFrontmatter<Partial<Agent>>(text);
  const agent: Agent = {
    name: typeof frontmatter.name === 'string' ? frontmatter.name : defaultName,
    body,
  };
  if (frontmatter.description) agent.description = frontmatter.description;
  if (frontmatter.model) agent.model = frontmatter.model;
  if (frontmatter.tools) agent.tools = frontmatter.tools;
  if (frontmatter.color) agent.color = frontmatter.color;
  if (frontmatter.permission_mode !== undefined)
    agent.permission_mode = frontmatter.permission_mode;
  if (frontmatter.max_turns !== undefined)
    agent.max_turns = frontmatter.max_turns;
  if (frontmatter.temperature !== undefined)
    agent.temperature = frontmatter.temperature;
  if (frontmatter.mode !== undefined) agent.mode = frontmatter.mode;
  if (frontmatter.memory !== undefined) agent.memory = frontmatter.memory;
  if (frontmatter.effort !== undefined) agent.effort = frontmatter.effort;
  if (frontmatter.targets) agent.targets = frontmatter.targets;
  if (frontmatter.excludes) agent.excludes = frontmatter.excludes;
  return agent;
}

export function serializeAgent(agent: Agent): string {
  const fm: Record<string, unknown> = {};
  if (agent.description) fm.description = agent.description;
  if (agent.model) fm.model = agent.model;
  if (agent.tools) fm.tools = agent.tools;
  if (agent.color) fm.color = agent.color;
  if (agent.permission_mode !== undefined)
    fm.permission_mode = agent.permission_mode;
  if (agent.max_turns !== undefined) fm.max_turns = agent.max_turns;
  if (agent.temperature !== undefined) fm.temperature = agent.temperature;
  if (agent.mode !== undefined) fm.mode = agent.mode;
  if (agent.memory !== undefined) fm.memory = agent.memory;
  if (agent.effort !== undefined) fm.effort = agent.effort;
  if (agent.targets) fm.targets = agent.targets;
  if (agent.excludes) fm.excludes = agent.excludes;
  return serializeFrontmatter(fm, agent.body);
}
