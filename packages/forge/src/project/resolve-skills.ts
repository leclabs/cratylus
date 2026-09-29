// ─────────────────────────────────────────────────────────────────────────────
// THE SKILLS A PLUGIN SET DEPLOYS — resolved once, for every reader.
//
// Two stages read the plugin set's skills: projection renders each one, and
// deploy emits the configuration their runtime faces carry into the host runtime
// config. Each used to resolve them its own way, and two resolutions of one set are
// two answers waiting to differ — a skill rendered from one plugin while its
// configuration came from another. So the resolution lives here and both call it:
// the configuration emitted is the one carried by the skills actually deployed.
// ─────────────────────────────────────────────────────────────────────────────

import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Skill } from '@cratylus/schema';
import { resolveModulePath, scanCellDirNames } from '../core/module-scan.js';
import type { ProjectablePlugin } from './index.js';

/** One skill of the set: the winning plugin's cell under its directory name. */
export interface ContributedSkill {
  /** The cell's directory name — the name it deploys under. */
  readonly name: string;
  readonly skill: Skill;
}

/**
 * Resolve the plugin set's skills, in name order. A later plugin's cell overrides
 * an earlier one's of the same name, and every override is logged: the override
 * is resolved BEFORE any cell is rendered, so it is reported rather than
 * discovered as a clobbered file.
 */
export async function resolveSkills(
  plugins: readonly Pick<ProjectablePlugin, 'name' | 'skills'>[],
  log: (line: string) => void = () => {},
): Promise<ContributedSkill[]> {
  const src = new Map<string, { dir: string; plugin: string }>();
  for (const p of plugins) {
    if (!p.skills) continue;
    for (const n of await scanCellDirNames(p.skills, 'skill')) {
      const prev = src.get(n);
      if (prev) log(`  override skill ${n}: ${prev.plugin} → ${p.name}`);
      src.set(n, { dir: p.skills, plugin: p.name });
    }
  }
  const skills: ContributedSkill[] = [];
  for (const [name, { dir }] of [...src].sort()) {
    const modPath = await resolveModulePath(join(dir, name), 'skill');
    if (!modPath) throw new Error(`skill module not found: ${name}/skill`);
    skills.push({ name, skill: await skillOf(modPath) });
  }
  return skills;
}

/**
 * The CLOSURE of an agent's skills over `composition` — what the agent is given,
 * as opposed to what it declared. A skill that relies on another composes it, so
 * an agent handed only its declared skills starts with part of the system it
 * works in; handed the closure, it starts with the whole.
 *
 * The declared names first, in their order, then every skill they transitively
 * compose, breadth-first in each cell's declaration order, each name once — so a
 * name reached twice keeps its first place and a composition cycle terminates.
 *
 * Each composed name is resolved against `roster`, the set's resolved skills,
 * never against the object a cell's module happened to import: a later plugin's
 * same-name cell is the one that deploys, so its composition is the one that
 * counts. A name absent from the roster is kept, because the agent did name it,
 * and not expanded, because there is no cell to read its composition off.
 */
export function skillClosure(
  declared: readonly string[],
  roster: ReadonlyMap<string, Skill>,
): string[] {
  const closure = [...new Set(declared)];
  const seen = new Set(closure);
  for (let i = 0; i < closure.length; i++) {
    for (const composed of roster.get(closure[i] as string)?.composition() ??
      []) {
      if (seen.has(composed.name)) continue;
      seen.add(composed.name);
      closure.push(composed.name);
    }
  }
  return closure;
}

/** The `Skill` export of a skill module (the object carrying `formalBlock`). */
async function skillOf(modPath: string): Promise<Skill> {
  // Runtime-selected: the cell module is whatever the plugin's skill dir holds.
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
