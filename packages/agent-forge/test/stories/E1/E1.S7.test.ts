/**
 * E1.S7 · read-side fidelity for documented-but-unmodeled surfaces.
 *
 * Per fixture (one per §3 read-side gap): every rules-bearing file must
 * either appear in the imported IR or be listed by the report under
 * `unlifted-surfaces` with its path — no file may be both un-imported and
 * un-reported (set difference = ∅). Today each fixture has at least one
 * file that is silently invisible, so all five are tracked.
 */

import { join } from 'node:path';
import { expect } from 'vitest';
import { runImport } from '../../../src/cli/commands/import.js';
import { readIR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, story } from '../helpers.js';
import { captured, put, scratch } from './util.js';

const fx = scratch();

interface FidelitySpec {
  label: string;
  ref: string;
  client: string;
  build: (root: string) => void;
  /** cwd for the import (defaults to the fixture root). */
  cwdOf?: (root: string) => string;
  /** Every rules-bearing fixture file: path (report key) + body marker. */
  files: readonly { rel: string; marker: string }[];
}

const SPECS: readonly FidelitySpec[] = [
  {
    label: 'codex AGENTS.override.md + root→cwd chain',
    ref: '[CX3]',
    client: 'codex',
    build: (root) => {
      put(root, 'AGENTS.md', 'CODEX-ROOT-RULE\n');
      put(root, 'AGENTS.override.md', 'CODEX-OVERRIDE-RULE\n');
      put(root, 'app/AGENTS.md', 'CODEX-APP-RULE\n');
    },
    cwdOf: (root) => join(root, 'app'),
    files: [
      { rel: 'AGENTS.md', marker: 'CODEX-ROOT-RULE' },
      { rel: 'AGENTS.override.md', marker: 'CODEX-OVERRIDE-RULE' },
      { rel: 'app/AGENTS.md', marker: 'CODEX-APP-RULE' },
    ],
  },
  {
    label: 'claude .claude/rules/*.md with paths: frontmatter',
    ref: '[CC1]',
    client: 'claude',
    build: (root) => {
      put(
        root,
        '.claude/rules/frontend.md',
        '---\npaths: ["src/**/*.tsx"]\n---\nCLAUDE-PATH-RULE\n',
      );
    },
    files: [{ rel: '.claude/rules/frontend.md', marker: 'CLAUDE-PATH-RULE' }],
  },
  {
    label: 'opencode instructions globs + CLAUDE.md fallback',
    ref: '[OC3]',
    client: 'opencode',
    build: (root) => {
      put(
        root,
        'opencode.json',
        JSON.stringify({ instructions: ['docs/style.md'] }),
      );
      put(root, 'docs/style.md', 'OC-INSTRUCTIONS-RULE\n');
      put(root, 'CLAUDE.md', 'OC-CLAUDEMD-FALLBACK-RULE\n');
    },
    files: [
      { rel: 'docs/style.md', marker: 'OC-INSTRUCTIONS-RULE' },
      { rel: 'CLAUDE.md', marker: 'OC-CLAUDEMD-FALLBACK-RULE' },
    ],
  },
  {
    label: 'cline paths: rule frontmatter + AGENTS.md',
    ref: '[CL1]',
    client: 'cline',
    build: (root) => {
      put(
        root,
        '.clinerules/scoped.md',
        '---\npaths: ["src/**"]\n---\nCLINE-SCOPED-RULE\n',
      );
      put(root, 'AGENTS.md', 'CLINE-AGENTSMD-RULE\n');
    },
    files: [
      { rel: '.clinerules/scoped.md', marker: 'CLINE-SCOPED-RULE' },
      { rel: 'AGENTS.md', marker: 'CLINE-AGENTSMD-RULE' },
    ],
  },
  {
    label: 'crush context_paths multi-file set',
    ref: '[CR2]',
    client: 'crush',
    build: (root) => {
      put(root, 'AGENTS.md', 'CRUSH-AGENTSMD-RULE\n');
      put(root, 'CRUSH.md', 'CRUSH-CRUSHMD-RULE\n');
      put(root, '.cursorrules', 'CRUSH-CURSORRULES-RULE\n');
    },
    files: [
      { rel: 'AGENTS.md', marker: 'CRUSH-AGENTSMD-RULE' },
      { rel: 'CRUSH.md', marker: 'CRUSH-CRUSHMD-RULE' },
      { rel: '.cursorrules', marker: 'CRUSH-CURSORRULES-RULE' },
    ],
  },
];

for (const spec of SPECS) {
  story(
    'E1.S7',
    `${spec.label}: every fixture file imported or reported under unlifted-surfaces ${spec.ref}`,
    async () => {
      const root = fx.tmp();
      spec.build(root);
      const cwd = spec.cwdOf ? spec.cwdOf(root) : root;

      const { code, out } = await captured(() =>
        runImport({ client: spec.client, scope: 'project', cwd }, ALL_ADAPTERS),
      );
      expect(code).toBe(0);

      const ir = await readIR('project', cwd);
      const lifted = (ir.rules ?? []).map((r) => r.body).join('\n');
      const reported = (rel: string): boolean =>
        out.includes('unlifted-surfaces') && out.includes(rel);

      const invisible = spec.files
        .filter((f) => !lifted.includes(f.marker) && !reported(f.rel))
        .map((f) => f.rel);
      expect(
        invisible,
        'files neither imported into IR nor reported under unlifted-surfaces',
      ).toEqual([]);
    },
  );
}
