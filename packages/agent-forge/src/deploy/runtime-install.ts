// ─────────────────────────────────────────────────────────────────────────────
// The per-host RUNTIME-INSTALL step (S7, FORK-3) — the deploy half that lands
// `@leclabs/agent-runtime` + its capability plugins on a host so a deployed skill's
// thin-shim `agent-runtime <capability> <verb>` resolves and WORKS.
//
// FORK-3 = MONOREPO-BUNDLED per-host install, NO npm publish (a private @leclabs
// fleet). The build host packs the runtime + each capability package into
// version-pinned tarballs (`pnpm pack`, which rewrites the pnpm-only `workspace:` /
// `catalog:` protocols to concrete npm-installable specs), then does ONE FLAT
// co-install per host:
//
//     npm install -g --prefix <PREFIX> <runtime.tgz> <memory.tgz>
//
// so the runtime + every capability package land as SIBLINGS in ONE resolvable
// `node_modules` (`<PREFIX>/lib/node_modules/@leclabs/*`) and the `agent-runtime`
// bin lands on PATH (`<PREFIX>/bin`, npm's own bin-link — NOT a hand-symlink). That
// co-location is exactly what the loader's `discover()` needs: its
// `import('@leclabs/agent-memory')` resolves as a sibling of the runtime it runs
// from — no `discover()` change required (proven by the real-bin dogfood).
//
// IDEMPOTENT + VERSION-PINNED: a content FINGERPRINT of the bundle is stamped into
// the install; a re-deploy whose bundle fingerprint matches is a NO-OP. RETIRES the
// old `memory` bin + the orphan `~/.claude/skills/memory/episodic.mjs`. Every
// shell-out funnels through the injectable {@link CommandRunner} so a test is
// hermetic; production passes the real ssh/scp/spawn runner.
// ─────────────────────────────────────────────────────────────────────────────

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { interactiveShellCmd, realRunner, shQuote } from './ssh.js';
import type { CommandRunner } from './types.js';

/**
 * The monorepo package DIRECTORIES (basenames under `<root>/packages/`) the bundle
 * carries: the runtime leaf FIRST (it owns the bin + the event-tap capability), then
 * each capability PACKAGE the loader's `discover()` probes. `@leclabs/agent-memory`
 * is the one capability package today (event-tap ships inside agent-runtime); a new
 * capability package is added here + to the loader's `KNOWN_CAPABILITY_PACKAGES`.
 */
export const RUNTIME_BUNDLE_PACKAGES = [
  'agent-runtime',
  'agent-memory',
  // The installable CLI carries the BIN and DECLARES the capability packages as
  // real dependencies. It must ship in the bundle or the install lands no bin at
  // all. Its presence also means capability resolution no longer depends on this
  // installer's flat co-location — that ambient coupling is what the CLI replaces.
  'agent-cli',
] as const;

/** Where the bundle fingerprint is stamped, relative to the install prefix — inside
 *  the runtime package so it is co-located with the install and removed with it. */
export const RUNTIME_STAMP_REL =
  'lib/node_modules/@leclabs/agent-runtime/.bundle-fingerprint';

/** The bin the flat co-install lands on PATH (`<prefix>/bin/<BIN>`). */
export const RUNTIME_BIN = 'agent-runtime';

/** A built runtime bundle: the packed tarballs + a content fingerprint (the
 *  idempotency key) + the runtime version (the human-readable pin). */
export interface RuntimeBundle {
  tarballs: string[];
  fingerprint: string;
  version: string;
}

export interface RuntimeInstallOpts {
  dry: boolean;
  log?: (line: string) => void;
  warn?: (line: string) => void;
  // Injected command runner (default: the real ssh/scp/spawn runner honoring dry).
  runner?: CommandRunner;
  // Override the install prefix (default: the host's npm global prefix, already on
  // PATH). A test passes a temp prefix; production leaves it unset.
  prefix?: string | null;
  // Override the monorepo root the bundle is packed from (default: discovered by
  // walking up from this module to the `pnpm-workspace.yaml`).
  monorepoRoot?: string | null;
  // A pre-built bundle to reuse across hosts in ONE deploy (fleet: pack once).
  bundle?: RuntimeBundle | null;
}

/** Walk up from `from` to the dir holding `pnpm-workspace.yaml` (the monorepo root
 *  the runtime packages are packed from). Throws if none is found. */
export function resolveMonorepoRoot(from: string): string {
  let dir = resolve(from);
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(
        `runtime-install: no pnpm-workspace.yaml found above ${from} — cannot locate the runtime packages to bundle`,
      );
    }
    dir = parent;
  }
}

/** The default monorepo root, discovered from this module's location. */
function defaultMonorepoRoot(): string {
  return resolveMonorepoRoot(import.meta.dirname ?? process.cwd());
}

/** A content fingerprint over the packed tarballs — the idempotency key. Bytes of
 *  each tarball, hashed in package order, so any source change flips it. */
function bundleFingerprint(tarballs: string[]): string {
  const h = createHash('sha256');
  for (const t of tarballs) h.update(readFileSync(t));
  return h.digest('hex').slice(0, 16);
}

/**
 * Build the runtime bundle on the build host: `pnpm pack` each
 * {@link RUNTIME_BUNDLE_PACKAGES} dir into a fresh staging dir (pnpm rewrites the
 * `workspace:`/`catalog:` protocols to concrete specs), then fingerprint the set.
 * Pure w.r.t. the host — the produced tarballs are the shippable artifact.
 */
export function buildRuntimeBundle(
  opts: RuntimeInstallOpts = { dry: false },
): RuntimeBundle {
  const log = opts.log ?? (() => {});
  const run = opts.runner ?? realRunner(false); // packing runs even on a dry deploy
  const root = opts.monorepoRoot ?? defaultMonorepoRoot();
  const stage = mkdtempSync(join(tmpdir(), 'agent-runtime-bundle-'));
  const tarballs: string[] = [];
  for (const pkg of RUNTIME_BUNDLE_PACKAGES) {
    const pkgDir = join(root, 'packages', pkg);
    if (!existsSync(join(pkgDir, 'package.json'))) {
      throw new Error(`runtime-install: package not found: ${pkgDir}`);
    }
    const before = new Set(tgzIn(stage));
    const r = run(['pnpm', '-C', pkgDir, 'pack', '--pack-destination', stage]);
    if (r.rc !== 0) {
      throw new Error(`runtime-install: pnpm pack ${pkg} failed: ${r.out}`);
    }
    const made = tgzIn(stage).filter((t) => !before.has(t));
    if (made.length !== 1) {
      throw new Error(
        `runtime-install: expected one new tarball packing ${pkg}, got [${made.join(', ')}]`,
      );
    }
    tarballs.push(join(stage, made[0] as string));
  }
  const version = readVersion(join(root, 'packages', 'agent-runtime'));
  const fingerprint = bundleFingerprint(tarballs);
  log(
    `  runtime bundle: ${RUNTIME_BUNDLE_PACKAGES.length} package(s), v${version} (${fingerprint})`,
  );
  return { tarballs, fingerprint, version };
}

/** The `.tgz` basenames present in a dir (order-stable). */
function tgzIn(dir: string): string[] {
  return existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith('.tgz'))
        .sort()
    : [];
}

/** Read a package's version, or `0.0.0` if unreadable. */
function readVersion(pkgDir: string): string {
  try {
    return (
      (
        JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8')) as {
          version?: string;
        }
      ).version ?? '0.0.0'
    );
  } catch {
    return '0.0.0';
  }
}

/** The stamp CONTENT: version + fingerprint, so a human sees the pin and the code
 *  compares the whole line. A re-deploy matches iff BOTH are unchanged. */
function stampContent(bundle: RuntimeBundle): string {
  return `${bundle.version} ${bundle.fingerprint}\n`;
}

/**
 * Install the runtime bundle in-place on THIS host (the `fire`/local path). Resolves
 * the prefix (override ▸ npm global prefix), no-ops when the stamped fingerprint
 * already matches, else flat-co-installs the tarballs (`npm install -g --prefix`),
 * stamps, and retires the old `memory` bin + the orphan `episodic.mjs` under
 * `claudeDir`. Returns whether an install actually ran.
 */
export function installRuntimeLocal(
  claudeDir: string,
  opts: RuntimeInstallOpts,
): { installed: boolean; prefix: string } {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? (() => {});
  const run = opts.runner ?? realRunner(opts.dry);
  const bundle = opts.bundle ?? buildRuntimeBundle(opts);

  const prefix = opts.prefix ?? localGlobalPrefix(run);
  log(
    `  runtime install -> ${prefix} (bin: ${join(prefix, 'bin', RUNTIME_BIN)})`,
  );

  const stampPath = join(prefix, RUNTIME_STAMP_REL);
  const want = stampContent(bundle);
  if (
    !opts.dry &&
    existsSync(stampPath) &&
    readFileSync(stampPath, 'utf-8') === want
  ) {
    log(`  runtime already current (${bundle.fingerprint}) — no-op`);
    retireLocal(prefix, claudeDir, opts);
    return { installed: false, prefix };
  }

  if (opts.dry) {
    log(
      `  DRY would install ${bundle.tarballs.length} tarball(s) -> ${prefix}`,
    );
    return { installed: false, prefix };
  }

  const r = run([
    'npm',
    'install',
    '-g',
    '--prefix',
    prefix,
    ...bundle.tarballs,
  ]);
  // The success ORACLE is artifact resolvability, not the exit code: a version
  // manager's postinstall reshim (e.g. mise) can taint npm's exit code even when
  // the install landed. Trust the resolvable artifact; hard-fail only if it is
  // genuinely absent.
  if (!runtimeResolvable(prefix)) {
    warn(
      `  ERR npm install runtime bundle failed (runtime not resolvable at ${prefix}): ${r.out}`,
    );
    return { installed: false, prefix };
  }
  if (r.rc !== 0) {
    warn(
      `  NOTE installer exited ${r.rc} but the runtime resolved (likely a version-manager reshim): ${r.out.split('\n')[0] ?? ''}`,
    );
  }
  mkdirSync(dirname(stampPath), { recursive: true });
  writeFileSync(stampPath, want, 'utf-8');
  log(`  runtime installed (${bundle.fingerprint})`);
  retireLocal(prefix, claudeDir, opts);
  return { installed: true, prefix };
}

/** Whether the runtime is resolvable at a prefix — the flat co-install landed the
 *  bin AND the runtime package in ONE `node_modules` (what `discover()` needs). The
 *  authoritative success signal, independent of a noisy installer exit code. */
function runtimeResolvable(prefix: string): boolean {
  return (
    existsSync(join(prefix, 'bin', RUNTIME_BIN)) &&
    existsSync(join(prefix, 'lib', 'node_modules', '@leclabs', 'agent-runtime'))
  );
}

/** The last absolute-path line in combined stdout+stderr — robust to the init
 *  noise (mise/atuin banners, prompt escapes) an interactive `-ic` remote shell
 *  can prepend before `npm prefix -g`'s answer. Falls back to a plain trim. */
function lastPathLine(out: string): string {
  const lines = out
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    if ((lines[i] as string).startsWith('/')) return lines[i] as string;
  }
  return out.trim();
}

/** Resolve the host's npm global prefix (`npm prefix -g`) — its `bin/` is on PATH. */
function localGlobalPrefix(run: CommandRunner): string {
  const r = run(['npm', 'prefix', '-g']);
  const p = r.out.trim();
  if (r.rc !== 0 || !p.startsWith('/')) {
    throw new Error(
      `runtime-install: could not resolve npm global prefix: ${r.out}`,
    );
  }
  return p;
}

/** Retire the old memory footprint on THIS host: the `memory` bin (superseded by
 *  `agent-runtime memory`) + the orphan `~/.claude/skills/memory/episodic.mjs` (and
 *  its now-empty skill dir). Idempotent — absent files are silently fine. */
function retireLocal(
  prefix: string,
  claudeDir: string,
  opts: RuntimeInstallOpts,
): void {
  const log = opts.log ?? (() => {});
  if (opts.dry) return;
  const memBin = join(prefix, 'bin', 'memory');
  if (existsSync(memBin)) {
    rmSync(memBin, { force: true });
    log('  retired old memory bin');
  }
  const memSkill = join(claudeDir, 'skills', 'memory');
  const orphan = join(memSkill, 'episodic.mjs');
  if (existsSync(orphan)) {
    rmSync(orphan, { force: true });
    log('  removed orphan skills/memory/episodic.mjs');
  }
  if (existsSync(memSkill) && readdirSync(memSkill).length === 0) {
    rmSync(memSkill, { recursive: true, force: true });
  }
}

/**
 * Install the runtime bundle on a remote host over ssh/scp. Builds the bundle on
 * the build host, scp's the tarballs, resolves the remote npm prefix + `$HOME`
 * server-side, no-ops on a fingerprint match, else remote flat-co-installs, stamps,
 * and retires the old memory footprint. The `CommandRunner` is the ssh/scp seam.
 */
export function installRuntimeSsh(
  target: string,
  opts: RuntimeInstallOpts,
): { installed: boolean } {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? (() => {});
  const run = opts.runner ?? realRunner(opts.dry);
  const bundle = opts.bundle ?? buildRuntimeBundle(opts);

  // Resolve the remote user home server-side (never a literal `~` through shQuote).
  let home = '$HOME';
  if (!opts.dry) {
    const hr = run(['ssh', target, 'printf %s "$HOME"']);
    home = hr.out.trim();
    if (hr.rc !== 0 || !home.startsWith('/')) {
      warn(`  ERR could not resolve remote $HOME on ${target}: ${hr.out}`);
      return { installed: false };
    }
  }

  // Resolve the remote prefix (override ▸ remote `npm prefix -g`). Run through the
  // user's INTERACTIVE shell so the version manager (mise) is sourced and `npm`
  // resolves to the USER-writable mise node prefix — never the system `/usr` node.
  // (A bare non-interactive `ssh host 'npm …'` never sources mise: `command not
  // found`, or on a host with a system node an EACCES `/usr` install.)
  let prefix = opts.prefix ?? '';
  if (prefix === '') {
    if (opts.dry) {
      prefix = '$(npm prefix -g)';
    } else {
      const pr = run(['ssh', target, interactiveShellCmd('npm prefix -g')]);
      // Take the last absolute-path line — an interactive shell can prepend
      // init noise (mise/atuin banners) on the combined stdout+stderr.
      prefix = lastPathLine(pr.out);
      if (pr.rc !== 0 || !prefix.startsWith('/')) {
        warn(
          `  ERR could not resolve remote npm prefix on ${target} (no user node manager active in the interactive shell?): ${pr.out}`,
        );
        return { installed: false };
      }
      if (prefix === '/usr' || prefix.startsWith('/usr/')) {
        warn(
          `  ERR remote npm on ${target} resolved to the SYSTEM prefix ${prefix} — a global install there needs root (EACCES). ${target} needs a USER node manager (e.g. mise with a global node pinned) active in its interactive shell.`,
        );
        return { installed: false };
      }
    }
  }
  const stampPath = `${prefix}/${RUNTIME_STAMP_REL}`;
  const want = stampContent(bundle);
  log(`  runtime install -> ${target}:${prefix}`);

  if (!opts.dry) {
    const cur = run([
      'ssh',
      target,
      `cat ${shQuote(stampPath)} 2>/dev/null || true`,
    ]);
    if (cur.out.trim() === want.trim()) {
      log(
        `  runtime already current on ${target} (${bundle.fingerprint}) — no-op`,
      );
      retireSsh(target, prefix, home, run, opts);
      return { installed: false };
    }
  } else {
    log(
      `  DRY would ship + install ${bundle.tarballs.length} tarball(s) -> ${target}:${prefix}`,
    );
    return { installed: false };
  }

  // Ship the tarballs to a remote staging dir, then flat-co-install.
  const remoteStage = `${home}/.cache/agent-runtime-bundle`;
  run(['ssh', target, `mkdir -p ${shQuote(remoteStage)}`]);
  const remoteTars: string[] = [];
  for (const t of bundle.tarballs) {
    const base = t.slice(t.lastIndexOf('/') + 1);
    const remoteT = `${remoteStage}/${base}`;
    const scp = run(['scp', '-q', t, `${target}:${remoteT}`]);
    if (scp.rc !== 0) {
      warn(`  ERR scp runtime tarball ${base} -> ${target}: ${scp.out}`);
      return { installed: false };
    }
    remoteTars.push(remoteT);
  }
  const inst = run([
    'ssh',
    target,
    // Same interactive-shell wrap as the prefix probe: the install runs through
    // the mise-sourced `npm`, landing the bundle in the user-writable prefix and
    // triggering mise's post-install reshim of the `agent-runtime` bin.
    interactiveShellCmd(
      `npm install -g --prefix ${shQuote(prefix)} ${remoteTars.map(shQuote).join(' ')}`,
    ),
  ]);
  // Verify by RESOLVABILITY (bin + runtime package present), not the exit code — a
  // remote version-manager reshim can taint it. `printf RESOLVED` only when both land.
  const binPath = shQuote(`${prefix}/bin/${RUNTIME_BIN}`);
  const pkgPath = shQuote(`${prefix}/lib/node_modules/@leclabs/agent-runtime`);
  const verify = run([
    'ssh',
    target,
    `test -e ${binPath} && test -d ${pkgPath} && printf RESOLVED`,
  ]);
  if (verify.out.trim() !== 'RESOLVED') {
    warn(
      `  ERR remote runtime not resolvable at ${target}:${prefix}: ${inst.out}`,
    );
    return { installed: false };
  }
  if (inst.rc !== 0) {
    warn(
      `  NOTE remote installer exited ${inst.rc} but the runtime resolved on ${target}`,
    );
  }
  // Stamp the fingerprint (idempotency key for the next deploy).
  run([
    'ssh',
    target,
    `mkdir -p ${shQuote(dirname(stampPath))} && printf %s ${shQuote(want)} > ${shQuote(stampPath)}`,
  ]);
  log(`  runtime installed on ${target} (${bundle.fingerprint})`);
  retireSsh(target, prefix, home, run, opts);
  return { installed: true };
}

/** Retire the old memory footprint on a remote host — the `memory` bin + the orphan
 *  `~/.claude/skills/memory/episodic.mjs` (and its empty dir). One idempotent ssh. */
function retireSsh(
  target: string,
  prefix: string,
  home: string,
  run: CommandRunner,
  opts: RuntimeInstallOpts,
): void {
  if (opts.dry) return;
  const memBin = `${prefix}/bin/memory`;
  const memSkill = `${home}/.claude/skills/memory`;
  run([
    'ssh',
    target,
    `rm -f ${shQuote(memBin)} ${shQuote(`${memSkill}/episodic.mjs`)}; ` +
      `rmdir ${shQuote(memSkill)} 2>/dev/null || true`,
  ]);
}
