// The consumer projection command — a thin agent-canon BUILD STEP that selects
// forge's claude harness adapter BY NAME (`adapterByName('claude')`, never a
// concrete adapter subpath) and runs it over agent-canon's typed agent/skill
// modules, writing the full SOUL/SKILL tree to disk. The PROJECTION LOGIC lives
// in agent-forge behind the `HarnessAdapter` port; this step only walks
// agent-canon's modules and wires them to it (agent-canon = agent-forge's source).
//
// Usage:  tsx src/toolkit/project-cli.ts [--out <dir>]
//   default out:  packages/agent-canon/.render-ts   (gitignored)
//
// Projection is a THIN MAP from the typed `Agent`/`Skill` vectors — no reader-density
// knob (a dead projection parameter: the body was byte-identical at every density) and
// no provenance banner. A skill's SKILL.md is `f(name, formalBlock, composition())`.

import { chmodSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  type ResolvedSkill,
  adapterByName,
} from '@leclabs/agent-forge/adapters/registry';
import {
  resolveModulePath,
  scanCellDirNames,
  scanModuleNames,
} from '@leclabs/agent-forge/module-scan';
import {
  projectPluginSet,
  writeRenderTree,
} from '@leclabs/agent-forge/project';
import type { Skill } from '@leclabs/agent-schema';
import type { Agent } from '../anatomy.js';
import canonPlugin from '../index.js';

// The harness projection port, selected strictly BY NAME — no concrete claude
// adapter module is imported here (the projection logic lives in forge).
const adapter = adapterByName('claude');

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
  return scanModuleNames(dir, ['base']);
}

/** Skill cells are self-contained dirs: `<name>/skill.<ext>`; the name is the dir. */
async function skillNames(dir: string): Promise<string[]> {
  return scanCellDirNames(dir, 'skill');
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

async function projectCells(out: string): Promise<{
  agents: number;
  skills: number;
  hooks: number;
}> {
  // The SAME call a consumer's `agent-forge project` makes — the corpus is just
  // one plugin in the set. Keeping a second dir-scanning projector here is what
  // let the consumer path rot unnoticed; there is now one path, and we ride it.
  //
  // NO `resolvedBodies`, deliberately. `agent-forge project` folds fragments here
  // because a CONSUMER may author `patches`; canon is a PLUGIN, has no
  // `agents.config.ts`, and authors none. Passing `resolveFragmentBodies(d, [])`
  // would be the identity over an always-empty patch set — a call site and a code
  // path buying a false impression of coverage and changing no emitted byte. Wire
  // it when `patches` becomes authorable at all (see `config.ts:26-29`), not before.
  const { files, agents, skills, hooks } = await projectPluginSet({
    plugins: [canonPlugin],
    adapter,
    log: (line) => process.stdout.write(`${line}\n`),
  });
  writeRenderTree(out, files);
  return { agents, skills, hooks };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  // Clean the out dir first — a removed/renamed cell must not leave a stale render.
  rmSync(args.out, { recursive: true, force: true });
  const { agents, skills, hooks } = await projectCells(args.out);
  process.stdout.write(
    `projected ${agents} agents + ${skills} skills + ${hooks} hook(s) to ${args.out}\n`,
  );
}
