import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { type Host, host, success } from '../capability-port/fixture.js';
import { parseYaml } from '../yaml.js';

let h: Host | undefined;
afterEach(() => {
  h?.dispose();
  h = undefined;
});

it('context-engineering/practice: a practice is adopted by its name', () => {
  h = host();
  // Start with nothing installed; every command has an empty stdin pipe, no terminal.
  rmSync(h.home, { recursive: true, force: true });
  mkdirSync(h.home);
  const offered = h.command(['install', '--harness', 'omp']);
  success(offered);
  const hint = /rulesets: ([^)]+)\)/.exec(
    `${offered.stdout}\n${offered.stderr}`,
  );
  expect(hint, 'install offers its rulesets without a terminal').not.toBeNull();
  expect(hint![1]!.split(', ')[0]).toBe('behaviour-driven-development');
  const rules = join(h.home, '.cratylus/omp/rules');
  expect(existsSync(rules) ? readdirSync(rules) : []).toEqual([]);

  // Taking each ruleset, or its one rule, adopts its practice by name alone, gitflow precised
  // only by its integration branch.
  const practices = [
    {
      ruleset: 'behaviour-driven-development',
      rule: 'behaviour-driven-development-adopted',
      description: 'This project practises behaviour-driven development.',
      body: 'This project practises behaviour-driven development.',
    },
    {
      ruleset: 'gitflow',
      rule: 'gitflow-adopted',
      description:
        'This project follows gitflow, its integration branch `develop` unless AGENTS.md names another.',
      body: "This project follows gitflow, its integration branch `develop` unless the project's AGENTS.md names another; a missing one is escalated to the product owner.",
    },
    {
      ruleset: 'conventional-commits',
      rule: 'conventional-commits-adopted',
      description: 'Commit messages follow Conventional Commits 1.0.0.',
      body: 'Commit messages follow Conventional Commits 1.0.0.',
    },
  ];
  for (const { ruleset, rule, description, body } of practices) {
    for (const choice of [ruleset, rule]) {
      success(h.command(['install', '--harness', 'omp', '--rules', choice]));
      expect(readdirSync(rules)).toEqual([`${rule}.md`]);
      const text = readFileSync(join(rules, `${rule}.md`), 'utf8');
      const front = /^---\n([\s\S]*?)\n---\n/.exec(text);
      expect(
        front,
        'the adopted practice has rule front-matter',
      ).not.toBeNull();
      expect(parseYaml(front![1]!)).toEqual({ description, alwaysApply: true });
      expect(text.slice(front![0].length).trim()).toBe(body);
    }
  }
});
