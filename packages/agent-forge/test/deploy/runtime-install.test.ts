// Hermetic tests for the S7 per-host runtime-install step (FORK-3). The shell-outs
// (pnpm pack / npm install / ssh / scp) funnel through an injectable CommandRunner,
// so these exercise the install ALGEBRA — flat co-install, resolvability oracle,
// fingerprint idempotency, orphan retire — with NO real npm/pnpm/network. The REAL
// end-to-end dogfood (the built bin discovering the installed agent-memory plugin)
// is proven separately; here we guard the deploy orchestration itself.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  RUNTIME_BIN,
  RUNTIME_STAMP_REL,
  type RuntimeBundle,
  installRuntimeLocal,
  installRuntimeSsh,
} from '../../src/deploy/index.js';
import type { CommandResult, CommandRunner } from '../../src/deploy/index.js';
import { tmp } from './helpers.js';

const BUNDLE: RuntimeBundle = {
  tarballs: [
    '/build/leclabs-agent-runtime-0.0.0.tgz',
    '/build/leclabs-agent-memory-0.0.0.tgz',
  ],
  fingerprint: 'deadbeefcafe0000',
  version: '0.0.0',
};

/** A local fake runner: an `npm install -g --prefix <p>` materializes the resolvable
 *  artifacts on real fs (bin + runtime package) so the resolvability oracle passes;
 *  every call is recorded. */
function localRunner(calls: string[][]): CommandRunner {
  return (cmd: string[]): CommandResult => {
    calls.push(cmd);
    if (cmd[0] === 'npm' && cmd[1] === 'install') {
      const pi = cmd.indexOf('--prefix');
      const prefix = cmd[pi + 1] as string;
      mkdirSync(join(prefix, 'bin'), { recursive: true });
      writeFileSync(join(prefix, 'bin', RUNTIME_BIN), '#!/bin/sh\n');
      mkdirSync(
        join(prefix, 'lib', 'node_modules', '@leclabs', 'agent-runtime'),
        {
          recursive: true,
        },
      );
      return { rc: 0, out: 'added 3 packages' };
    }
    if (cmd[0] === 'npm' && cmd[1] === 'prefix') {
      return { rc: 0, out: '/should/not/be/used' };
    }
    return { rc: 0, out: '' };
  };
}

describe('runtime-install (local)', () => {
  it('flat-co-installs, stamps the fingerprint, and retires the old memory footprint', () => {
    const root = tmp('rt-local-');
    const prefix = join(root, 'prefix');
    const claudeDir = join(root, '.claude');
    // Plant the orphan + old memory bin the install must retire.
    mkdirSync(join(claudeDir, 'skills', 'memory'), { recursive: true });
    writeFileSync(
      join(claudeDir, 'skills', 'memory', 'episodic.mjs'),
      '// orphan\n',
    );
    mkdirSync(join(prefix, 'bin'), { recursive: true });
    writeFileSync(join(prefix, 'bin', 'memory'), '#!/bin/sh\n');

    const calls: string[][] = [];
    const r = installRuntimeLocal(claudeDir, {
      dry: false,
      prefix,
      bundle: BUNDLE,
      runner: localRunner(calls),
    });

    expect(r.installed).toBe(true);
    // The flat co-install shipped BOTH tarballs on one `npm install -g --prefix`.
    const install = calls.find((c) => c[0] === 'npm' && c[1] === 'install');
    expect(install).toContain('-g');
    expect(install).toContain(BUNDLE.tarballs[0]);
    expect(install).toContain(BUNDLE.tarballs[1]);
    // Bin + runtime package resolvable; stamp written.
    expect(existsSync(join(prefix, 'bin', RUNTIME_BIN))).toBe(true);
    expect(readFileSync(join(prefix, RUNTIME_STAMP_REL), 'utf-8')).toContain(
      BUNDLE.fingerprint,
    );
    // Retired: orphan episodic.mjs + old memory bin gone.
    expect(
      existsSync(join(claudeDir, 'skills', 'memory', 'episodic.mjs')),
    ).toBe(false);
    expect(existsSync(join(prefix, 'bin', 'memory'))).toBe(false);
  });

  it('is idempotent: a re-deploy at the same fingerprint is a no-op (no npm install)', () => {
    const root = tmp('rt-idem-');
    const prefix = join(root, 'prefix');
    const claudeDir = join(root, '.claude');
    mkdirSync(claudeDir, { recursive: true });

    const first: string[][] = [];
    installRuntimeLocal(claudeDir, {
      dry: false,
      prefix,
      bundle: BUNDLE,
      runner: localRunner(first),
    });
    expect(first.some((c) => c[0] === 'npm' && c[1] === 'install')).toBe(true);

    const second: string[][] = [];
    const r2 = installRuntimeLocal(claudeDir, {
      dry: false,
      prefix,
      bundle: BUNDLE,
      runner: localRunner(second),
    });
    expect(r2.installed).toBe(false);
    expect(second.some((c) => c[0] === 'npm' && c[1] === 'install')).toBe(
      false,
    );
  });

  it('succeeds on a noisy nonzero exit when the runtime still resolved', () => {
    const root = tmp('rt-noisy-');
    const prefix = join(root, 'prefix');
    const claudeDir = join(root, '.claude');
    mkdirSync(claudeDir, { recursive: true });
    // Runner returns rc=1 (a version-manager reshim) but still lands the artifacts.
    const runner: CommandRunner = (cmd) => {
      if (cmd[0] === 'npm' && cmd[1] === 'install') {
        const pi = cmd.indexOf('--prefix');
        const p = cmd[pi + 1] as string;
        mkdirSync(join(p, 'bin'), { recursive: true });
        writeFileSync(join(p, 'bin', RUNTIME_BIN), '#!/bin/sh\n');
        mkdirSync(join(p, 'lib', 'node_modules', '@leclabs', 'agent-runtime'), {
          recursive: true,
        });
        return { rc: 1, out: 'added 3 packages\nreshim failed' };
      }
      return { rc: 0, out: '' };
    };
    const r = installRuntimeLocal(claudeDir, {
      dry: false,
      prefix,
      bundle: BUNDLE,
      runner,
    });
    expect(r.installed).toBe(true);
  });

  it('dry-run installs nothing', () => {
    const root = tmp('rt-dry-');
    const prefix = join(root, 'prefix');
    const claudeDir = join(root, '.claude');
    mkdirSync(claudeDir, { recursive: true });
    const calls: string[][] = [];
    const r = installRuntimeLocal(claudeDir, {
      dry: true,
      prefix,
      bundle: BUNDLE,
      runner: localRunner(calls),
    });
    expect(r.installed).toBe(false);
    expect(calls.some((c) => c[0] === 'npm' && c[1] === 'install')).toBe(false);
    expect(existsSync(join(prefix, RUNTIME_STAMP_REL))).toBe(false);
  });
});

describe('runtime-install (ssh)', () => {
  /** A fake ssh/scp runner: resolves $HOME + npm prefix, misses the stamp on the
   *  first `cat`, and reports the resolvability probe RESOLVED. Records every call. */
  function sshRunner(
    calls: string[][],
    opts: { stamp?: string; prefixOut?: string } = {},
  ): CommandRunner {
    return (cmd: string[]): CommandResult => {
      calls.push(cmd);
      const script = cmd[cmd.length - 1] ?? '';
      if (cmd[0] === 'ssh') {
        if (script.includes('printf %s "$HOME"'))
          return { rc: 0, out: '/home/remote' };
        // The prefix probe now runs through the interactive-shell wrap
        // (`"${SHELL:-zsh}" -ic 'npm prefix -g'`) so mise is sourced — match the
        // wrapped form, and simulate a noisy interactive banner before the path.
        if (script.includes('npm prefix -g'))
          return {
            rc: 0,
            out: `mise: mounting shims\n${opts.prefixOut ?? '/home/remote/.local'}`,
          };
        if (script.includes('cat ') && script.includes('.bundle-fingerprint'))
          return { rc: 0, out: opts.stamp ?? '' };
        if (script.includes('printf RESOLVED'))
          return { rc: 0, out: 'RESOLVED' };
        return { rc: 0, out: '' };
      }
      if (cmd[0] === 'scp') return { rc: 0, out: '' };
      return { rc: 0, out: '' };
    };
  }

  it('ships tarballs + remote flat-co-installs, verifies resolvability, stamps, retires', () => {
    const calls: string[][] = [];
    const r = installRuntimeSsh('me@host', {
      dry: false,
      bundle: BUNDLE,
      runner: sshRunner(calls),
    });
    expect(r.installed).toBe(true);
    const flat = ['ssh', 'me@host'];
    const joined = calls.map((c) => c.join(' '));
    // One scp per tarball, one remote flat co-install, a resolvability probe, a stamp.
    expect(calls.filter((c) => c[0] === 'scp')).toHaveLength(2);
    expect(joined.some((s) => s.includes('npm install -g --prefix'))).toBe(
      true,
    );
    expect(joined.some((s) => s.includes('printf RESOLVED'))).toBe(true);
    expect(joined.some((s) => s.includes('.bundle-fingerprint'))).toBe(true);
    // BOTH remote npm invocations run through the interactive-shell wrap so the
    // version manager (mise) is sourced — the fleet-remote defect fix. A noisy
    // interactive banner before the prefix must NOT poison prefix resolution.
    expect(
      joined.some((s) => s.includes('-ic') && s.includes('npm prefix -g')),
    ).toBe(true);
    expect(
      joined.some((s) => s.includes('-ic') && s.includes('npm install -g')),
    ).toBe(true);
    // Retire the old memory footprint on the remote.
    expect(
      joined.some((s) => s.includes('rm -f') && s.includes('/bin/memory')),
    ).toBe(true);
    void flat;
  });

  it('refuses a SYSTEM /usr prefix (needs root → EACCES) instead of forcing a broken install', () => {
    const calls: string[][] = [];
    const r = installRuntimeSsh('me@host', {
      dry: false,
      bundle: BUNDLE,
      runner: sshRunner(calls, { prefixOut: '/usr' }),
    });
    // Honest refusal: no scp, no install attempt against an unwritable prefix.
    expect(r.installed).toBe(false);
    expect(calls.some((c) => c[0] === 'scp')).toBe(false);
    expect(calls.some((c) => c.join(' ').includes('npm install -g'))).toBe(
      false,
    );
  });

  it('is idempotent over ssh: a matching remote stamp skips the install', () => {
    const calls: string[][] = [];
    const r = installRuntimeSsh('me@host', {
      dry: false,
      bundle: BUNDLE,
      runner: sshRunner(calls, {
        stamp: `${BUNDLE.version} ${BUNDLE.fingerprint}`,
      }),
    });
    expect(r.installed).toBe(false);
    expect(calls.some((c) => c[0] === 'scp')).toBe(false);
    expect(calls.some((c) => c.join(' ').includes('npm install -g'))).toBe(
      false,
    );
  });
});
