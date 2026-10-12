// ─────────────────────────────────────────────────────────────────────────────
// Where WHAT IS FROZEN is read from (decisions 0132, 0134): the RECORD, as the
// branch's recorded tip holds it, never a working copy. A cut's examples, its
// checks and the files they use are read from a commit of the repository; a
// path that commit does not hold, the branch has recorded nothing of yet, and
// there is no record to contradict the working copy, so it is read from there.
// A branch with no commit at all is read wholly from its working copy.
//
// The ledger is not read here: it is cratylus's own append-only record, read
// where cratylus keeps it (`ledger.ts`). Nor is a working copy's removal of a
// file read as the file's removal; whether the working copy still holds a path
// is answered apart (`kept`), so a frozen cut's examples file missing from it
// leaves what is frozen unread rather than released.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** The files what is frozen is read from, by paths from the top. */
export interface Files {
  /** Whether `path` is a file. */
  has(path: string): boolean;
  /** Whether the working copy holds `path` as a file. */
  kept(path: string): boolean;
  /** The text of the file at `path`, or `undefined` when there is none. */
  read(path: string): string | undefined;
  /** Every file `entry` is (a file, or each under a folder ending in `/`),
   *  sorted. */
  under(entry: string): string[];
}

/** The files of the working copy whose top is `top`. */
export function workingCopy(top: string): Files {
  const has = (path: string): boolean =>
    statSync(join(top, path), { throwIfNoEntry: false })?.isFile() ?? false;
  return {
    has,
    kept: has,
    read: (path) =>
      has(path) ? readFileSync(join(top, path), 'utf8') : undefined,
    under(entry) {
      if (!entry.endsWith('/')) return has(entry) ? [entry] : [];
      if (!statSync(join(top, entry), { throwIfNoEntry: false })?.isDirectory())
        return [];
      return readdirSync(join(top, entry), {
        recursive: true,
        withFileTypes: true,
      })
        .filter((d) => d.isFile())
        .map((d) =>
          join(d.parentPath, d.name)
            .slice(join(top).length + 1)
            .replaceAll('\\', '/'),
        )
        .sort();
    },
  };
}

/** Run git in `top`; its stdout, untrimmed. */
const git = (top: string, args: readonly string[]): string =>
  execFileSync('git', args, {
    cwd: top,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1 << 28,
  });

/** The files of the record: `commit` of the repository whose work tree's top
 *  is `top` (its `HEAD` when none is given), and the working copy at `top` for
 *  every path the commit does not hold; the working copy alone when there is
 *  no such commit. */
export function recordedFiles(top: string, commit?: string): Files {
  const copy = workingCopy(top);
  let tip = commit;
  if (tip === undefined)
    try {
      tip = git(top, ['rev-parse', '--verify', '-q', 'HEAD^{commit}']).trim();
    } catch {
      return copy;
    }
  const held = new Set(
    git(top, ['ls-tree', '-r', '-z', '--full-tree', tip])
      .split('\0')
      .flatMap((line) => {
        const [meta = '', path] = line.split('\t');
        return path !== undefined && meta.split(' ')[1] === 'blob'
          ? [path]
          : [];
      }),
  );
  const texts = new Map<string, string>();
  return {
    has: (path) => held.has(path) || copy.has(path),
    kept: copy.has,
    read(path) {
      if (!held.has(path)) return copy.read(path);
      let text = texts.get(path);
      if (text === undefined) {
        text = git(top, ['cat-file', 'blob', `${tip}:${path}`]);
        texts.set(path, text);
      }
      return text;
    },
    under(entry) {
      if (!entry.endsWith('/')) return this.has(entry) ? [entry] : [];
      return [
        ...new Set([
          ...[...held].filter((path) => path.startsWith(entry)),
          ...copy.under(entry),
        ]),
      ].sort();
    },
  };
}
