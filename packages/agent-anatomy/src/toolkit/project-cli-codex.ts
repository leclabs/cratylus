// The CODEX consumer projection command — the second-harness counterpart of
// `project-cli.ts`. Same mind modules, same `ResolvedAgent`/`ResolvedSkill`, but
// run through koine's CODEX adapter instead of claude: agents → `agents/<name>.toml`,
// skills → `skills/<name>/SKILL.md`, plus the `AGENTS.md` instruction surface.
//
// This IS the T2.4 proof: a mind agent authored ONCE reaches a second koine harness
// for free — the only new code is which adapter functions the walk calls. The
// PROJECTION LOGIC lives in koine (`@leclabs/agent-forge/adapters/codex`); this step only
// walks mind's typed modules and wires them to it.
//
// Usage:  tsx src/toolkit/project-cli-codex.ts [--out <dir>] [--profile <reader/harness>] [--delta]
//   default out:     packages/mind/.render-ts-codex   (gitignored; separate from .render-ts)
//   default profile: strong-llm-lean/codex
//   --delta:         subtract the codex harness reset (omit-to-inherit; first-pass reset)

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  type ResolvedAgent,
  type ResolvedSkill,
  agentToCodexToml,
  agentsMdSurface,
  codexHarnessReset,
  projectCodexAgentDelta,
  skillToCodexMd,
} from '@leclabs/agent-forge/adapters/codex';
import type { SkillCell } from './skill-cell.js';

const here = dirname(fileURLToPath(import.meta.url));
const mindRoot = join(here, '..', '..');
const agentsModDir = join(mindRoot, 'src', 'agents');
const skillsModDir = join(mindRoot, 'src', 'skills');

interface Args {
  out: string;
  profile: string;
  delta: boolean;
}

function parseArgs(argv: string[]): Args {
  let out = join(mindRoot, '.render-ts-codex');
  let profile = 'strong-llm-lean/codex';
  let delta = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') {
      const v = argv[++i];
      if (!v) {
        throw new Error('--out requires a value');
      }
      out = v;
    } else if (a === '--profile') {
      const v = argv[++i];
      if (!v) {
        throw new Error('--profile requires a value');
      }
      profile = v;
    } else if (a === '--delta') {
      delta = true;
    } else {
      throw new Error(`unknown arg ${a}`);
    }
  }
  return { out, profile, delta };
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

async function projectAgents(args: Args): Promise<string[]> {
  const dir = join(args.out, 'agents');
  mkdirSync(dir, { recursive: true });
  const names: string[] = [];
  for (const name of await moduleNames(agentsModDir)) {
    const resolved = await resolvedAgentOf(join(agentsModDir, `${name}.ts`));
    const toml = args.delta
      ? projectCodexAgentDelta(resolved, codexHarnessReset, args.profile)
      : agentToCodexToml(resolved, args.profile);
    writeFileSync(join(dir, `${name}.toml`), toml);
    process.stdout.write(`EMIT codex agent ${name}\n`);
    names.push(name);
  }
  return names;
}

async function projectSkills(args: Args): Promise<number> {
  const names = await moduleNames(skillsModDir);
  const cells = new Map<string, SkillCell>();
  for (const name of names) {
    cells.set(name, await skillCellOf(join(skillsModDir, `${name}.ts`)));
  }
  // The codex ref projector: a `[[slug]]` whose target is a known skill → its
  // `/trigger`; any other slug → typographic `**slug**` (same affordance as claude
  // — codex consumes the AgentSkills `/trigger` surface too).
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
    const dir = join(args.out, 'skills', name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'SKILL.md'), skillToCodexMd(resolved, refProject));
    process.stdout.write(`EMIT codex skill ${name}\n`);
    n++;
  }
  return n;
}

/**
 * The `memory` dual-deploy skill (`deploy: skill-dir`): its `## Tool` section is the
 * SKILL.md body VERBATIM. Codex consumes the AgentSkills spec, so the same surface
 * projects; the bundled `episodic.mjs` is a claude-runtime concern (the host memory
 * tool path) and is NOT carried here (codex memory wiring is a later concern).
 */
async function projectMemorySkill(args: Args): Promise<void> {
  const memRaw = readFileSync(join(mindRoot, 'ideas', 'memory.md'), 'utf8');
  const memBody = memRaw.split('---').slice(2).join('---');
  const toolSection = sectionBody(memBody, 'Tool');
  const fm =
    frontField(memRaw, 'skill_description') ||
    frontField(memRaw, 'delineation');
  const resolved: ResolvedSkill = {
    name: 'memory',
    trigger: '',
    delineation: fm,
    skillDescription: frontField(memRaw, 'skill_description') || fm,
    body: '',
    composedFrom: [],
    sourcePath: 'packages/mind/ideas/memory.md',
    toolSection,
  };
  const dir = join(args.out, 'skills', 'memory');
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'SKILL.md'),
    skillToCodexMd(resolved, (s) => `**${s}**`),
  );
  process.stdout.write('EMIT codex skill memory (dual-deploy)\n');
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
  const agentNames = await projectAgents(args);
  const s = await projectSkills(args);
  await projectMemorySkill(args);
  // The codex AGENTS.md instruction surface (the always-loaded discovery shell).
  writeFileSync(join(args.out, 'AGENTS.md'), agentsMdSurface(agentNames));
  process.stdout.write(
    `projected ${agentNames.length} agents + ${s + 1} skills + AGENTS.md to ${args.out}${
      args.delta ? ' (delta: codex reset subtracted)' : ''
    }\n`,
  );
}
