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

  // Taking the ruleset, or its one rule, adopts the same practice by name alone.
  for (const choice of [
    'behaviour-driven-development',
    'behaviour-driven-development-adopted',
  ]) {
    success(h.command(['install', '--harness', 'omp', '--rules', choice]));
    expect(readdirSync(rules)).toEqual([
      'behaviour-driven-development-adopted.md',
    ]);
    const text = readFileSync(
      join(rules, 'behaviour-driven-development-adopted.md'),
      'utf8',
    );
    const front = /^---\n([\s\S]*?)\n---\n/.exec(text);
    expect(front, 'the adopted practice has rule front-matter').not.toBeNull();
    expect(parseYaml(front![1]!)).toEqual({
      description: 'The project practises behaviour-driven development.',
      alwaysApply: true,
    });
    expect(text.slice(front![0].length).trim()).toBe(
      'This project practises behaviour-driven development.\n\n' +
        "Why: Its name carries the practice whole, each role's participation included.",
    );
  }
});
