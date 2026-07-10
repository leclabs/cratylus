// The consumer projection command — a thin agent-anatomy BUILD STEP that imports agent-forge's
// claude adapter and runs it over agent-anatomy's typed agent/skill modules, writing the
// full SOUL/SKILL tree to disk. The PROJECTION LOGIC lives in agent-forge
// (`@leclabs/agent-forge/adapters/claude`); this step only walks agent-anatomy's modules and
// wires them to it (agent-anatomy = agent-forge's source).
//
// Usage:  tsx src/toolkit/project-cli.ts [--out <dir>]
//   default out:  packages/agent-anatomy/.render-ts   (gitignored)
//
// Projection is a THIN MAP from the typed `Agent`/`Skill` vectors — no reader-density
// knob (a dead projection parameter: the body was byte-identical at every density) and
// no provenance banner. A skill's SKILL.md is `f(name, formalBlock, composition())`.

import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  type ResolvedSkill,
  agentToClaudeMd,
  serializeClaudeHooksReport,
  skillToClaudeMd,
} from '@leclabs/agent-forge/adapters/claude';
import type { Agent, Skill } from '@leclabs/agent-forge/anatomy';
import { hookSources } from './hooks.js';

const here = dirname(fileURLToPath(import.meta.url));
const anatomyRoot = join(here, '..', '..');
const agentsModDir = join(anatomyRoot, 'src', 'agents');
const skillsModDir = join(anatomyRoot, 'src', 'skills');

interface Args {
  out: string;
}

function parseArgs(argv: string[]): Args {
  let out = join(anatomyRoot, '.render-ts');
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') {
      const v = argv[++i];
      if (!v) {
        throw new Error('--out requires a value');
      }
      out = v;
    } else {
      throw new Error(`unknown arg ${a}`);
    }
  }
  return { out };
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

/** The `<name>: Agent` vector export of an agent module. */
async function agentOf(modPath: string): Promise<Agent> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const key = Object.keys(mod).find((k) => k !== 'default');
  if (!key) {
    throw new Error(`${modPath}: no Agent export`);
  }
  return mod[key] as Agent;
}

/** The `Skill` export of a skill module (the object carrying `formalBlock`; a
 *  module also exports its `<name>Notation` σ* string, which this skips). */
async function skillOf(modPath: string): Promise<Skill> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const skill = Object.values(mod).find(
    (v): v is Skill =>
      typeof v === 'object' && v !== null && 'formalBlock' in v,
  );
  if (!skill) {
    throw new Error(`${modPath}: no Skill export`);
  }
  return skill;
}

async function projectAgents(out: string): Promise<number> {
  const dir = join(out, 'agents');
  mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const name of await moduleNames(agentsModDir)) {
    const agent = await agentOf(join(agentsModDir, `${name}.ts`));
    writeFileSync(join(dir, `${name}.md`), agentToClaudeMd(agent));
    process.stdout.write(`EMIT agent ${name}\n`);
    n++;
  }
  return n;
}

async function projectSkills(out: string): Promise<number> {
  const names = await moduleNames(skillsModDir);
  let n = 0;
  for (const name of names) {
    const cell = await skillOf(join(skillsModDir, `${name}.ts`));
    const resolved: ResolvedSkill = {
      name: cell.name,
      trigger: `/${cell.name}`,
      description: cell.description,
      formalBlock: cell.formalBlock,
      // Composed-from: the resolved sibling skills (lazy thunk), each as its
      // `/trigger`. Every entry IS a known skill, so no slug lookup is needed.
      composedFrom: cell.composition().map((c) => `/${c.name}`),
    };
    const dir = join(out, 'skills', name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'SKILL.md'), skillToClaudeMd(resolved));
    process.stdout.write(`EMIT skill ${name}\n`);
    n++;
  }
  return n;
}

/**
 * The `memory` dual-deploy dir (`deploy: skill-dir`): its `## Tool` section is the
 * SKILL.md body VERBATIM, and the bundled `memory.mjs` tool ships beside it. Sourced
 * from `src/genus/memory.md` (the one home) + the memory build artifact.
 */
async function projectMemorySkill(out: string): Promise<void> {
  const { readFileSync } = await import('node:fs');
  const memRaw = readFileSync(
    join(anatomyRoot, 'src', 'genus', 'memory.md'),
    'utf8',
  );
  const memBody = memRaw.split('---').slice(2).join('---');
  const toolSection = sectionBody(memBody, 'Tool');
  const fm =
    frontField(memRaw, 'skill_description') ||
    frontField(memRaw, 'description');
  const resolved: ResolvedSkill = {
    name: 'memory',
    trigger: '', // memory has no /trigger (a protocol home, not a command)
    description: fm,
    skillDescription: frontField(memRaw, 'skill_description') || fm,
    formalBlock: '', // bypassed: the `deploy: skill-dir` toolSection path
    composedFrom: [],
    toolSection,
  };
  const dir = join(out, 'skills', 'memory');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'SKILL.md'), skillToClaudeMd(resolved));
  // Bundle the built memory.mjs (the host memory tool) beside SKILL.md.
  const bundle = join(anatomyRoot, '..', 'agent-memory', 'dist', 'memory.mjs');
  copyFileSync(bundle, join(dir, 'memory.mjs'));
  process.stdout.write('EMIT skill memory (dual-deploy + memory.mjs)\n');
}

/**
 * Project the agent-forge `Hook` sources into the render tree:
 *   - `settings.json` — the `{hooks}` block (claude adapter `serializeClaudeHooks`,
 *     canonical `turn.end`/`subagent.end` → `Stop`/`SubagentStop`). A SETTINGS
 *     FRAGMENT (hooks only); deploy MERGES it into the host's settings.json so it
 *     never clobbers permissions/env/other keys.
 *   - `hooks/<id>/` — the worker scripts staged beside it as deployable assets.
 * Off-by-default is preserved at RUNTIME (the worker re-checks the per-repo
 * git-config opt-in), so registering the hook on every host stays inert until a
 * repo opts in — registration is now agent-forge-managed, not a hand-rolled `jq` edit.
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
  // Stage each hook's worker payloads under hooks/<id>/ in the render tree. The
  // bytes come from the source cell (`worker.content`), not an on-disk copy — the
  // cell is the sole home; the executable bit is set per `worker.executable`.
  let n = 0;
  for (const src of hookSources) {
    const destDir = join(out, 'hooks', src.hook.id ?? 'unnamed');
    mkdirSync(destDir, { recursive: true });
    for (const worker of src.workers) {
      const dest = join(destDir, worker.filename);
      writeFileSync(dest, worker.content);
      if (worker.executable) {
        chmodSync(dest, 0o755);
      }
    }
    process.stdout.write(
      `EMIT hook ${src.hook.id} (+${src.workers.length} worker${src.workers.length === 1 ? '' : 's'})\n`,
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
  // Clean the out dir first — a removed/renamed cell must not leave a stale render.
  rmSync(args.out, { recursive: true, force: true });
  const a = await projectAgents(args.out);
  const s = await projectSkills(args.out);
  await projectMemorySkill(args.out);
  const h = await projectHooks(args.out);
  process.stdout.write(
    `projected ${a} agents + ${s + 1} skills + ${h} hook(s) to ${args.out}\n`,
  );
}
