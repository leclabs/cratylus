import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { type Host, host, success } from '../capability-port/fixture.js';

let h: Host | undefined;
afterEach(() => {
  h?.dispose();
  h = undefined;
});

it('behaviour-driven-development/integration-branch: gitflow integrates into the branch the project names', () => {
  h = host();
  success(h.command(['install', '--harness', 'omp', '--rules', 'gitflow']));
  const rules = join(h.home, '.cratylus/omp/rules');
  expect(readdirSync(rules)).toEqual(['gitflow-adopted.md']);
  const text = readFileSync(join(rules, 'gitflow-adopted.md'), 'utf8');
  expect(text.replace(/^---\n[\s\S]*?\n---\n/, '')).toContain(
    "its integration branch `develop` unless the project's AGENTS.md names another; a missing one is escalated to the product owner.",
  );
});
