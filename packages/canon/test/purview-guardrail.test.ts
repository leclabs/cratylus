// GATE — the purview guardrail refuses an act outside the holder's DECLARED arrow, and
// refuses nothing else.
//
// WHAT MAKES THIS GATE WORTH PINNING rather than trusting to the shell: the cell's whole
// claim is that the law is not in the cell. The rubric carries no role text and names no
// agent; the worker reads the `## Role` section out of the persona's own deployed Target
// at run time and hands it to the judge as the contract. If that derivation breaks — a
// changed deploy layout, a renamed section, a Target that never lands — the worker fails
// open and the gate goes DARK while still exiting 0 on every call, which is the same
// apparatus-under-zero-trust failure `stance-guardrail-dark.test.ts` exists to catch one
// cell over. So the first assertion here is not that a breach is denied; it is that the
// agent's own contract actually reached the payload.
//
// THE NEGATIVE CONTROLS ARE THE POINT. A gate that denied everything would pass a
// block-only suite, and a gate that denies nothing is what we are guarding against, so
// both directions are asserted: a read is never judged, a fabricated citation is
// discarded, an unenrolled scope is silent, and an identical input is never denied twice.

import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectionFacts } from '@cratylus/forge/project';
import { hookIrOf, resolveWorker } from '@cratylus/schema';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { architect } from '../src/agents/architect.js';
import { mav } from '../src/agents/mav.js';
import { purviewGuardrail } from '../src/hooks/purview-guardrail.js';

let root: string;
let worker: string;

/** The worker as a HARNESS receives it: the template resolved against that harness's
 *  own projection facts, exactly as projection emits it. */
function workerSource(harness: string): string {
  const f = purviewGuardrail.workers?.find(
    (x) => x.filename === 'purview-guardrail.sh',
  );
  if (!f) throw new Error('purview-guardrail.sh not found on the cell');
  return resolveWorker(
    f,
    projectionFacts(adapterByName(harness)),
    purviewGuardrail.speech,
  ).content;
}

/**
 * A fixture deployment in the SHAPE the omp adapter lands: the worker under
 * `<home>/.omp/hooks/purview-guardrail/`, the persona scope at
 * `<home>/.omp/agent/personas/<name>/`, and the Target at
 * `<home>/.omp/agent/agents/<name>.md`. The worker derives the Target from the scope, so
 * the layout is the thing under test and cannot be shortcut with an env override.
 */
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'purview-'));
  const hooks = join(root, '.omp', 'hooks', 'purview-guardrail');
  mkdirSync(hooks, { recursive: true });
  worker = join(hooks, 'purview-guardrail.sh');
  writeFileSync(worker, workerSource('omp'), 'utf8');
  chmodSync(worker, 0o755);

  const agents = join(root, '.omp', 'agent', 'agents');
  mkdirSync(agents, { recursive: true });
  for (const a of [architect, mav]) {
    // Only the section the worker reads has to be real; the surrounding headings are
    // what prove the awk range stops where the next dimension starts.
    writeFileSync(
      join(agents, `${a.name}.md`),
      `# ${a.name}\n\n## Archetype\n\n${a.archetype}\n\n## Role\n\n${a.role}\n\n## Formality\n\nplain\n`,
      'utf8',
    );
    const scope = join(root, '.omp', 'agent', 'personas', a.name, 'stance');
    mkdirSync(scope, { recursive: true });
    writeFileSync(
      join(scope, 'manifest.json'),
      JSON.stringify({ agent: a.name, gates: {} }),
      'utf8',
    );
  }
});

const scopeOf = (name: string): string =>
  join(root, '.omp', 'agent', 'personas', name);

function run(
  agent: string,
  tool: string,
  toolInput: Record<string, unknown>,
  env: Record<string, string> = {},
): { stdout: string; status: number | null } {
  const input = JSON.stringify({
    stance_scope: scopeOf(agent),
    tool_name: tool,
    tool_input: toolInput,
    session_id: `s-${Math.random()}`,
    cwd: root,
  });
  const r = spawnSync('sh', [worker], {
    input,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return { stdout: r.stdout ?? '', status: r.status };
}

/** A judge verdict on disk — the seam the worker reads instead of spawning a model. */
function verdictFile(body: string): string {
  const p = join(root, `verdict-${Math.random()}.txt`);
  writeFileSync(p, body, 'utf8');
  return p;
}

const DISPATCH = {
  subagent_type: 'implementer',
  prompt: 'build the fold exactly as written',
};

describe('purview guardrail — the holder’s own arrow is the law', () => {
  it('hands the judge the agent’s OWN projected contract, verbatim', () => {
    const { stdout } = run(architect.name, 'Task', DISPATCH, {
      STANCE_EMIT_PAYLOAD: '1',
    });
    const { payload, rubric } = JSON.parse(stdout) as {
      payload: string;
      rubric: string;
    };
    // The whole contract, not a paraphrase and not a prefix.
    expect(payload).toContain(architect.role);
    // …and it stopped at the next dimension rather than swallowing the file.
    expect(payload).not.toContain('## Formality');
    // The rubric is the NEUTRAL one, reached from the worker's own location.
    expect(rubric).toMatch(
      /\.agents\/purview-guardrail\/purview-judge-prompt\.md$/,
    );
  });

  it('classifies the act by codomain — a dispatch writes spec, a write writes artifact', () => {
    const dispatch = JSON.parse(
      run(architect.name, 'Task', DISPATCH, { STANCE_EMIT_PAYLOAD: '1' })
        .stdout,
    ) as { payload: string };
    expect(dispatch.payload).toContain('DISPATCH to');
    expect(dispatch.payload).toContain('implementer');

    const write = JSON.parse(
      run(
        mav.name,
        'Write',
        { file_path: '/repo/src/a.ts' },
        {
          STANCE_EMIT_PAYLOAD: '1',
        },
      ).stdout,
    ) as { payload: string };
    expect(write.payload).toContain('codomain: artifact');
    expect(write.payload).toContain('/repo/src/a.ts');
  });

  it('never judges a read — the arrow test is on the codomain', () => {
    const { stdout, status } = run(
      architect.name,
      'Read',
      { file_path: '/repo/src/a.ts' },
      { STANCE_EMIT_PAYLOAD: '1' },
    );
    expect(stdout).toBe('');
    expect(status).toBe(0);
  });

  it('DENIES a BLOCK whose cited span is in the payload', () => {
    const { stdout, status } = run(architect.name, 'Task', DISPATCH, {
      STANCE_VERDICT_FILE: verdictFile(
        'VERDICT: BLOCK\nREASON: the dispatch writes spec, which this arrow excludes\nSPAN: build the fold exactly as written\n',
      ),
    });
    const out = JSON.parse(stdout) as {
      hookSpecificOutput: {
        permissionDecision: string;
        permissionDecisionReason: string;
      };
    };
    expect(out.hookSpecificOutput.permissionDecision).toBe('deny');
    expect(out.hookSpecificOutput.permissionDecisionReason).toContain(
      'writes spec',
    );
    expect(status).toBe(0);
  });

  it('DISCARDS a BLOCK citing a span the payload does not contain', () => {
    const { stdout } = run(architect.name, 'Task', DISPATCH, {
      STANCE_VERDICT_FILE: verdictFile(
        'VERDICT: BLOCK\nREASON: fabricated\nSPAN: this text never appeared anywhere\n',
      ),
    });
    expect(stdout).toBe('');
  });

  it('allows a PASS verdict', () => {
    const { stdout } = run(
      architect.name,
      'Task',
      { subagent_type: 'planner', prompt: 'decompose piece three' },
      {
        STANCE_VERDICT_FILE: verdictFile(
          'VERDICT: PASS\nREASON: the contract routes C→spec to plan\n',
        ),
      },
    );
    expect(stdout).toBe('');
  });

  it('fails OPEN when the judge returns nothing', () => {
    const { stdout, status } = run(architect.name, 'Task', DISPATCH, {
      STANCE_VERDICT_FILE: join(root, 'no-such-verdict'),
    });
    expect(stdout).toBe('');
    expect(status).toBe(0);
  });

  it('is silent for a scope carrying no stance manifest (presence is enrollment)', () => {
    const { stdout } = run('nobody', 'Task', DISPATCH, {
      STANCE_EMIT_PAYLOAD: '1',
    });
    expect(stdout).toBe('');
  });

  it('caps re-entry — an identical input is never denied twice', () => {
    const file = verdictFile(
      'VERDICT: BLOCK\nREASON: outside the arrow\nSPAN: build the fold exactly as written\n',
    );
    // The cap's marker is keyed by ⟨session, tool_input⟩ and lives in TMPDIR, which
    // OUTLIVES the suite. A fixed session id would therefore pass on a clean machine
    // and fail on the second run of the day — so the id is fresh per run and the two
    // calls below share it, which is the only sharing the cap is about.
    const input = JSON.stringify({
      stance_scope: scopeOf(architect.name),
      tool_name: 'Task',
      tool_input: DISPATCH,
      session_id: `cap-${process.pid}-${Date.now()}`,
      cwd: root,
    });
    const once = spawnSync('sh', [worker], {
      input,
      encoding: 'utf8',
      env: { ...process.env, STANCE_VERDICT_FILE: file },
    });
    const twice = spawnSync('sh', [worker], {
      input,
      encoding: 'utf8',
      env: { ...process.env, STANCE_VERDICT_FILE: file },
    });
    expect(once.stdout).toContain('deny');
    expect(twice.stdout).toBe('');
  });
});

// THE CLAUDE FORM OF THE SCOPE. Claude Code places no dispatcher, so the payload carries
// no `stance_scope`; it NAMES the running agent as `agent_type` (on the main thread of a
// `claude --agent` session and inside a subagent, and on neither for a bare session). The
// worker derives the persona's scope from that name under its own harness home, and a
// manifest there is enrollment. The layout is the one the claude adapter deploys:
// `<home>/.claude/{hooks/<id>/, agents/, personas/<name>/stance/manifest.json}`.
//
// THE CONTROLS ARE THE POINT. Without them a worker that judged every agent_type — or
// one that read `.stance_scope` only, as this cell did — would each pass a suite that only
// asserts the enrolled persona is judged.
describe('purview guardrail — the claude form of the scope (agent_type only)', () => {
  let claudeRoot: string;
  let claudeWorker: string;

  beforeAll(() => {
    claudeRoot = mkdtempSync(join(tmpdir(), 'purview-claude-'));
    const hooks = join(claudeRoot, '.claude', 'hooks', 'purview-guardrail');
    mkdirSync(hooks, { recursive: true });
    claudeWorker = join(hooks, 'purview-guardrail.sh');
    writeFileSync(claudeWorker, workerSource('claude'), 'utf8');
    chmodSync(claudeWorker, 0o755);

    const agents = join(claudeRoot, '.claude', 'agents');
    mkdirSync(agents, { recursive: true });
    for (const a of [architect, mav]) {
      writeFileSync(
        join(agents, `${a.name}.md`),
        `# ${a.name}\n\n## Role\n\n${a.role}\n\n## Formality\n\nplain\n`,
        'utf8',
      );
    }
    // Only `architect` is ENROLLED. `mav` has a Target and no manifest: projected,
    // dispatched to, and not carrying the guard.
    const scope = join(
      claudeRoot,
      '.claude',
      'personas',
      architect.name,
      'stance',
    );
    mkdirSync(scope, { recursive: true });
    writeFileSync(
      join(scope, 'manifest.json'),
      JSON.stringify({ agent: architect.name, gates: {} }),
      'utf8',
    );
  });

  const runClaude = (payload: Record<string, unknown>) =>
    spawnSync('sh', [claudeWorker], {
      input: JSON.stringify({
        tool_name: 'Task',
        tool_input: DISPATCH,
        session_id: `c-${Math.random()}`,
        cwd: claudeRoot,
        ...payload,
      }),
      encoding: 'utf8',
      env: { ...process.env, STANCE_EMIT_PAYLOAD: '1' },
    });

  it('judges the enrolled persona the payload names, with its own projected contract', () => {
    const { stdout, status } = runClaude({ agent_type: architect.name });
    expect(status).toBe(0);
    const { payload } = JSON.parse(stdout) as { payload: string };
    expect(payload).toContain(architect.role);
  });

  it('is silent on a bare session — the payload names no agent', () => {
    expect(runClaude({}).stdout).toBe('');
    expect(runClaude({ agent_type: '' }).stdout).toBe('');
  });

  it('is silent for a named agent that carries no manifest (a built-in, a host’s, an unenrolled persona)', () => {
    expect(runClaude({ agent_type: 'general-purpose' }).stdout).toBe('');
    expect(runClaude({ agent_type: mav.name }).stdout).toBe('');
  });

  it('never builds a scope path out of a name that is not one directory', () => {
    // `../personas/architect` would resolve to the enrolled scope from a name that is
    // not the agent's own.
    expect(
      runClaude({ agent_type: `../personas/${architect.name}` }).stdout,
    ).toBe('');
  });

  it('lets a dispatcher-supplied scope win over the name (omp keeps its form)', () => {
    const { stdout } = runClaude({
      agent_type: 'general-purpose',
      stance_scope: join(claudeRoot, '.claude', 'personas', architect.name),
    });
    expect(stdout).not.toBe('');
  });
});

// The stubbed model client below records into this global, because the emitted module is
// loaded from disk and can share nothing with the test but the process.
declare global {
  var __purviewOmpJudged: string[] | undefined;
}

// THE OMP FORM OF THE EVERY-TOOL ARM. `tool.use.pre` binds omp's `tool_call` with no tool
// name, so the module the adapter emits has to read the name off the event. It wrote an
// EMPTY `tool_name` instead, which the worker reads as "nothing to judge" and allows — so
// purview fired on every omp call and could never judge one. This RUNS the emitted module
// against the deployed worker, because the two halves only meet at the envelope between
// them: a test of either alone is green while the arm judges nothing.
describe('purview guardrail — omp’s tool.use.pre reaches the worker with the real tool name', () => {
  let stubbed: string[];
  let handlers: Array<(event: unknown, ctx: unknown) => Promise<unknown>>;
  const homeWas = process.env.HOME;

  beforeAll(async () => {
    const home = mkdtempSync(join(tmpdir(), 'purview-omp-'));
    const omp = adapterByName('omp');
    // The deployed layout, from the adapter's OWN destination map.
    const hooks = join(home, '.omp', 'hooks', 'purview-guardrail');
    mkdirSync(hooks, { recursive: true });
    writeFileSync(
      join(hooks, 'purview-guardrail.sh'),
      workerSource('omp'),
      'utf8',
    );
    mkdirSync(join(home, '.agents', 'purview-guardrail'), { recursive: true });
    writeFileSync(
      join(home, '.agents', 'purview-guardrail', 'purview-judge-prompt.md'),
      'RUBRIC',
      'utf8',
    );
    const agents = join(home, '.omp', 'agent', 'agents');
    mkdirSync(agents, { recursive: true });
    writeFileSync(
      join(agents, 'mav.md'),
      `# mav\n\n## Role\n\n${mav.role}\n\n## Formality\n\nplain\n`,
      'utf8',
    );
    const scopeRel = (file: string) => omp.scopedRel?.(file, 'mav') ?? '';
    const manifest = join(home, '.omp', scopeRel('stance/manifest.json'));
    mkdirSync(join(manifest, '..'), { recursive: true });
    writeFileSync(
      manifest,
      JSON.stringify({ agent: 'mav', gates: {} }),
      'utf8',
    );

    const surface =
      omp.scopeActivatedSurface?.(
        [hookIrOf(purviewGuardrail, omp.hookCommand)],
        ['mav'],
      ) ?? [];
    const module = surface.find((s) => s.scope === 'mav');
    if (!module) throw new Error('omp emitted no purview module for mav');
    const file = join(home, '.omp', scopeRel(module.filename));
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, module.content, 'utf8');

    // omp bundles `@oh-my-pi/pi-ai` for its extensions; the model call is the one
    // thing stubbed, and it records what the judge was asked.
    const stub = join(
      home,
      '.omp',
      'agent',
      'node_modules',
      '@oh-my-pi',
      'pi-ai',
    );
    mkdirSync(stub, { recursive: true });
    writeFileSync(
      join(stub, 'package.json'),
      JSON.stringify({
        name: '@oh-my-pi/pi-ai',
        type: 'module',
        main: 'index.js',
      }),
    );
    writeFileSync(
      join(stub, 'index.js'),
      `export async function completeSimple(_m, req) {
  (globalThis.__purviewOmpJudged ??= []).push(req.messages[0].content);
  return { content: [{ type: 'text', text: 'VERDICT: PASS' }] };
}\n`,
    );
    globalThis.__purviewOmpJudged = [];
    stubbed = globalThis.__purviewOmpJudged;

    const loaded = (await import(file)) as {
      default: (pi: unknown) => void;
    };
    handlers = [];
    process.env.HOME = home;
    loaded.default({
      cwd: home,
      exec: async (cmd: string, args: string[]) => {
        const r = spawnSync(cmd, args, { encoding: 'utf8', env: process.env });
        return {
          stdout: r.stdout ?? '',
          stderr: r.stderr ?? '',
          code: r.status,
          killed: false,
        };
      },
      sendUserMessage: () => {},
      on: (
        event: string,
        h: (event: unknown, ctx: unknown) => Promise<unknown>,
      ) => {
        if (event === 'tool_call') handlers.push(h);
      },
    });
  });

  afterAll(() => {
    if (homeWas === undefined) Reflect.deleteProperty(process.env, 'HOME');
    else process.env.HOME = homeWas;
  });

  const fire = async (toolName: string, input: Record<string, unknown>) => {
    const before = stubbed.length;
    for (const h of handlers) await h({ toolName, input }, { model: {} });
    return stubbed.slice(before);
  };

  it('judges a write — the act the arrow reserves — with the contract of the persona whose scope holds the module', async () => {
    const judged = await fire('write', { path: '/repo/src/a.ts' });
    expect(judged).toHaveLength(1);
    expect(judged[0]).toContain('agent: mav');
    expect(judged[0]).toContain('codomain: artifact');
    expect(judged[0]).toContain('/repo/src/a.ts');
  });

  it('judges one dispatch once, though two of the cell’s registrations match a task call', async () => {
    // `subagent.dispatch.pre` narrows `task`, and `tool.use.pre` matches every tool,
    // `task` included: one act must not be two judgments.
    const judged = await fire('task', {
      context: 'build the fold',
      tasks: [{ task: 'exactly as written' }],
    });
    expect(judged).toHaveLength(1);
    expect(judged[0]).toContain('DISPATCH to');
    expect(judged[0]).toContain('exactly as written');
  });

  it('never judges a read', async () => {
    expect(await fire('read', { path: '/repo/src/a.ts' })).toEqual([]);
  });
});
