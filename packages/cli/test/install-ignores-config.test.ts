// INSTALL IGNORES A CONFIGURATION FILE IN ITS WORKING DIRECTORY (decision 0331).
//
// `cratylus install` always installs the canon the command is built with. A
// `cratylus.config.ts` where it runs, naming another plugin, is read by nothing: the
// run succeeds and places the same agents and skills a run from an empty directory
// does. The file writes a marker when it is loaded, so reading it is seen too.
//
// Held on the BUILT bin, as closed-pipe.test.ts is: the cli package's test task
// depends on its own build (turbo.json).

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const bin = join(here, '..', 'dist', 'cratylus.js');

const CONFIG = `import { writeFileSync } from 'node:fs';
writeFileSync(new URL('./config-was-read', import.meta.url), '');
const acme = { name: 'acme', agents: './acme-agents', skills: './acme-skills' };
export default { extends: [acme] };
`;

let scratch: string;
beforeAll(() => {
  expect(existsSync(bin), `${bin} is built by the test task`).toBe(true);
  scratch = mkdtempSync(join(tmpdir(), 'cratylus-install-config-'));
});
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

/** Install from `cwd` into a home of its own: the exit, and what the owned root holds. */
function installFrom(cwd: string, name: string) {
  const home = join(scratch, `${name}-home`);
  mkdirSync(home);
  const r = spawnSync(
    process.execPath,
    [
      bin,
      'install',
      '--harness',
      'omp',
      '--home',
      home,
      '--model-roles',
      'default',
    ],
    { cwd, env: { ...process.env, HOME: home }, input: '', encoding: 'utf8' },
  );
  const owned = join(home, '.cratylus', 'omp');
  const [agents = [], skills = []] = ['agents', 'skills'].map((dir) =>
    existsSync(join(owned, dir)) ? readdirSync(join(owned, dir)).sort() : [],
  );
  return { code: r.status, output: r.stdout + r.stderr, agents, skills };
}

it('installs the canon cratylus ships from a directory whose cratylus.config.ts names another plugin, without reading it', () => {
  const plain = join(scratch, 'plain');
  const configured = join(scratch, 'configured');
  mkdirSync(plain);
  mkdirSync(configured);
  writeFileSync(join(configured, 'cratylus.config.ts'), CONFIG);

  const bundled = installFrom(plain, 'plain');
  expect(bundled.code, bundled.output).toBe(0);
  expect(bundled.agents.length).toBeGreaterThan(0);
  expect(bundled.skills.length).toBeGreaterThan(0);

  const ran = installFrom(configured, 'configured');
  expect(ran.code, ran.output).toBe(0);
  expect(ran.agents).toEqual(bundled.agents);
  expect(ran.skills).toEqual(bundled.skills);
  expect(existsSync(join(configured, 'config-was-read'))).toBe(false);
}, 60_000);
