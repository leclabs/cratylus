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
import type { Agent, Skill } from '@leclabs/agent-forge/anatomy';
import {
  resolveModulePath,
  scanCellDirNames,
  scanModuleNames,
} from '@leclabs/agent-forge/core';
import { projectPluginSet } from '@leclabs/agent-forge/project';
import canonPlugin from '../index.js';
import { hookSources } from './hooks.js';
import { emitRuntimeShim } from './runtime-shim.js';

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
}> {
  // The SAME call a consumer's `agent-forge project` makes — the corpus is just
  // one plugin in the set. Keeping a second dir-scanning projector here is what
  // let the consumer path rot unnoticed; there is now one path, and we ride it.
  const { agents, skills } = await projectPluginSet({
    plugins: [canonPlugin],
    out,
    adapter,
    log: (line) => process.stdout.write(`${line}\n`),
  });
  return { agents, skills };
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
  const projectHooksReport = adapter.hooks;
  if (!projectHooksReport) {
    throw new Error(`harness '${adapter.name}' does not project hooks`);
  }
  const { settings, warnings, skipped } = projectHooksReport(
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
    `${JSON.stringify({ hooks: settings }, null, 2)}\n`,
  );
  process.stdout.write(
    `EMIT settings.json (hooks: ${Object.keys(settings).join(', ')})\n`,
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  // Clean the out dir first — a removed/renamed cell must not leave a stale render.
  rmSync(args.out, { recursive: true, force: true });
  const { agents, skills } = await projectCells(args.out);
  const h = await projectHooks(args.out);
  process.stdout.write(
    `projected ${agents} agents + ${skills} skills + ${h} hook(s) to ${args.out}\n`,
  );
}
