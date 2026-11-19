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
  const dir = join(h.home, '.cratylus/omp/rules');
  const rules = Object.fromEntries(
    readdirSync(dir).map((file) => [
      file.replace(/\.md$/, ''),
      readFileSync(join(dir, file), 'utf8').replace(
        /^---\n[\s\S]*?\n---\n/,
        '',
      ),
    ]),
  );
  expect(Object.keys(rules).sort()).toEqual([
    'gitflow-feature-branches',
    'gitflow-hotfix-branches',
    'gitflow-main-and-integration-branch',
    'gitflow-release-branches',
  ]);

  // One rule names the integration branch: the one AGENTS.md names, develop where it names none,
  // and the product owner's call where neither exists.
  const named = rules['gitflow-main-and-integration-branch']!;
  expect(named).toContain(
    "The integration branch is the branch the project's AGENTS.md names as its integration branch, and `develop` where AGENTS.md names none.",
  );
  expect(named).toContain(
    'Where AGENTS.md names none and `develop` does not exist, the product owner names the integration branch: escalate to the product owner before branching or merging.',
  );

  // Every other rule integrates into the integration branch so named, never into develop by name.
  expect(rules['gitflow-feature-branches']).toContain(
    'branched from the integration branch',
  );
  expect(rules['gitflow-feature-branches']).toContain(
    'merge it back into the integration branch with `git merge --no-ff`',
  );
  for (const [name, text] of Object.entries(rules)) {
    if (name === 'gitflow-main-and-integration-branch') continue;
    expect(text, name).not.toMatch(/\bdevelop\b/);
  }
});
