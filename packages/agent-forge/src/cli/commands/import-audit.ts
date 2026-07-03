/**
 * Import-report audit: names every loss an import would otherwise hide.
 *
 * Three surfaces, per the E1 loud-lift stories:
 * - `unrepresentable` — source frontmatter fields present in a documented
 *   source file but absent from the lifted IR resource (path + field);
 * - `unsupported-by-source` — resource types the source client declares no
 *   surface for (computed by the caller from adapter capabilities);
 * - `unlifted-surfaces` — documented rules-bearing files present on disk but
 *   consumed by neither the lifted IR nor any report line.
 *
 * The documented-surface tables mirror the harness-landscape research
 * ([CX3][CC1][OC3][CL1][CR2]); adapters own lifting, this audit only names
 * what was left behind.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import type { IR } from '../../core/index.js';
import { parseFrontmatter } from '../../core/index.js';

export interface UnrepresentableField {
  path: string;
  field: string;
}

export interface ImportAudit {
  unrepresentable: UnrepresentableField[];
  unliftedSurfaces: string[];
}

/** camelCase → snake_case (IR field spelling). */
function snake(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

function listFilesRecursive(dir: string, depth = 6): string[] {
  if (depth < 0 || !existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(p, depth - 1));
    else out.push(p);
  }
  return out;
}

// ─── unrepresentable source fields ─────────────────────────────────────────

interface FrontmatterSurface {
  /** Files to audit, absolute. */
  files: (sourceDir: string) => { path: string; defaultName: string }[];
  /** The lifted IR collection the file maps into. */
  lifted: (ir: Partial<IR>) => Record<string, unknown>[] | undefined;
}

const FRONTMATTER_SURFACES: Record<string, FrontmatterSurface[]> = {
  claude: [
    {
      // .claude/agents/*.md [CC2]
      files: (sourceDir) => {
        const dir = join(sourceDir, '.claude', 'agents');
        if (!existsSync(dir)) return [];
        return readdirSync(dir)
          .filter((f) => f.endsWith('.md'))
          .map((f) => ({
            path: join(dir, f),
            defaultName: f.replace(/\.md$/, ''),
          }));
      },
      lifted: (ir) => ir.agents as Record<string, unknown>[] | undefined,
    },
    {
      // .claude/skills/*/SKILL.md [CC3]
      files: (sourceDir) => {
        const dir = join(sourceDir, '.claude', 'skills');
        if (!existsSync(dir)) return [];
        return readdirSync(dir, { withFileTypes: true })
          .filter((e) => e.isDirectory())
          .map((e) => ({
            path: join(dir, e.name, 'SKILL.md'),
            defaultName: e.name,
          }))
          .filter((f) => existsSync(f.path));
      },
      lifted: (ir) => ir.skills as Record<string, unknown>[] | undefined,
    },
  ],
};

function auditUnrepresentable(
  client: string,
  sourceDir: string,
  ir: Partial<IR>,
): UnrepresentableField[] {
  const out: UnrepresentableField[] = [];
  for (const surface of FRONTMATTER_SURFACES[client] ?? []) {
    const liftedByName = new Map<string, Record<string, unknown>>();
    for (const item of surface.lifted(ir) ?? []) {
      const name = item.name;
      if (typeof name === 'string') liftedByName.set(name, item);
    }
    for (const file of surface.files(sourceDir)) {
      const { frontmatter } = parseFrontmatter(readFileSync(file.path, 'utf8'));
      const name =
        typeof frontmatter.name === 'string'
          ? frontmatter.name
          : file.defaultName;
      const lifted = liftedByName.get(name);
      for (const [key, value] of Object.entries(frontmatter)) {
        if (value === undefined || value === null || key === 'name') continue;
        const represented =
          lifted !== undefined &&
          (lifted[key] !== undefined || lifted[snake(key)] !== undefined);
        if (!represented) out.push({ path: file.path, field: key });
      }
    }
  }
  return out;
}

// ─── unlifted documented surfaces ──────────────────────────────────────────

/** Compile a documented instructions glob (`*` / `**`) to a RegExp over
 *  forward-slashed relative paths. */
function globToRegExp(glob: string): RegExp {
  const pattern = glob
    .split(/(\*{1,2})/)
    .map((seg) => {
      if (seg === '**') return '.*';
      if (seg === '*') return '[^/]*';
      return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
  return new RegExp(`^${pattern}$`);
}

/** Documented rules-bearing candidate files per client, absolute paths. */
const RULES_SURFACES: Record<string, (sourceDir: string) => string[]> = {
  // [CX3]: AGENTS.md + AGENTS.override.md along the root→cwd chain.
  codex: (sourceDir) => {
    const out: string[] = [];
    let dir = resolve(sourceDir);
    for (let i = 0; i < 20; i++) {
      out.push(join(dir, 'AGENTS.md'), join(dir, 'AGENTS.override.md'));
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return out;
  },
  // [CC1]: .claude/rules/**/*.md (paths-scoped rule files).
  claude: (sourceDir) =>
    listFilesRecursive(join(sourceDir, '.claude', 'rules')).filter((f) =>
      f.endsWith('.md'),
    ),
  // [OC3]: opencode.json instructions globs + CLAUDE.md fallback.
  opencode: (sourceDir) => {
    const out: string[] = [
      join(sourceDir, 'AGENTS.md'),
      join(sourceDir, 'CLAUDE.md'),
    ];
    const config = join(sourceDir, 'opencode.json');
    if (existsSync(config)) {
      try {
        const parsed = JSON.parse(readFileSync(config, 'utf8')) as {
          instructions?: string[];
        };
        for (const entry of parsed.instructions ?? []) {
          if (entry.includes('*')) {
            const re = globToRegExp(entry);
            for (const f of listFilesRecursive(sourceDir, 4)) {
              const rel = f
                .slice(sourceDir.length + 1)
                .split('\\')
                .join('/');
              if (re.test(rel)) out.push(f);
            }
          } else {
            out.push(resolve(sourceDir, entry));
          }
        }
      } catch {
        // corrupt opencode.json is the adapter's refusal to make, not ours
      }
    }
    return out;
  },
  // [CL1]: .clinerules/*.md (incl. paths: frontmatter) + AGENTS.md.
  cline: (sourceDir) => [
    ...listFilesRecursive(join(sourceDir, '.clinerules'), 2).filter((f) =>
      f.endsWith('.md'),
    ),
    join(sourceDir, 'AGENTS.md'),
  ],
  // [CR2]: the crush context_paths default set.
  crush: (sourceDir) =>
    ['AGENTS.md', 'CRUSH.md', 'CLAUDE.md', '.cursorrules'].map((f) =>
      join(sourceDir, f),
    ),
};

function auditUnlifted(
  client: string,
  sourceDir: string,
  ir: Partial<IR>,
): string[] {
  const candidates = RULES_SURFACES[client]?.(sourceDir) ?? [];
  const ruleBodies = (ir.rules ?? []).map((r) => r.body);
  const out: string[] = [];
  for (const path of [...new Set(candidates)]) {
    if (!existsSync(path) || !statSync(path).isFile()) continue;
    const { body } = parseFrontmatter(readFileSync(path, 'utf8'));
    const content = body.trim();
    if (content === '') continue;
    const consumed = ruleBodies.some((b) => b.includes(content));
    if (!consumed) out.push(path);
  }
  return out;
}

/**
 * Audit one import: which documented source content did the lift leave
 * behind? Pure read-only over the source tree + the lifted IR.
 */
export function auditImport(
  client: string,
  sourceDir: string,
  ir: Partial<IR>,
): ImportAudit {
  return {
    unrepresentable: auditUnrepresentable(client, sourceDir, ir),
    unliftedSurfaces: auditUnlifted(client, sourceDir, ir),
  };
}
