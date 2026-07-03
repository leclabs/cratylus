/**
 * E1-local fixture utilities. Fixtures live in mkdtemp tmp dirs only; user
 * scope goes through helpers.fakeHome(). No writes inside the repo tree.
 */

import { createHash } from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { afterEach } from 'vitest';
import { fakeHome, makeTmpDir } from '../helpers.js';

/** Write `content` at `root/rel`, creating parent dirs. */
export function put(
  root: string,
  rel: string,
  content: string,
  mode?: number,
): void {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  if (mode === undefined) writeFileSync(path, content, 'utf8');
  else writeFileSync(path, content, { encoding: 'utf8', mode });
}

/** Minimal documented-shape SKILL.md (name + description frontmatter). */
export function skillMd(name: string): string {
  return `---\nname: ${name}\ndescription: Exercises the ${name} skill class\n---\n# ${name}\n\nSteps.\n`;
}

/**
 * Capture everything the CLI drivers print (console.log + console.error)
 * while running `fn`. The captured text is the "import report" surface the
 * E1 stories assert against.
 */
export async function captured(
  fn: () => Promise<number>,
): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...args: unknown[]) => {
    lines.push(args.join(' '));
  };
  console.error = (...args: unknown[]) => {
    lines.push(args.join(' '));
  };
  try {
    const code = await fn();
    return { code, out: lines.join('\n') };
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
}

/** Deterministic content hash of a directory tree (paths + bytes). */
export function hashTree(dir: string): string {
  const hash = createHash('sha256');
  const walk = (d: string): void => {
    for (const entry of readdirSync(d).sort()) {
      const p = join(d, entry);
      if (statSync(p).isDirectory()) {
        walk(p);
      } else {
        hash.update(relative(dir, p));
        hash.update('\0');
        hash.update(readFileSync(p));
        hash.update('\0');
      }
    }
  };
  walk(dir);
  return hash.digest('hex');
}

/**
 * Per-file scratch manager: tmp dirs removed and $HOME restored after each
 * test. `home()` is the ONLY sanctioned route to user-scope surfaces.
 */
export function scratch(): { tmp: () => string; home: () => string } {
  const tmps: string[] = [];
  let restoreHome: (() => void) | null = null;
  afterEach(() => {
    restoreHome?.();
    restoreHome = null;
    for (const d of tmps.splice(0)) rmSync(d, { recursive: true, force: true });
  });
  return {
    tmp(): string {
      const d = makeTmpDir();
      tmps.push(d);
      return d;
    },
    home(): string {
      const fh = fakeHome();
      restoreHome = fh.restore;
      return fh.home;
    },
  };
}
