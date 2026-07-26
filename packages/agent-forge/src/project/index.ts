// ─────────────────────────────────────────────────────────────────────────────
// PROJECTION over a RESOLVED PLUGIN SET — the missing link between `compose` and
// `deploy`.
//
// `compose` resolved the plugin set and wrote nothing; `deploy` required a render
// tree; and the only producer of a render tree was a MONOREPO SCRIPT that
// dir-scanned the corpus and bypassed the plugin resolver entirely. So a consumer
// could install, extend, and resolve — and still not obtain a single artifact.
//
// This module closes that gap, and closes it ONCE: the corpus's own projection and
// the consumer's projection are now the same call over the same plugin dirs. The
// difference between "our corpus" and "a consumer's config" is only WHICH plugins
// are in the set — which is the whole point of a build-time plugin architecture.
//
// RENDERING IS NOT WRITING. Projection returns the artifact tree; `writeRenderTree`
// (./write.ts) puts it on disk. This module opens no file descriptor — that is a
// LOAD-BEARING property, not tidiness: it is what makes "what does this plugin set
// project?" an answerable question instead of a tmpdir excavation.
// ─────────────────────────────────────────────────────────────────────────────

import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  type Agent,
  type HookCell,
  type Skill,
  hookIrOf,
} from '../anatomy/index.js';
import type { ResolvedSkill } from '../core/anatomy-body.js';
import type { HarnessAdapter } from '../core/harness-adapter.js';
import {
  resolveModulePath,
  scanCellDirNames,
  scanModuleNames,
} from '../core/module-scan.js';
import { runtimeShimContent } from './runtime-shim.js';

/** The plugin fields projection consumes — the dirs a plugin contributes cells from. */
export interface ProjectablePlugin {
  readonly name: string;
  readonly agents?: string;
  readonly skills?: string;
  /** Leading block stamped into this plugin's cells; travels with the plugin. */
  readonly preamble?: string;
  /** Dir of hook cell modules this plugin contributes. */
  readonly hooks?: string;
}

export interface ProjectOpts {
  /** The resolved plugin set, in `extends` order. */
  readonly plugins: readonly ProjectablePlugin[];
  /** The harness adapter that renders each cell. */
  readonly adapter: HarnessAdapter;
  /**
   * A doctrine-agnostic leading block stamped into every projected cell. The corpus
   * passes its founding doctrine so the axiom rides the projected bytes rather than
   * ambient repo context; a consumer may pass nothing.
   */
  readonly preamble?: string;
  readonly log?: (line: string) => void;
}

interface Src {
  readonly dir: string;
  readonly plugin: string;
  readonly preamble?: string;
}

export interface ProjectReport {
  readonly agents: number;
  readonly skills: number;
  readonly shims: number;
  readonly hooks: number;
}

/**
 * ONE projected artifact: its path RELATIVE to the render-tree root, plus its bytes.
 * `HarnessAdapter` already hands back `{ filename, content }` per cell; this is that
 * pair once the projection has decided which subtree the cell belongs under.
 */
export interface ProjectedFile {
  /** Path relative to the render-tree root, e.g. `skills/wake/SKILL.md`. */
  readonly path: string;
  readonly content: string;
  /** 0755 on write (shims, hook workers). Absent ⇒ ambient umask. */
  readonly executable?: boolean;
}

/**
 * What a plugin set projects to: every artifact as bytes, plus the counts.
 *
 * DELIBERATELY a local structural type, and deliberately unnamed beyond that. This
 * is NOT MODEL's `IR`: `ir : agent → IR` is AGENT-scoped and is already realized by
 * the `Agent` interface. A whole-plugin-set aggregate is a different thing that no
 * grounding doc declares, and minting a canonical anchor for it is a cratylism act
 * this seam is not entitled to perform.
 */
export interface ProjectedTree extends ProjectReport {
  readonly files: readonly ProjectedFile[];
}

/** The `<name>: Agent` vector export of an agent module. */
async function agentOf(modPath: string): Promise<Agent> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const key = Object.keys(mod).find((k) => k !== 'default');
  if (!key) throw new Error(`${modPath}: no Agent export`);
  return mod[key] as Agent;
}

/** The `Skill` export of a skill module (the object carrying `formalBlock`). */
async function skillOf(modPath: string): Promise<Skill> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const skill = Object.values(mod).find(
    (v): v is Skill =>
      typeof v === 'object' && v !== null && 'formalBlock' in v,
  );
  if (!skill) throw new Error(`${modPath}: no Skill export`);
  return skill;
}

/** The `HookCell` export of a hook module (the object carrying `substrate`). */
async function hookOf(modPath: string): Promise<HookCell | null> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const cell = Object.values(mod).find(
    (v): v is HookCell =>
      typeof v === 'object' && v !== null && 'substrate' in v && 'workers' in v,
  );
  return cell ?? null;
}

/**
 * Project every cell contributed by the plugin set into an artifact tree. Writes
 * nothing — hand the result to `writeRenderTree(out, tree.files)`.
 *
 * Later plugins in `extends` order win on a name collision — the same precedence
 * `resolve()` gives fragments, so a consumer can override a canon cell by shipping
 * one of the same name. The winner is reported, never silently applied.
 */
export async function projectPluginSet(
  opts: ProjectOpts,
): Promise<ProjectedTree> {
  const log = opts.log ?? (() => {});
  const files: ProjectedFile[] = [];

  // Collect by name across plugins first, so an override is resolved BEFORE any
  // cell is rendered and can be logged rather than discovered as a clobbered file.
  const agentSrc = new Map<string, Src>();
  const skillSrc = new Map<string, Src>();
  for (const p of opts.plugins) {
    if (p.agents) {
      for (const n of await scanModuleNames(p.agents, ['base'])) {
        const prev = agentSrc.get(n);
        if (prev) log(`  override agent ${n}: ${prev.plugin} → ${p.name}`);
        agentSrc.set(n, {
          dir: p.agents,
          plugin: p.name,
          preamble: p.preamble,
        });
      }
    }
    if (p.skills) {
      for (const n of await scanCellDirNames(p.skills, 'skill')) {
        const prev = skillSrc.get(n);
        if (prev) log(`  override skill ${n}: ${prev.plugin} → ${p.name}`);
        skillSrc.set(n, {
          dir: p.skills,
          plugin: p.name,
          preamble: p.preamble,
        });
      }
    }
  }

  let agents = 0;
  for (const [name, { dir, preamble: pre }] of [...agentSrc].sort()) {
    const modPath = await resolveModulePath(dir, name);
    if (!modPath) throw new Error(`agent module not found: ${name}`);
    const agent = await agentOf(modPath);
    const { filename, content } = opts.adapter.agentDef({
      ...agent,
      ...((pre ?? opts.preamble) ? { preamble: pre ?? opts.preamble } : {}),
    });
    files.push({ path: join('agents', filename), content });
    log(`EMIT agent ${name}`);
    agents++;
  }

  let skills = 0;
  let shims = 0;
  for (const [name, { dir, preamble: pre }] of [...skillSrc].sort()) {
    const cellPath = await resolveModulePath(join(dir, name), 'skill');
    if (!cellPath) throw new Error(`skill module not found: ${name}/skill`);
    const cell = await skillOf(cellPath);
    const resolved: ResolvedSkill = {
      name: cell.name,
      trigger: `/${cell.name}`,
      description: cell.description,
      formalBlock: cell.formalBlock,
      composedFrom: cell.composition().map((c) => `/${c.name}`),
      ...((pre ?? opts.preamble) ? { preamble: pre ?? opts.preamble } : {}),
      runtime: cell.runtime,
    };
    const cellOut = join('skills', name);
    const { filename, content } = opts.adapter.skillDef(resolved);
    files.push({ path: join(cellOut, filename), content });
    if (cell.runtime) {
      files.push({
        path: join(cellOut, 'scripts', `${cell.runtime.capability}.mjs`),
        content: runtimeShimContent(cell.runtime.capability),
        executable: true,
      });
      log(
        `EMIT skill ${name} (+runtime shim scripts/${cell.runtime.capability}.mjs)`,
      );
      shims++;
    } else {
      log(`EMIT skill ${name}`);
    }
    skills++;
  }

  // Hooks. Only `harness`-substrate cells register in settings.json; a
  // `git`-substrate cell fires in git's own process and must never be serialized
  // here, so it is filtered BEFORE the lift (which refuses it loudly anyway).
  const hookCells: HookCell[] = [];
  for (const p of opts.plugins) {
    if (!p.hooks) continue;
    for (const n of await scanModuleNames(p.hooks)) {
      const modPath = await resolveModulePath(p.hooks, n);
      if (!modPath) continue;
      const cell = await hookOf(modPath);
      if (cell && cell.substrate === 'harness') hookCells.push(cell);
    }
  }

  hookCells.sort(
    (a, b) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) -
        (b.order ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id),
  );

  let hooks = 0;
  if (hookCells.length > 0) {
    const renderHooks = opts.adapter.hooks;
    if (!renderHooks) {
      throw new Error(
        `harness '${opts.adapter.name}' does not project hooks, but the plugin set contributes ${hookCells.length}`,
      );
    }
    const sources = hookCells.map((cell) => ({
      hook: hookIrOf(cell),
      workers: cell.workers,
    }));
    const { settings, warnings, skipped } = renderHooks(
      sources.map((s) => s.hook),
    );
    for (const w of warnings) log(`WARN hook: ${w}`);
    for (const sk of skipped) log(`SKIP hook ${sk.path}: ${sk.reason}`);
    files.push({
      path: 'settings.json',
      content: `${JSON.stringify({ hooks: settings }, null, 2)}\n`,
    });
    log(`EMIT settings.json (hooks: ${Object.keys(settings).join(', ')})`);
    for (const src of sources) {
      const destDir = join('hooks', src.hook.id ?? 'unnamed');
      for (const worker of src.workers) {
        // Bytes come from the CELL, never an on-disk copy — the cell is the home.
        files.push({
          path: join(destDir, worker.filename),
          content: worker.content,
          ...(worker.executable ? { executable: true } : {}),
        });
      }
      log(
        `EMIT hook ${src.hook.id} (+${src.workers.length} worker${src.workers.length === 1 ? '' : 's'})`,
      );
      hooks++;
    }
  }

  return { files, agents, skills, shims, hooks };
}

export { emitRuntimeShim } from './runtime-shim.js';
export { writeRenderTree } from './write.js';
