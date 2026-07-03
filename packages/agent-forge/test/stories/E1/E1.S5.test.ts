/**
 * E1.S5 · import --from foreign root — lift a harness config living in
 * another checkout. Repo A is empty; repo B carries `.codex/` + AGENTS.md
 * per §2/Codex. The import must write IR under A's `.agent-forge/` and
 * leave B byte-unchanged (pre/post hash of B's whole tree).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from 'vitest';
import { runImport } from '../../../src/cli/commands/import.js';
import { readIR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, story } from '../helpers.js';
import { captured, hashTree, put, scratch } from './util.js';

const fx = scratch();

story(
  'E1.S5',
  'import codex --from <B> writes IR under A/.agent-forge and leaves B byte-unchanged',
  async () => {
    const a = fx.tmp();
    const b = fx.tmp();
    put(b, 'AGENTS.md', '# B rules\n\nCODEX-B-RULE-MARKER\n'); // [CX3]
    put(
      b,
      '.codex/config.toml', // [CX7]
      [
        '[mcp_servers.github]',
        'command = "npx"',
        'args = ["-y", "@modelcontextprotocol/server-github"]',
        '',
      ].join('\n'),
    );
    const before = hashTree(b);

    const { code } = await captured(() =>
      runImport(
        { client: 'codex', scope: 'project', cwd: a, from: b },
        ALL_ADAPTERS,
      ),
    );
    expect(code).toBe(0);

    // IR landed in A
    expect(existsSync(join(a, '.agent-forge', 'rules', 'main.md'))).toBe(true);
    const ir = await readIR('project', a);
    expect(ir.rules?.[0]?.body).toContain('CODEX-B-RULE-MARKER');
    expect(ir.mcp_servers?.map((s) => s.name)).toEqual(['github']);

    // B untouched — byte-level
    expect(existsSync(join(b, '.agent-forge'))).toBe(false);
    expect(hashTree(b)).toBe(before);
  },
);
