import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aiderAdapter } from '../../../src/adapters/aider/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';

const manifest = (): Manifest => ({
  agentForge: 1,
  scope: 'project',
  targets: ['aider'],
});

describe('aiderAdapter', () => {
  let cwd: string;
  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'agent-forge-aider-'));
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('writes AGENTS.md', async () => {
    const ir: IR = {
      manifest: manifest(),
      rules: [{ id: 'main', body: 'Be terse.' }],
    };
    await aiderAdapter.write(ir, 'project', cwd, {});
    expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(true);
  });

  it('round-trips rule bodies through the read: conf chain (aider-adapter-truth)', async () => {
    // Post-fix: write also wires .aider.conf.yml `read:` at the conventions
    // file, and read() follows that chain rather than a fixed bare path — so
    // the rule id read back is derived from the wired file's stem
    // ('AGENTS'), not the original synthetic id ('main'). Body content is the
    // round-trip invariant that still holds [AI1][AI2].
    const ir: IR = {
      manifest: manifest(),
      rules: [{ id: 'main', body: 'Be terse.' }],
    };
    await aiderAdapter.write(ir, 'project', cwd, {});
    const re = await aiderAdapter.read('project', cwd);
    expect(re.rules?.map((r) => r.body)).toEqual(ir.rules?.map((r) => r.body));
    expect(re.rules).toEqual([{ id: 'AGENTS', body: 'Be terse.' }]);
  });

  it('warns about every other resource type (Aider supports nothing else)', async () => {
    const ir: IR = {
      manifest: manifest(),
      skills: [{ name: 's', description: 'x', body: 'y' }],
      hooks: [{ id: 'h', events: ['turn.end'], command: 'x' }],
      mcp_servers: [{ name: 'gh', transport: 'stdio', command: 'x' }],
    };
    const report = await aiderAdapter.write(ir, 'project', cwd, {});
    expect(report.warnings.length).toBeGreaterThanOrEqual(3);
  });
});
