import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
} from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { type Host, host, run } from '../capability-port/fixture.js';
import { parseYaml } from '../yaml.js';

let h: Host | undefined;
afterEach(() => {
  h?.dispose();
  h = undefined;
});

// A packed cratylus on PATH and a HOME of its own, with nothing installed yet.
function emptyHome(): Host {
  const fresh = host();
  rmSync(fresh.home, { recursive: true, force: true });
  mkdirSync(fresh.home);
  return fresh;
}

const entries = (dir: string) =>
  existsSync(dir) ? readdirSync(dir).sort() : [];

// The skills omp offers the user, by name, each to its SKILL.md: every
// `skills/<name>/SKILL.md` of an extension package its user plugin manifest
// links under `~/.omp/plugins/node_modules`.
function offeredSkills(home: string): Map<string, string> {
  const modules = join(home, '.omp/plugins/node_modules');
  const skills = new Map<string, string>();
  for (const name of entries(modules)) {
    const dir = join(realpathSync(join(modules, name)), 'skills');
    for (const skill of entries(dir)) {
      const file = join(dir, skill, 'SKILL.md');
      if (existsSync(file)) skills.set(skill, file);
    }
  }
  return skills;
}

// Binds design/model/agent-design/practice.md.
it('agent-design/practice: a practice is named, never explained', () => {
  h = emptyHome();
  // Packed, user scope, no terminal: `run` hands the command an empty stdin pipe.
  const r = h.command(['install', '--harness', 'omp']);
  expect(r.code, `${r.stdout}\n${r.stderr}`).toBe(0);

  expect
    .soft([...offeredSkills(h.home).keys()].sort())
    .toEqual([
      'conceptualize',
      'elicit',
      'exemplify',
      'formalize',
      'materialize',
      'probe',
      'signify',
    ]);

  const statement =
    "Each example lives in its concept's record in design/model/, written as given–when–then, and its acceptance test, in the project's own test framework, is titled `<context>/<concept>: <example name>`.";
  const why =
    'The domain model stays the one source of meaning, and the model check binds every example to its test.';

  // Read the packed canon, not the workspace: a second rule must be caught even
  // if install mistakenly places only the first rule of the practice's ruleset.
  const declarations = run(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      "import canon from '@cratylus/canon'; console.log(JSON.stringify(canon.practiceRulesets ?? []));",
    ],
    h.prefix,
    h.env,
  );
  expect(declarations.code, declarations.stderr).toBe(0);
  expect
    .soft(
      JSON.parse(declarations.stdout),
      'the practice ruleset holds exactly its one departure, verbatim',
    )
    .toEqual([
      expect.objectContaining({
        name: 'behaviour-driven-development',
        rules: [
          expect.objectContaining({
            name: 'behaviour-driven-development-examples',
            statement,
            why,
          }),
        ],
      }),
    ]);

  const rule = join(
    h.home,
    '.cratylus/omp/rules/behaviour-driven-development-examples.md',
  );
  expect(
    existsSync(rule),
    'the practice rule reaches the installed agents',
  ).toBe(true);
  const text = readFileSync(rule, 'utf8');
  const front = /^---\n([\s\S]*?)\n---\n/.exec(text);
  expect(front, 'the practice rule opens with front-matter').not.toBeNull();
  expect(parseYaml(front![1]!)).toEqual({
    description: expect.stringMatching(/\S/),
    alwaysApply: true,
  });
  expect(text.slice(front![0].length).trim()).toBe(
    `${statement}\n\nWhy: ${why}`,
  );
});
