/**
 * E5.S8 · Pi — the live demonstration of plugin-delivered capabilities.
 * Ungated 2026-07 (pi research accepted): ground truth =
 * plans/interop-hardening/completed/pi-harness-research.RETURN.md ([PI#]).
 * Pi deliberately omits hooks/subagents/permissions as config surfaces and
 * designates TS extensions + pi packages as the delivery path [PI2
 * §Philosophy]; the adapter must deliver the agents floor and the hooks
 * nice-to-have as generated code. Graduated wave 5: src/adapters/pi ships —
 * every probe imports it dynamically and the contract assertions execute
 * directly.
 */

import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import type { IR, Manifest } from '../../../src/core/index.js';
import { importAdapter } from '../E10/probe.js';
import { makeTmpDir, story } from '../helpers.js';

const manifest = (): Manifest => ({
  agentForge: 1,
  scope: 'project',
  targets: ['pi'],
});

/** E5.S8 P: IR with 1 agent + hooks on the four canonical events. */
const DEMO_IR = (): IR => ({
  manifest: manifest(),
  agents: [
    {
      name: 'scout',
      description: 'Explores the repo',
      body: 'You explore and report.',
      model: 'gpt-5',
    },
  ],
  hooks: [
    {
      id: 'guard',
      events: ['tool.use.pre'],
      matcher: 'bash',
      command: './guard.sh',
    },
    { id: 'audit', events: ['tool.use.post'], command: './audit.sh' },
    { id: 'hello', events: ['session.start'], command: './hello.sh' },
    { id: 'scrub', events: ['prompt.submit'], command: './scrub.sh' },
  ],
});

describe('E5.S8 · pi plugin-delivery demonstration', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = makeTmpDir('af-e5s8-');
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  story(
    'E5.S8',
    'skills floor discharged natively: .agents/skills/ emission, name = dirname spec-strict despite pi tolerating the deviation [PI5]',
    async () => {
      const pi = await importAdapter('pi');
      const ir: IR = {
        manifest: manifest(),
        skills: [
          { name: 'review', description: 'Review code', body: '# steps' },
        ],
      };
      await pi.write(ir, 'project', cwd, {});
      // Native discovery path (cwd→ancestors) — no skill-plugin shim, no
      // bespoke .pi/skills emission for the floor (E5.S3 parsimony guard).
      expect(
        existsSync(join(cwd, '.agents', 'skills', 'review', 'SKILL.md')),
      ).toBe(true);
      const text = readFileSync(
        join(cwd, '.agents', 'skills', 'review', 'SKILL.md'),
        'utf8',
      );
      expect(text).toMatch(/name:\s*review/);
    },
  );

  story(
    'E5.S8',
    'agents via code: md defs at .pi/agents/*.md + a registerTool delegate extension per the official subagent example [PI9]',
    async () => {
      const pi = await importAdapter('pi');
      await pi.write(DEMO_IR(), 'project', cwd, {});
      // Agent definition: md + frontmatter (name/description/model, body =
      // system prompt) at the documented project home.
      const def = join(cwd, '.pi', 'agents', 'scout.md');
      expect(existsSync(def)).toBe(true);
      const text = readFileSync(def, 'utf8');
      expect(text).toContain('You explore and report.');
      // Delegate extension: generated TS registering the subagent tool.
      const extDir = join(cwd, '.pi', 'extensions');
      expect(existsSync(extDir)).toBe(true);
      const ext = readdirSync(extDir).filter((f) => f.endsWith('.ts'));
      expect(ext.length).toBeGreaterThan(0);
      const extText = ext
        .map((f) => readFileSync(join(extDir, f), 'utf8'))
        .join('\n');
      expect(extText).toContain('registerTool');
    },
  );

  story(
    'E5.S8',
    'hooks via pi.on(): tool_call veto {block, reason} · tool_result · session_start · input; unverified canonical events land in .skipped [PI3]',
    async () => {
      const pi = await importAdapter('pi');
      const report = await pi.write(DEMO_IR(), 'project', cwd, {});
      const extDir = join(cwd, '.pi', 'extensions');
      expect(existsSync(extDir)).toBe(true);
      const extText = readdirSync(extDir)
        .filter((f) => f.endsWith('.ts'))
        .map((f) => readFileSync(join(extDir, f), 'utf8'))
        .join('\n');
      // The E5.S8 event table, [PI3]-verified names only:
      expect(extText).toContain("'tool_call'"); // PreToolUse, veto shape
      expect(extText).toContain('block: true');
      expect(extText).toContain("'tool_result'"); // PostToolUse
      expect(extText).toContain("'session_start'"); // SessionStart
      expect(extText).toContain("'input'"); // UserPromptSubmit
      // A canonical event with no [PI3] equivalent must be skipped by name —
      // compile one and assert E4.S4 discipline.
      const ir = DEMO_IR();
      ir.hooks?.push({
        id: 'ghost',
        events: ['file.change.external'],
        command: './x.sh',
      });
      const report2 = await pi.write(
        ir,
        'project',
        makeTmpDir('af-e5s8b-'),
        {},
      );
      expect(
        [...report.skipped, ...report2.skipped].some((s) =>
          s.reason.includes('file.change.external'),
        ),
      ).toBe(true);
    },
  );

  story(
    'E5.S8',
    'one pi package: package.json {keywords:["pi-package"], pi:{extensions}} manifest; trust-gate warning on every project-scope write [PI6][PI2]',
    async () => {
      const pi = await importAdapter('pi');
      const report = await pi.write(DEMO_IR(), 'project', cwd, {});
      // Packaging: the code artifacts ship as ONE pi package.
      const pkgFile = join(cwd, '.pi', 'package.json');
      expect(existsSync(pkgFile)).toBe(true);
      const pkg = JSON.parse(readFileSync(pkgFile, 'utf8')) as {
        keywords?: string[];
        pi?: { extensions?: string[] };
      };
      expect(pkg.keywords).toContain('pi-package');
      expect(pkg.pi?.extensions?.length).toBeGreaterThan(0);
      // Trust gating loud: project-scope emissions are INERT until trusted —
      // absence of the warning on any project-scope pi write = FAIL.
      expect(
        report.warnings.some(
          (w) => w.includes('trust') && w.includes('trust.json'),
        ),
      ).toBe(true);
    },
  );
});
