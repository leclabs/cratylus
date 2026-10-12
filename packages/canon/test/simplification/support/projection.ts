// The delivered project as the harness receives it: cratylus's own projection of this
// repository's corpus for omp, made once per test file into a scratch directory.

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { cratylus, scratchDir } from './cli.js';
import { ROOT } from './repo.js';

/** One projected agent declaration: its file, front matter and body. */
export interface Declaration {
  readonly name: string;
  readonly file: string;
  /** Each front-matter key → its value: JSON where the value is JSON, else the plain text. */
  readonly front: Readonly<Record<string, unknown>>;
  readonly body: string;
  readonly text: string;
}

/** A value as the projected front matter writes it: JSON (a quoted string, a list, a
 *  map, null), else a plain scalar. */
function scalar(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/** A declaration's text split into its front matter and body. */
export function frontMatterOf(text: string): {
  front: Record<string, unknown>;
  body: string;
} {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (m === null) return { front: {}, body: text };
  const front: Record<string, unknown> = {};
  for (const line of (m[1] ?? '').split(/\r?\n/)) {
    const at = line.indexOf(':');
    if (at <= 0 || /^\s/.test(line)) continue;
    front[line.slice(0, at).trim()] = scalar(line.slice(at + 1).trim());
  }
  return { front, body: m[2] ?? '' };
}

export interface Projection {
  readonly dir: string;
  /** Every file of the tree, from its top, with its text. */
  readonly files: Readonly<Record<string, string>>;
  readonly agents: readonly Declaration[];
}

let cached: Projection | undefined;
/** The omp projection of this repository's corpus. */
export function projection(): Projection {
  if (cached !== undefined) return cached;
  const dir = join(scratchDir('simplification-projection-'), 'omp');
  const r = cratylus(ROOT, ['project', '--harness', 'omp', '--out', dir]);
  if (r.status !== 0) throw new Error(`cratylus project failed: ${r.stderr}`);
  const files: Record<string, string> = {};
  for (const name of readdirSync(dir, { recursive: true, encoding: 'utf8' })) {
    try {
      files[name.split('\\').join('/')] = readFileSync(join(dir, name), 'utf8');
    } catch {
      // a directory
    }
  }
  const agents = Object.entries(files)
    .filter(([path]) => /^agents\/[^/]+\.md$/.test(path))
    .map(([path, text]): Declaration => {
      const { front, body } = frontMatterOf(text);
      return {
        name: String(
          front.name ?? relative('agents', path).replace(/\.md$/, ''),
        ),
        file: join(dir, path),
        front,
        body,
        text,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  if (agents.length === 0) throw new Error(`no agent projected into ${dir}`);
  cached = { dir, files, agents };
  return cached;
}

/** The modules the projection gives omp to load as extensions, in name order. */
export function extensionModules(
  p: Projection,
): { name: string; text: string }[] {
  return Object.entries(p.files)
    .filter(
      ([path]) => /\.(ts|js|mjs)$/.test(path) && !path.startsWith('skills/'),
    )
    .filter(([path]) => !path.startsWith('hooks/'))
    .map(([path, text]) => ({ name: path.split('/').at(-1) ?? path, text }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/** The text of the `### <name>` section of a profile body, or '' when it has none. */
export function sectionOf(body: string, name: string): string {
  const lines = body.split('\n');
  const start = lines.findIndex((l) =>
    new RegExp(`^#{2,4}\\s+${name}\\s*$`, 'i').test(l),
  );
  if (start < 0) return '';
  const depth = /^#+/.exec(lines[start] ?? '')?.[0].length ?? 3;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => {
    const h = /^(#+)\s/.exec(l);
    return h !== null && (h[1]?.length ?? 0) <= depth;
  });
  return (end < 0 ? rest : rest.slice(0, end)).join('\n');
}
