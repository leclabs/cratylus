// GATE — deploy places a SECOND harness's artifacts, not just claude's.
//
// WHY THIS SHAPE OF TEST. The deploy half had no adapter in scope: scope resolved
// `.claude`, the agent placer looked for `<name>.md`, and the hooks placer read
// `settings.json`. Pointed at a codex render tree it placed ZERO agents and
// reported success — because "no file matched the extension I assumed" is
// indistinguishable from "there was nothing to deploy". A wrong default here
// fails by finding nothing, which is the failure mode that reads as a pass.
//
// So every assertion below is POSITIVE (this artifact landed at this path), and
// each is paired against the other harness so a regression to a hardcoded
// default cannot satisfy both.

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { adapterByName } from '../../src/adapters/registry/index.js';
import { deploySingle } from '../../src/deploy/deploy.js';

const roots: string[] = [];
afterEach(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
  roots.length = 0;
});

/** A render tree shaped for `harness`, with one agent, one skill and one hook. */
function tree(harness: string) {
  const root = mkdtempSync(join(tmpdir(), `forge-${harness}-`));
  roots.push(root);
  const a = adapterByName(harness);
  const src = join(root, 'render');
  mkdirSync(join(src, 'agents'), { recursive: true });
  mkdirSync(join(src, 'skills', 'probe'), { recursive: true });
  mkdirSync(join(src, 'hooks', 'ping'), { recursive: true });
  writeFileSync(join(src, 'agents', `warden${a.agentExt}`), 'warden def\n');
  writeFileSync(join(src, 'skills', 'probe', 'SKILL.md'), '# probe\n');
  writeFileSync(join(src, 'hooks', 'ping', 'ping.sh'), '#!/bin/sh\nexit 0\n');
  writeFileSync(
    join(src, a.hooksFile),
    JSON.stringify({
      hooks: {
        SessionStart: [{ hooks: [{ type: 'command', command: 'sh ping.sh' }] }],
      },
    }),
  );
  return { root, src, adapter: a, home: join(root, 'target') };
}

function deployAll(t: ReturnType<typeof tree>) {
  for (const kind of ['agent', 'skill', 'hooks'] as const) {
    deploySingle({
      kind,
      scope: 'user',
      tree: {
        agentsDir: join(t.src, 'agents'),
        skillsDir: join(t.src, 'skills'),
        hooksDir: t.src,
      },
      harnessHome: t.adapter.home,
      agentExt: t.adapter.agentExt,
      hooksFile: t.adapter.hooksFile,
      home: t.home,
      dry: false,
    });
  }
  return join(t.home, t.adapter.home);
}

describe.each(['claude', 'codex'])('deploy --harness %s', (harness) => {
  it('lands in THIS harness’s home, not another’s', () => {
    const t = tree(harness);
    const dir = deployAll(t);
    expect(existsSync(dir), `${dir} missing`).toBe(true);
    for (const other of ['claude', 'codex'].filter((h) => h !== harness)) {
      const foreign = join(t.home, adapterByName(other).home);
      expect(existsSync(foreign), `also wrote ${foreign}`).toBe(false);
    }
  });

  it('places the agent def under this harness’s EXTENSION', () => {
    const t = tree(harness);
    const dir = deployAll(t);
    const placed = join(dir, 'agents', `warden${t.adapter.agentExt}`);
    expect(
      existsSync(placed),
      `no agent at ${placed} — a placer reading the wrong extension finds nothing and reports success`,
    ).toBe(true);
  });

  it('writes this harness’s hook-config FILENAME', () => {
    const t = tree(harness);
    const dir = deployAll(t);
    expect(existsSync(join(dir, t.adapter.hooksFile))).toBe(true);
    for (const other of ['claude', 'codex'].filter((h) => h !== harness)) {
      const foreign = adapterByName(other).hooksFile;
      if (foreign === t.adapter.hooksFile) continue;
      expect(existsSync(join(dir, foreign)), `also wrote ${foreign}`).toBe(
        false,
      );
    }
  });

  it('places the hook workers', () => {
    const t = tree(harness);
    const dir = deployAll(t);
    expect(existsSync(join(dir, 'hooks', 'ping', 'ping.sh'))).toBe(true);
  });
});

describe('the two harnesses genuinely differ — else the cases above are one case', () => {
  it('claude and codex disagree on home, extension and hook file', () => {
    const c = adapterByName('claude');
    const x = adapterByName('codex');
    expect(c.home).not.toBe(x.home);
    expect(c.agentExt).not.toBe(x.agentExt);
    expect(c.hooksFile).not.toBe(x.hooksFile);
  });
});

// ── omp: the harness whose destinations are NOT the render tree's layout ─────
//
// The cases above pin one asymmetry (extension, home, hook filename) and share a
// hidden assumption: that a skill lands at `skills/<name>` and a mechanism in a
// file at the root. omp breaks both, and the breakage was live — `~/.omp/skills`
// is a directory that harness never scans (its native provider reads
// `<agent-dir>/skills`, profile-scoped), so a byte-perfect render deployed 16
// unloadable skills and reported success.
describe('deploy --harness omp places what omp actually reads', () => {
  const omp = adapterByName('omp');

  /** An omp-shaped render tree: one agent, one skill, and one staged mechanism
   *  module per scope (session + the agent), exactly as `project` writes them. */
  function ompTree() {
    const root = mkdtempSync(join(tmpdir(), 'forge-omp-'));
    roots.push(root);
    const src = join(root, 'render');
    mkdirSync(join(src, 'agents'), { recursive: true });
    mkdirSync(join(src, 'skills', 'probe'), { recursive: true });
    mkdirSync(join(src, 'hooks', 'ping'), { recursive: true });
    mkdirSync(join(src, 'enforcing', '_session'), { recursive: true });
    mkdirSync(join(src, 'enforcing', 'mav'), { recursive: true });
    writeFileSync(
      join(src, 'agents', `mav${omp.agentExt}`),
      'You are `mav`.\n',
    );
    writeFileSync(join(src, 'skills', 'probe', 'SKILL.md'), '# probe\n');
    writeFileSync(join(src, 'hooks', 'ping', 'ping.sh'), '#!/bin/sh\nexit 0\n');
    for (const scope of ['_session', 'mav']) {
      writeFileSync(
        join(src, 'enforcing', scope, 'mod.ts'),
        `// ${scope}\nexport default () => {};\n`,
      );
    }
    const home = join(root, 'target');
    for (const kind of ['agent', 'skill', 'hooks'] as const) {
      deploySingle({
        kind,
        scope: 'user',
        tree: {
          agentsDir: join(src, 'agents'),
          skillsDir: join(src, 'skills'),
          hooksDir: src,
        },
        harnessHome: omp.home,
        agentExt: omp.agentExt,
        agentRel: (n: string) => omp.agentRel(n),
        skillRel: (n: string, agents: readonly string[]) =>
          omp.skillRel(n, agents),
        enforcingRel: omp.enforcingRel ?? null,
        hooksFile: omp.hooksFile,
        home,
        dry: false,
      });
    }
    return join(home, omp.home);
  }

  it('copies the skill into the session root AND every projected profile', () => {
    const dir = ompTree();
    expect(existsSync(join(dir, 'agent', 'skills', 'probe', 'SKILL.md'))).toBe(
      true,
    );
    expect(
      existsSync(
        join(dir, 'profiles', 'mav', 'agent', 'skills', 'probe', 'SKILL.md'),
      ),
      'a profile launch reads only its own agent dir, so a skill it cannot see is not deployed',
    ).toBe(true);
  });

  it('does NOT copy the skill to `skills/`, the dir omp never scans', () => {
    const dir = ompTree();
    expect(
      existsSync(join(dir, 'skills', 'probe')),
      'this is the render tree’s staging layout, not a destination — deploying here is how 16 skills became inert',
    ).toBe(false);
  });

  it('places each staged mechanism module in the scope that loads it', () => {
    const dir = ompTree();
    expect(existsSync(join(dir, 'agent', 'extensions', 'mod.ts'))).toBe(true);
    expect(
      existsSync(join(dir, 'profiles', 'mav', 'agent', 'extensions', 'mod.ts')),
    ).toBe(true);
    // And nothing is left at the staging path: a module under `enforcing/` on the
    // host is one omp's extension loader never sees.
    expect(existsSync(join(dir, 'enforcing'))).toBe(false);
  });
});
