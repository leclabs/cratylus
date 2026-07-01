// Bundle staging — the skill-dir build-artifact companion contract
// (resolve._stage_bundle). The acceptance gate: the bundle HARD-ERROR fires
// when the `episodic.mjs` build output is absent (never silently ship a
// tool-less memory home).

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BundleMissingError,
  placeSkillsLocal,
  stageAssets,
  stageBundle,
} from '../../src/deploy/index.js';
import { buildBundleSrc, buildRenderTree, tmp } from './helpers.js';

const silent = { dry: false, log: () => {}, warn: () => {} };

describe('stageBundle', () => {
  it('stages a built artifact beside SKILL.md, byte-for-byte', () => {
    const root = buildBundleSrc(tmp('agent-forge-bundle-'), true);
    const destDir = tmp('agent-forge-skill-');
    const staged = stageBundle(
      'memory',
      destDir,
      ['agent-memory/dist/episodic.mjs'],
      {
        baseRoot: root,
      },
    );
    expect(staged).toEqual(['episodic.mjs']);
    expect(existsSync(join(destDir, 'episodic.mjs'))).toBe(true);
  });

  it('HARD-ERRORS when the build output is absent (the acceptance gate)', () => {
    const root = buildBundleSrc(tmp('agent-forge-bundle-'), false); // NOT built
    const destDir = tmp('agent-forge-skill-');
    expect(() =>
      stageBundle('memory', destDir, ['agent-memory/dist/episodic.mjs'], {
        baseRoot: root,
      }),
    ).toThrow(BundleMissingError);
  });

  it('the hard-error names the skill, the spec, and the build hint', () => {
    const root = buildBundleSrc(tmp('agent-forge-bundle-'), false);
    const destDir = tmp('agent-forge-skill-');
    try {
      stageBundle('memory', destDir, ['agent-memory/dist/episodic.mjs'], {
        baseRoot: root,
      });
      expect.unreachable('should have thrown');
    } catch (e) {
      const err = e as BundleMissingError;
      expect(err.skill).toBe('memory');
      expect(err.spec).toBe('agent-memory/dist/episodic.mjs');
      expect(err.message).toMatch(/not built at/);
      expect(err.message).toMatch(/pnpm --filter @leclabs\/agent-memory build/);
    }
  });

  it('no-op when a skill declares no bundle', () => {
    const destDir = tmp('agent-forge-skill-');
    expect(stageBundle('wake', destDir, undefined, { baseRoot: '/' })).toEqual(
      [],
    );
  });
});

describe('the bundle hard-error fires through the placer', () => {
  it('placeSkillsLocal throws BundleMissingError when episodic.mjs is unbuilt', () => {
    const src = tmp('agent-forge-render-');
    const tree = buildRenderTree(src);
    const bundleRoot = buildBundleSrc(tmp('agent-forge-bundle-'), false); // unbuilt
    const claude = join(tmp('agent-forge-host-'), '.claude');
    expect(() =>
      placeSkillsLocal(
        claude,
        {
          ...tree,
          companions: {
            memory: { bundle: ['agent-memory/dist/episodic.mjs'] },
          },
          bundleBaseRoot: bundleRoot,
        },
        ['memory'],
        silent,
      ),
    ).toThrow(BundleMissingError);
  });
});

describe('stageAssets', () => {
  it('warns (not throws) on a missing committed asset', () => {
    const cellDir = tmp('agent-forge-cell-');
    const warns: string[] = [];
    const staged = stageAssets('s', cellDir, ['missing.png'], {
      assetBaseDir: cellDir,
      warn: (l) => warns.push(l),
    });
    expect(staged).toEqual([]);
    expect(warns.join('\n')).toMatch(/asset s\/missing\.png not found/);
  });

  it('stages a present committed asset', () => {
    const cellDir = tmp('agent-forge-cell-');
    mkdirSync(cellDir, { recursive: true });
    writeFileSync(join(cellDir, 'logo.txt'), 'asset', 'utf-8');
    const destDir = tmp('agent-forge-skill-');
    const staged = stageAssets('s', destDir, ['logo.txt'], {
      assetBaseDir: cellDir,
    });
    expect(staged).toEqual(['logo.txt']);
    expect(readdirSync(destDir)).toContain('logo.txt');
  });
});
