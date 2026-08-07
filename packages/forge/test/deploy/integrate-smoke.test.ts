// ─────────────────────────────────────────────────────────────────────────────
// S10 · integrate-smoke — the runtime-plugin architecture's ACCEPTANCE GATE.
//
// Proves the whole loop end-to-end on a clean, hermetic fixture — NON-VACUOUS at
// every leg (a capability provably RAN, not merely that a process spawned):
//
//   project → deploy → a DEPLOYED thin-shim invokes `cratylus-run memory <verb>`
//   AND `cratylus-run tap <verb>` on the target, and the capability's effect is
//   READ BACK.
//
//   L0 project : a skill declaring runtime:{capability:'memory'} emits a THIN SHIM
//                `scripts/memory.mjs` (a forwarder to the host `cratylus-run
//                memory` CLI — the canonical shape canon's runtime-shim gate
//                pins; here the shim is consumed + PROVEN to drive the real bin).
//   L1 deploy  : `placeSkillsLocal` copies the skill dir mode-preserving into a
//                TEMP target `.claude/` — the shim's exec bit survives.
//   (setup)    : `pnpm deploy` materializes the CLI package with its workspace
//                is a PRECONDITION, not a stage — installing packages on a host is
//                npm's job, never deploy's — so it is plain test setup here, and
//                nothing about it is an assertion on forge.
//   L3 memory  : the DEPLOYED shim `… memory encode`→`read` round-trips a record —
//                the store file on disk carries the body, the read returns the id.
//   L4 tap     : `cratylus-run tap install`→`status`(attached)→`uninstall` merges a
//                passive logger into a temp settings.json and removes it with ZERO
//                RESIDUE (the target file restored, our tap id gone).
//
// HERMETIC: a scoped temp target/host-root/home, `GIT_CONFIG_GLOBAL=/dev/null`, and
// `--home`/`--settings` passed explicitly — the operator's real `~/.agents`,
// `~/.claude`, and every global prefix are NEVER touched — nothing here runs npm.
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
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { RUNTIME_BIN } from '@cratylus/runtime/bin-name';
import { requireRepoRoot } from '@repo/tooling/repo-root';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { canonicalToClaude } from '../../src/adapters/claude/index.js';
import { emitRuntimeConfig, placeSkillsLocal } from '../../src/deploy/index.js';
import { tmp } from './helpers.js';

/** The package that ships both commands, so `<RUNTIME_BIN> <cap> <verb>`
 *  resolves: the CLI carrying the bin, the contract leaf, the capability. These are
 *  PACKAGE names (an npm coordinate), not the bin name — they do not move on a
 *  rebrand of the executable. */
/** The package that ships both commands; `pnpm deploy` resolves its closure. */
const HUB = 'cratylus';

/**
 * The canonical thin-shim CONTENT for a runtime capability — a self-contained node
 * forwarder to the host `cratylus-run <capability>` CLI, byte-identical to what
 * canon's `runtimeShimContent` emits (whose exact shape its own runtime-shim
 * gate pins). Reproduced here (forge must not import canon — the DAG is
 * canon → forge, never inverted); this smoke consumes the shim and PROVES it drives
 * the real installed bin, the half canon's unit gate cannot reach.
 */
function thinShim(capability: string): string {
  return `#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
const r = spawnSync('${RUNTIME_BIN}', ['${capability}', ...process.argv.slice(2)], {
  stdio: 'inherit',
});
process.exit(r.status ?? 1);
`;
}

// One shared hermetic fixture threaded across the ordered legs.
const root = tmp('s10-integrate-smoke-');
const projectSkills = join(root, 'project', 'skills');
const targetClaude = join(root, 'target', '.claude');
const hostRoot = join(root, 'installed');
const agentHome = join(root, 'agent-home');
const SKILL = 'memory-face';
const TAP_SKILL = 'event-tap-face';
const NONCE = `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * The host runtime config this fixture's shims read — the file `cratylus deploy`
 * emits, here written by the same emitter into the hermetic root.
 *
 * WITHOUT IT THE L4 LEG CANNOT RUN, and that is the finding rather than a fixture
 * detail: the event-tap capability no longer carries a lifecycle vocabulary of its
 * own (it carried canon's 28 names, copied). Everything corpus-specific now reaches
 * a host as configuration the projection emitted, so a host with no emitted config
 * has no vocabulary — and this leg drives a REAL deployed shim on a REAL host, which
 * is exactly the condition that must be represented.
 */
const runtimeConfig = join(root, 'runtime-config.json');

/** The deployed shim runs `cratylus-run` off PATH; isolate git config too, and
 *  point the runtime at the emitted host config rather than the operator's real one. */
const hermeticEnv = {
  ...process.env,
  PATH: `${join(hostRoot, 'bin')}:${process.env.PATH ?? ''}`,
  GIT_CONFIG_GLOBAL: '/dev/null',
  AGENT_RUNTIME_CONFIG: runtimeConfig,
};

afterAll(() => {
  // The whole fixture lives under the OS tmpdir; leave it for post-mortem (the OS
  // reaps tmp). Nothing under the operator's real home/prefix was ever written.
});

describe('S10 integrate-smoke — project→deploy→invoke→verify', () => {
  const deployedShim = join(
    targetClaude,
    'skills',
    SKILL,
    'scripts',
    'memory.mjs',
  );
  // The tap leg's counterpart. The capability word is `eventTap` (the runtime's
  // own `CAPABILITIES` key, which canon's `event-tap` cell declares), so the
  // emitter names the shim `eventTap.mjs` and it spawns `cratylus-run eventTap`.
  const deployedTapShim = join(
    targetClaude,
    'skills',
    TAP_SKILL,
    'scripts',
    'eventTap.mjs',
  );

  // PRECONDITION (not a stage, not an assertion): put the runtime packages in a
  // temp npm prefix so the deployed shim has an `cratylus-run` to drive. On a
  // real host this is `npm i -g cratylus`; here the un-published
  // workspace packages are packed and co-installed to reach the same state.
  beforeAll(() => {
    // The projection's own emission, into the hermetic root — the L4 leg's
    // precondition and, itself, a proof that what deploy writes is what the runtime
    // reads. Nothing is transcribed: the vocabulary is the claude adapter's map
    // domain and the native names are its values.
    emitRuntimeConfig({
      path: runtimeConfig,
      events: Object.keys(canonicalToClaude),
      nativeEvents: canonicalToClaude,
    });
    // A CONSUMER INSTALL, BUILT BY THE WORKSPACE THAT ALREADY KNOWS HOW.
    //
    // This packed six tarballs and ran `npm install -g --prefix <tmp>`, which was the
    // wrong tool twice over: it reached for npm to simulate an install pnpm can
    // produce directly, and it drove a GLOBAL prefix to do it. `pnpm deploy` is the
    // workspace-native answer — it materializes a package with its workspace
    // dependencies resolved into a self-contained tree, which is precisely "what a
    // consumer receives" without publishing anything or touching a global root.
    //
    // Injection is what makes it faithful (`injectWorkspacePackages: true`): without
    // it, deploy leaves `workspace:*` specifiers unresolved and the tree cannot run
    // anywhere. pnpm 10+ refuses the non-injected path for exactly that reason.
    const repoRoot = requireRepoRoot(import.meta.dirname);
    execFileSync(
      'pnpm',
      ['--filter', HUB, 'deploy', '--prod', '--silent', hostRoot],
      { cwd: repoRoot, encoding: 'utf-8', stdio: 'pipe' },
    );

    // LINK THE BINS THE WAY A PACKAGE MANAGER WOULD. `deploy` materializes the
    // package, but a package's own `bin` entries are never linked into its own
    // `node_modules/.bin` — that only happens for DEPENDENCIES. The probe under test
    // resolves the runtime bin off `PATH`, so the names have to exist as executables.
    const binDir = join(hostRoot, 'bin');
    mkdirSync(binDir, { recursive: true });
    const manifest = JSON.parse(
      readFileSync(join(hostRoot, 'package.json'), 'utf-8'),
    ) as { bin: Record<string, string> };
    for (const [name, target] of Object.entries(manifest.bin)) {
      const link = join(binDir, name);
      symlinkSync(join(hostRoot, target), link);
    }

    // Guard, so an unmet precondition fails legibly instead of as a shim error.
    expect(existsSync(join(binDir, RUNTIME_BIN))).toBe(true);

    // PUT THE INSTALLED BIN ON THIS PROCESS'S PATH, because the code under test reads
    // `process.env.PATH` — `probeRuntimeBin` resolves the runtime bin the way a real
    // host does, and `placeSkillsLocal` refuses (rc 2, "deployed shims are inert")
    // when it cannot. Exporting only to spawned children would leave the IN-PROCESS
    // legs probing the developer's own PATH, which is a different host than this one.
    process.env.PATH = `${binDir}:${process.env.PATH ?? ''}`;
  }, 180_000);

  it('L0 project: a runtime:{capability:memory} skill emits an executable thin shim → cratylus-run memory', () => {
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
    // Falsifier: the shim drives the host `<RUNTIME_BIN> memory` CLI, forwarding argv.
    expect(emitted).toMatch(
      new RegExp(`spawnSync\\('${RUNTIME_BIN}', \\['memory',`),
    );
    expect(emitted).toContain('...process.argv.slice(2)');
    // THIN — no bundled impl, no cross-package import.
    expect(emitted).not.toContain('@cratylus/');
    // Executable, so deploy's mode-preserving copy keeps the bit.
    expect(statSync(shimSrc).mode & 0o111).not.toBe(0);
  });

  it('L0b project: a runtime:{capability:eventTap} skill emits an executable thin shim → cratylus-run eventTap', () => {
    const skillDir = join(projectSkills, TAP_SKILL);
    const scriptsDir = join(skillDir, 'scripts');
    mkdirSync(scriptsDir, { recursive: true });
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      '# event-tap\nA runtime-capability skill (eventTap), projected with a thin shim.\n',
      'utf-8',
    );
    const shimSrc = join(scriptsDir, 'eventTap.mjs');
    writeFileSync(shimSrc, thinShim('eventTap'));
    chmodSync(shimSrc, 0o755);

    const emitted = readFileSync(shimSrc, 'utf-8');
    // Falsifier: the shim drives the host `<RUNTIME_BIN> eventTap` CLI, forwarding argv.
    expect(emitted).toMatch(
      new RegExp(`spawnSync\\('${RUNTIME_BIN}', \\['eventTap',`),
    );
    expect(emitted).toContain('...process.argv.slice(2)');
    expect(emitted).not.toContain('@cratylus/');
    expect(statSync(shimSrc).mode & 0o111).not.toBe(0);
  });

  it('L1 deploy: placeSkillsLocal copies the skill dirs into the temp target, exec bit intact', () => {
    const res = placeSkillsLocal(
      targetClaude,
      { agentsDir: join(root, 'project', 'agents'), skillsDir: projectSkills },
      [SKILL, TAP_SKILL],
      { dry: false },
    );
    expect(res.rc).toBe(0);
    expect(res.report.copied).toBe(2);
    // Both deployed shims landed AND kept their exec bit (survives the copy).
    for (const shim of [deployedShim, deployedTapShim]) {
      expect(existsSync(shim)).toBe(true);
      expect(statSync(shim).mode & 0o111).not.toBe(0);
    }
  });

  it('L3 memory leg: the DEPLOYED shim round-trips a record (encode→read), proven on disk', () => {
    // encode via the deployed shim → the shim spawns `cratylus-run memory encode`.
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

  it('L4 event-tap leg: the DEPLOYED shim drives install→status(attached)→uninstall with ZERO RESIDUE', () => {
    const settings = join(targetClaude, 'settings.json');
    const sink = join(root, 'capture.log');
    // Seed a settings file with a FOREIGN key + a foreign hook — the tap must
    // preserve both across install/uninstall.
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

    // Through the DEPLOYED SHIM, exactly as an agent reaches the capability — not
    // `execFileSync(bin, ['tap', …])`. Driving the bin directly proved the runtime
    // worked while leaving the agent-facing path (skill → shim → CLI) untested; the
    // shim spawns the capability word `eventTap`, which the bin must route.
    const runTap = (...args: string[]): string =>
      execFileSync('node', [deployedTapShim, ...args, '--settings', settings], {
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
    expect(merged).toContain('cratylus-run-event-tap');

    // uninstall — surgical: our entry gone, foreign spared, status detached.
    runTap('uninstall');
    const detached = JSON.parse(runTap('status')) as {
      status: { attached: boolean };
    };
    expect(detached.status.attached).toBe(false);
    // ZERO RESIDUE: our tap id is gone; the foreign key + hook remain.
    const after = readFileSync(settings, 'utf-8');
    expect(after).not.toContain('cratylus-run-event-tap');
    expect(after).toContain('echo foreign');
    expect(after).toContain('"FOO": "bar"');
  }, 60_000);
});
