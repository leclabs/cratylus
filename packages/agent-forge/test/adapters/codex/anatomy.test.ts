import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import TOML from '@iarna/toml';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aiderAdapter } from '../../../src/adapters/aider/index.js';
import {
  type ResolvedSkill,
  agentToCodexToml,
  agentToCodexTomlObject,
  agentsMdSurface,
  skillToCodexMd,
} from '../../../src/adapters/codex/index.js';
import { opencodeAdapter } from '../../../src/adapters/opencode/index.js';
import type { Agent } from '../../../src/anatomy/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';

// ── Fixtures (self-contained; agent-forge does not depend on agent-anatomy) ─────────────────

/**
 * A nico-like `Agent` vector (mirrors what a nico corpus agent elevates to);
 * cyan-marked, sage persona. Every organ key is present (completeness law);
 * only a handful of organs carry a value, the rest are explicit `null`
 * (omit-to-inherit). Each non-null organ value IS the SOUL body
 * `<slug> ≜ <definiens>` — a plain branded string, no wrapper object.
 */
function nicoLikeAgent(): Agent {
  return {
    name: 'nico',
    autonomy: ['human-on-the-loop ≜ human-on-the-loop definiens'],
    persona: 'the Sage archetype',
    role: 'curate ≜ curate definiens',
    formality: 'formal ≜ formal definiens',
    audienceAdaptation: null,
    transparency: null,
    provenance: { mark: { emoji: '📐', hue: 'cyan' } },
    objective: null,
    guardrails: null,
    engineeringPrinciples: null,
    heuristics: null,
    capabilities: null,
    learning: null,
    situationAwareness: null,
    actions: [
      'file-ops ≜ file-ops definiens',
      'delegation ≜ delegation definiens',
    ],
    modalities: 'text ≜ text definiens',
    model: 'claude ≜ claude definiens',
    memory: 'protocol ≜ the standing memory protocol for nico',
    trigger: 'user-message ≜ user-message definiens',
    framing: null,
    reasoningStrategy: 'react ≜ react definiens',
    satisficing: 'satisfice ≜ satisfice definiens',
    outputFormat: 'natural-language ≜ natural-language definiens',
    selfEvaluation: null,
  };
}

// ── Codex agent → TOML projection ────────────────────────────────────────────

describe('agentToCodexToml — the codex subagent projection', () => {
  it('emits valid TOML carrying name / description / developer_instructions; never color [CX1]', () => {
    const toml = agentToCodexToml(nicoLikeAgent());
    const parsed = TOML.parse(toml) as Record<string, unknown>;
    expect(parsed.name).toBe('nico');
    expect(parsed.description).toBe('📐 the Sage archetype');
    expect(typeof parsed.developer_instructions).toBe('string');
    // No documented Codex agent-TOML color field — never fabricated [CX1].
    expect(parsed.color).toBeUndefined();
  });

  it('developer_instructions carries the full composed SOUL body + memory genus block', () => {
    const obj = agentToCodexTomlObject(nicoLikeAgent());
    const sp = obj.developer_instructions as string;
    // The harness-neutral organ sections — the SAME body the claude SOUL carries.
    expect(sp).toContain('## Persona');
    expect(sp).toContain('the Sage archetype');
    expect(sp).toContain('## Model');
    expect(sp).toContain('claude ≜ claude definiens');
    // No more `## Memory Protocol` genus append — `memory` is a plain organ
    // section like any other, carrying the vector's branded value verbatim.
    expect(sp).toContain('## Memory');
    expect(sp).toContain('protocol ≜ the standing memory protocol for nico');
    // NO provenance banner: the regenerate-don't-hand-edit comment + content-hash
    // is build-provenance the running agent never consumes, so it is not injected
    // (mirrors skillToCodexMd, which already omits it).
    expect(sp).not.toContain('GENERATED from');
    expect(sp).not.toContain('profile:');
    expect(sp).not.toMatch(/content-hash: sha256:/);
  });

  it('omits the emoji-prefixed description when the agent carries no mark (color never emitted either way)', () => {
    const a: Agent = { ...nicoLikeAgent(), provenance: null };
    const parsed = TOML.parse(agentToCodexToml(a)) as Record<string, unknown>;
    expect(parsed.color).toBeUndefined();
    expect(parsed.description).toBe('the Sage archetype');
  });
});

// ── Codex skill → SKILL.md projection ────────────────────────────────────────

describe('skillToCodexMd — the codex skill projection', () => {
  const skill: ResolvedSkill = {
    name: 'demo',
    trigger: '/demo',
    delineation: 'a demo skill',
    body: '\n\ndemo ≜ a formula consumed not emitted\n\n# demo\n\nThe verb prose with a [[wake]] ref.\n\n- **alpha** ≜ an absorbed declaration bullet\n',
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
    // An absorbed-declaration bullet also carries ≜ and MUST survive (the
    // codex projection reuses the claude adapter's `skillBody`).
    expect(md).toContain('- **alpha** ≜ an absorbed declaration bullet');
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
// NOT silently dropped or corrupted. Demonstrated on aider (declares
// `agents: 'none'`); opencode graduated to a real (partial) agents write with
// the opencode-adapter-truth fix [OC2] — see the sibling test below, which
// demonstrates the same safety leg for a field-level drop instead of a
// whole-resource skip. We drive the IR write path (the adapter contract)
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
        body: agentToCodexTomlObject(nicoLikeAgent())
          .developer_instructions as string,
      },
    ],
  });

  it('opencode (agents: partial) writes the real .opencode/agents/nico.md, not a skip', async () => {
    expect(opencodeAdapter.capabilities.resources.agents).toBe('partial');
    const report = await opencodeAdapter.write(
      irWithAgent('opencode'),
      'project',
      cwd,
      {},
    );
    // A real write, not a skip [OC2] — never corrupted, never crashed.
    expect(report.skipped.some((s) => s.path.includes('nico'))).toBe(false);
    expect(
      report.written.some((p) => p.includes(join('agents', 'nico.md'))),
    ).toBe(true);
    // The agent had no IR mode; opencode's frontmatter requires the field, so
    // the adapter discloses the default via a warning, never fabricates it
    // silently.
    expect(report.warnings.some((w) => /mode/.test(w))).toBe(true);
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
