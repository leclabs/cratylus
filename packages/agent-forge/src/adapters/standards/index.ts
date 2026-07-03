import { existsSync, readdirSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  type Adapter,
  type AdapterCapabilities,
  type IR,
  type Rule,
  type Scope,
  type Skill,
  type WriteOpts,
  type WriteReport,
  parseFrontmatter,
  parseRule,
  serializeFrontmatter,
  splitScopedRules,
  writeNestedRuleFiles,
} from '../../core/index.js';

/**
 * The `standards` adapter — the neutral/agnostic surface itself (E7.S9), not
 * a harness dialect: root + nested `AGENTS.md` [S1][S9] and `.agents/skills/`
 * [S3][S60]. It is both an importer (lifts the shared tree any standards-
 * native harness already reads/writes into IR) and the reference emitter for
 * that same tree — the engine's own dir-scoped-rule routing
 * (`core/engine/nested-rules.ts`) reuses the identical split/write so the
 * compile-level glue and this adapter's own `write` never diverge.
 *
 * Project-scope only: dir-scoping and the neutral tree are project-tree
 * concepts with no documented user/local-home convention, so `read`/`write`
 * are no-ops (loud skip, nothing fabricated) outside `project` scope.
 *
 * Deliberately thin: no vendor config surface exists for commands/agents/
 * hooks/mcp/permissions/env under the neutral tree, so those resources are
 * loudly skipped — one entry per item, never a silent or fabricated drop.
 */

const SKIP_DIRS = new Set(['node_modules', '.git']);

/** Nested-AGENTS.md-carrying dirs under `root` (dot-dirs/node_modules/.git
 *  excluded), relative POSIX-joined paths, sorted. Root itself is excluded —
 *  callers read it separately. */
function findNestedAgentsMdDirs(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string, rel: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name);
    } catch {
      return;
    }
    for (const name of entries) {
      if (name.startsWith('.') || SKIP_DIRS.has(name)) continue;
      const childRel = rel ? `${rel}/${name}` : name;
      const childAbs = join(dir, name);
      if (existsSync(join(childAbs, 'AGENTS.md'))) out.push(childRel);
      walk(childAbs, childRel);
    }
  };
  walk(root, '');
  return out.sort();
}

/** Spec-pure SKILL.md for `.agents/skills/`: Agent Skills fields only,
 *  dashed `allowed-tools` [S3][S60]. IR-only fields (files, targets, …) have
 *  no home here and are dropped (the neutral tree carries no harness
 *  extras) — the same lossy set zed's `.agents/skills` writer drops. */
function serializeSpecSkill(skill: Skill): string {
  const fm: Record<string, unknown> = {
    name: skill.name,
    description: skill.description,
  };
  if (skill.allowed_tools) fm['allowed-tools'] = skill.allowed_tools;
  if (skill.license !== undefined) fm.license = skill.license;
  if (skill.compatibility !== undefined) fm.compatibility = skill.compatibility;
  if (skill.metadata !== undefined) fm.metadata = skill.metadata;
  return serializeFrontmatter(fm, skill.body);
}

/** Parse a spec-pure SKILL.md written by `serializeSpecSkill` (dashed
 *  `allowed-tools`, never the IR's underscore field name). */
function parseSpecSkill(text: string, defaultName: string): Skill {
  const { frontmatter, body } = parseFrontmatter<Record<string, unknown>>(text);
  const name =
    typeof frontmatter.name === 'string' ? frontmatter.name : defaultName;
  const description =
    typeof frontmatter.description === 'string' ? frontmatter.description : '';
  const skill: Skill = { name, description, body };
  const allowedTools = frontmatter['allowed-tools'];
  if (Array.isArray(allowedTools))
    skill.allowed_tools = allowedTools as string[];
  if (typeof frontmatter.license === 'string')
    skill.license = frontmatter.license;
  if (typeof frontmatter.compatibility === 'string')
    skill.compatibility = frontmatter.compatibility;
  if (frontmatter.metadata && typeof frontmatter.metadata === 'object')
    skill.metadata = frontmatter.metadata as Record<string, string>;
  return skill;
}

async function readSkillsDir(dir: string): Promise<Skill[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: Skill[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const file = join(dir, entry.name, 'SKILL.md');
    if (!existsSync(file)) continue;
    out.push(parseSpecSkill(await readFile(file, 'utf8'), entry.name));
  }
  return out;
}

const capabilities: AdapterCapabilities = {
  resources: {
    rules: 'full', // root + nested AGENTS.md [S1][S9]
    // partial: spec-pure `.agents/skills` drops files/license/compatibility/
    // metadata/paths/user_invocable/disable_model_invocation — same lossy
    // set zed declares 'partial' for, same reason [S3][S60].
    skills: 'partial',
    commands: 'none', // no neutral command-file convention
    agents: 'none', // no neutral subagent-file convention
    hooks: 'none', // no neutral hook convention
    mcp: 'none', // no neutral MCP convention
    permissions: 'none', // no neutral permissions convention
    env: 'none', // no neutral env convention
  },
  hooks: { supported: [], matchers: 'none', payload: 'native' },
  // Neutral tree is a project-tree concept; no documented user/local home —
  // 'local' gets the engine's automatic no-local-tier skip, 'user' is
  // refused explicitly by read/write below (never fabricated).
  scopes: ['project'],
};

async function readImpl(scope: Scope, cwd: string): Promise<Partial<IR>> {
  if (scope !== 'project') return {};
  const ir: Partial<IR> = {};
  const rules: Rule[] = [];

  const rootFile = join(cwd, 'AGENTS.md');
  if (existsSync(rootFile)) {
    rules.push(parseRule(await readFile(rootFile, 'utf8'), 'main'));
  }
  for (const dir of findNestedAgentsMdDirs(cwd)) {
    const text = await readFile(join(cwd, dir, 'AGENTS.md'), 'utf8');
    const rule = parseRule(text, dir.replace(/\//g, '-'));
    rule.dir = dir;
    rules.push(rule);
  }
  if (rules.length) ir.rules = rules;

  const skillsDir = join(cwd, '.agents', 'skills');
  if (existsSync(skillsDir)) {
    const skills = await readSkillsDir(skillsDir);
    if (skills.length) ir.skills = skills;
  }

  return ir;
}

/** Every resource item present in the IR as `<label>/<id-or-name>` (bare
 *  label for a singleton resource) — the same convention the engine's own
 *  `presentResources` uses for elicit entries. */
function presentUnsupported(ir: IR): { path: string; reason: string }[] {
  const out: { path: string; reason: string }[] = [];
  for (const c of ir.commands ?? [])
    out.push({ path: `commands/${c.name}`, reason: 'unsupported' });
  for (const a of ir.agents ?? [])
    out.push({ path: `agents/${a.name}`, reason: 'unsupported' });
  for (const h of ir.hooks ?? [])
    out.push({ path: `hooks/${h.id ?? '?'}`, reason: 'unsupported' });
  for (const s of ir.mcp_servers ?? [])
    out.push({ path: `mcp/${s.name}`, reason: 'unsupported' });
  if (ir.permissions) out.push({ path: 'permissions', reason: 'unsupported' });
  if (ir.env && Object.keys(ir.env).length)
    out.push({ path: 'env', reason: 'unsupported' });
  return out;
}

async function writeImpl(
  ir: IR,
  scope: Scope,
  cwd: string,
  opts: WriteOpts = {},
): Promise<WriteReport> {
  if (scope !== 'project') {
    const skipped = [
      ...(ir.rules ?? []).map((r) => ({
        path: `rules/${r.id}`,
        reason: 'no-standards-surface-at-scope',
      })),
      ...(ir.skills ?? []).map((s) => ({
        path: `skills/${s.name}`,
        reason: 'no-standards-surface-at-scope',
      })),
      ...presentUnsupported(ir).map((s) => ({
        ...s,
        reason: 'no-standards-surface-at-scope',
      })),
    ];
    const warnings = skipped.length
      ? [
          `standards: no documented neutral-tree surface at scope '${scope}' — ${skipped.length} resource(s) skipped, nothing fabricated`,
        ]
      : [];
    return { written: [], skipped, warnings };
  }

  const written: string[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const warnings: string[] = [];

  if (ir.rules?.length) {
    const { root, scoped } = splitScopedRules(ir.rules);
    if (root.length) {
      const file = join(cwd, 'AGENTS.md');
      const body = root.map((r) => r.body).join('\n\n');
      if (!opts.dryRun) {
        await mkdir(cwd, { recursive: true });
        await writeFile(file, `${body}\n`, 'utf8');
      }
      written.push(file);
    }
    if (scoped.size > 0) {
      written.push(...(await writeNestedRuleFiles(scoped, cwd, opts.dryRun)));
    }
  }

  if (ir.skills?.length) {
    const skillsDir = join(cwd, '.agents', 'skills');
    for (const skill of ir.skills) {
      const dir = join(skillsDir, skill.name);
      const file = join(dir, 'SKILL.md');
      if (!opts.dryRun) {
        await mkdir(dir, { recursive: true });
        await writeFile(file, serializeSpecSkill(skill), 'utf8');
      }
      written.push(file);
    }
  }

  const unsupported = presentUnsupported(ir);
  if (unsupported.length) {
    skipped.push(...unsupported);
    const labels = new Set(unsupported.map((u) => u.path.split('/')[0]));
    for (const label of labels) {
      warnings.push(
        `${label}: no documented neutral-standards surface — dropped, nothing fabricated`,
      );
    }
  }

  return { written, skipped, warnings };
}

export const standardsAdapter: Adapter = {
  id: 'standards',
  capabilities,
  async detect(scope: Scope, cwd: string): Promise<boolean> {
    if (scope !== 'project') return false;
    return (
      existsSync(join(cwd, 'AGENTS.md')) ||
      existsSync(join(cwd, '.agents', 'skills'))
    );
  },
  read: readImpl,
  write: writeImpl,
};
export default standardsAdapter;
