// THE BINDING GATE — a deploy may not place a shim against a run-time bin that
// does not execute.
//
// This test exists because of a specific outage, and it is written to convict
// exactly that outage. On 2026-08-05 the operator renamed the workspace
// directory. The run-time bin reached PATH through a `pnpm link --global`, a
// relative symlink into the checkout that no artifact in this repository
// authored; the rename stranded it. Every deployed skill shim then died inside
// node's module loader, `/wake` could not run, and the repository was green and
// clean throughout.
//
// TWO FIXTURES, and the pair is the point — a checker with only the convicting
// half convicts the corpus of its own defects:
//
//   STRANDED  a host whose `cratylus-run` is present, executable, and found by a
//             PATH lookup, but whose target no longer exists. This is the real
//             host on 2026-08-05.
//   LIVE      a host whose `cratylus-run` runs and answers `--version`.
//
// AND THE CRUX, asserted directly: on the STRANDED host `whichOnPath` SUCCEEDS.
// A presence check passes on a host where the capability is dead. That is why the
// probe is `--version` and not `which`, and it is the one property that, had it
// been held, would have caught this.

import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  assertShimsResolvable,
  placeSkillsLocal,
  probeRuntimeBin,
  resetRuntimeBinProbe,
  runtimeBinRefusal,
  salientStderr,
  shimsSpawningRuntimeBin,
  whichOnPath,
} from '../../src/deploy/index.js';
import { runtimeShimContent } from '../../src/project/runtime-shim.js';
import { buildRenderTree, tmp } from './helpers.js';

const BIN = 'cratylus-run';

// The fixture PATH holds ONLY the fixture bin dir, so no `cratylus-run` the real
// host happens to have can decide the outcome. The shims therefore spell node
// absolutely rather than finding it on that PATH — the fixtures model the
// binding, not node's own discovery.
const NODE = process.execPath;

/** A host bin dir holding a `cratylus-run` that EXECS A PATH THAT IS NOT THERE —
 *  the stranded global link, reproduced. `which` finds it; running it dies in
 *  node's module loader, exactly as it did on the day. */
function strandedHost(): { bin: string; env: NodeJS.ProcessEnv } {
  const root = tmp('host-stranded-');
  const bindir = join(root, 'bin');
  mkdirSync(bindir, { recursive: true });
  const gone = join(root, 'workspaces', 'renamed-away', 'dist', 'bin.js');
  const shim = join(bindir, BIN);
  writeFileSync(shim, `#!/bin/sh\nexec "${NODE}" "${gone}" "$@"\n`, 'utf-8');
  chmodSync(shim, 0o755);
  return { bin: shim, env: { ...process.env, PATH: bindir } };
}

/** A host bin dir whose `cratylus-run` actually runs and answers `--version`. */
function liveHost(): { bin: string; env: NodeJS.ProcessEnv } {
  const root = tmp('host-live-');
  const bindir = join(root, 'bin');
  const entrydir = join(root, 'checkout', 'packages', 'cli', 'dist');
  mkdirSync(bindir, { recursive: true });
  mkdirSync(entrydir, { recursive: true });
  const entry = join(entrydir, 'bin.js');
  writeFileSync(
    entry,
    "if (process.argv[2] === '--version') { process.stdout.write('0.0.0\\n'); }\n",
    'utf-8',
  );
  const shim = join(bindir, BIN);
  writeFileSync(shim, `#!/bin/sh\nexec "${NODE}" "${entry}" "$@"\n`, 'utf-8');
  chmodSync(shim, 0o755);
  return { bin: shim, env: { ...process.env, PATH: bindir } };
}

/** A host with no `cratylus-run` at all. */
function emptyHost(): { env: NodeJS.ProcessEnv } {
  const bindir = join(tmp('host-empty-'), 'bin');
  mkdirSync(bindir, { recursive: true });
  return { env: { ...process.env, PATH: bindir } };
}

/** A render tree carrying the REAL projected thin shim — the emitter's own
 *  bytes, not a lookalike, so the gate is tested against what actually ships. */
function treeWithShim(capability = 'memory'): {
  skillsDir: string;
  agentsDir: string;
  srcDir: string;
  files: string[];
} {
  const src = tmp('forge-render-');
  const tree = buildRenderTree(src);
  const srcDir = join(tree.skillsDir, 'memory');
  mkdirSync(join(srcDir, 'scripts'), { recursive: true });
  writeFileSync(
    join(srcDir, 'scripts', `${capability}.mjs`),
    runtimeShimContent(capability),
    'utf-8',
  );
  return {
    ...tree,
    srcDir,
    files: ['SKILL.md', `scripts/${capability}.mjs`],
  };
}

beforeEach(() => {
  resetRuntimeBinProbe();
});

describe('the probe is `--version`, not `which`', () => {
  it('CRUX: a presence check PASSES on the stranded host the capability died on', () => {
    const host = strandedHost();
    // `which` is satisfied — a file is there, executable, on PATH. This is what
    // was true for the whole outage.
    expect(whichOnPath(BIN, host.env)).toBe(host.bin);
    // Executing it is what tells the truth.
    const probe = probeRuntimeBin({ env: host.env, fresh: true });
    expect(probe.resolvable).toBe(false);
    expect(probe.found).toBe(host.bin);
    expect(probe.reason).toMatch(/exited/);
  });

  it('EXONERATES a host whose bin executes', () => {
    const host = liveHost();
    const probe = probeRuntimeBin({ env: host.env, fresh: true });
    expect(probe.resolvable).toBe(true);
    expect(probe.version).toBe('0.0.0');
    expect(probe.reason).toBeNull();
  });

  it('CONVICTS a host where the bin is absent from PATH entirely', () => {
    const probe = probeRuntimeBin({ env: emptyHost().env, fresh: true });
    expect(probe.resolvable).toBe(false);
    expect(probe.found).toBeNull();
    expect(probe.reason).toMatch(/not found on PATH/);
  });
});

describe('what counts as a placed CALL', () => {
  it('finds the projected thin shim and ignores a SKILL.md that merely names the bin', () => {
    const { srcDir, files } = treeWithShim();
    writeFileSync(
      join(srcDir, 'SKILL.md'),
      `# memory\n\nRuns via \`${BIN} memory read\`.\n`,
      'utf-8',
    );
    expect(shimsSpawningRuntimeBin(srcDir, files, BIN)).toEqual([
      'scripts/memory.mjs',
    ]);
  });

  it('a skill placing no scripts is never gated', () => {
    const { srcDir } = treeWithShim();
    expect(shimsSpawningRuntimeBin(srcDir, ['SKILL.md'], BIN)).toEqual([]);
    expect(
      assertShimsResolvable(srcDir, ['SKILL.md'], {
        env: strandedHost().env,
        fresh: true,
      }),
    ).toBeNull();
  });
});

describe('assertShimsResolvable', () => {
  it('CONVICTS the stranded host and EXONERATES the live one — same shim bytes', () => {
    const { srcDir, files } = treeWithShim();
    expect(
      assertShimsResolvable(srcDir, files, {
        env: strandedHost().env,
        fresh: true,
      }),
    ).toMatch(/REFUSED/);
    resetRuntimeBinProbe();
    expect(
      assertShimsResolvable(srcDir, files, {
        env: liveHost().env,
        fresh: true,
      }),
    ).toBeNull();
  });

  it('a dry run places nothing, so it convicts nothing', () => {
    const { srcDir, files } = treeWithShim();
    expect(
      assertShimsResolvable(srcDir, files, {
        env: strandedHost().env,
        fresh: true,
        dry: true,
      }),
    ).toBeNull();
  });

  it('the refusal is CAPABILITY-level: names the shim, the probe, and its repair — never a loader stack', () => {
    const { srcDir, files } = treeWithShim();
    const text = assertShimsResolvable(srcDir, files, {
      env: strandedHost().env,
      fresh: true,
    });
    expect(text).not.toBeNull();
    const msg = text as string;
    // what was placed, and that it is inert
    expect(msg).toMatch(/scripts\/memory\.mjs/);
    expect(msg).toMatch(/INERT/);
    // the probe that was actually run
    expect(msg).toMatch(new RegExp(`${BIN} --version`));
    // the lesson, at the point of failure
    expect(msg).toMatch(/Presence on PATH is not resolvability/);
    // THE REPAIR IS AN ORDINARY INSTALL, and that is the point of this assertion.
    // It used to be `node <checkout>/packages/cli/dist/bin.js install` — a repair
    // instruction naming a CHECKOUT PATH, which is unreadable to the consumer this
    // message exists for. The tool no longer authors its own PATH binding; the
    // package manager does, and it is the thing that solves this portably.
    expect(msg).toMatch(/npm i -g cratylus/);
    expect(msg).not.toMatch(/dist\/bin\.js install/);
    // the evidence quoted is the ERROR SENTENCE, which names the strand itself
    expect(msg).toMatch(/Cannot find module/);
    expect(msg).toMatch(/renamed-away/);
    // and NOT a node module-loader stack
    expect(msg).not.toMatch(/node:internal/);
    expect(msg).not.toMatch(/\n\s*at /);
  });

  // This assertion is here because the gate CONVICTED ITS OWN FIRST DRAFT: the
  // refusal quoted stderr's first line, and node opens a MODULE_NOT_FOUND with
  // `node:internal/modules/cjs/loader:1573` — the exact frame the message exists
  // to replace.
  it('salientStderr skips loader frames and quotes the error sentence', () => {
    const raw = [
      'node:internal/modules/cjs/loader:1573',
      '  throw err;',
      '  ^',
      '',
      "Error: Cannot find module '/gone/dist/bin.js'",
      '    at Function._resolveFilename (node:internal/modules/cjs/loader:1570:15)',
    ].join('\n');
    expect(salientStderr(raw)).toBe(
      "Error: Cannot find module '/gone/dist/bin.js'",
    );
    expect(salientStderr('')).toBeNull();
    expect(salientStderr('node:internal/x:1\n  ^')).toBeNull();
  });

  it('the stranded host is reported with the file `which` would have found', () => {
    const host = strandedHost();
    const probe = probeRuntimeBin({ env: host.env, fresh: true });
    const msg = runtimeBinRefusal(probe, ['scripts/memory.mjs']);
    expect(msg).toContain(host.bin);
  });
});

describe('placeSkillsLocal refuses a deploy that shipped inert shims', () => {
  const silent = { dry: false, log: () => {}, warn: () => {} };

  /** The gate reads the ambient PATH through the placer (PlaceOpts carries no
   *  env), so the fixture host is installed on the process for the call. */
  function withHost<T>(env: NodeJS.ProcessEnv, fn: () => T): T {
    const prior = process.env.PATH;
    process.env.PATH = env.PATH;
    resetRuntimeBinProbe();
    try {
      return fn();
    } finally {
      process.env.PATH = prior;
      resetRuntimeBinProbe();
    }
  }

  it('rc 2 + a loud warning on the STRANDED host — the files still land and are recorded', () => {
    const tree = treeWithShim();
    const claude = join(tmp('forge-host-'), '.claude');
    const warns: string[] = [];

    const r = withHost(strandedHost().env, () =>
      placeSkillsLocal(claude, tree, ['memory'], {
        dry: false,
        log: () => {},
        warn: (l) => warns.push(l),
      }),
    );

    expect(r.rc).toBe(2);
    expect(warns.join('\n')).toMatch(/REFUSED/);
    expect(r.report.warnings.join('\n')).toMatch(/deployed shims are inert/);
    // Testimony is still complete: the placer records what it laid down so the
    // next deploy can converge. A refusal must not cost attributability.
    expect(r.report.written.memory).toContain(
      'skills/memory/scripts/memory.mjs',
    );
  });

  it('rc 0 and silence on the LIVE host — same tree, same shim', () => {
    const tree = treeWithShim();
    const claude = join(tmp('forge-host-'), '.claude');
    const warns: string[] = [];

    const r = withHost(liveHost().env, () =>
      placeSkillsLocal(claude, tree, ['memory'], {
        dry: false,
        log: () => {},
        warn: (l) => warns.push(l),
      }),
    );

    expect(r.rc).toBe(0);
    expect(warns.join('\n')).not.toMatch(/REFUSED/);
  });

  it('a shim-free skill deploys clean even on the stranded host (no false conviction)', () => {
    const src = tmp('forge-render-');
    const tree = buildRenderTree(src);
    const claude = join(tmp('forge-host-'), '.claude');
    const r = withHost(strandedHost().env, () =>
      placeSkillsLocal(claude, tree, ['wake'], silent),
    );
    expect(r.rc).toBe(0);
  });
});
