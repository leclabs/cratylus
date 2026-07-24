// Deploy orchestrator — resolve a SCOPE to the LOCAL `.claude/` root, then run
// the placer that ships the generated defs (the SOUL) and seeds each agent's
// `{SEMANTIC,PROCEDURAL,EPISODIC}` sidecars ONLY IF ABSENT (`memory`).
// Governed oppositely to the def (`substance-over-accident`): the def is
// regenerated substance (overwritten freely); the sidecars are the
// self-authored individual (never clobbered).
//
// Join key is the agent NAME (`named-marker-as-index-key`):
//   <name>.md (def) <-> <name>/SEMANTIC.md (the individual).
//
// STAGE BOUNDARY — deploy places a render tree into the LOCAL `.claude/` root
// and nothing else. Getting the packages onto a host is npm's job (a
// PRECONDITION to the pipeline, not a stage); doing it across N hosts is the
// operator's OUTER LOOP around the whole pipeline, one iteration per host. A
// loop does not belong inside its own body, so neither host topology nor a
// transport backend lives here.
//
// The deploy layer consumes an ALREADY-PROJECTED render tree; the projection
// itself is agent-forge's claude adapter, driven by agent-canon's project-cli.

import { existsSync, readdirSync, statSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { hookTreeNames, placeHooksLocal } from './hooks.js';
import { placeAgentsLocal, placeSkillsLocal } from './local.js';
import { projectScope, userScope } from './scope.js';
import type {
  DeployKind,
  PlaceOpts,
  PlaceReport,
  PlaceResult,
  RenderTree,
} from './types.js';

export type Scope = 'user' | 'project';

export interface DeployOpts {
  kind: DeployKind;
  scope: Scope;
  tree: RenderTree;
  // CLI overrides (null ⇒ unset, defer to the built-in default).
  home?: string | null;
  project?: string | null;
  dry?: boolean;
  // Restrict to a subset of names. Unknown name → hard error.
  only?: string[] | null;
  log?: (line: string) => void;
  warn?: (line: string) => void;
}

/** Names available to deploy for a kind, read from the render tree. Agents are
 *  the `<name>.md` files in agentsDir; skills are the `<name>/` dirs (with a
 *  SKILL.md) in skillsDir. */
export function treeNames(kind: DeployKind, tree: RenderTree): string[] {
  if (kind === 'hooks') {
    return tree.hooksDir ? hookTreeNames(tree.hooksDir) : [];
  }
  if (kind === 'skill') {
    if (!existsSync(tree.skillsDir)) {
      return [];
    }
    return readdirSync(tree.skillsDir)
      .filter((d) => {
        const p = resolvePath(tree.skillsDir, d);
        return (
          statSync(p).isDirectory() && existsSync(resolvePath(p, 'SKILL.md'))
        );
      })
      .sort();
  }
  if (!existsSync(tree.agentsDir)) {
    return [];
  }
  return readdirSync(tree.agentsDir)
    .filter(
      (f) =>
        f.endsWith('.md') && statSync(resolvePath(tree.agentsDir, f)).isFile(),
    )
    .map((f) => f.slice(0, -'.md'.length))
    .sort();
}

/** The set of def/skill names to deploy for `kind`, optionally narrowed by an
 *  `only` allowlist (hard-errors on an unknown name). */
export function resolveNames(
  kind: DeployKind,
  tree: RenderTree,
  only: string[] | null | undefined,
): string[] {
  let names = treeNames(kind, tree);
  if (only && only.length > 0) {
    const want = only.map((n) => n.trim()).filter(Boolean);
    const unknown = want.filter((n) => !names.includes(n));
    if (unknown.length > 0) {
      throw new Error(
        `--only: unknown ${kind}(s) [${unknown.map((n) => `'${n}'`).join(', ')}]; ` +
          `known: [${names.map((n) => `'${n}'`).join(', ')}]`,
      );
    }
    names = names.filter((n) => want.includes(n));
  }
  return names;
}

function placeOpts(opts: DeployOpts): PlaceOpts {
  return {
    dry: opts.dry ?? false,
    log: opts.log,
    warn: opts.warn,
  };
}

/** Deploy in-place to the local `.claude/` root resolved from the scope. */
function deployLocal(names: string[], opts: DeployOpts): PlaceResult {
  const log = opts.log ?? (() => {});
  const scopeRes =
    opts.scope === 'project'
      ? projectScope(opts.project)
      : userScope(opts.home);
  if (scopeRes.note) {
    (opts.warn ?? (() => {}))(scopeRes.note.message);
  }
  log(`=== LOCAL deploy -> ${scopeRes.claudeDir} ===`);
  if (opts.kind === 'hooks') {
    return placeHooksLocal(
      scopeRes.claudeDir,
      opts.tree,
      names,
      placeOpts(opts),
    );
  }
  if (opts.kind === 'skill') {
    return placeSkillsLocal(
      scopeRes.claudeDir,
      opts.tree,
      names,
      placeOpts(opts),
    );
  }
  return placeAgentsLocal(
    scopeRes.claudeDir,
    opts.tree.agentsDir,
    names,
    placeOpts(opts),
  );
}

export type DeploySingleOpts = DeployOpts;

export interface DeploySingleResult {
  rc: number;
  result: PlaceResult;
}

/** Deploy the render tree into the local `.claude/` root for one kind. */
export function deploySingle(opts: DeploySingleOpts): DeploySingleResult {
  const log = opts.log ?? (() => {});
  const names = resolveNames(opts.kind, opts.tree, opts.only);
  log(
    `${opts.kind.endsWith('s') ? opts.kind : `${opts.kind}s`} (${names.length}): ${names.join(', ')}`,
  );
  const result = deployLocal(names, opts);
  return { rc: result.rc === 2 ? 2 : 0, result };
}

export type { PlaceReport, PlaceResult };
