import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runInstall } from '../../src/cli/commands/install.js';
import { answers, fixturePractices } from '../deploy/helpers.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

describe('guided install confirmation', () => {
  let home: string;
  let cwd: string;

  beforeEach(() => {
    const root = mkdtempSync(join(tmpdir(), 'forge-install-confirm-'));
    home = join(root, 'home');
    cwd = join(root, 'cwd');
    mkdirSync(home, { recursive: true });
    mkdirSync(cwd, { recursive: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(join(home, '..'), { recursive: true, force: true });
  });

  const snapshot = (dir: string, at = ''): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const entry of readdirSync(join(dir, at)).sort()) {
      const rel = at === '' ? entry : `${at}/${entry}`;
      const path = join(dir, rel);
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) out[rel] = `-> ${readlinkSync(path)}`;
      else if (stat.isDirectory()) Object.assign(out, snapshot(dir, rel));
      else out[rel] = readFileSync(path, 'utf8');
    }
    return out;
  };

  it('writes nothing before confirmation, shows what it would place, and writes nothing on a decline', async () => {
    const fixtures = fileURLToPath(
      new URL('../project/fixtures', import.meta.url),
    );
    const corpus = {
      name: 'fixture',
      manifest: FIXTURE_MANIFEST,
      agents: join(fixtures, 'agents'),
      skills: join(fixtures, 'skills'),
      practices: fixturePractices(['probe']),
    };
    const before = snapshot(home);
    let seenBefore: string[] | undefined;
    let out = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      out += String(chunk);
      return true;
    });
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      out += `${args.join(' ')}\n`;
    });
    expect(
      await runInstall({
        corpus: corpus as never,
        home,
        cwd,
        harness: 'omp',
        practices: undefined,
        interactive: true,
        prompts: answers({
          practices: async () => ['fixture'],
          confirm: async () => {
            seenBefore = Object.keys(snapshot(home));
            expect(out).toContain('cratylus would install');
            expect(out).toContain('practices: fixture');
            return false;
          },
        }),
      }),
    ).toBe(0);
    expect(seenBefore).toEqual(Object.keys(before));
    expect(snapshot(home)).toEqual(before);
    expect(out).toContain('Nothing was written.');
  });
});
