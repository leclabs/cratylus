// Greenfield scaffold — scaffold an agent project in a target dir.
//
// `scaffoldProject` turns an empty/target directory into a *project*: not a pile
// of agent files, but a project with its structure laid down. Two acts, in order:
//
//   1. PROJECT THE CULTURE — copy the (already-projected) full render tree
//      (every agent + skill, with staged companions) into
//      `<target>/.claude/{agents,skills}`. Defs/skills are regenerated substance,
//      overwritten freely (`substance-over-accident`).
//   2. LAY THE PROJECT SCAFFOLD — the marker that makes the target a project:
//      - `<target>/AGENTS.md` — the project conventions + the subject.
//      - `<target>/plans/founding/` — a minimal sharded-plan-layout scaffold.
//
// This module is DOCTRINE-AGNOSTIC: what the project documents SAY and which
// state folders the plan scaffold materializes are injected as a
// `ProjectTemplate` (engine declares the structure; corpus supplies the prose +
// states). Forge ships `DEFAULT_PROJECT_TEMPLATE`; a doctrine-bearing corpus
// injects its own.
//
// Clobber-guarded: refuses an existing `<target>/AGENTS.md` unless `force`
// (idempotent re-scaffold). Does NOT seed SEMANTIC/PROCEDURAL/EPISODIC sidecars —
// those are the running host's `deploy` concern; scaffold lays the SOUL, not the
// individual.

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import type { ProjectTemplate } from './project-template.js';
import type { RenderTree } from './types.js';

export const DEFAULT_SUBJECT =
  "<the project's subject -- what this project is for; the project's authors fill this in>";

export interface ScaffoldProjectOpts {
  target: string;
  tree: RenderTree;
  /** The project doctrine to lay down — the prose + plan-layout states. */
  template: ProjectTemplate;
  subject?: string;
  force?: boolean;
  log?: (line: string) => void;
  warn?: (line: string) => void;
}

export interface ScaffoldProjectResult {
  rc: number;
  agents: number;
  skills: number;
  agentsMd: string;
  planDir: string;
}

/** Recursively copy a dir tree (binary-safe). */
function copyTree(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const s = resolvePath(src, entry);
    const d = resolvePath(dest, entry);
    if (statSync(s).isDirectory()) {
      copyTree(s, d);
    } else {
      copyFileSync(s, d);
    }
  }
}

/** Copy every agent def + skill dir from the render tree into
 *  <target>/.claude/{agents,skills}. Returns [agents, skills] counts. */
function projectCulture(target: string, tree: RenderTree): [number, number] {
  const agentsDir = resolvePath(target, '.claude', 'agents');
  const skillsDir = resolvePath(target, '.claude', 'skills');
  mkdirSync(agentsDir, { recursive: true });
  mkdirSync(skillsDir, { recursive: true });

  let nAgents = 0;
  if (existsSync(tree.agentsDir)) {
    for (const f of readdirSync(tree.agentsDir)) {
      if (
        f.endsWith('.md') &&
        statSync(resolvePath(tree.agentsDir, f)).isFile()
      ) {
        copyFileSync(resolvePath(tree.agentsDir, f), resolvePath(agentsDir, f));
        nAgents += 1;
      }
    }
  }

  let nSkills = 0;
  if (existsSync(tree.skillsDir)) {
    for (const d of readdirSync(tree.skillsDir)) {
      const srcDir = resolvePath(tree.skillsDir, d);
      if (
        statSync(srcDir).isDirectory() &&
        existsSync(resolvePath(srcDir, 'SKILL.md'))
      ) {
        copyTree(srcDir, resolvePath(skillsDir, d));
        nSkills += 1;
      }
    }
  }
  return [nAgents, nSkills];
}

/** Create <target>/plans/founding/{PLAN.md, <state-folders>...} — a minimal
 *  sharded-plan-layout from the injected template. Returns the plan dir.
 *  .gitkeep markers keep the empty state folders materializable in git. */
function layPlansScaffold(
  target: string,
  subject: string,
  template: ProjectTemplate,
): string {
  const planDir = resolvePath(target, 'plans', 'founding');
  mkdirSync(planDir, { recursive: true });
  writeFileSync(
    resolvePath(planDir, 'PLAN.md'),
    template.planMd(subject),
    'utf-8',
  );
  for (const state of template.planStates) {
    const sd = resolvePath(planDir, state);
    mkdirSync(sd, { recursive: true });
    writeFileSync(resolvePath(sd, '.gitkeep'), '', 'utf-8');
  }
  return planDir;
}

/** Scaffold an agent project in `target` from the injected template. Returns the
 *  scaffold result (rc 0 ok). */
export function scaffoldProject(
  opts: ScaffoldProjectOpts,
): ScaffoldProjectResult {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? (() => {});
  const subject = opts.subject ?? DEFAULT_SUBJECT;
  const template = opts.template;
  const target = resolvePath(opts.target);
  const agentsMd = resolvePath(target, 'AGENTS.md');
  if (existsSync(agentsMd) && !opts.force) {
    warn(
      `REFUSE  ${agentsMd} already exists -- this dir may already be a project; pass --force to overwrite the project marker`,
    );
    return { rc: 1, agents: 0, skills: 0, agentsMd, planDir: '' };
  }

  mkdirSync(target, { recursive: true });
  log(`=== scaffolding a project in ${target} ===`);

  const [nAgents, nSkills] = projectCulture(target, opts.tree);
  log(
    `  culture projected: ${nAgents} agents + ${nSkills} skills -> ${target}/.claude/`,
  );

  writeFileSync(agentsMd, template.agentsMd(subject), 'utf-8');
  log(`  project marker:    ${agentsMd}`);

  const planDir = layPlansScaffold(target, subject, template);
  log(
    `  plans scaffold:    ${planDir}/ (PLAN.md + ${template.planStates.join('/')})`,
  );

  log(`=== scaffolded: ${nAgents} agents, culture projected ===`);
  return { rc: 0, agents: nAgents, skills: nSkills, agentsMd, planDir };
}
