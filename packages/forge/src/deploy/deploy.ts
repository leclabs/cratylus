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
// itself is forge's claude adapter, driven by `cratylus project`.

import { existsSync, readdirSync, statSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { hookTreeNames, placeHooksLocal } from './hooks.js';
import { placeAgentsLocal, placeSkillsLocal } from './local.js';
import {
  applyPrune,
  hasManifest,
  nextKindRecord,
  readManifest,
  staleFiles,
  unattributable,
  unregisterHookCommandsAt,
  writeManifest,
} from './manifest.js';
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
  /**
   * WHICH harness's home the tree lands in — `HarnessAdapter.home` (`.claude`,
   * `.codex`). Omitted ⇒ `.claude`, the historical behaviour.
   *
   * Passed as the dot-dir rather than the whole adapter deliberately: deploy is a
   * FILE PLACER and needs exactly one fact from the adapter. Handing it the
   * adapter would invite it to start projecting, which is the other half of the
   * seam and not its concern.
   */
  harnessHome?: string | null;
  /** The harness's agent-definition extension (`HarnessAdapter.agentExt`). */
  agentExt?: string | null;
  /** The harness's hook-config filename (`HarnessAdapter.hooksFile`). */
  hooksFile?: string | null;
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
 *  the `<name><agentExt>` files in agentsDir; skills are the `<name>/` dirs (with
 *  a SKILL.md) in skillsDir. `agentExt` is the ADAPTER's — reading a codex tree
 *  with claude's `.md` returns an empty list, which is indistinguishable from an
 *  empty tree and deploys nothing while reporting success. */
export function treeNames(
  kind: DeployKind,
  tree: RenderTree,
  agentExt = '.md',
): string[] {
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
        f.endsWith(agentExt) &&
        statSync(resolvePath(tree.agentsDir, f)).isFile(),
    )
    .map((f) => f.slice(0, -agentExt.length))
    .sort();
}

/** The set of def/skill names to deploy for `kind`, optionally narrowed by an
 *  `only` allowlist (hard-errors on an unknown name). */
export function resolveNames(
  kind: DeployKind,
  tree: RenderTree,
  only: string[] | null | undefined,
  agentExt = '.md',
): string[] {
  let names = treeNames(kind, tree, agentExt);
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
    // The harness's artifact shapes, forwarded from the adapter. Omitting these
    // is how a codex deploy silently placed nothing: the placers' `.md` /
    // `settings.json` defaults are correct for claude and wrong everywhere else,
    // and a wrong default here fails by finding no files, which reads as success.
    ...(opts.agentExt ? { agentExt: opts.agentExt } : {}),
    ...(opts.hooksFile ? { hooksFile: opts.hooksFile } : {}),
    log: opts.log,
    warn: opts.warn,
  };
}

/** Run the kind's placer against a resolved `.claude/` root. */
function place(
  harnessDir: string,
  names: string[],
  opts: DeployOpts,
): PlaceResult {
  if (opts.kind === 'hooks') {
    return placeHooksLocal(harnessDir, opts.tree, names, placeOpts(opts));
  }
  if (opts.kind === 'skill') {
    return placeSkillsLocal(harnessDir, opts.tree, names, placeOpts(opts));
  }
  return placeAgentsLocal(
    harnessDir,
    opts.tree.agentsDir,
    names,
    placeOpts(opts),
  );
}

/**
 * CONVERGE the deploy root to the render tree: place, then subtract whatever a
 * PRIOR deploy of this tree left behind and this one did not re-write.
 *
 * The subtraction is bounded by the manifest and nothing else — see
 * `manifest.ts` for why attribution must be by record rather than by naming
 * convention. Three refusals live here:
 *   - no prior manifest ⇒ nothing is attributable ⇒ prune nothing, just record;
 *   - `--only` ⇒ a subset intent, so the prune stays inside the subset;
 *   - `--dry-run` ⇒ print the exact deletion set, delete nothing.
 */
function deployLocal(names: string[], opts: DeployOpts): PlaceResult {
  const log = opts.log ?? (() => {});
  const dry = opts.dry ?? false;
  const scopeRes =
    opts.scope === 'project'
      ? projectScope(opts.project, opts.harnessHome ?? undefined)
      : userScope(opts.home, opts.harnessHome ?? undefined);
  if (scopeRes.note) {
    (opts.warn ?? (() => {}))(scopeRes.note.message);
  }
  const harnessDir = scopeRes.harnessDir;
  log(`=== LOCAL deploy -> ${harnessDir} ===`);

  const bootstrap = !hasManifest(harnessDir);
  const unaccounted = dry
    ? unattributable(
        harnessDir,
        opts.kind,
        names,
        Object.keys(readManifest(harnessDir).kinds[opts.kind] ?? {}),
      )
    : [];
  const prior = readManifest(harnessDir);
  const result = place(harnessDir, names, opts);

  const narrowed = Boolean(opts.only && opts.only.length > 0);
  const priorKind = prior.kinds[opts.kind] ?? {};
  const { written, skipped, registered } = result.report;

  if (bootstrap) {
    log(
      '  prune: no prior deploy manifest in this root — nothing here is ' +
        'attributable to this tool, so nothing is removed; this deploy ' +
        'establishes the record and the next one can converge.',
    );
  } else {
    const stale = staleFiles(priorKind, written, skipped, narrowed);
    const removed = applyPrune(harnessDir, stale, dry);
    if (removed.length > 0) {
      log(
        dry
          ? `  prune (dry-run): ${removed.length} orphan(s) WOULD be removed:`
          : `  prune: removed ${removed.length} orphan(s):`,
      );
      for (const rel of removed) {
        log(`    - ${rel}`);
      }
    }
    // A registration whose worker this prune just deleted would still fire.
    if (opts.kind === 'hooks' && !narrowed) {
      const staleCmds = prior.hookCommands.filter(
        (c) => !registered.includes(c),
      );
      const n = unregisterHookCommandsAt(
        resolvePath(harnessDir, 'settings.json'),
        staleCmds,
        dry,
      );
      if (n > 0) {
        log(
          dry
            ? `  prune (dry-run): ${n} settings.json hook registration(s) WOULD be unregistered`
            : `  prune: unregistered ${n} stale settings.json hook entr${n === 1 ? 'y' : 'ies'}`,
        );
      }
    }
  }

  // A dry run also SHOWS what the prune will never touch: names this tool cannot
  // account for. They are left alone by design — an orphan from a pre-manifest
  // deploy is indistinguishable from an operator's own artifact, so the operator
  // decides, not us.
  if (unaccounted.length > 0) {
    log(
      `  prune (dry-run): ${unaccounted.length} ${opts.kind} name(s) in the target are UNATTRIBUTABLE`,
    );
    log(
      '    (not in the render tree, not in the manifest — never pruned; retire any orphan by hand)',
    );
    for (const n of unaccounted) {
      log(`    ? ${n}`);
    }
  }

  if (!dry) {
    writeManifest(harnessDir, {
      ...prior,
      kinds: {
        ...prior.kinds,
        [opts.kind]: nextKindRecord(priorKind, written, skipped, narrowed),
      },
      hookCommands:
        opts.kind === 'hooks'
          ? narrowed
            ? [...new Set([...prior.hookCommands, ...registered])]
            : registered
          : prior.hookCommands,
    });
  }
  return result;
}

export type DeploySingleOpts = DeployOpts;

export interface DeploySingleResult {
  rc: number;
  result: PlaceResult;
}

/** Deploy the render tree into the local `.claude/` root for one kind. */
export function deploySingle(opts: DeploySingleOpts): DeploySingleResult {
  const log = opts.log ?? (() => {});
  const names = resolveNames(
    opts.kind,
    opts.tree,
    opts.only,
    opts.agentExt ?? undefined,
  );
  log(
    `${opts.kind.endsWith('s') ? opts.kind : `${opts.kind}s`} (${names.length}): ${names.join(', ')}`,
  );
  const result = deployLocal(names, opts);
  return { rc: result.rc === 2 ? 2 : 0, result };
}

export type { PlaceReport, PlaceResult };
