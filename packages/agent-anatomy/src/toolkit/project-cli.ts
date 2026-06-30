// The consumer projection command — a thin mind BUILD STEP that imports koine's
// claude adapter and runs it over mind's typed agent/skill modules, writing the
// full SOUL/SKILL tree to disk. The PROJECTION LOGIC lives in koine
// (`@leclabs/agent-forge/adapters/claude`); this step only walks mind's modules and
// wires them to it (mind = koine's source). The TS counterpart of
// `toolkit/resolve.py main()`.
//
// Usage:  tsx src/toolkit/project-cli.ts [--out <dir>] [--density <reader>]
//                                        [--profile <reader/harness>]
//   default out:     packages/mind/.render-ts   (gitignored; never the Python .render)
//   default density: strong-llm-lean (the deployed reader; → profile
//                    strong-llm-lean/claude-code)
//
// Reader density is the PRIMARY knob — `--density strong-llm-lean|strong-llm|weak-llm`
// — and is just a PROJECTION PARAMETER, never a property of the source modules: the
// same typed fragments project at the chosen density. It maps to the recorded
// `profile:` header as `<density>/claude-code`. `--profile` is the explicit escape
// hatch (full `<reader>/<harness>` control); it overrides `--density` when given.

import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  type ReaderDensity,
  type ResolvedAgent,
  type ResolvedSkill,
  agentToClaudeMd,
  densityProfile,
  isReaderDensity,
  serializeClaudeHooksReport,
  skillToClaudeMd,
} from '@leclabs/agent-forge/adapters/claude';
import { hookSources } from './hooks.js';
import type { SkillCell } from './skill-cell.js';

const here = dirname(fileURLToPath(import.meta.url));
const mindRoot = join(here, '..', '..');
const agentsModDir = join(mindRoot, 'src', 'agents');
const skillsModDir = join(mindRoot, 'src', 'skills');

interface Args {
  out: string;
  profile: string;
}

function parseArgs(argv: string[]): Args {
  let out = join(mindRoot, '.render-ts');
  let density: ReaderDensity = 'strong-llm-lean';
  let profile: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') {
      const v = argv[++i];
      if (!v) {
        throw new Error('--out requires a value');
      }
      out = v;
    } else if (a === '--density') {
      const v = argv[++i];
      if (!v) {
        throw new Error('--density requires a value');
      }
      if (!isReaderDensity(v)) {
        throw new Error(
          `unknown --density ${v} (want strong-llm-lean | strong-llm | weak-llm)`,
        );
      }
      density = v;
    } else if (a === '--profile') {
      const v = argv[++i];
      if (!v) {
        throw new Error('--profile requires a value');
      }
      profile = v;
    } else {
      throw new Error(`unknown arg ${a}`);
    }
  }
  // `--profile` (explicit `<reader>/<harness>`) wins; else derive from `--density`.
  return { out, profile: profile ?? densityProfile(density) };
}

async function moduleNames(dir: string): Promise<string[]> {
  const names: string[] = [];
  for await (const p of glob('*.ts', { cwd: dir })) {
    if (p !== 'base.ts') {
      names.push(p.replace(/\.ts$/, ''));
    }
  }
  return names.sort();
}

/** The `<name>Resolved: ResolvedAgent` export of an agent module. */
async function resolvedAgentOf(modPath: string): Promise<ResolvedAgent> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const key = Object.keys(mod).find((k) => k.endsWith('Resolved'));
  if (!key) {
    throw new Error(`${modPath}: no *Resolved export`);
  }
  return mod[key] as ResolvedAgent;
}

/** The first `SkillCell` export of a skill module. */
async function skillCellOf(modPath: string): Promise<SkillCell> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const key = Object.keys(mod).find((k) => k !== 'default');
  return mod[key as string] as SkillCell;
}

async function projectAgents(out: string, profile: string): Promise<number> {
  const dir = join(out, 'agents');
  mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const name of await moduleNames(agentsModDir)) {
    const resolved = await resolvedAgentOf(join(agentsModDir, `${name}.ts`));
    writeFileSync(join(dir, `${name}.md`), agentToClaudeMd(resolved, profile));
    process.stdout.write(`EMIT agent ${name}\n`);
    n++;
  }
  return n;
}

async function projectSkills(out: string, profile: string): Promise<number> {
  const names = await moduleNames(skillsModDir);
  const cells = new Map<string, SkillCell>();
  for (const name of names) {
    cells.set(name, await skillCellOf(join(skillsModDir, `${name}.ts`)));
  }
  // The ref projector: a `[[slug]]` whose target is a known skill → its `/trigger`;
  // any other slug → typographic `**slug**` (mirrors compose.harness.ref_text).
  const refProject = (slug: string): string => {
    const cell = cells.get(slug);
    return cell ? cell.trigger : `**${slug}**`;
  };

  let n = 0;
  for (const name of names) {
    const cell = cells.get(name) as SkillCell;
    const resolved: ResolvedSkill = {
      name: cell.name,
      trigger: cell.trigger,
      delineation: cell.delineation,
      body: cell.body,
      composedFrom: cell.composition.map(refProject),
      sourcePath: `packages/mind/skill/${name}.md`,
    };
    const dir = join(out, 'skills', name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'SKILL.md'),
      skillToClaudeMd(resolved, refProject, profile),
    );
    process.stdout.write(`EMIT skill ${name}\n`);
    n++;
  }
  return n;
}

/**
 * The `memory` dual-deploy dir (`deploy: skill-dir`): its `## Tool` section is the
 * SKILL.md body VERBATIM, and the bundled `episodic.mjs` ships beside it. Sourced
 * from `ideas/memory.md` (the one home) + the episodic build artifact.
 */
async function projectMemorySkill(out: string, profile: string): Promise<void> {
  const { readFileSync } = await import('node:fs');
  const memRaw = readFileSync(join(mindRoot, 'ideas', 'memory.md'), 'utf8');
  const memBody = memRaw.split('---').slice(2).join('---');
  const toolSection = sectionBody(memBody, 'Tool');
  const fm =
    frontField(memRaw, 'skill_description') ||
    frontField(memRaw, 'delineation');
  const resolved: ResolvedSkill = {
    name: 'memory',
    trigger: '', // memory has no /trigger (a protocol home, not a command)
    delineation: fm,
    skillDescription: frontField(memRaw, 'skill_description') || fm,
    body: '',
    composedFrom: [],
    sourcePath: 'packages/mind/ideas/memory.md',
    toolSection,
  };
  const dir = join(out, 'skills', 'memory');
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'SKILL.md'),
    skillToClaudeMd(resolved, (s) => `**${s}**`, profile),
  );
  // Bundle the built episodic.mjs (the host memory tool) beside SKILL.md.
  const bundle = join(mindRoot, '..', 'agent-memory', 'dist', 'episodic.mjs');
  copyFileSync(bundle, join(dir, 'episodic.mjs'));
  process.stdout.write('EMIT skill memory (dual-deploy + episodic.mjs)\n');
}

/**
 * Project the koine `Hook` sources into the render tree:
 *   - `settings.json` — the `{hooks}` block (claude adapter `serializeClaudeHooks`,
 *     canonical `turn.end`/`subagent.end` → `Stop`/`SubagentStop`). A SETTINGS
 *     FRAGMENT (hooks only); deploy MERGES it into the host's settings.json so it
 *     never clobbers permissions/env/other keys.
 *   - `hooks/<id>/` — the worker scripts staged beside it as deployable assets.
 * Off-by-default is preserved at RUNTIME (the worker re-checks the per-repo
 * git-config opt-in), so registering the hook on every host stays inert until a
 * repo opts in — registration is now koine-managed, not a hand-rolled `jq` edit.
 */
async function projectHooks(out: string): Promise<number> {
  const { hooks, warnings, skipped } = serializeClaudeHooksReport(
    hookSources.map((s) => s.hook),
  );
  for (const w of warnings) {
    process.stderr.write(`WARN hook: ${w}\n`);
  }
  for (const s of skipped) {
    process.stderr.write(`SKIP hook ${s.path}: ${s.reason}\n`);
  }
  mkdirSync(out, { recursive: true });
  writeFileSync(
    join(out, 'settings.json'),
    `${JSON.stringify({ hooks }, null, 2)}\n`,
  );
  process.stdout.write(
    `EMIT settings.json (hooks: ${Object.keys(hooks).join(', ')})\n`,
  );
  // Stage each hook's worker scripts under hooks/<id>/ in the render tree.
  let n = 0;
  for (const src of hookSources) {
    const destDir = join(out, 'hooks', src.hook.id ?? 'unnamed');
    mkdirSync(destDir, { recursive: true });
    for (const asset of src.assets) {
      copyFileSync(join(mindRoot, src.assetDir, asset), join(destDir, asset));
    }
    process.stdout.write(
      `EMIT hook ${src.hook.id} (+${src.assets.length} worker asset${src.assets.length === 1 ? '' : 's'})\n`,
    );
    n++;
  }
  return n;
}

/** The `## <heading>` section body of a cell, blank-trimmed (mirrors section_body). */
function sectionBody(body: string, heading: string): string {
  const want = `## ${heading}`.toLowerCase();
  const out: string[] = [];
  let inSection = false;
  for (const line of body.split('\n')) {
    if (line.startsWith('## ')) {
      if (inSection) {
        break;
      }
      if (line.toLowerCase() === want) {
        inSection = true;
      }
      continue;
    }
    if (inSection) {
      out.push(line);
    }
  }
  while (out.length && out[0]?.trim() === '') {
    out.shift();
  }
  while (out.length && out[out.length - 1]?.trim() === '') {
    out.pop();
  }
  return out.join('\n');
}

function frontField(raw: string, key: string): string {
  const m = raw.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return m?.[1]?.trim() ?? '';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const a = await projectAgents(args.out, args.profile);
  const s = await projectSkills(args.out, args.profile);
  await projectMemorySkill(args.out, args.profile);
  const h = await projectHooks(args.out);
  process.stdout.write(
    `projected ${a} agents + ${s + 1} skills + ${h} hook(s) to ${args.out}\n`,
  );
}
