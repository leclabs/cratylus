/**
 * Local helpers for the E3 (reimport) story suite. Fixture ground truth is
 * plans/interop-hardening/completed/harness-landscape-research.RETURN.md §2/§3.
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Map of relative path → sha256 for every file under `dir`. */
export function hashTree(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (d: string): void => {
    for (const entry of readdirSync(d).sort()) {
      const p = join(d, entry);
      if (statSync(p).isDirectory()) walk(p);
      else
        out[relative(dir, p)] = createHash('sha256')
          .update(readFileSync(p))
          .digest('hex');
    }
  };
  walk(dir);
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
