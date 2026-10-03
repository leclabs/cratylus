import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { agentToClaudeMd } from '@cratylus/forge/adapters/claude';
import { agentToOmpMd } from '@cratylus/forge/adapters/omp';
import { describe, expect, it } from 'vitest';
import { MANIFEST } from '../src/manifest.js';
import type { Agent } from '../src/manifest.js';
import { architectRole } from '../src/roles/architect.js';

const canonRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(canonRoot, '../..');
const src = join(canonRoot, 'src');
const agentDir = join(src, 'agents');
const context = { manifest: MANIFEST };
const fixture = JSON.parse(
  readFileSync(
    join(
      canonRoot,
      'test/fixtures/architect-dispatch-contract/dispatch-cases.json',
    ),
    'utf8',
  ),
) as {
  missingHolder: { name: string; holds: string; skills: string[] };
  missingPreload: string;
  defaultOnlySkill: string;
};
const UNIVERSAL = 'caller declares invocation-specific strict schema';
const SHORTFALL = 'native Agent machine-enforcement shortfall';

/** Agent modules are discovered from the current source roster, not a frozen list. */
async function agentsFromSource(): Promise<Agent[]> {
  const files = readdirSync(agentDir)
    .filter((file) => file.endsWith('.ts') && file !== 'base.ts')
    .sort();
  expect(files.length, 'source agent inventory is non-empty').toBeGreaterThan(
    0,
  );
  return Promise.all(
    files.map(async (file) => {
      // A runtime-selected module is necessary: this gate must include a newly added
      // agent without a static import or hand-maintained roster.
      const mod = (await import(pathToFileURL(join(agentDir, file)).href)) as {
        [key: string]: unknown;
      };
      const agent = Object.values(mod).find(
        (value): value is Agent =>
          typeof value === 'object' && value !== null && 'holds' in value,
      );
      if (!agent) throw new Error(`${file}: no Agent export`);
      return agent;
    }),
  );
}

function holderViolations(
  agent: Agent,
  harness: 'claude' | 'omp',
  rendered: string,
): string[] {
  const failures: string[] = [];
  if (!agent.skills?.includes('dispatch'))
    failures.push('missing dispatch skill');
  if (!rendered.includes('dispatch')) failures.push('missing dispatch preload');
  if (agent.holds === 'architect' && !rendered.includes(UNIVERSAL))
    failures.push('missing caller-owned contract');
  if (agent.holds === 'architect' && !rendered.includes(SHORTFALL))
    failures.push('missing Claude machine-enforcement shortfall');
  if (/^output:/m.test(rendered)) failures.push('role-default output schema');
  if (rendered.includes('outputSchema'))
    failures.push('generic role states native transport field');
  const preload = harness === 'omp' ? 'autoloadSkills:' : 'skills:';
  if (!rendered.includes(preload))
    failures.push('missing harness preload field');
  if (
    harness === 'claude' &&
    (!rendered.includes('SessionStart') ||
      !rendered.includes("'skills/dispatch'"))
  )
    failures.push('missing main/delegated Claude skill preload');
  if (harness === 'omp' && !rendered.includes('autoloadSkills'))
    failures.push('missing delegated omp skill preload');
  return failures;
}

function dispatchSkillViolations(body: string): string[] {
  const checks: readonly (readonly [string, string])[] = [
    ['caller declares its own contract', 'missing universal caller contract'],
    ['outputSchema', 'missing native omp schema projection'],
    ['schemaMode: strict', 'missing strict mode'],
    [
      'not machine-enforced structured transport',
      'missing Claude machine-enforcement shortfall',
    ],
  ];
  return checks.flatMap(([needle, message]) =>
    body.includes(needle) ? [] : [message],
  );
}

describe('architect dispatch contract reach and projection', () => {
  it('convicts missing holders, missing preload and default-only instructions', () => {
    const holder = fixture.missingHolder as unknown as Agent;
    expect(holderViolations(holder, 'omp', 'role without dispatch')).toContain(
      'missing dispatch skill',
    );
    expect(
      holderViolations(
        { ...holder, skills: ['dispatch'] },
        'claude',
        fixture.missingPreload,
      ),
    ).toEqual(
      expect.arrayContaining([
        'missing dispatch preload',
        'role-default output schema',
      ]),
    );
    expect(dispatchSkillViolations(fixture.defaultOnlySkill)).toEqual(
      expect.arrayContaining([
        'missing universal caller contract',
        'missing native omp schema projection',
        'missing strict mode',
        'missing Claude machine-enforcement shortfall',
      ]),
    );
  });

  it('holds the caller-owned contract on every role holder and the optional planner seam', async () => {
    const agents = await agentsFromSource();
    const holders = agents.filter((agent) => agent.holds === 'architect');
    const denominator = holders.map((agent) => agent.name).sort();
    const planner = agents.find((agent) => agent.holds === 'planner');
    const paths = [
      '.cratylus/claude/agents/<holder>.md',
      '.cratylus/claude/skills/dispatch/SKILL.md',
      '.cratylus/claude/enforcing/_session/claude-agent',
      '.cratylus/omp/agents/<holder>.md',
      '.cratylus/omp/skills/dispatch/SKILL.md',
      '.cratylus/omp/enforcing/_session/omp-agent',
    ];
    console.info(
      `architect dispatch denominator: ${JSON.stringify({ harnesses: ['claude', 'omp'], holders: denominator, planner: planner?.name, paths })}`,
    );
    expect(denominator).toEqual(['architect', 'kino', 'mav', 'nico']);
    expect(planner, 'planner source holder exists').toBeDefined();
    expect(planner?.skills).toContain('dispatch');
    expect(architectRole.vector.actions?.join('\n')).toContain(
      'caller-owned dispatch contract',
    );

    for (const agent of holders) {
      for (const [harness, rendered] of [
        ['claude', agentToClaudeMd(agent, context)],
        ['omp', agentToOmpMd(agent, context)],
      ] as const) {
        expect(
          holderViolations(agent, harness, rendered),
          `${harness}/${agent.name}`,
        ).toEqual([]);
      }
    }
    for (const [harness, rendered] of [
      ['claude', agentToClaudeMd(planner as Agent, context)],
      ['omp', agentToOmpMd(planner as Agent, context)],
    ] as const) {
      expect(
        holderViolations(planner as Agent, harness, rendered),
        `${harness}/planner`,
      ).toEqual([]);
    }
  });

  it('matches current source inventories and resolves every projected skill on both harnesses', () => {
    const agents = readdirSync(agentDir)
      .filter((file) => file.endsWith('.ts') && file !== 'base.ts')
      .map((file) => file.replace(/\.ts$/, ''))
      .sort();
    const skillsDir = join(src, 'skills');
    const skills = readdirSync(skillsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    const outputs = {
      claude: join(repoRoot, '.cratylus/claude'),
      omp: join(repoRoot, '.cratylus/omp'),
    };
    expect(agents.length, 'agent denominator').toBeGreaterThan(0);
    expect(skills.length, 'skill denominator').toBeGreaterThan(0);
    console.info(
      `projection inventory denominator: ${JSON.stringify({ agents, skills, paths: Object.values(outputs) })}`,
    );
    for (const [harness, output] of Object.entries(outputs)) {
      const actualAgents = readdirSync(join(output, 'agents'))
        .filter((file) => file.endsWith('.md'))
        .map((file) => file.replace(/\.md$/, ''))
        .sort();
      expect(actualAgents, `${harness} full agent inventory`).toEqual(agents);
      const projectedSkills = join(output, 'skills');
      const actualSkills = readdirSync(projectedSkills, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
      expect(actualSkills, `${harness} full skill inventory`).toEqual(skills);
      for (const name of skills) {
        expect(
          readFileSync(join(projectedSkills, name, 'SKILL.md'), 'utf8'),
          `${harness}/${name} resolves`,
        ).toContain(`name: ${name}`);
      }
      const dispatch = readFileSync(
        join(projectedSkills, 'dispatch', 'SKILL.md'),
        'utf8',
      );
      expect(
        dispatchSkillViolations(dispatch),
        `${harness} dispatch skill`,
      ).toEqual([]);
    }
    for (const harness of ['claude', 'omp'] as const) {
      const receiving = join(outputs[harness], 'agents');
      for (const name of ['implementer', 'assayer', 'planner', 'integrator']) {
        expect(
          readFileSync(join(receiving, `${name}.md`), 'utf8'),
          `${harness}/${name} has no role-default output`,
        ).not.toMatch(/^output:/m);
      }
    }
    const claudeLauncher = readFileSync(
      join(outputs.claude, 'enforcing/_session/claude-agent'),
      'utf8',
    );
    const ompLauncher = readFileSync(
      join(outputs.omp, 'enforcing/_session/omp-agent'),
      'utf8',
    );
    expect(claudeLauncher).toContain('claude --agent');
    expect(ompLauncher).toContain('omp read "skill://$skill"');
  });
});
