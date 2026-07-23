// ─────────────────────────────────────────────────────────────────────────────
// S10 · integrate-smoke — the runtime-plugin architecture's ACCEPTANCE GATE.
//
// Proves the whole loop end-to-end on a clean, hermetic fixture — NON-VACUOUS at
// every leg (a capability provably RAN, not merely that a process spawned):
//
//   project → deploy → per-host runtime-install → a DEPLOYED thin-shim invokes
//   `agent-runtime memory <verb>` AND `agent-runtime tap <verb>` on the target,
//   and the capability's effect is READ BACK.
//
//   L0 project : a skill declaring runtime:{capability:'memory'} emits a THIN SHIM
//                `scripts/memory.mjs` (a forwarder to the host `agent-runtime
//                memory` CLI — the canonical shape agent-canon's runtime-shim gate
//                pins; here the shim is consumed + PROVEN to drive the real bin).
//   L1 deploy  : `placeSkillsLocal` copies the skill dir mode-preserving into a
//                TEMP target `.claude/` — the shim's exec bit survives.
//   L2 install : the REAL S7 `installRuntimeLocal` (real `pnpm pack` +
//                `npm install -g --prefix`) lands `agent-runtime` + agent-memory
//                co-installed + RESOLVABLE in a temp prefix (NO fake runner).
//   L3 memory  : the DEPLOYED shim `… memory encode`→`read` round-trips a record —
//                the store file on disk carries the body, the read returns the id.
//   L4 tap     : `agent-runtime tap install`→`status`(attached)→`remove` merges a
//                passive logger into a temp settings.json and removes it with ZERO
//                RESIDUE (the target file restored, our tap id gone).
//
// HERMETIC: a scoped temp target/prefix/home, `GIT_CONFIG_GLOBAL=/dev/null`, and
// `--home`/`--settings` passed explicitly — the operator's real `~/.agents`,
// `~/.claude`, and fleet are NEVER touched. LOCAL only (no ssh, no fleet).
//
// This test does the REAL pack+install, so it is heavier than the unit suites;
// each leg carries an explicit generous timeout.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  RUNTIME_BIN,
  installRuntimeLocal,
  placeSkillsLocal,
} from '../../src/deploy/index.js';
import { tmp } from './helpers.js';

/**
 * The canonical thin-shim CONTENT for a runtime capability — a self-contained node
 * forwarder to the host `agent-runtime <capability>` CLI, byte-identical to what
 * agent-canon's `runtimeShimContent` emits (whose exact shape its own runtime-shim
 * gate pins). Reproduced here (agent-forge must not import agent-canon — the DAG is
 * canon → forge, never inverted); this smoke consumes the shim and PROVES it drives
 * the real installed bin, the half agent-canon's unit gate cannot reach.
 */
function thinShim(capability: string): string {
  return `#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
const r = spawnSync('agent-runtime', ['${capability}', ...process.argv.slice(2)], {
  stdio: 'inherit',
});
process.exit(r.status ?? 1);
`;
}

// One shared hermetic fixture threaded across the ordered legs.
const root = tmp('s10-integrate-smoke-');
const projectSkills = join(root, 'project', 'skills');
const targetClaude = join(root, 'target', '.claude');
const prefix = join(root, 'prefix');
const agentHome = join(root, 'agent-home');
const SKILL = 'memory-face';
const NONCE = `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** The deployed shim runs `agent-runtime` off PATH; isolate git config too. */
const hermeticEnv = {
  ...process.env,
  PATH: `${join(prefix, 'bin')}:${process.env.PATH ?? ''}`,
  GIT_CONFIG_GLOBAL: '/dev/null',
};

afterAll(() => {
  // The whole fixture lives under the OS tmpdir; leave it for post-mortem (the OS
  // reaps tmp). Nothing under the operator's real home/prefix was ever written.
});

describe('S10 integrate-smoke — project→deploy→install→invoke→verify', () => {
  const deployedShim = join(
    targetClaude,
    'skills',
    SKILL,
    'scripts',
    'memory.mjs',
  );

  it('L0 project: a runtime:{capability:memory} skill emits an executable thin shim → agent-runtime memory', () => {
    const skillDir = join(projectSkills, SKILL);
    const scriptsDir = join(skillDir, 'scripts');
    mkdirSync(scriptsDir, { recursive: true });
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      '# memory\nA runtime-capability skill (memory), projected with a thin shim.\n',
      'utf-8',
    );
    const shimSrc = join(scriptsDir, 'memory.mjs');
    writeFileSync(shimSrc, thinShim('memory'));
    chmodSync(shimSrc, 0o755);

    const emitted = readFileSync(shimSrc, 'utf-8');
    // Falsifier: the shim drives the host `agent-runtime memory` CLI, forwarding argv.
    expect(emitted).toMatch(/spawnSync\('agent-runtime', \['memory',/);
    expect(emitted).toContain('...process.argv.slice(2)');
    // THIN — no bundled impl, no cross-package import.
    expect(emitted).not.toContain('@leclabs/');
    // Executable, so deploy's mode-preserving copy keeps the bit.
    expect(statSync(shimSrc).mode & 0o111).not.toBe(0);
  });

  it('L1 deploy: placeSkillsLocal copies the skill dir into the temp target, exec bit intact', () => {
    const res = placeSkillsLocal(
      targetClaude,
      { agentsDir: join(root, 'project', 'agents'), skillsDir: projectSkills },
      [SKILL],
      { dry: false },
    );
    expect(res.rc).toBe(0);
    expect(res.report.copied).toBe(1);
    // The deployed shim landed AND kept its exec bit (survives the copy).
    expect(existsSync(deployedShim)).toBe(true);
    expect(statSync(deployedShim).mode & 0o111).not.toBe(0);
  });

  it('L2 install: the REAL runtime-install lands agent-runtime + agent-memory co-installed & resolvable', () => {
    const r = installRuntimeLocal(targetClaude, { dry: false, prefix });
    expect(r.installed).toBe(true);
    expect(r.prefix).toBe(prefix);
    // Resolvability oracle: the bin on PATH + BOTH packages as siblings in ONE
    // node_modules — exactly what the loader's discover() needs.
    expect(existsSync(join(prefix, 'bin', RUNTIME_BIN))).toBe(true);
    const modules = join(prefix, 'lib', 'node_modules', '@leclabs');
    expect(existsSync(join(modules, 'agent-runtime'))).toBe(true);
    expect(existsSync(join(modules, 'agent-memory'))).toBe(true);
  }, 120_000);

  it('L3 memory leg: the DEPLOYED shim round-trips a record (encode→read), proven on disk', () => {
    // encode via the deployed shim → the shim spawns `agent-runtime memory encode`.
    const id = execFileSync(
      'node',
      [
        deployedShim,
        'encode',
        '--home',
        agentHome,
        '--session',
        's10-smoke',
        '--body',
        NONCE,
      ],
      { env: hermeticEnv, encoding: 'utf-8' },
    ).trim();
    // A ULID (Crockford base32, 26 chars) — proves encode actually minted + ran.
    expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);

    // NON-VACUOUS: the record persisted to the on-disk EPISODIC store.
    const store = join(agentHome, 'EPISODIC.jsonl');
    expect(existsSync(store)).toBe(true);
    const persisted = readFileSync(store, 'utf-8');
    expect(persisted).toContain(NONCE);
    expect(persisted).toContain(id);

    // read back via the deployed shim → the same record surfaces with our id+body.
    const out = execFileSync(
      'node',
      [deployedShim, 'read', '--home', agentHome, '--json'],
      { env: hermeticEnv, encoding: 'utf-8' },
    );
    const record = out
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l) as { id: string; body: string })
      .find((r) => r.id === id);
    expect(record).toBeDefined();
    expect(record?.body).toBe(NONCE);
  }, 60_000);

  it('L4 event-tap leg: install→status(attached)→remove with ZERO RESIDUE', () => {
    const bin = join(prefix, 'bin', RUNTIME_BIN);
    const settings = join(targetClaude, 'settings.json');
    const sink = join(root, 'capture.log');
    // Seed a settings file with a FOREIGN key + a foreign hook — the tap must
    // preserve both across install/remove.
    const baseline = `${JSON.stringify(
      {
        env: { FOO: 'bar' },
        hooks: {
          Stop: [{ hooks: [{ type: 'command', command: 'echo foreign' }] }],
        },
      },
      null,
      2,
    )}\n`;
    writeFileSync(settings, baseline, 'utf-8');

    const runTap = (...args: string[]): string =>
      execFileSync(bin, ['tap', ...args, '--settings', settings], {
        env: hermeticEnv,
        encoding: 'utf-8',
      });

    // install — merges a passive logger onto Stop (turn.end) + SessionStart.
    const installed = JSON.parse(
      runTap('install', '--events', 'turn.end,session.start', '--sink', sink),
    ) as { verb: string; events: string[] };
    expect(installed.verb).toBe('install');
    expect([...installed.events].sort()).toEqual(['session.start', 'turn.end']);

    // status — reflects the installed state, derived from the target file.
    const status = JSON.parse(runTap('status')) as {
      status: { attached: boolean; events: string[] };
    };
    expect(status.status.attached).toBe(true);
    expect([...status.status.events].sort()).toEqual([
      'session.start',
      'turn.end',
    ]);
    // The merge preserved the foreign key + appended OUR entry (its tap id present).
    const merged = readFileSync(settings, 'utf-8');
    expect(merged).toContain('"FOO": "bar"');
    expect(merged).toContain('echo foreign');
    expect(merged).toContain('agent-runtime-event-tap');

    // remove — surgical: our entry gone, foreign spared, status detached.
    runTap('remove');
    const detached = JSON.parse(runTap('status')) as {
      status: { attached: boolean };
    };
    expect(detached.status.attached).toBe(false);
    // ZERO RESIDUE: our tap id is gone; the foreign key + hook remain.
    const after = readFileSync(settings, 'utf-8');
    expect(after).not.toContain('agent-runtime-event-tap');
    expect(after).toContain('echo foreign');
    expect(after).toContain('"FOO": "bar"');
  }, 60_000);
});
