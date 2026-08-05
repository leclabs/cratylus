// DEPLOY-CHECK — the deployed tree must be what the corpus RENDERS.
//
// Every gate in this suite before it was a claim about how a Target is PRODUCED:
// `deploy-valid ⇔ REGENERABLE` says a Target is deploy-owned, deterministic, and
// never hand-edited. The render oracle hashes `.render-ts` — the corpus's own
// output — and proves the projector is deterministic. NONE of that is a claim
// about what is sitting on the host right now, so the two trees could diverge
// silently and indefinitely with every gate green. They did: on 2026-08-04 an
// agent argued a naming question for five hours from a SUPERSEDED axiom, because
// the doctrine deployed into its context was a pre-`a2205eb` projection and
// nothing anywhere compared it to the render tree.
//
// THE CONTROL for the conviction fixture is `today's machinery stays silent`
// (`the control`, below): the drifted host is fed to the pre-existing oracle —
// a dry-run `deploySingle`, whose prune + unattributable report is the whole of
// what this repo could say about a deploy root before this file existed — and it
// reports NOTHING about the drift. That is the defect, encoded, and it is what
// makes the conviction below non-vacuous.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runDeploy } from '../../src/cli/commands/deploy.js';
import { deploySingle } from '../../src/deploy/index.js';
import {
  auditLocal,
  placeAgentsLocal,
  placeSkillsLocal,
  renderedFiles,
} from '../../src/deploy/local.js';
import { buildHooksTree, buildRenderTree, tmp } from './helpers.js';

const silent = { log: () => {}, warn: () => {} };

/** The live line of the first principle, and the superseded one it replaced —
 *  verbatim from the incident, because the point of the report is that an
 *  operator can READ what their host is still running. */
const LIVE = '∀ authored-surface ⟨σ* ∨ ⊕σ* · prose ≡ identifier ≡ path⟩';
const SUPERSEDED = '∀ name ⟨anchor · dimension · skill · agent · file · dir⟩';

/** A render tree whose `nico` def carries the LIVE axiom, plus a host that has
 *  been deployed from it. Returns both roots. */
function deployedHost(): {
  root: string;
  agentsDir: string;
  skillsDir: string;
  hooksDir: string;
  home: string;
  harnessDir: string;
} {
  const root = tmp('check-render-');
  const { agentsDir, skillsDir } = buildRenderTree(root);
  const { hooksDir } = buildHooksTree(root);
  writeFileSync(
    join(agentsDir, 'nico.md'),
    `---\nname: nico\n---\n# nico\n\n## Prime Principle\n\n${LIVE}\n`,
    'utf-8',
  );
  const home = tmp('check-home-');
  for (const kind of ['agent', 'skill', 'hooks'] as const) {
    const r = deploySingle({
      kind,
      scope: 'user',
      tree: { agentsDir, skillsDir, hooksDir },
      home,
      ...silent,
    });
    expect(r.rc).toBe(0);
  }
  return {
    root,
    agentsDir,
    skillsDir,
    hooksDir,
    home,
    harnessDir: join(home, '.claude'),
  };
}

/** Every file under `dir`, dir-relative POSIX, recursively. */
function allFiles(dir: string, rel = ''): string[] {
  const out: string[] = [];
  for (const e of readdirSync(join(dir, rel)).sort()) {
    const child = rel ? `${rel}/${e}` : e;
    if (statSync(join(dir, child)).isDirectory()) {
      out.push(...allFiles(dir, child));
    } else {
      out.push(child);
    }
  }
  return out;
}

describe('the control: the machinery that predates this file stays silent', () => {
  it('a dry-run deploy of a DRIFTED host reports nothing about the drift', () => {
    const h = deployedHost();
    // The exact incident: the deployed def is superseded doctrine.
    writeFileSync(
      join(h.harnessDir, 'agents', 'nico.md'),
      `---\nname: nico\n---\n# nico\n\n## Prime Principle\n\n${SUPERSEDED}\n`,
      'utf-8',
    );
    const lines: string[] = [];
    const r = deploySingle({
      kind: 'agent',
      scope: 'user',
      tree: { agentsDir: h.agentsDir, skillsDir: h.skillsDir },
      home: h.home,
      dry: true,
      log: (l) => lines.push(l),
      warn: (l) => lines.push(l),
    });
    // Green. Nothing to prune, nothing unattributable, rc 0 — and not one word
    // about the fact that the host is running a doctrine the corpus retired.
    expect(r.rc).toBe(0);
    const said = lines.join('\n');
    expect(said).not.toMatch(/nico\.md/);
    expect(said).not.toMatch(/drift|stale|superseded|differ/i);
  });
});

describe('auditLocal — CONVICTION', () => {
  it('names the divergence in a deployed def that drifted from the render tree', () => {
    const h = deployedHost();
    writeFileSync(
      join(h.harnessDir, 'agents', 'nico.md'),
      `---\nname: nico\n---\n# nico\n\n## Prime Principle\n\n${SUPERSEDED}\n`,
      'utf-8',
    );
    const rep = auditLocal(
      h.harnessDir,
      'agent',
      { agentsDir: h.agentsDir, skillsDir: h.skillsDir },
      ['mav', 'nico'],
    );
    const stale = rep.divergences.filter((d) => d.kind === 'stale');
    expect(stale.map((d) => d.path)).toEqual(['agents/nico.md']);
    // NAMES what would be lost — not "1 file differs".
    expect(stale[0]?.missing).toContain(LIVE);
    expect(stale[0]?.superseded).toContain(SUPERSEDED);
    // `mav` did not drift and is not accused.
    expect(rep.divergences.map((d) => d.path)).not.toContain('agents/mav.md');
  });

  it('reports a rendered artifact that never landed as ABSENT', () => {
    const h = deployedHost();
    rmSync(join(h.harnessDir, 'skills', 'wake', 'SKILL.md'));
    const rep = auditLocal(
      h.harnessDir,
      'skill',
      { agentsDir: h.agentsDir, skillsDir: h.skillsDir },
      ['memory', 'wake'],
    );
    const absent = rep.divergences.filter((d) => d.kind === 'absent');
    expect(absent.map((d) => d.path)).toEqual(['skills/wake/SKILL.md']);
    expect(absent[0]?.gist).toMatch(/wake/);
    expect(rep.divergences.some((d) => d.kind === 'stale')).toBe(false);
  });

  it('reports a file we did not render as FOREIGN, never as ours, and never deletes it', () => {
    const h = deployedHost();
    const theirs = join(h.harnessDir, 'agents', 'lex-own.md');
    writeFileSync(theirs, '# the operator wrote this\n', 'utf-8');
    const rep = auditLocal(
      h.harnessDir,
      'agent',
      { agentsDir: h.agentsDir, skillsDir: h.skillsDir },
      ['mav', 'nico'],
    );
    const foreign = rep.divergences.filter((d) => d.kind === 'foreign');
    expect(foreign).toHaveLength(1);
    expect(foreign[0]?.path).toBe('agents/lex-own.md');
    expect(foreign[0]?.ours).toBe(false);
    // A report, not a repair.
    expect(existsSync(theirs)).toBe(true);
    expect(readFileSync(theirs, 'utf-8')).toBe('# the operator wrote this\n');
    // And it is not accused of being stale or absent — those are OUR defects.
    expect(rep.divergences.filter((d) => d.kind !== 'foreign')).toHaveLength(0);
  });

  it('a retired artifact a PRIOR deploy left behind is foreign-but-OURS', () => {
    const h = deployedHost();
    // The render tree retires `mav`; the host still carries the def we placed.
    const rep = auditLocal(
      h.harnessDir,
      'agent',
      { agentsDir: h.agentsDir, skillsDir: h.skillsDir },
      ['nico'],
    );
    const foreign = rep.divergences.filter((d) => d.kind === 'foreign');
    expect(foreign.map((d) => d.path)).toEqual(['agents/mav.md']);
    expect(foreign[0]?.ours).toBe(true);
    expect(existsSync(join(h.harnessDir, 'agents', 'mav.md'))).toBe(true);
  });
});

describe('auditLocal — EXONERATION', () => {
  it('a host in sync has ZERO divergences, for every kind', () => {
    const h = deployedHost();
    const tree = {
      agentsDir: h.agentsDir,
      skillsDir: h.skillsDir,
      hooksDir: h.hooksDir,
    };
    const cases: [Parameters<typeof auditLocal>[1], string[]][] = [
      ['agent', ['mav', 'nico']],
      ['skill', ['memory', 'wake']],
      ['hooks', ['stance-guardrail']],
    ];
    for (const [kind, names] of cases) {
      const rep = auditLocal(h.harnessDir, kind, tree, names);
      expect({ kind, d: rep.divergences }).toEqual({ kind, d: [] });
      expect(rep.compared).toBeGreaterThan(0);
    }
  });

  it('the `.forge/` bookkeeping record is NOT drift', () => {
    const h = deployedHost();
    // Deploy's own manifest lives here; `project` lands a render-manifest under
    // the same dir one stage upstream. Neither is a projected artifact.
    expect(
      existsSync(join(h.harnessDir, '.forge', 'deploy-manifest.json')),
    ).toBe(true);
    for (const kind of ['agent', 'skill', 'hooks'] as const) {
      const rep = auditLocal(
        h.harnessDir,
        kind,
        {
          agentsDir: h.agentsDir,
          skillsDir: h.skillsDir,
          hooksDir: h.hooksDir,
        },
        kind === 'agent'
          ? ['mav', 'nico']
          : kind === 'skill'
            ? ['memory', 'wake']
            : ['stance-guardrail'],
      );
      expect(rep.divergences.filter((d) => d.path.includes('.forge'))).toEqual(
        [],
      );
    }
  });

  it('the audit MUTATES NOTHING — the host is byte-identical after a check', () => {
    const h = deployedHost();
    const before = allFiles(h.harnessDir).map(
      (f) => `${f}:${readFileSync(join(h.harnessDir, f)).toString('base64')}`,
    );
    for (const kind of ['agent', 'skill', 'hooks'] as const) {
      auditLocal(
        h.harnessDir,
        kind,
        {
          agentsDir: h.agentsDir,
          skillsDir: h.skillsDir,
          hooksDir: h.hooksDir,
        },
        kind === 'agent'
          ? ['mav', 'nico']
          : kind === 'skill'
            ? ['memory', 'wake']
            : ['stance-guardrail'],
      );
    }
    const after = allFiles(h.harnessDir).map(
      (f) => `${f}:${readFileSync(join(h.harnessDir, f)).toString('base64')}`,
    );
    expect(after).toEqual(before);
  });
});

describe('renderedFiles agrees with the placers own testimony', () => {
  it('the READ path enumerates exactly what the WRITE path records having written', () => {
    const root = tmp('check-render-');
    const { agentsDir, skillsDir } = buildRenderTree(root);
    const harnessDir = join(tmp('check-home-'), '.claude');
    mkdirSync(harnessDir, { recursive: true });
    const a = placeAgentsLocal(harnessDir, agentsDir, ['mav', 'nico'], {
      dry: true,
      ...silent,
    });
    expect(
      renderedFiles('agent', { agentsDir, skillsDir }, ['mav', 'nico'])
        .map((f) => f.rel)
        .sort(),
    ).toEqual(Object.values(a.report.written).flat().sort());
    const s = placeSkillsLocal(
      harnessDir,
      { agentsDir, skillsDir },
      ['memory', 'wake'],
      { dry: true, ...silent },
    );
    expect(
      renderedFiles('skill', { agentsDir, skillsDir }, ['memory', 'wake'])
        .map((f) => f.rel)
        .sort(),
    ).toEqual(Object.values(s.report.written).flat().sort());
  });
});

describe('cratylus deploy --check', () => {
  it('CONVICTS a drifted host: rc 1, and the report names the lost line', async () => {
    const h = deployedHost();
    writeFileSync(
      join(h.harnessDir, 'agents', 'nico.md'),
      `---\nname: nico\n---\n# nico\n\n## Prime Principle\n\n${SUPERSEDED}\n`,
      'utf-8',
    );
    const lines: string[] = [];
    const rc = await runDeploy({
      agentsDir: h.agentsDir,
      skillsDir: h.skillsDir,
      hooksDir: h.hooksDir,
      kind: 'all',
      scope: 'user',
      home: h.home,
      check: true,
      log: (l) => lines.push(l),
    });
    expect(rc).toBe(1);
    const said = lines.join('\n');
    expect(said).toMatch(/STALE/);
    expect(said).toMatch(/agents\/nico\.md/);
    expect(said).toContain(LIVE);
    expect(said).toContain(SUPERSEDED);
  });

  it('EXONERATES a host in sync: rc 0, and says so', async () => {
    const h = deployedHost();
    const lines: string[] = [];
    const rc = await runDeploy({
      agentsDir: h.agentsDir,
      skillsDir: h.skillsDir,
      hooksDir: h.hooksDir,
      kind: 'all',
      scope: 'user',
      home: h.home,
      check: true,
      log: (l) => lines.push(l),
    });
    expect(rc).toBe(0);
    expect(lines.join('\n')).toMatch(/in sync/i);
  });

  it('foreign alone does NOT convict — it is reported, not charged to us', async () => {
    const h = deployedHost();
    writeFileSync(
      join(h.harnessDir, 'agents', 'lex-own.md'),
      '# mine\n',
      'utf-8',
    );
    const lines: string[] = [];
    const rc = await runDeploy({
      agentsDir: h.agentsDir,
      skillsDir: h.skillsDir,
      hooksDir: h.hooksDir,
      kind: 'all',
      scope: 'user',
      home: h.home,
      check: true,
      log: (l) => lines.push(l),
    });
    expect(rc).toBe(0);
    expect(lines.join('\n')).toMatch(/lex-own/);
  });

  it('--check changes nothing on the host (a report, not a repair)', async () => {
    const h = deployedHost();
    rmSync(join(h.harnessDir, 'agents', 'nico.md'));
    const rc = await runDeploy({
      agentsDir: h.agentsDir,
      skillsDir: h.skillsDir,
      hooksDir: h.hooksDir,
      kind: 'all',
      scope: 'user',
      home: h.home,
      check: true,
      log: () => {},
    });
    expect(rc).toBe(1);
    // The check did NOT re-place the file it found missing.
    expect(existsSync(join(h.harnessDir, 'agents', 'nico.md'))).toBe(false);
  });
});
