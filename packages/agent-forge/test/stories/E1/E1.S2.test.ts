/**
 * E1.S2 · every shipped target imports from a documented-truth fixture.
 *
 * One test per adapter. Each fixture is built STRICTLY from that harness's
 * §2 config-contract sheet (harness-landscape-research.RETURN.md) — paths,
 * formats, keys exactly as documented, never what the current adapter
 * expects — and exercises every resource class the sheet marks present.
 * A present-in-fixture class with zero imported resources fails, naming
 * the class. Adapters whose reads diverge from documented reality (§3) are
 * story.tracked until the read side is fixed.
 */

import { expect } from 'vitest';
import { runImport } from '../../../src/cli/commands/import.js';
import { type IR, readIR, validateIR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, story } from '../helpers.js';
import { captured, put, scratch, skillMd } from './util.js';

const fx = scratch();

const count = {
  rules: (ir: IR) => ir.rules?.length ?? 0,
  skills: (ir: IR) => ir.skills?.length ?? 0,
  commands: (ir: IR) => ir.commands?.length ?? 0,
  agents: (ir: IR) => ir.agents?.length ?? 0,
  hooks: (ir: IR) => ir.hooks?.length ?? 0,
  mcp_servers: (ir: IR) => ir.mcp_servers?.length ?? 0,
  permissions: (ir: IR) => (ir.permissions ? 1 : 0),
} as const;

type ClassName = keyof typeof count;

interface AdapterSpec {
  client: string;
  /** §3 divergence summary — why documented-truth import fails today. */
  gap?: string;
  build: (cwd: string) => void;
  /** Resource classes present in the fixture per the §2 sheet. */
  classes: readonly ClassName[];
  extra?: (ir: IR) => void;
}

const STDIO = {
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-github'],
};

const SPECS: readonly AdapterSpec[] = [
  {
    client: 'claude',
    build: (cwd) => {
      put(cwd, 'CLAUDE.md', '# Rules\n\nCLAUDE-RULE-MARKER\n'); // [CC1]
      put(
        cwd,
        '.claude/settings.json', // permissions+env+hooks only [CC8]
        JSON.stringify({
          permissions: { allow: ['Read(*)'] },
          env: { DEBUG: 'true' },
          hooks: {
            PreToolUse: [
              {
                matcher: 'Edit|Write',
                hooks: [
                  { type: 'command', command: './guard.sh', timeout: 30 },
                ],
              },
            ],
          },
        }),
      );
      put(
        cwd,
        '.mcp.json', // the documented project MCP surface [CC7]
        JSON.stringify({
          mcpServers: {
            github: STDIO,
            linear: { type: 'http', url: 'https://mcp.linear.app/mcp' },
          },
        }),
      );
      put(
        cwd,
        '.claude/agents/one.md',
        '---\ndescription: Plans tasks\nmodel: inherit\n---\nYou are one.', // [CC2]
      );
      put(cwd, '.claude/skills/s1/SKILL.md', skillMd('s1')); // [CC3]
      put(
        cwd,
        '.claude/commands/plan.md',
        '---\ndescription: Trigger planning\n---\nMake a plan.', // [CC3] legacy commands
      );
    },
    classes: [
      'rules',
      'hooks',
      'permissions',
      'mcp_servers',
      'agents',
      'skills',
      'commands',
    ],
    extra: (ir) => {
      expect(ir.mcp_servers?.length).toBe(2);
      expect(new Set(ir.mcp_servers?.map((s) => s.transport))).toEqual(
        new Set(['stdio', 'http']),
      );
      expect(ir.env).toEqual({ DEBUG: 'true' });
    },
  },
  {
    client: 'codex',
    // .agents/skills lift fixed alongside the codex-adapter-truth write-side
    // fix [CX2] (paths.ts skillsDir is shared by read+write) — no longer a gap.
    build: (cwd) => {
      put(cwd, 'AGENTS.md', '# Rules\n\nCODEX-RULE-MARKER\n'); // [CX3]
      put(
        cwd,
        '.codex/config.toml', // [CX4][CX7]
        [
          '[mcp_servers.github]',
          'command = "npx"',
          'args = ["-y", "@modelcontextprotocol/server-github"]',
          '',
          '[[hooks.PreToolUse]]',
          'matcher = "^Bash$"',
          '',
          '[[hooks.PreToolUse.hooks]]',
          'type = "command"',
          'command = "python3 check.py"',
          'timeout = 30',
          '',
        ].join('\n'),
      );
      put(
        cwd,
        '.codex/agents/rev.toml', // documented fields only [CX1]
        [
          'name = "rev"',
          'description = "Reviews diffs"',
          'developer_instructions = "You review diffs."',
          'model = "gpt-5.3-codex"',
          '',
        ].join('\n'),
      );
      put(cwd, '.agents/skills/s1/SKILL.md', skillMd('s1')); // [CX2]
    },
    classes: ['rules', 'hooks', 'mcp_servers', 'agents', 'skills'],
  },
  {
    client: 'cursor',
    // agents + commands lift as of the cursor-adapter-truth fix
    // (E1.S8/E8.S5, [CU3][CU6]) — no longer a gap.
    build: (cwd) => {
      put(cwd, 'AGENTS.md', '# Rules\n\nCURSOR-RULE-MARKER\n'); // [CU1]
      put(
        cwd,
        '.cursor/rules/style.mdc', // the primary rules surface [CU1]
        '---\ndescription: Style rules\nglobs: "src/**"\nalwaysApply: false\n---\nMDC-RULE-MARKER\n',
      );
      put(
        cwd,
        '.cursor/agents/rev.md', // [CU3]
        '---\nname: rev\ndescription: Reviews diffs\nmodel: inherit\n---\nYou are rev.',
      );
      put(cwd, '.cursor/skills/s1/SKILL.md', skillMd('s1')); // [CU4]
      put(cwd, '.cursor/commands/go.md', 'Run the go checklist.\n'); // [CU6]
      put(
        cwd,
        '.cursor/hooks.json', // [CU2]
        JSON.stringify({
          version: 1,
          hooks: {
            preToolUse: [
              { command: './guard.sh', timeout: 30, matcher: '^Bash$' },
            ],
          },
        }),
      );
      put(
        cwd,
        '.cursor/mcp.json', // [CU5]
        JSON.stringify({ mcpServers: { github: { type: 'stdio', ...STDIO } } }),
      );
    },
    classes: ['rules', 'skills', 'hooks', 'mcp_servers', 'agents', 'commands'],
  },
  {
    client: 'copilot',
    build: (cwd) => {
      put(cwd, 'AGENTS.md', '# Rules\n\nCOPILOT-RULE-MARKER\n'); // [CP3]
      put(
        cwd,
        '.github/copilot-instructions.md',
        'COPILOT-INSTRUCTIONS-MARKER\n', // [CP3]
      );
      put(
        cwd,
        '.github/agents/rev.agent.md', // [CP1]
        '---\nname: rev\ndescription: Reviews diffs\n---\nYou are rev.',
      );
      put(cwd, '.github/skills/s1/SKILL.md', skillMd('s1')); // [CP2]
      put(
        cwd,
        '.github/hooks/guard.json', // Copilot's own hook dialect [CP4]
        JSON.stringify({
          version: 1,
          hooks: {
            preToolUse: [
              { type: 'command', bash: './guard.sh', timeoutSec: 30 },
            ],
          },
        }),
      );
      put(
        cwd,
        '.github/prompts/go.prompt.md', // [CP5]
        '---\ndescription: Go\n---\nDo the go thing.',
      );
      put(
        cwd,
        '.vscode/mcp.json', // `servers` key [CP6]
        JSON.stringify({ servers: { github: STDIO } }),
      );
    },
    classes: ['rules', 'mcp_servers', 'skills', 'hooks', 'agents', 'commands'],
  },
  {
    client: 'gemini',
    build: (cwd) => {
      put(cwd, 'GEMINI.md', '# Rules\n\nGEMINI-RULE-MARKER\n'); // default context file [GM1]
      put(
        cwd,
        '.gemini/settings.json', // hooks + mcpServers [GM1][GM4]
        JSON.stringify({
          hooks: {
            BeforeTool: [
              {
                matcher: '.*',
                hooks: [
                  { type: 'command', command: './guard.sh', timeout: 60000 },
                ],
              },
            ],
          },
          mcpServers: { github: STDIO },
        }),
      );
      put(
        cwd,
        '.gemini/agents/helper.md', // [GM2]
        '---\nname: helper\ndescription: Helps out\n---\nYou help.',
      );
      put(cwd, '.gemini/skills/s1/SKILL.md', skillMd('s1')); // [GM3]
      put(
        cwd,
        '.gemini/commands/go.toml', // [GM5]
        'description = "Go"\nprompt = "Do the go thing."\n',
      );
    },
    classes: ['rules', 'hooks', 'mcp_servers', 'agents', 'skills', 'commands'],
  },
  {
    client: 'opencode',
    // mcp/permission (opencode.json) + agents/commands lift as of the
    // opencode-adapter-truth fix [OC2][OC4][OC7][OC8] — no longer a gap.
    build: (cwd) => {
      put(cwd, 'AGENTS.md', '# Rules\n\nOPENCODE-RULE-MARKER\n'); // [OC3]
      put(
        cwd,
        'opencode.json', // mcp typed local (command ARRAY) + permission DSL [OC7][OC8]
        JSON.stringify({
          $schema: 'https://opencode.ai/config.json',
          mcp: {
            github: {
              type: 'local',
              command: ['npx', '-y', '@modelcontextprotocol/server-github'],
              enabled: true,
            },
          },
          permission: { bash: 'ask' },
        }),
      );
      put(
        cwd,
        '.opencode/agents/rev.md', // [OC2]
        '---\ndescription: Reviews diffs\nmode: subagent\n---\nYou are rev.',
      );
      put(
        cwd,
        '.opencode/commands/go.md', // [OC4]
        '---\ndescription: Go\n---\nDo the go thing. $ARGUMENTS',
      );
      put(cwd, '.opencode/skills/s1/SKILL.md', skillMd('s1')); // [OC6]
    },
    classes: [
      'rules',
      'skills',
      'mcp_servers',
      'agents',
      'commands',
      'permissions',
    ],
  },
  {
    client: 'cline',
    // cline-adapter-truth: skills [CL5] and workflows [CL4] now lift. A
    // FOREIGN (non-agent-forge) hook script — no `# agent-forge:<id>` marker
    // — genuinely cannot recover a structured Hook; parsing arbitrary shell
    // content isn't a documented contract, so this fixture's hand-authored
    // `.clinerules/hooks/PreToolUse` stays unlifted [CL2].
    gap: 'foreign (non-agent-forge) hook scripts have no structured fields to recover [CL2]',
    build: (cwd) => {
      put(cwd, '.clinerules/style.md', 'CLINE-RULE-MARKER\n'); // [CL1]
      put(cwd, '.clinerules/workflows/deploy.md', 'Deploy steps.\n'); // [CL4]
      put(
        cwd,
        '.clinerules/hooks/PreToolUse', // executable named as the event [CL2]
        '#!/bin/sh\nexit 0\n',
        0o755,
      );
      put(cwd, '.cline/skills/s1/SKILL.md', skillMd('s1')); // [CL5]
    },
    classes: ['rules', 'skills', 'commands', 'hooks'],
  },
  {
    client: 'crush',
    gap: 'crush.json mcp/hooks/permissions unread [CR1][CR3]',
    build: (cwd) => {
      put(cwd, 'AGENTS.md', '# Rules\n\nCRUSH-AGENTSMD-MARKER\n'); // context_paths [CR2]
      put(cwd, 'CRUSH.md', '# Crush rules\n\nCRUSH-CRUSHMD-MARKER\n'); // [CR2]
      put(
        cwd,
        'crush.json', // mcp + hooks + permissions all live here [CR1][CR3]
        JSON.stringify({
          $schema: 'https://charm.land/crush.json',
          mcp: { github: { type: 'stdio', ...STDIO } },
          hooks: {
            PreToolUse: [
              {
                name: 'guard',
                matcher: '^bash$',
                command: './guard.sh',
                timeout: 30,
              },
            ],
          },
          permissions: { allowed_tools: ['view'] },
        }),
      );
      put(cwd, '.crush/skills/s1/SKILL.md', skillMd('s1')); // [CR1]
    },
    classes: ['rules', 'skills', 'mcp_servers', 'hooks', 'permissions'],
  },
  {
    client: 'aider',
    gap: 'conventions wired via read: are not lifted; no auto-discovery exists [AI2]',
    build: (cwd) => {
      put(cwd, '.aider.conf.yml', 'read: [CONVENTIONS.md]\n'); // [AI1]
      put(cwd, 'CONVENTIONS.md', '# Conventions\n\nAIDER-CONVENTIONS-MARKER\n'); // [AI2]
    },
    classes: ['rules'],
  },
  {
    client: 'continue',
    build: (cwd) => {
      put(
        cwd,
        '.continue/rules/style.md', // [CT2]
        '---\nalwaysApply: true\n---\nCONTINUE-RULE-MARKER\n',
      );
      put(
        cwd,
        '.continue/prompts/go.md', // [CT3]
        '---\ninvokable: true\n---\nDo the go thing.\n',
      );
      put(
        cwd,
        '.continue/mcpServers/mcp.json', // foreign-format auto-detect home [CT4]
        JSON.stringify({ mcpServers: { github: STDIO } }),
      );
    },
    classes: ['rules', 'commands', 'mcp_servers'],
  },
];

async function importAndCheck(spec: AdapterSpec): Promise<void> {
  const cwd = fx.tmp();
  spec.build(cwd);

  const { code } = await captured(() =>
    runImport({ client: spec.client, scope: 'project', cwd }, ALL_ADAPTERS),
  );
  expect(code).toBe(0);

  // readIR validates internally; assert the schema gate explicitly too.
  const ir = await readIR('project', cwd);
  expect(validateIR(ir)).toBe(true);
  spec.extra?.(ir);

  const missing = spec.classes
    .filter((c) => count[c](ir) === 0)
    .map((c) => String(c));
  expect(
    missing,
    `${spec.client}: documented-in-fixture resource classes with 0 imported resources`,
  ).toEqual([]);
}

for (const spec of SPECS.filter((s) => !s.gap)) {
  story(
    'E1.S2',
    `import ${spec.client}: every documented resource class lifts from a §2-truth fixture`,
    () => importAndCheck(spec),
  );
}

for (const spec of SPECS.filter((s) => s.gap)) {
  story.tracked(
    'E1.S2',
    `import ${spec.client}: every documented resource class lifts from a §2-truth fixture (gap: ${spec.gap})`,
    () => importAndCheck(spec),
  );
}
