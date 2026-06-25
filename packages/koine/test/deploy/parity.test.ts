// Parity proof against the proven Python placer (acceptance #1). Both the
// real `packages/mind/toolkit/place/local.py` and koine's local placer run over
// the SAME render tree into two scratch `.claude/` targets; the resulting trees
// must be byte-identical (file set + contents). This is the round-trip gate: if
// the TS port diverges from the Python it transcribes, the diff surfaces here.
//
// Skips gracefully (not fails) when python3 or the toolkit is unavailable, so
// the suite stays green on a host without the mind toolkit — the hermetic
// fixtures (local/fleet/bundle tests) carry the contract regardless.

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { placeAgentsLocal } from '../../src/deploy/index.js';
import { buildRenderTree, tmp } from './helpers.js';

// Locate the mind toolkit relative to this package (repo-root walk).
function toolkitDir(): string | null {
  let dir = resolve(__dirname);
  for (let i = 0; i < 8; i++) {
    const cand = join(dir, 'packages', 'mind', 'toolkit', 'place', 'local.py');
    if (existsSync(cand)) {
      return join(dir, 'packages', 'mind', 'toolkit');
    }
    dir = resolve(dir, '..');
  }
  return null;
}

function pythonAvailable(): boolean {
  const p = spawnSync('python3', ['--version'], { encoding: 'utf-8' });
  return p.status === 0;
}

/** Walk a dir tree → sorted list of [relPath, content]. */
function snapshot(root: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d).sort()) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) {
        walk(p);
      } else {
        out.push([relative(root, p), readFileSync(p, 'utf-8')]);
      }
    }
  };
  walk(root);
  return out.sort((a, b) => a[0].localeCompare(b[0]));
}

const tk = toolkitDir();
const hasPython = pythonAvailable();
const run = tk && hasPython ? it : it.skip;

describe('parity with place/local.py (place_agents)', () => {
  run(
    'produces a byte-identical .claude/agents tree on a scratch target',
    () => {
      const { agentsDir } = buildRenderTree(tmp('koine-render-'));

      // ── Python side ──────────────────────────────────────────────────────
      const pyClaude = join(tmp('parity-py-'), '.claude');
      const harness = `
import sys, pathlib
sys.path.insert(0, ${JSON.stringify(tk)})
from place import local as place_local
place_local.place_agents(
    pathlib.Path(${JSON.stringify(pyClaude)}),
    pathlib.Path(${JSON.stringify(agentsDir)}),
    ["mav", "nico"],
    False,
)
`;
      const py = spawnSync('python3', ['-c', harness], { encoding: 'utf-8' });
      expect(py.status, py.stderr).toBe(0);

      // ── koine side ───────────────────────────────────────────────────────
      const tsClaude = join(tmp('parity-ts-'), '.claude');
      placeAgentsLocal(tsClaude, agentsDir, ['mav', 'nico'], {
        dry: false,
        log: () => {},
        warn: () => {},
      });

      // ── compare ──────────────────────────────────────────────────────────
      const pySnap = snapshot(pyClaude);
      const tsSnap = snapshot(tsClaude);
      // identical relative-path sets
      expect(tsSnap.map((x) => x[0])).toEqual(pySnap.map((x) => x[0]));
      // identical contents (defs + seeded sidecars, EPISODIC.jsonl empty in both)
      expect(tsSnap).toEqual(pySnap);
    },
  );

  run(
    'honors the if-absent seed guard identically (existing sidecar untouched)',
    () => {
      const { agentsDir } = buildRenderTree(tmp('koine-render-'));

      // Pre-seed an existing SELF.md in BOTH targets with identical content; both
      // placers must leave it untouched (the never-clobber contract).
      const pyClaude = join(tmp('parity-py-'), '.claude');
      const tsClaude = join(tmp('parity-ts-'), '.claude');
      for (const claude of [pyClaude, tsClaude]) {
        const selfdir = join(claude, 'agents', 'mav');
        mkdirSync(selfdir, { recursive: true });
        writeFileSync(
          join(selfdir, 'SELF.md'),
          'LIVED — never clobber',
          'utf-8',
        );
      }

      const harness = `
import sys, pathlib
sys.path.insert(0, ${JSON.stringify(tk)})
from place import local as place_local
place_local.place_agents(
    pathlib.Path(${JSON.stringify(pyClaude)}),
    pathlib.Path(${JSON.stringify(agentsDir)}),
    ["mav"],
    False,
)
`;
      const py = spawnSync('python3', ['-c', harness], { encoding: 'utf-8' });
      expect(py.status, py.stderr).toBe(0);

      placeAgentsLocal(tsClaude, agentsDir, ['mav'], {
        dry: false,
        log: () => {},
        warn: () => {},
      });

      expect(snapshot(tsClaude)).toEqual(snapshot(pyClaude));
      // and the pre-seeded SELF survived in both
      expect(
        readFileSync(join(tsClaude, 'agents', 'mav', 'SELF.md'), 'utf-8'),
      ).toBe('LIVED — never clobber');
    },
  );
});
