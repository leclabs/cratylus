/**
 * Local helpers for the E2 (ir-emission) story suite. Fixture ground truth is
 * plans/interop-hardening/completed/harness-landscape-research.RETURN.md §2;
 * citation keys like [CC1] resolve in its §5 source ledger.
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import type { IR } from '../../../src/core/index.js';

/** All regular files under `dir`, POSIX-relative to it, sorted. */
export function walkFiles(dir: string, base = dir): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walkFiles(p, base));
    else out.push(relative(base, p));
  }
  return out.sort();
}

/** Map of relative path → sha256 for every file under `dir`. */
export function hashTree(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rel of walkFiles(dir)) {
    out[rel] = createHash('sha256')
      .update(readFileSync(join(dir, rel)))
      .digest('hex');
  }
  return out;
}

/** Capture console.log/console.error output for the duration of `fn`. */
export async function captureConsole<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; output: string }> {
  const lines: string[] = [];
  const origLog = console.log;
  const origError = console.error;
  console.log = (...args: unknown[]) => {
    lines.push(args.join(' '));
  };
  console.error = (...args: unknown[]) => {
    lines.push(args.join(' '));
  };
  try {
    const result = await fn();
    return { result, output: lines.join('\n') };
  } finally {
    console.log = origLog;
    console.error = origError;
  }
}

/**
 * The compile fixture of E2.S3/E2.S4: 1 rule, 1 skill, 1 agent, 1 mcp server.
 */
export function compileFixtureIR(
  scope: 'user' | 'project' | 'local',
  targets: string[],
): IR {
  return {
    manifest: { agentForge: 1, scope, targets },
    rules: [{ id: 'main', body: '# Rules\n\nBe terse.' }],
    skills: [
      {
        name: 'review',
        description: 'Review code',
        body: '# Review\n\n1. read',
      },
    ],
    agents: [{ name: 'one', body: 'You are one.', description: 'Agent one' }],
    mcp_servers: [
      {
        name: 'github',
        transport: 'stdio',
        command: 'npx',
        args: ['-y', 'srv'],
      },
    ],
  };
}
