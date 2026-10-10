import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync, readlinkSync } from 'node:fs';
import { join } from 'node:path';

// Capture every project output, including untracked additions and deletions.
// Git internals are harness bookkeeping, not the work's outputs. Symlinks are
// recorded as links, never followed outside the disposable project.
export function snapshot(root: string, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const name of readdirSync(join(root, prefix)).sort()) {
    if (!prefix && name === '.git') continue;
    const relative = prefix ? `${prefix}/${name}` : name;
    const path = join(root, relative);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) result[relative] = `link:${readlinkSync(path)}`;
    else if (stat.isDirectory()) {
      result[`${relative}/`] = `directory:${stat.mode}`;
      Object.assign(result, snapshot(root, relative));
    } else
      result[relative] =
        `${stat.mode}:${createHash('sha256').update(readFileSync(path)).digest('hex')}`;
  }
  return result;
}
