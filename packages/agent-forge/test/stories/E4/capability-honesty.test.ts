/**
 * E4.S3 — capability declarations equal documented reality.
 *
 * GROUND_TRUTH transcribes RETURN §1 (capability matrix) + §2 (per-harness
 * sheets): per adapter × resource type, whether the harness has a documented
 * config surface — 'present' — or none — 'absent' — with the citation ref.
 *
 * The story's honesty property is two-sided (amended 2026-07 from empirical
 * test evidence):
 *   under-claim leg — (1) declared 'none' ⇒ ground-truth absent;
 *                     (2) ground-truth present ⇒ declared 'full' | 'partial';
 *   over-claim leg  — declared 'full' | 'partial' ⇒ ground-truth present
 *                     (a declaration must be BACKED by a documented surface;
 *                     the empirical case this leg exists for: opencode
 *                     env: full against no surface [OC1], §3/opencode d4).
 *
 * STALE_CELLS (under-claims) and OVER_CLAIM_CELLS are the sets violating the
 * property today; each is asserted fixed in its tracked story. The green
 * stories assert the property on every other cell, so the suite bites both
 * ways: fixing a cell breaks its tracked test (graduation forced) and
 * regressing an honest cell breaks a green test.
 *
 * Judgment calls (annotated, presence = *configurable surface* an adapter
 * could target):
 * - aider hooks: §1 marks ◐ for lint/test shell-outs [AI4] — not an
 *   event-driven hook surface; transcribed absent.
 * - cline agents: ◐ native subagents are a tool, not file-config [CL7];
 *   transcribed absent.
 * - continue agents: the assistant IS config.yaml; no subagent surface
 *   [CT1][CT6]; transcribed absent.
 */

import { describe, expect } from 'vitest';

import type { ResourceType, Support } from '../../../src/core/index.js';
import { ALL_ADAPTERS, adapterById, story } from '../helpers.js';

type Truth = { present: boolean; ref: string };
type Row = Record<ResourceType, Truth>;

const t = (ref: string): Truth => ({ present: true, ref });
const f = (ref: string): Truth => ({ present: false, ref });

const GROUND_TRUTH: Record<string, Row> = {
  amp: {
    rules: t('[AM1]'),
    skills: t('[AM4]'),
    commands: t('[AM2] amp.registerCommand() plugin API'),
    agents: t('[AM1][AM9] amp.createAgent() plugin API'),
    hooks: t('[AM2][AM7] amp.on() event registration'),
    mcp: t('[AM1] amp.mcpServers'),
    permissions: f(
      '[AM8] per-tool-call plugin decisions, no permission config file',
    ),
    env: f('[AM1] no documented global env surface'),
  },
  aider: {
    rules: t('[AI2] conventions via read:'),
    skills: f('[AI1]'),
    commands: f('[AI3] built-ins only'),
    agents: f('[AI3]'),
    hooks: f('[AI4] lint/test shell-outs are not lifecycle hooks'),
    mcp: f('[AI5] FR open'),
    permissions: f('[AI3]'),
    env: f('[AI1] AIDER_* is config input, not an env surface'),
  },
  claude: {
    rules: t('[CC1]'),
    skills: t('[CC3]'),
    commands: t('[CC3][CC5] skills double as /name + legacy .claude/commands'),
    agents: t('[CC2]'),
    hooks: t('[CC6]'),
    mcp: t('[CC7]'),
    permissions: t('[CC8] permissions.{allow,deny,ask}'),
    env: t('[CC8] env settings key'),
  },
  cline: {
    rules: t('[CL1]'),
    skills: t('[CL5] .cline/skills + .claude/skills'),
    commands: t('[CL4] workflows .clinerules/workflows/*.md'),
    agents: f('[CL7] tool, not file-config'),
    hooks: t('[CL2]'),
    mcp: t('[CL6]'),
    permissions: f(
      '[CL2] hook decisions/UI toggles, no permission config file',
    ),
    env: f('[CL1] no env surface documented'),
  },
  codex: {
    rules: t('[CX3]'),
    skills: t('[CX2]'),
    commands: t('[CX5] prompts (deprecated → skills)'),
    agents: t('[CX1]'),
    hooks: t('[CX4]'),
    mcp: t('[CX7]'),
    permissions: t('[CX6] approval_policy/sandbox_mode'),
    env: t('[CX6] shell_environment_policy'),
  },
  continue: {
    rules: t('[CT2]'),
    skills: f('[CT3] absence'),
    commands: t('[CT3] prompts invokable: true → /name'),
    agents: f('[CT1][CT6] assistant = whole config.yaml; no subagents'),
    hooks: f('[CT1] confirmed absent'),
    mcp: t('[CT4]'),
    permissions: t('[CT6] cn CLI --allow/--ask/--exclude → permissions.yaml'),
    env: f('[CT1] no env surface documented'),
  },
  copilot: {
    rules: t('[CP3]'),
    skills: t('[CP2]'),
    commands: t('[CP5] .github/prompts/*.prompt.md → /name'),
    agents: t('[CP1] .github/agents/*.agent.md is GA'),
    hooks: t('[CP4]'),
    mcp: t('[CP6]'),
    permissions: f('[CP4] hook allow/deny decisions, no permissions config'),
    env: t('[CP13] copilot-setup-steps.yml env'),
  },
  crush: {
    rules: t('[CR2]'),
    skills: t('[CR1]'),
    commands: f('[CR1] user-invocable skills; no command files'),
    agents: f('[CR4] open FR #1807'),
    hooks: t('[CR3] hooks.PreToolUse in crush.json'),
    mcp: t('[CR1]'),
    permissions: t('[CR1] permissions.allowed_tools'),
    env: f('[CR1] $VAR expansion only; no env surface'),
  },
  cursor: {
    rules: t('[CU1]'),
    skills: t('[CU4]'),
    commands: t('[CU6] .cursor/commands/*.md'),
    agents: t('[CU3] .cursor/agents/*.md (2.4)'),
    hooks: t('[CU2]'),
    mcp: t('[CU5]'),
    permissions: t('[CU9] .cursor/cli.json permissions'),
    env: f('[CU5] per-server MCP env only; no global env surface'),
  },
  devin: {
    rules: t('[WS1][WS6]'),
    skills: t('[WS3]'),
    commands: t('[WS4] workflows .windsurf/workflows/*.md'),
    agents: f(
      '[WS7] Devin Local subagents announcement-level; file config unverified',
    ),
    hooks: t('[WS2]'),
    mcp: t('[WS5]'),
    permissions: f('[WS5] no native permission surface; MCP 100-tool cap only'),
    env: f('[WS5] ${env:VAR} substitution inside mcp_config only'),
  },
  gemini: {
    rules: t('[GM1]'),
    skills: t('[GM3]'),
    commands: t('[GM5] .gemini/commands/*.toml'),
    agents: t('[GM2]'),
    hooks: t('[GM4]'),
    mcp: t('[GM1]'),
    permissions: t('[GM1] tools.core/excludeTools controls'),
    env: t('[GM1] .env loading'),
  },
  kilo: {
    rules: t('[KL2][KL4]'),
    skills: t('[KL3]'),
    commands: t(
      '[KL7] .kilo/commands/*.md (subtask: frontmatter, no IR analog)',
    ),
    agents: t('[KL1] .kilo/agents/*.md (mode: required)'),
    hooks: t('[KL6] plugin lifecycle hooks'),
    mcp: t('[KL5] kilo.jsonc mcp key typed local/remote, command as ARRAY'),
    permissions: f(
      '[KL1] permission is a per-agent frontmatter field (ordered glob rules), no project-wide config surface',
    ),
    env: f('[KL1] no documented env config surface'),
  },
  opencode: {
    rules: t('[OC3]'),
    skills: t('[OC6]'),
    commands: t('[OC4] .opencode/commands/*.md'),
    agents: t('[OC2] .opencode/agents/*.md + agent config key'),
    hooks: t('[OC5] plugin events'),
    mcp: t('[OC7]'),
    permissions: t('[OC8] permission DSL'),
    env: f('[OC1] {env:VAR} substitution only; no env surface'),
  },
  pi: {
    rules: t('[PI2] AGENTS.md|CLAUDE.md native walk-up concat'),
    skills: t('[PI5] .agents/skills/ native discovery'),
    commands: t('[PI7] prompt templates .pi/prompts/*.md'),
    agents: t('[PI9] md defs + registerTool delegate — code delivery'),
    hooks: t('[PI3] pi.on() extension events — code delivery'),
    mcp: f('[PI2] omitted by design; extension route only'),
    permissions: f('[PI2] no permission system — containerize or extend'),
    env: f('[PI4] no env surface in settings'),
  },
  zed: {
    rules: t('[ZD1]'),
    skills: t('[ZD2]'),
    commands: f('[ZD8] extension slash commands removed'),
    agents: f('[ZD4][ZD6] subagent tool + ACP, not file-config'),
    hooks: f('[ZD5] no hook system'),
    mcp: t('[ZD3]'),
    permissions: f('[ZD5] tool_permissions is nearest; no modeled surface'),
    env: f('[ZD3] per-context-server env only; no global env surface'),
  },
};

/** Cells violating the honesty property today (stale `none`s, §3). */
const STALE_CELLS: readonly (readonly [string, ResourceType, string])[] = [
  ['cline', 'skills', '[CL5]'],
  ['cline', 'commands', '[CL4]'],
  ['opencode', 'agents', '[OC2]'],
  ['opencode', 'commands', '[OC4]'],
  ['cursor', 'commands', '[CU6]'],
  ['copilot', 'commands', '[CP5]'],
  ['continue', 'commands', '[CT3]'],
  ['continue', 'permissions', '[CT6]'],
  ['gemini', 'commands', '[GM5]'],
  ['crush', 'hooks', '[CR3]'],
  ['crush', 'permissions', '[CR1]'],
] as const;

/** Cells declared full|partial today with NO documented surface (over-claims). */
const OVER_CLAIM_CELLS: readonly (readonly [string, ResourceType, string])[] = [
  ['cline', 'permissions', '[CL2] no permission config file'],
  ['cline', 'env', '[CL1] no env surface documented'],
  ['crush', 'env', '[CR1] $VAR expansion only'],
  ['opencode', 'env', '[OC1] {env:VAR} substitution only — §3/opencode d4'],
] as const;

const RESOURCE_TYPES = Object.keys(GROUND_TRUTH.claude) as ResourceType[];

function violations(
  cells: Iterable<readonly [string, ResourceType]>,
): string[] {
  const out: string[] = [];
  for (const [adapterId, type] of cells) {
    const adapter = adapterById.get(adapterId);
    if (!adapter) throw new Error(`unknown adapter '${adapterId}'`);
    const declared: Support = adapter.capabilities.resources[type];
    const truth = GROUND_TRUTH[adapterId]?.[type];
    if (!truth) throw new Error(`no ground truth for ${adapterId}/${type}`);
    // Under-claim leg: the two implications (declared none ⇒ absent; present
    // ⇒ declared full|partial) are equivalent over Support — both fail
    // exactly when a documented-present surface is declared 'none'.
    if (declared === 'none' && truth.present) {
      out.push(
        `${adapterId}/${type}: declared none but documented present ${truth.ref}`,
      );
    }
  }
  return out;
}

/** Over-claim leg: declared full|partial must be backed by a documented surface. */
function overClaims(
  cells: Iterable<readonly [string, ResourceType]>,
): string[] {
  const out: string[] = [];
  for (const [adapterId, type] of cells) {
    const adapter = adapterById.get(adapterId);
    if (!adapter) throw new Error(`unknown adapter '${adapterId}'`);
    const declared: Support = adapter.capabilities.resources[type];
    const truth = GROUND_TRUTH[adapterId]?.[type];
    if (!truth) throw new Error(`no ground truth for ${adapterId}/${type}`);
    if (declared !== 'none' && !truth.present) {
      out.push(
        `${adapterId}/${type}: declared ${declared} but no documented surface ${truth.ref}`,
      );
    }
  }
  return out;
}

describe('E4.S3 · capability declarations vs documented reality', () => {
  story('E4.S3', 'ground truth covers every adapter × resource cell', () => {
    expect(Object.keys(GROUND_TRUTH).sort()).toEqual(
      ALL_ADAPTERS.map((a) => a.id).sort(),
    );
    for (const row of Object.values(GROUND_TRUTH)) {
      expect(Object.keys(row).sort()).toEqual([...RESOURCE_TYPES].sort());
    }
  });

  story(
    'E4.S3',
    'honest cells: declarations match documented reality (bites on regression)',
    () => {
      const stale = new Set(STALE_CELLS.map(([a, r]) => `${a}/${r}`));
      const cells: (readonly [string, ResourceType])[] = [];
      for (const adapterId of Object.keys(GROUND_TRUTH)) {
        for (const type of RESOURCE_TYPES) {
          if (!stale.has(`${adapterId}/${type}`)) cells.push([adapterId, type]);
        }
      }
      expect(violations(cells)).toEqual([]);
    },
  );

  // opencode agents+commands graduated with opencode-adapter-truth; cline
  // skills+workflows graduated with cline-adapter-truth — both dropped from
  // the enumeration below; the remaining cells still violate.
  story.tracked(
    'E4.S3',
    'stale cells: cursor/copilot/continue/gemini commands, continue permissions, crush hooks+permissions declared honestly',
    () => {
      expect(violations(STALE_CELLS.map(([a, r]) => [a, r] as const))).toEqual(
        [],
      );
    },
  );

  story(
    'E4.S3',
    'over-claim leg holds on every non-listed cell: full|partial always backed by a documented surface (bites on a new unbacked claim)',
    () => {
      const listed = new Set(OVER_CLAIM_CELLS.map(([a, r]) => `${a}/${r}`));
      const cells: (readonly [string, ResourceType])[] = [];
      for (const adapterId of Object.keys(GROUND_TRUTH)) {
        for (const type of RESOURCE_TYPES) {
          if (!listed.has(`${adapterId}/${type}`))
            cells.push([adapterId, type]);
        }
      }
      expect(overClaims(cells)).toEqual([]);
    },
  );

  story(
    'E4.S3',
    'over-claim cells retired: cline permissions+env, crush env, opencode env no longer claim undocumented surfaces [OC1][CL1][CL2][CR1]',
    () => {
      expect(
        overClaims(OVER_CLAIM_CELLS.map(([a, r]) => [a, r] as const)),
      ).toEqual([]);
    },
  );
});
