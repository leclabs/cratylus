/**
 * E1.S4 · absent capability imports loudly-empty.
 *
 * aider has no MCP/agents/skills [AI3][AI5]. Importing an aider fixture
 * (conf + conventions file per §2/aider) must produce a machine-parseable
 * per-resource-type absence status (`unsupported-by-source` or the
 * adapter's declared-none equivalent) — never silent omission. Today
 * runImport prints only nonzero resource counts, so absence is silence.
 */

import { expect } from 'vitest';
import { runImport } from '../../../src/cli/commands/import.js';
import { ALL_ADAPTERS, story } from '../helpers.js';
import { captured, put, scratch } from './util.js';

const fx = scratch();

story(
  'E1.S4',
  'import aider reports mcp_servers/agents/skills as unsupported-by-source, not omission [AI3][AI5]',
  async () => {
    const cwd = fx.tmp();
    put(cwd, '.aider.conf.yml', 'read: [CONVENTIONS.md]\n'); // [AI1]
    put(cwd, 'CONVENTIONS.md', '# Conventions\n\nBe terse.\n'); // [AI2]

    const { code, out } = await captured(() =>
      runImport({ client: 'aider', scope: 'project', cwd }, ALL_ADAPTERS),
    );
    expect(code).toBe(0);

    for (const type of ['mcp_servers', 'agents', 'skills'] as const) {
      expect(out).toMatch(
        new RegExp(
          `${type}[^\\n]*(unsupported-by-source|unsupported|declared[- ]none)`,
          'i',
        ),
      );
    }
  },
);
