// Greenfield init (polis-instantiation) — found a mind-society in a target dir.
//
// `init <target>` turns an empty/target directory into a *founded polis*: not a
// pile of agent files, but a society with the [[politeia]] (foundational
// structure) laid down. Two acts, in order:
//
//   1. PROJECT THE CULTURE — copy the (already-projected) full render tree
//      (every agent + skill, with staged companions) into
//      `<target>/.claude/{agents,skills}`. The founders nico + mav are among
//      the projected agents ("agents born as founders" — [[founder-charter]]).
//      Defs/skills are regenerated substance, overwritten freely
//      ([[substance-over-accident]]).
//   2. LAY THE FOUNDING SCAFFOLD — the marker that makes the target a society:
//      - `<target>/AGENTS.md` — cites the constitution, names the founders,
//        states the subject. Modeled on polis's own root AGENTS.md.
//      - `<target>/plans/founding/` — a minimal sharded-plan-layout scaffold.
//
// Clobber-guarded: refuses an existing `<target>/AGENTS.md` unless `force`
// (idempotent re-found). Does NOT seed SEMANTIC/PROCEDURAL/EPISODIC sidecars — those are
// the running host's `deploy` concern; init lays the SOUL, not the individual.
//
// Faithful port of `toolkit/init.py` (agent-forge consumes a render tree where Python
// composed resolve.emit directly).

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import type { RenderTree } from './types.js';

export const PLAN_STATES = ['pending', 'ready', 'active', 'completed'] as const;
export const DEFAULT_SUBJECT =
  "<the society's subject -- what this polis is for; the founders fill this in>";

export interface InitOpts {
  target: string;
  tree: RenderTree;
  subject?: string;
  force?: boolean;
  log?: (line: string) => void;
  warn?: (line: string) => void;
}

export interface InitResult {
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

export function foundingAgentsMd(subject: string): string {
  return `# agent conventions

This project is a **founded mind-society** -- a *polis*, not a pile of agents. It was
founded by projecting the polis commons (\`packages/agent-anatomy\`) into this repository: the
foundational structure (the **politeia**) is laid down, and the founders are born
among the projected agents.

## Subject

${subject}

## The founders

Born into this society as projected agents (\`.claude/agents/\`):

- **Nico** 📐 -- master builder of the **constitution**: roles, archetypes, the
  society itself. To mutate the culture, be Nico or delegate to him.
- **Mav** ✈️ -- master builder of the **substrate**: the infrastructure, machinery,
  and delivery the society runs on. For build/delivery, Mav leads.

\`principal-ic\` is **intrinsic** to both founders -- the founder genus, bound to this
society's subject, not a path-scoped grant (the founder charter).

## How this society was founded

- **Culture** -- every agent + skill in this \`.claude/\` is a *projection* of a agent-anatomy
  corpus cell, not a hand-authored copy. Regenerate by re-projecting; do not
  hand-edit the generated defs (each carries a \`GENERATED from ...\` provenance
  header + content-hash that the projector guards against clobbering).
- **Constitution cited, not copied** -- the founding draws on the polis *politeia*
  (the foundational structure) and *founder-charter* (who founds, on what terms).
  This society *is a polis* because it instantiates that structure.

## Work-tracking

\`plans/\` is a sharded-plan-layout: \`PLAN.md\` is the backlog + status mirror; task
files move through state folders (\`pending/ -> ready/ -> active/ -> completed/\`) as
dependencies clear.
`;
}

export function foundingPlanMd(subject: string): string {
  return `# founding -- PLAN

The founding backlog of this mind-society. \`PLAN.md\` mirrors the state folders;
task files move \`pending/ -> ready/ -> active/ -> completed/\` as deps clear.

**Subject:** ${subject}

## Backlog (pending)

- **F1 -- state the subject** -- replace the placeholder in \`AGENTS.md\` and above
  with this society's real subject (what this polis is for).
- **F2 -- adopt on a host** -- deploy the founded agents to a running client so the
  founders (nico, mav) wake with their identity-memory sidecars seeded.
`;
}

/** Create <target>/plans/founding/{PLAN.md, pending/, ready/, active/,
 *  completed/} — a minimal sharded-plan-layout. Returns the plan dir.
 *  .gitkeep markers keep the empty state folders materializable in git. */
function layPlansScaffold(target: string, subject: string): string {
  const planDir = resolvePath(target, 'plans', 'founding');
  mkdirSync(planDir, { recursive: true });
  writeFileSync(
    resolvePath(planDir, 'PLAN.md'),
    foundingPlanMd(subject),
    'utf-8',
  );
  for (const state of PLAN_STATES) {
    const sd = resolvePath(planDir, state);
    mkdirSync(sd, { recursive: true });
    writeFileSync(resolvePath(sd, '.gitkeep'), '', 'utf-8');
  }
  return planDir;
}

/** Found a mind-society in `target`. Returns the init result (rc 0 ok). */
export function initSociety(opts: InitOpts): InitResult {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? (() => {});
  const subject = opts.subject ?? DEFAULT_SUBJECT;
  const target = resolvePath(opts.target);
  const agentsMd = resolvePath(target, 'AGENTS.md');
  if (existsSync(agentsMd) && !opts.force) {
    warn(
      `REFUSE  ${agentsMd} already exists -- this dir may already be a founded society; pass --force to overwrite the founding marker`,
    );
    return { rc: 1, agents: 0, skills: 0, agentsMd, planDir: '' };
  }

  mkdirSync(target, { recursive: true });
  log(`=== founding a polis in ${target} ===`);

  const [nAgents, nSkills] = projectCulture(target, opts.tree);
  log(
    `  culture projected: ${nAgents} agents + ${nSkills} skills -> ${target}/.claude/`,
  );

  writeFileSync(agentsMd, foundingAgentsMd(subject), 'utf-8');
  log(`  founding marker:   ${agentsMd}`);

  const planDir = layPlansScaffold(target, subject);
  log(`  plans scaffold:    ${planDir}/ (PLAN.md + ${PLAN_STATES.join('/')})`);

  log(`=== founded: ${nAgents} founders+agents born, culture projected ===`);
  return { rc: 0, agents: nAgents, skills: nSkills, agentsMd, planDir };
}
