// A PRACTICE IS RENDERED WHOLE OR NOT AT ALL — pinned through the projector.
//
// The fixture plugin set (`fixtures/practices`) declares practices, plumbing and a
// dispatch relation as data, over agents, skills and hooks chosen so that each law
// has a cell that would break it:
//
//   agents   lead (steward; dispatches builder; given brief; composes autonomy)
//            builder (builder; given tool) · solo (solo) · outsider (composes
//            autonomy, in no practice) · orphan (dispatches ghost-role) · phantom
//            (holds ghost-role) · seeker (given `absent`, which no cell carries)
//   skills   brief → base · tool · extra · stray (in no practice) · pipe → conduit
//            (plumbing)
//   hooks    notice (plumbing) · guard (binds autonomy) · unrelated (neither)

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plumbing, Practice } from '@cratylus/schema';
import { describe, expect, it } from 'vitest';
import { adapterByName } from '../../src/adapters/registry/index.js';
import {
  type ProjectablePlugin,
  type ProjectedTree,
  projectPluginSet,
} from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const fixtures = join(here, 'fixtures', 'practices');

const PRACTICES: readonly Practice[] = [
  {
    name: 'alpha',
    description: 'the lead and its builder',
    agents: ['lead', 'builder'],
    preselected: true,
  },
  {
    name: 'beta',
    description: 'a lone agent with a skill nobody is given',
    agents: ['solo'],
    skills: ['extra'],
  },
  {
    name: 'gamma',
    description: 'a skill and nothing else',
    agents: [],
    skills: ['extra'],
  },
  {
    name: 'dangling',
    description: 'an agent whose dispatched role is held by nobody chosen',
    agents: ['orphan'],
  },
  {
    name: 'ghosts',
    description: 'the holder of the role `dangling` dispatches to',
    agents: ['phantom'],
  },
  {
    name: 'lost',
    description: 'an agent given a skill the set does not carry',
    agents: ['seeker'],
  },
];

const PLUMBING: Plumbing = { skills: ['pipe'], hooks: ['notice'] };

const cells = {
  name: 'fixture-practices',
  manifest: FIXTURE_MANIFEST,
  agents: join(fixtures, 'agents'),
  skills: join(fixtures, 'skills'),
  hooks: join(fixtures, 'hooks'),
} satisfies ProjectablePlugin;

const declaring: ProjectablePlugin = {
  ...cells,
  practices: PRACTICES,
  plumbing: PLUMBING,
};
const undeclaring: ProjectablePlugin = cells;

const ALL_AGENTS = [
  'builder',
  'lead',
  'orphan',
  'outsider',
  'phantom',
  'seeker',
  'solo',
];
const ALL_SKILLS = [
  'base',
  'brief',
  'conduit',
  'extra',
  'pipe',
  'stray',
  'tool',
];
const ALL_HOOKS = ['guard', 'notice', 'unrelated'];

async function project(
  harness: string,
  practices?: readonly string[],
  plugin: ProjectablePlugin = declaring,
): Promise<ProjectedTree> {
  return projectPluginSet({
    plugins: [plugin],
    adapter: adapterByName(harness),
    ...(practices ? { practices } : {}),
    warn: () => {},
  });
}

/** The cells a tree places, by kind: agent names, skill names, hook ids. */
function placed(tree: ProjectedTree) {
  const names = (prefix: string, strip: (rest: string) => string) =>
    [
      ...new Set(
        tree.files
          .filter((f) => f.path.startsWith(prefix))
          .map((f) => strip(f.path.slice(prefix.length))),
      ),
    ].sort();
  return {
    agents: names('agents/', (rest) => rest.replace(/\.[^.]+$/, '')),
    skills: names('skills/', (rest) => rest.split('/')[0] as string),
    hooks: names('hooks/', (rest) => rest.split('/')[0] as string),
  };
}

const HARNESSES = ['claude', 'omp'] as const;

describe.each(HARNESSES)(
  'practices — a render of one practice on %s',
  (harness) => {
    it('places exactly its agents, their skills with what those compose, the plumbing and the guards its agents compose', async () => {
      const tree = await project(harness, ['alpha']);
      expect(placed(tree)).toEqual({
        agents: ['builder', 'lead'],
        // brief is given to lead and composes base; tool to builder; pipe is plumbing
        // and composes conduit. `extra` and `stray` belong to no chosen practice.
        skills: ['base', 'brief', 'conduit', 'pipe', 'tool'],
        // `guard` binds autonomy and lead composes it; `notice` is plumbing;
        // `unrelated` is neither.
        hooks: ['guard', 'notice'],
      });
      expect(tree.agents).toBe(2);
      expect(tree.skills).toBe(5);
      expect(tree.hooks).toBe(2);
    });

    it('registers a guard only when a rendered agent composes what it binds', async () => {
      // `solo` composes no autonomy value, so the guard binds nobody here and is not
      // registered, however many agents of the set (outsider) would be bound by it.
      const tree = await project(harness, ['beta']);
      expect(placed(tree)).toEqual({
        agents: ['solo'],
        skills: ['conduit', 'extra', 'pipe'],
        hooks: ['notice'],
      });
    });

    it('places the skills of a practice that has no agent, and no agent', async () => {
      const tree = await project(harness, ['gamma']);
      expect(placed(tree)).toEqual({
        agents: [],
        skills: ['conduit', 'extra', 'pipe'],
        hooks: ['notice'],
      });
    });

    it('renders the union of several practices, each cell once', async () => {
      const tree = await project(harness, ['alpha', 'beta', 'alpha']);
      expect(placed(tree)).toEqual({
        agents: ['builder', 'lead', 'solo'],
        skills: ['base', 'brief', 'conduit', 'extra', 'pipe', 'tool'],
        hooks: ['guard', 'notice'],
      });
    });

    it('closes a set over dispatch across the practices CHOSEN, not within one', async () => {
      const tree = await project(harness, ['dangling', 'ghosts']);
      expect(placed(tree).agents).toEqual(['orphan', 'phantom']);
    });
  },
);

describe.each(HARNESSES)(
  'practices — a hook a practice names, on %s',
  (harness) => {
    const hooking: ProjectablePlugin = {
      ...declaring,
      practices: [
        ...PRACTICES,
        {
          name: 'hooked',
          description: 'a practice naming a hook that binds no composition',
          agents: [],
          hooks: ['unrelated'],
        },
      ],
    };

    it('places the hook with the practice that names it, beside the plumbing', async () => {
      const tree = await project(harness, ['hooked'], hooking);
      expect(placed(tree).hooks).toEqual(['notice', 'unrelated']);
    });

    it('places it for no practice that does not name it', async () => {
      const tree = await project(harness, ['gamma'], hooking);
      expect(placed(tree).hooks).toEqual(['notice']);
    });

    it('REFUSES a practice naming a hook the set does not have', async () => {
      const missing: ProjectablePlugin = {
        ...declaring,
        practices: [
          {
            name: 'hooked',
            description: 'x',
            agents: [],
            hooks: ['nothing'],
          },
        ],
      };
      await expect(project(harness, ['hooked'], missing)).rejects.toThrow(
        /practice.*hook 'nothing'/,
      );
    });
  },
);

describe('a hook bound to a moment the harness does not fire — declared lost, not staged', () => {
  // claude, with the one moment the `guard` fixture binds (`turn.end`) withdrawn: the
  // hook is chosen, so the loss is the harness's alone.
  const deaf = {
    ...adapterByName('claude'),
    name: 'deaf',
    realizes: (event: string) => event !== 'turn.end',
  };

  async function projectDeaf(practices: readonly string[]) {
    const warnings: string[] = [];
    const tree = await projectPluginSet({
      plugins: [declaring],
      adapter: deaf,
      practices,
      warn: (line) => warnings.push(line),
    });
    return { tree, warnings };
  }

  it('warns once naming the hook, the moment and the harness, and stages no worker for it', async () => {
    const { tree, warnings } = await projectDeaf(['alpha']);
    const lost = warnings.filter((w) => w.includes("'turn.end'"));
    expect(lost).toHaveLength(1);
    expect(lost[0]).toContain("'guard'");
    expect(lost[0]).toContain("'deaf'");
    expect(placed(tree).hooks).toEqual(['notice']);
  });

  it('says nothing of a hook whose moment the harness does fire', async () => {
    const { warnings } = await projectDeaf(['beta']);
    expect(warnings.filter((w) => w.includes('does not fire'))).toEqual([]);
  });
});

describe.each(HARNESSES)(
  'practices — a render naming none on %s',
  (harness) => {
    it('places every cell where the practices are absent', async () => {
      expect(placed(await project(harness))).toEqual({
        agents: ALL_AGENTS,
        skills: ALL_SKILLS,
        hooks: ALL_HOOKS,
      });
    });

    it('refuses an empty choice before rendering anything, naming that no practice was chosen', async () => {
      const logged: string[] = [];
      await expect(
        projectPluginSet({
          plugins: [declaring],
          adapter: adapterByName(harness),
          practices: [],
          log: (line) => logged.push(line),
          warn: () => {},
        }),
      ).rejects.toThrow(/no practice was chosen/);
      expect(logged).toEqual([]);
    });

    it('renders a plugin set declaring no practices as it renders one declaring them', async () => {
      const bare = await project(harness, undefined, undeclaring);
      const declared = await project(harness);
      expect(bare.files).toEqual(declared.files);
      expect(bare.practices).toEqual([]);
    });
  },
);

describe('practices — the declaration is reported for an install to offer', () => {
  it('lists every declared practice in declaration order with whether it is preselected, whatever was rendered', async () => {
    const expected = PRACTICES.map((p) => ({
      name: p.name,
      description: p.description,
      preselected: p.preselected === true,
    }));
    expect((await project('claude')).practices).toEqual(expected);
    expect((await project('claude', ['gamma'])).practices).toEqual(expected);
    expect(expected.filter((p) => p.preselected).map((p) => p.name)).toEqual([
      'alpha',
    ]);
  });

  it("replaces an earlier plugin's practice of the same name with a later one's", async () => {
    const later: ProjectablePlugin = {
      name: 'later',
      practices: [{ name: 'gamma', description: 'replaced', agents: [] }],
    };
    const tree = await projectPluginSet({
      plugins: [declaring, later],
      adapter: adapterByName('claude'),
      practices: ['gamma'],
      warn: () => {},
    });
    expect(tree.practices.find((p) => p.name === 'gamma')?.description).toBe(
      'replaced',
    );
    // The replacement lists no skills, so `extra` is no longer placed.
    expect(placed(tree).skills).toEqual(['conduit', 'pipe']);
  });
});

describe('practices — a set that is not closed, or a name not declared, is REFUSED', () => {
  it('REFUSES an agent dispatching a role no agent of the set holds, naming the practice, the agent and the role', async () => {
    const refusal = project('claude', ['dangling']);
    await expect(refusal).rejects.toThrow(/practice 'dangling'/);
    await expect(refusal).rejects.toThrow(/agent 'orphan'/);
    await expect(refusal).rejects.toThrow(/role 'ghost-role'/);
  });

  it('REFUSES an agent composing a skill the set does not carry, naming the skill', async () => {
    const refusal = project('omp', ['lost']);
    await expect(refusal).rejects.toThrow(/practice 'lost'/);
    await expect(refusal).rejects.toThrow(/agent 'seeker'/);
    await expect(refusal).rejects.toThrow(/skill 'absent'/);
  });

  it('REFUSES a practice naming a skill the set does not carry, naming the skill', async () => {
    const missing: ProjectablePlugin = {
      ...declaring,
      practices: [
        { name: 'hollow', description: 'x', agents: [], skills: ['nowhere'] },
      ],
    };
    await expect(project('claude', ['hollow'], missing)).rejects.toThrow(
      /practice 'hollow'.*skill 'nowhere'/,
    );
  });

  it('REFUSES a practice naming an agent the set does not have', async () => {
    const missing: ProjectablePlugin = {
      ...declaring,
      practices: [{ name: 'hollow', description: 'x', agents: ['nobody'] }],
    };
    await expect(project('claude', ['hollow'], missing)).rejects.toThrow(
      /practice 'hollow'.*agent 'nobody'/,
    );
  });

  it('REFUSES plumbing that names a hook the set does not have', async () => {
    const missing: ProjectablePlugin = {
      ...declaring,
      plumbing: { hooks: ['nothing'] },
    };
    await expect(project('claude', ['gamma'], missing)).rejects.toThrow(
      /plumbing.*hook 'nothing'/,
    );
  });

  it('REFUSES an undeclared practice name, naming the declared ones', async () => {
    const refusal = project('claude', ['alpha', 'zeta']);
    await expect(refusal).rejects.toThrow(/'zeta' is no declared practice/);
    await expect(refusal).rejects.toThrow(
      /declared: alpha, beta, gamma, dangling, ghosts, lost/,
    );
  });

  it('REFUSES any name when the set declares no practice at all', async () => {
    await expect(project('claude', ['alpha'], undeclaring)).rejects.toThrow(
      /declared: none/,
    );
  });
});
