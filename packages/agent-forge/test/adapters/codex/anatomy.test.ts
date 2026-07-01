import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import TOML from '@iarna/toml';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aiderAdapter } from '../../../src/adapters/aider/index.js';
import { claudeHarnessReset } from '../../../src/adapters/claude/index.js';
import {
  type ResolvedAgent,
  type ResolvedSkill,
  agentToCodexToml,
  agentToCodexTomlObject,
  agentsMdSurface,
  codexHarnessReset,
  projectCodexAgentDelta,
  skillToCodexMd,
} from '../../../src/adapters/codex/index.js';
import { opencodeAdapter } from '../../../src/adapters/opencode/index.js';
import type { Fragment } from '../../../src/anatomy/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';

// ── Fixtures (self-contained; agent-forge does not depend on agent-anatomy) ─────────────────

/** A minimal Fragment stub — only `organ`/`slug`/`definiens` are load-bearing. */
function frag(organ: string, slug: string): Fragment {
  return { organ, slug, definiens: `${slug} definiens` } as Fragment;
}

/** A nico-like resolved agent (mirrors `nicoResolved`); cyan-marked, sage persona. */
function nicoLikeResolved(): ResolvedAgent {
  return {
    name: 'nico',
    description: 'the Sage archetype',
    mark: { emoji: '📐', hue: 'cyan' },
    sourcePath: 'packages/agent-anatomy/agent/nico.md',
    memoryProtocol: 'protocol for {name}',
    personaProtocol: 'persona protocol for {name}',
    organs: [
      ['Persona', [frag('persona', 'sage')]],
      ['Role', [frag('role', 'curate')]],
      ['Formality', [frag('formality', 'formal')]],
      ['Model', [frag('model', 'claude')]],
      ['Autonomy', [frag('autonomy', 'human-on-the-loop')]],
      ['Actions', [frag('actions', 'file-ops'), frag('actions', 'delegation')]],
      ['Modalities', [frag('modalities', 'text')]],
      ['Trigger', [frag('trigger', 'user-message')]],
      ['Output-Format', [frag('output-format', 'natural-language')]],
      ['Reasoning-Strategy', [frag('reasoning-strategy', 'react')]],
      ['Satisficing', [frag('satisficing', 'satisfice')]],
    ],
  };
}

// ── Codex agent → TOML projection ────────────────────────────────────────────

describe('agentToCodexToml — the codex subagent projection', () => {
  it('emits valid TOML carrying name / description / system_prompt / color', () => {
    const toml = agentToCodexToml(nicoLikeResolved());
    const parsed = TOML.parse(toml) as Record<string, unknown>;
    expect(parsed.name).toBe('nico');
    expect(parsed.color).toBe('cyan');
    expect(parsed.description).toBe('📐 the Sage archetype');
    expect(typeof parsed.system_prompt).toBe('string');
  });

  it('system_prompt carries the full composed SOUL body + memory genus block', () => {
    const obj = agentToCodexTomlObject(nicoLikeResolved());
    const sp = obj.system_prompt as string;
    // The harness-neutral organ sections — the SAME body the claude SOUL carries.
    expect(sp).toContain('## Persona');
    expect(sp).toContain('sage ≜ sage definiens');
    expect(sp).toContain('## Model');
    // The memory genus block, {name}-substituted.
    expect(sp).toContain('protocol for nico');
    // NO provenance banner: the regenerate-don't-hand-edit comment + content-hash
    // is build-provenance the running agent never consumes, so it is not injected
    // (mirrors skillToCodexMd, which already omits it).
    expect(sp).not.toContain('GENERATED from');
    expect(sp).not.toContain('profile:');
    expect(sp).not.toMatch(/content-hash: sha256:/);
  });

  it('omits color when the agent carries no mark hue', () => {
    const a = { ...nicoLikeResolved(), mark: undefined };
    const parsed = TOML.parse(agentToCodexToml(a)) as Record<string, unknown>;
    expect(parsed.color).toBeUndefined();
    expect(parsed.description).toBe('the Sage archetype');
  });
});

// ── Codex harness reset (T2.4 first pass) ────────────────────────────────────

describe('codexHarnessReset — first-pass omit-to-inherit basis', () => {
  it('mirrors claude’s reset organ set (same omit-to-inherit surface)', () => {
    expect(Object.keys(codexHarnessReset).sort()).toEqual(
      Object.keys(claudeHarnessReset).sort(),
    );
  });

  it('diverges from claude ONLY on model (codex, not claude)', () => {
    expect(codexHarnessReset.model).toEqual({
      kind: 'scalar',
      slugs: ['codex'],
    });
    // Every other organ matches the claude measured reset.
    for (const organ of Object.keys(codexHarnessReset)) {
      if (organ === 'model') continue;
      expect(
        codexHarnessReset[organ as keyof typeof codexHarnessReset],
      ).toEqual(claudeHarnessReset[organ as keyof typeof claudeHarnessReset]);
    }
  });

  it('projectCodexAgentDelta subtracts the harness-provided organs', () => {
    const toml = projectCodexAgentDelta(nicoLikeResolved(), codexHarnessReset);
    const sp = (TOML.parse(toml) as { system_prompt: string }).system_prompt;
    // Distinctive organs kept.
    expect(sp).toContain('## Persona');
    expect(sp).toContain('## Role');
    expect(sp).toContain('## Formality'); // formal != reset neutral → kept
    // Harness-provided organs omitted.
    expect(sp).not.toContain('## Autonomy');
    expect(sp).not.toContain('## Actions');
    expect(sp).not.toContain('## Modalities');
    // Memory genus block still frames the SOUL.
    expect(sp).toContain('## Memory');
  });

  it('KEEPS substrate=claude under the codex reset (real delta on codex)', () => {
    // The deliberate divergence: a claude-substrate agent on codex is NOT native.
    const toml = projectCodexAgentDelta(nicoLikeResolved(), codexHarnessReset);
    const sp = (TOML.parse(toml) as { system_prompt: string }).system_prompt;
    expect(sp).toContain('## Model');
    expect(sp).toContain('claude ≜');
  });
});

// ── Codex skill → SKILL.md projection ────────────────────────────────────────

describe('skillToCodexMd — the codex skill projection', () => {
  const skill: ResolvedSkill = {
    name: 'demo',
    trigger: '/demo',
    delineation: 'a demo skill',
    body: '\n\ndemo ≜ a formula consumed not emitted\n\n# demo\n\nThe verb prose with a [[wake]] ref.\n',
    composedFrom: ['/wake'],
    sourcePath: 'packages/agent-anatomy/skill/demo.md',
  };

  it('emits AgentSkills frontmatter (name + description) and no provenance comment', () => {
    const md = skillToCodexMd(skill, (s) => `/${s}`);
    expect(
      md.startsWith('---\nname: demo\ndescription: a demo skill\n---'),
    ).toBe(true);
    // Codex SKILL.md is a plain spec file — no GENERATED banner, no trigger line.
    expect(md).not.toContain('GENERATED from');
    expect(md).not.toContain('trigger:');
  });

  it('drops the prose ≜ formula line and keeps the verb body', () => {
    const md = skillToCodexMd(skill, (s) => `/${s}`);
    expect(md).not.toContain('a formula consumed not emitted');
    expect(md).toContain('# demo');
    expect(md).toContain('Composed from /wake.');
  });
});

// ── The AGENTS.md instruction surface ────────────────────────────────────────

describe('agentsMdSurface', () => {
  it('lists the subagents sorted, each pointing at its .toml', () => {
    const md = agentsMdSurface(['nico', 'mav', 'developer']);
    expect(md).toContain('# Agents');
    const iDev = md.indexOf('`developer`');
    const iMav = md.indexOf('`mav`');
    const iNico = md.indexOf('`nico`');
    expect(iDev).toBeLessThan(iMav);
    expect(iMav).toBeLessThan(iNico);
    expect(md).toContain('- `nico` — `agents/nico.toml`');
  });
});

// ── Honest lossy reporting: agents-none adapters skip + warn, never corrupt ───
// The thesis' safety leg: a agent-anatomy agent projected through an adapter that declares
// `agents: 'none'` must be SKIPPED with a warning via the existing WriteReport,
// NOT silently dropped or corrupted. Demonstrated on opencode + aider (both
// declare `agents: 'none'`). We drive the IR write path (the adapter contract)
// with a agent-anatomy-derived agent IR.

describe('lossy reporting for agents-none adapters (WriteReport holds)', () => {
  let cwd: string;
  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'agent-forge-lossy-'));
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  const manifest = (target: string): Manifest => ({
    agentForge: 1,
    scope: 'project',
    targets: [target],
  });

  // A agent-anatomy-derived agent IR — the projection's IR-level shape (name + the composed
  // SOUL as body) carried through an adapter that cannot host agents.
  const irWithAgent = (target: string): IR => ({
    manifest: manifest(target),
    agents: [
      {
        name: 'nico',
        description: '📐 the Sage archetype',
        body: agentToCodexTomlObject(nicoLikeResolved())
          .system_prompt as string,
      },
    ],
  });

  it('opencode (agents: none) skips + warns, writes no agent file', async () => {
    expect(opencodeAdapter.capabilities.resources.agents).toBe('none');
    const report = await opencodeAdapter.write(
      irWithAgent('opencode'),
      'project',
      cwd,
      {},
    );
    // Skipped, with a human-legible reason — not corrupted, not crashed.
    expect(report.skipped.some((s) => s.path.includes('nico'))).toBe(true);
    expect(report.warnings.some((w) => /agents/.test(w))).toBe(true);
    // Nothing the adapter wrote is an agent artifact.
    expect(report.written.some((p) => p.includes('nico'))).toBe(false);
  });

  it('aider (agents: none) skips the agent cleanly (no corruption)', async () => {
    expect(aiderAdapter.capabilities.resources.agents).toBe('none');
    const report = await aiderAdapter.write(
      irWithAgent('aider'),
      'project',
      cwd,
      {},
    );
    expect(report.written.some((p) => p.includes('nico'))).toBe(false);
  });

  it('codex (agents: full) is the FULL target — proves the contrast', () => {
    // The codex adapter declares agents: full — the projection lands, not skips.
    // (The actual TOML write is covered above; here we pin the capability that
    // makes codex a real second harness while opencode/aider must skip.)
    const md = readFileSync(
      join(__dirname, '..', '..', '..', 'src', 'adapters', 'codex', 'index.ts'),
      'utf8',
    );
    expect(md).toContain("agents: 'full'");
  });
});
