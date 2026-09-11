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
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  OMP_LAUNCHER_FILE,
  OMP_OVERLAY_FILE,
  OMP_SESSION_MODULE,
} from '../../src/adapters/omp/index.js';
import { adapterByName } from '../../src/adapters/registry/index.js';
import { SCOPE_DIR_TOKEN } from '../../src/core/harness-adapter.js';
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
// `~/.agents/skills`), so a byte-perfect render once deployed 16 unloadable
// skills and reported success.
describe('deploy --harness omp places what omp actually reads', () => {
  const omp = adapterByName('omp');

  /** An omp-shaped render tree: one agent, one skill, and one staged launch-spec
   *  set per scope (session + the agent), exactly as `project` writes them —
   *  the session module named for real, so `scopedRel`'s filename-aware
   *  placement (module → `extensions/`, overlay/launcher → the scope's own top
   *  level) is exercised the same way it is in production. */
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
        join(src, 'enforcing', scope, OMP_SESSION_MODULE),
        `// ${scope}\nexport default () => {};\n`,
      );
    }
    // The launch spec — omp.yml + omp-launch — lands ONLY for the persona
    // scope, exactly as `ompLaunchSurface` emits it (never for `_session`).
    writeFileSync(
      join(src, 'enforcing', 'mav', OMP_OVERLAY_FILE),
      `extensions:\n  - ${SCOPE_DIR_TOKEN}/extensions\n`,
    );
    const launcherSrc = join(src, 'enforcing', 'mav', OMP_LAUNCHER_FILE);
    writeFileSync(launcherSrc, '#!/bin/sh\nexec omp "$@"\n');
    chmodSync(launcherSrc, 0o755);
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
        scopedRel: omp.scopedRel ?? null,
        hooksFile: omp.hooksFile,
        home,
        dry: false,
      });
    }
    return { dir: join(home, omp.home), home };
  }

  it('copies the skill to the harness-neutral root ONLY — no fan-out', () => {
    const { home } = ompTree();
    expect(
      existsSync(join(home, '.agents', 'skills', 'probe', 'SKILL.md')),
      'omp reads ~/.agents/skills NATIVELY on every launch, personaed or bare',
    ).toBe(true);
  });

  it('does NOT copy the skill to `.omp/skills/`, the dir omp never scans', () => {
    const { dir } = ompTree();
    expect(
      existsSync(join(dir, 'skills', 'probe')),
      'this is the render tree’s staging layout, not a destination — deploying here is how 16 skills became inert',
    ).toBe(false);
  });

  it('does NOT write into `profiles/` — the persona carrier is retired', () => {
    const { dir } = ompTree();
    expect(
      existsSync(join(dir, 'profiles')),
      'identity moved to the launch spec; forge must never create the profile dir it used to conflate identity with',
    ).toBe(false);
  });

  it('places each staged mechanism module in the scope that loads it', () => {
    const { dir, home } = ompTree();
    expect(
      existsSync(join(dir, 'agent', 'extensions', OMP_SESSION_MODULE)),
    ).toBe(true);
    expect(
      existsSync(
        join(home, '.agents', 'mav', 'extensions', OMP_SESSION_MODULE),
      ),
    ).toBe(true);
    // And nothing is left at the staging path: a module under `enforcing/` on the
    // host is one omp's extension loader never sees.
    expect(existsSync(join(dir, 'enforcing'))).toBe(false);
  });

  it('lands the launcher executable, and the overlay resolves to where the module actually landed', () => {
    const { home } = ompTree();
    const scopeDir = join(home, '.agents', 'mav');
    const launcherPath = join(scopeDir, OMP_LAUNCHER_FILE);
    expect(existsSync(launcherPath)).toBe(true);
    expect(
      statSync(launcherPath).mode & 0o111,
      'an unexecutable launcher is dead on the host — the operator cannot run it',
    ).not.toBe(0);

    const overlay = readFileSync(join(scopeDir, OMP_OVERLAY_FILE), 'utf-8');
    // The token must be GONE — a placeholder no YAML parser can expand would
    // reach the host exactly the way a literal `$HOME` does: read as a literal,
    // useless path segment.
    expect(overlay).not.toContain(SCOPE_DIR_TOKEN);
    // And what replaced it must name the directory the module actually landed
    // in — a launcher whose overlay names a directory nobody placed anything
    // into is a persona that starts with none of its own governance loaded.
    expect(overlay).toContain(join(scopeDir, 'extensions'));
    expect(existsSync(join(scopeDir, 'extensions', OMP_SESSION_MODULE))).toBe(
      true,
    );
  });
});
