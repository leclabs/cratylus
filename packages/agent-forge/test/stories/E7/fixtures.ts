/**
 * Shared E7 fixtures: IR builders + output-tree scanning. Read-only over
 * compile OUTPUT trees in tmp dirs; never writes outside them.
 */

import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Manifest, McpServer, Rule } from '../../../src/core/index.js';

export function manifest(targets: string[]): Manifest {
  return { agentForge: 1, scope: 'project', targets };
}

/** Three ordered rules whose `order` matches array order (1, 2, 3). */
export function orderedRules(): Rule[] {
  return [
    { id: 'alpha', body: 'RULE-ALPHA: prefer parsimony.', order: 1 },
    { id: 'bravo', body: 'RULE-BRAVO: keep commits green.', order: 2 },
    { id: 'charlie', body: 'RULE-CHARLIE: cite sources.', order: 3 },
  ];
}

/** One stdio + one streamable-HTTP MCP server (the E7.S6 pair). */
export function mcpPair(): McpServer[] {
  return [
    {
      name: 'gh',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', 'mcp-github'],
    },
    { name: 'api', transport: 'http', url: 'https://api.example.com/mcp' },
  ];
}

/** All file paths under `root`, relative, forward-slashed, sorted. */
export function walkFiles(root: string): string[] {
  const out: string[] = [];
  const visit = (dir: string): void => {
    for (const entry of readdirSync(dir).sort()) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) visit(p);
      else out.push(relative(root, p).split(sep).join('/'));
    }
  };
  visit(root);
  return out;
}

/** Agent Skills SKILL.md frontmatter fields, per the spec table [S3]. */
export const SPEC_SKILL_FIELDS = [
  'name',
  'description',
  'license',
  'compatibility',
  'metadata',
  'allowed-tools',
] as const;
