// The CODEX consumer projection command — the second-harness counterpart of
// `project-cli.ts`. Same agent-canon modules (the `Agent` vector + `ResolvedSkill`), but
// run through agent-forge's CODEX adapter instead of claude: agents → `agents/<name>.toml`,
// skills → `skills/<name>/SKILL.md`, plus the `AGENTS.md` instruction surface.
//
// This IS the T2.4 proof: a agent-canon agent authored ONCE reaches a second agent-forge harness
// for free — the only new code is which harness the walk selects by name. The
// PROJECTION LOGIC lives in agent-forge behind the `HarnessAdapter` port
// (`adapterByName('codex')`); this step only walks agent-canon's typed modules
// and wires them to it.
//
// Usage:  tsx src/toolkit/project-cli-codex.ts [--out <dir>] [--profile <reader/harness>]
//   default out:     packages/agent-canon/.render-ts-codex   (gitignored; separate from .render-ts)
//   default profile: strong-llm-lean/codex

import { mkdirSync, writeFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  type ResolvedSkill,
  adapterByName,
} from '@leclabs/agent-forge/adapters/registry';
import type { Agent, Skill } from '@leclabs/agent-forge/anatomy';

// The harness projection port, selected strictly BY NAME — no concrete codex
// adapter module is imported here (the projection logic lives in forge).
const adapter = adapterByName('codex');

const here = dirname(fileURLToPath(import.meta.url));
const anatomyRoot = join(here, '..', '..');
const agentsModDir = join(anatomyRoot, 'src', 'agents');
const skillsModDir = join(anatomyRoot, 'src', 'skills');

interface Args {
  out: string;
  profile: string;
}

function parseArgs(argv: string[]): Args {
  let out = join(anatomyRoot, '.render-ts-codex');
  let profile = 'strong-llm-lean/codex';
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
    } else {
      throw new Error(`unknown arg ${a}`);
    }
  }
  return { out, profile };
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

async function projectAgents(args: Args): Promise<string[]> {
  const dir = join(args.out, 'agents');
  mkdirSync(dir, { recursive: true });
  const names: string[] = [];
  for (const name of await moduleNames(agentsModDir)) {
    const agent = await agentOf(join(agentsModDir, `${name}.ts`));
    const { filename, content } = adapter.agentDef(agent);
    writeFileSync(join(dir, filename), content);
    process.stdout.write(`EMIT codex agent ${name}\n`);
    names.push(name);
  }
  return names;
}

async function projectSkills(args: Args): Promise<number> {
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
    const dir = join(args.out, 'skills', name);
    mkdirSync(dir, { recursive: true });
    const { filename, content } = adapter.skillDef(resolved);
    writeFileSync(join(dir, filename), content);
    process.stdout.write(`EMIT codex skill ${name}\n`);
    n++;
  }
  return n;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const agentNames = await projectAgents(args);
  const s = await projectSkills(args);
  // The codex AGENTS.md instruction surface (the always-loaded discovery shell).
  const surface = adapter.surface;
  if (!surface) {
    throw new Error(`harness '${adapter.name}' has no instruction surface`);
  }
  const { filename, content } = surface(agentNames);
  writeFileSync(join(args.out, filename), content);
  process.stdout.write(
    `projected ${agentNames.length} agents + ${s} skills + AGENTS.md to ${args.out}\n`,
  );
}
