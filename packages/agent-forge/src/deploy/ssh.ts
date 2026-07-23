// Remote (ssh/scp) placer — ship generated defs to a host's `.claude/` root and
// seed each agent's sidecar layers if-absent, atomically, server-side. Same
// substance/accident contract as the local placer; the host is the accident.
//
// Faithful port of `place/ssh.py`. The shell-out is funnelled through an
// injectable `CommandRunner` so a hermetic test can substitute a fake fleet (no
// real network) — production passes the real `ssh`/`scp` runner.

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve as resolvePath } from 'node:path';
import {
  basename as posixBasename,
  dirname as posixDirname,
} from 'node:path/posix';
import { stageAssets, walkSkillFiles } from './bundle.js';
import { mergeHooksSettings } from './hooks.js';
import { SEED_FILES } from './seeds.js';
import {
  type CommandResult,
  type CommandRunner,
  type PlaceOpts,
  type PlaceResult,
  type RenderTree,
  emptyReport,
} from './types.js';

/** POSIX single-quote shell-quoting (mirrors Python `shlex.quote`). */
export function shQuote(s: string): string {
  if (s === '') {
    return "''";
  }
  if (/^[a-zA-Z0-9_@%+=:,./-]+$/.test(s)) {
    return s;
  }
  return `'${s.replace(/'/g, "'\\''")}'`;
}

/**
 * Wrap a remote command so ssh runs it under the user's INTERACTIVE shell
 * (`$SHELL -ic`, falling back to `zsh` — the fleet's shell — when `$SHELL` is
 * unset). The fleet activates its version manager (mise) in the interactive rc
 * (`.zshrc`), NOT in `.zshenv`/`.zprofile`, so this is the only shell form that
 * puts the mise-managed `node`/`npm` — and, after install, the reshimmed
 * `agent-runtime` bin — on PATH. A bare `ssh host 'npm …'` is non-interactive:
 * mise never sources, so `npm` is `command not found`; a login shell (`-lc`) is
 * no better and on a host with a system node surfaces only `/usr` npm (→ EACCES
 * on a global install). The command is single-quoted so its own quoting survives
 * the extra shell hop, and `${SHELL:-zsh}` expands on the remote (double-quoted
 * so a space in the shell path is safe).
 */
export function interactiveShellCmd(cmd: string): string {
  return `"\${SHELL:-zsh}" -ic ${shQuote(cmd)}`;
}

/** The production runner: actually invokes ssh/scp via spawnSync. Honors
 *  `dry` (no execution, returns a sentinel). */
export function realRunner(dry: boolean): CommandRunner {
  return (cmd: string[]): CommandResult => {
    if (dry) {
      return { rc: 0, out: '(dry-run)' };
    }
    const [bin, ...rest] = cmd;
    if (bin === undefined) {
      return { rc: 1, out: 'empty command' };
    }
    const p = spawnSync(bin, rest, { encoding: 'utf-8' });
    const out = `${p.stdout ?? ''}${p.stderr ?? ''}`.trim();
    return { rc: p.status ?? 1, out };
  };
}

export interface SshPlaceOpts extends PlaceOpts {
  // The injectable command runner; defaults to the real ssh/scp runner.
  runner?: CommandRunner;
}

interface ResolvedDir {
  claudeDir: string | null;
  rc: 0 | 2;
}

/** Reachability check + resolve `home` to an ABSOLUTE remote `.claude` dir.
 *  Returns {claudeDir, 0} on success, {null, 2} if unreachable/unresolvable.
 *  Never passes a literal `~` through shQuote (that suppresses tilde expansion
 *  → writes a literal-named dir); resolves $HOME server-side. */
function resolveClaudeDir(
  target: string,
  home: string,
  run: CommandRunner,
  dry: boolean,
  warn: (line: string) => void,
): ResolvedDir {
  const reach = run([
    'ssh',
    '-o',
    'ConnectTimeout=6',
    '-o',
    'BatchMode=yes',
    target,
    'true',
  ]);
  if (reach.rc !== 0 && !dry) {
    warn(`  UNREACHABLE ${target} -- deferring`);
    return { claudeDir: null, rc: 2 };
  }
  if (home === '~/.claude' || home === '~' || home === '~/') {
    const r = run(['ssh', target, 'printf %s "$HOME"']);
    const remoteHome = dry ? '$HOME' : r.out.trim();
    if (!dry && (r.rc !== 0 || !remoteHome.startsWith('/'))) {
      warn(`  ERR could not resolve remote $HOME: ${r.out}`);
      return { claudeDir: null, rc: 2 };
    }
    return { claudeDir: `${remoteHome}/.claude`, rc: 0 };
  }
  // Explicit path. The flag is named --home; unify with local userScope (which
  // appends `.claude`). A home that is NOT already the `.claude` dir gets it
  // appended — LOUDLY — so a bare home dir can never silently litter
  // `<home>/{agents,skills}` beside the real `<home>/.claude`. A path already
  // ending in `.claude` is used verbatim (back-compat).
  const p = home.replace(/\/+$/, '');
  if (posixBasename(p) !== '.claude') {
    warn(`  NOTE --home '${home}' is a home dir -> deploying to ${p}/.claude`);
    return { claudeDir: `${p}/.claude`, rc: 0 };
  }
  return { claudeDir: p, rc: 0 };
}

/** Deploy agent defs to <user>@<host>, seeding sidecar layers if-absent. */
export function placeAgentsSsh(
  user: string,
  host: string,
  home: string,
  defsDir: string,
  names: string[],
  opts: SshPlaceOpts,
): PlaceResult {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? (() => {});
  const run = opts.runner ?? realRunner(opts.dry);
  const report = emptyReport();
  const target = `${user}@${host}`;
  const resolved = resolveClaudeDir(target, home, run, opts.dry, warn);
  if (resolved.claudeDir === null) {
    return { rc: resolved.rc, report };
  }
  const agentsDir = `${resolved.claudeDir}/agents`;
  // Memory sidecars go to the harness-NEUTRAL home <home>/.agents/<name> (sibling
  // of .claude, mirroring agent-memory `homeForName`) — NOT under .claude/agents,
  // where only the <name>.md declaration lives.
  const memHome = resolved.claudeDir.replace(/\.claude$/, '.agents');
  run(['ssh', target, `mkdir -p ${shQuote(agentsDir)}`]);
  for (const name of names) {
    const src = resolvePath(defsDir, `${name}.md`);
    if (!existsSync(src)) {
      warn(`  WARN  no def for ${name} at ${src}`);
      report.warnings.push(`no def for ${name}`);
      continue;
    }
    if (!opts.dry) {
      const r = run(['scp', '-q', src, `${target}:${agentsDir}/${name}.md`]);
      if (r.rc !== 0) {
        warn(`  ERR scp ${name}: ${r.out}`);
        continue;
      }
    }
    report.copied += 1;
    const selfdir = `${memHome}/${name}`;
    run(['ssh', target, `mkdir -p ${shQuote(selfdir)}`]);
    // seed each layer if-absent, atomically, on the remote: test -e guards.
    for (const [fname, seedfn] of SEED_FILES) {
      const remotef = `${selfdir}/${fname}`;
      const seed = seedfn(name);
      const remoteCmd =
        `if [ -e ${shQuote(remotef)} ]; then echo PRESENT; ` +
        `else cat > ${shQuote(remotef)} <<'MIND_SEED_EOF'\n${seed}\nMIND_SEED_EOF\n echo SEEDED; fi`;
      const r = run(['ssh', target, remoteCmd]);
      const tag = `${name}/${fname}`;
      if (opts.dry) {
        report.seeded.push(`${tag}?`);
      } else if (r.out.trim().endsWith('SEEDED')) {
        report.seeded.push(tag);
      } else if (r.out.trim().endsWith('PRESENT')) {
        report.present.push(tag);
      } else {
        warn(`  ERR seed ${tag}: ${r.out}`);
      }
    }
  }
  log(`  defs copied: ${report.copied}`);
  log(
    `  layers seeded (${report.seeded.length}): ${report.seeded.join(', ') || '-'}`,
  );
  log(
    `  layers present, untouched (${report.present.length}): ${report.present.join(', ') || '-'}`,
  );
  return { rc: 0, report };
}

/** Ship <skillsSrc>/<name>/ -> <remote>/.claude/skills/<name>/ — SKILL.md plus
 *  any staged committed companion assets beside it. Skills are generated
 *  substance with no sidecars — overwrite freely. Committed `assets:` companions
 *  are staged into the source dir first (a missing asset warns, never blocks). */
export function placeSkillsSsh(
  user: string,
  host: string,
  home: string,
  tree: RenderTree,
  names: string[],
  opts: SshPlaceOpts,
): PlaceResult {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? (() => {});
  const run = opts.runner ?? realRunner(opts.dry);
  const report = emptyReport();
  const target = `${user}@${host}`;
  const resolved = resolveClaudeDir(target, home, run, opts.dry, warn);
  if (resolved.claudeDir === null) {
    return { rc: resolved.rc, report };
  }
  const skillsDir = `${resolved.claudeDir}/skills`;
  for (const name of names) {
    const srcDir = resolvePath(tree.skillsDir, name);
    if (!existsSync(resolvePath(srcDir, 'SKILL.md'))) {
      warn(
        `  WARN  no SKILL.md for ${name} at ${resolvePath(srcDir, 'SKILL.md')}`,
      );
      report.warnings.push(`no SKILL.md for ${name}`);
      continue;
    }
    const comp = tree.companions?.[name];
    if (comp?.assets) {
      stageAssets(name, srcDir, comp.assets, {
        assetBaseDir: srcDir,
        log,
        warn,
      });
    }
    const remoteDir = `${skillsDir}/${name}`;
    run(['ssh', target, `mkdir -p ${shQuote(remoteDir)}`]);
    // Recurse the WHOLE skill dir: co-located `scripts/`, `references/`,
    // `assets/` subtrees ride along, structure preserved on the remote.
    const files = walkSkillFiles(srcDir);
    let failed = false;
    if (!opts.dry) {
      // Pre-create each needed remote subdir so nested files land intact.
      const subdirs = new Set<string>();
      for (const rel of files) {
        const d = posixDirname(rel);
        if (d !== '.') {
          subdirs.add(d);
        }
      }
      for (const d of [...subdirs].sort()) {
        run(['ssh', target, `mkdir -p ${shQuote(`${remoteDir}/${d}`)}`]);
      }
      for (const rel of files) {
        // `-p` preserves mode → exec bits on `scripts/*` survive the hop.
        const r = run([
          'scp',
          '-q',
          '-p',
          resolvePath(srcDir, rel),
          `${target}:${remoteDir}/${rel}`,
        ]);
        if (r.rc !== 0) {
          warn(`  ERR scp ${name}/${rel}: ${r.out}`);
          failed = true;
          break;
        }
      }
    }
    if (failed) {
      continue;
    }
    report.copied += 1;
    const extra = files.filter((f) => f !== 'SKILL.md');
    const tail = extra.length
      ? ` (+${extra.length} asset${extra.length === 1 ? '' : 's'})`
      : '';
    log(`  skill ${name} -> ${target}:${remoteDir}/SKILL.md${tail}`);
  }
  log(`  skills copied: ${report.copied}`);
  return { rc: 0, report };
}

/** Ship hook worker scripts to `<remote>/.claude/hooks/<id>/` and MERGE the
 *  projected hooks block into the remote settings.json. The merge runs LOCALLY
 *  (no remote `jq` assumed): read the remote settings.json via `ssh cat`, merge
 *  with `mergeHooksSettings`, scp the merged file back — idempotent and
 *  non-destructive (existing permissions/env/other hooks preserved). */
export function placeHooksSsh(
  user: string,
  host: string,
  home: string,
  tree: RenderTree,
  names: string[],
  opts: SshPlaceOpts,
): PlaceResult {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? (() => {});
  const run = opts.runner ?? realRunner(opts.dry);
  const report = emptyReport();
  const hooksDir = tree.hooksDir;
  if (!hooksDir) {
    warn('  WARN  no hooksDir in render tree; nothing to place');
    return { rc: 0, report };
  }
  const target = `${user}@${host}`;
  const resolved = resolveClaudeDir(target, home, run, opts.dry, warn);
  if (resolved.claudeDir === null) {
    return { rc: resolved.rc, report };
  }
  const remoteHooks = `${resolved.claudeDir}/hooks`;
  for (const name of names) {
    const srcDir = resolvePath(hooksDir, 'hooks', name);
    if (!existsSync(srcDir)) {
      warn(`  WARN  no hook dir for ${name} at ${srcDir}`);
      report.warnings.push(`no hook dir for ${name}`);
      continue;
    }
    const remoteDir = `${remoteHooks}/${name}`;
    run(['ssh', target, `mkdir -p ${shQuote(remoteDir)}`]);
    const files = readdirSync(srcDir)
      .filter((f) => statSync(resolvePath(srcDir, f)).isFile())
      .sort();
    let failed = false;
    if (!opts.dry) {
      for (const f of files) {
        const r = run([
          'scp',
          '-q',
          resolvePath(srcDir, f),
          `${target}:${remoteDir}/${f}`,
        ]);
        if (r.rc !== 0) {
          warn(`  ERR scp ${name}/${f}: ${r.out}`);
          failed = true;
          break;
        }
      }
    }
    if (failed) {
      continue;
    }
    report.copied += 1;
    log(
      `  hook ${name} -> ${target}:${remoteDir}/ (+${files.length} asset(s))`,
    );
  }
  // Merge the hooks block into the remote settings.json (read → merge → write).
  const fragFile = resolvePath(hooksDir, 'settings.json');
  if (existsSync(fragFile)) {
    const incoming =
      (
        JSON.parse(readFileSync(fragFile, 'utf-8')) as {
          hooks?: Record<string, unknown>;
        }
      ).hooks ?? {};
    if (Object.keys(incoming).length > 0) {
      const remoteSettings = `${resolved.claudeDir}/settings.json`;
      let existing: Record<string, unknown> = {};
      if (!opts.dry) {
        const r = run([
          'ssh',
          target,
          `cat ${shQuote(remoteSettings)} 2>/dev/null || echo '{}'`,
        ]);
        try {
          existing = JSON.parse(r.out.trim() || '{}') as Record<
            string,
            unknown
          >;
        } catch {
          warn('  WARN remote settings.json unparseable; starting from {}');
          existing = {};
        }
      }
      const { settings, added } = mergeHooksSettings(
        existing,
        incoming as Record<string, never>,
      );
      if (!opts.dry) {
        const tmp = resolvePath(
          mkdtempSync(resolvePath(tmpdir(), 'agent-forge-hooks-')),
          'settings.json',
        );
        writeFileSync(tmp, `${JSON.stringify(settings, null, 2)}\n`);
        run(['ssh', target, `mkdir -p ${shQuote(resolved.claudeDir)}`]);
        const r = run(['scp', '-q', tmp, `${target}:${remoteSettings}`]);
        if (r.rc !== 0) {
          warn(`  ERR scp settings.json: ${r.out}`);
        }
      }
      log(
        `  settings.json: merged hooks for [${Object.keys(incoming).join(', ')}] ` +
          `(+${added} new) -> ${target}:${remoteSettings}`,
      );
    }
  }
  log(`  hooks copied: ${report.copied}`);
  return { rc: 0, report };
}
