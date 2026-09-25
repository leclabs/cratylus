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
import { beforeAll, describe, expect, it } from 'vitest';
import { architect } from '../src/agents/architect.js';
import { mav } from '../src/agents/mav.js';
import { purviewGuardrail } from '../src/hooks/purview-guardrail.js';

let root: string;
let worker: string;

function workerSource(): string {
  const f = purviewGuardrail.workers?.find(
    (x) => x.filename === 'purview-guardrail.sh',
  );
  if (!f) throw new Error('purview-guardrail.sh not found on the cell');
  return f.content;
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
  writeFileSync(worker, workerSource(), 'utf8');
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
      PURVIEW_EMIT_PAYLOAD: '1',
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
      run(architect.name, 'Task', DISPATCH, { PURVIEW_EMIT_PAYLOAD: '1' })
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
          PURVIEW_EMIT_PAYLOAD: '1',
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
      { PURVIEW_EMIT_PAYLOAD: '1' },
    );
    expect(stdout).toBe('');
    expect(status).toBe(0);
  });

  it('DENIES a BLOCK whose cited span is in the payload', () => {
    const { stdout, status } = run(architect.name, 'Task', DISPATCH, {
      PURVIEW_VERDICT_FILE: verdictFile(
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
      PURVIEW_VERDICT_FILE: verdictFile(
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
        PURVIEW_VERDICT_FILE: verdictFile(
          'VERDICT: PASS\nREASON: the contract routes C→spec to plan\n',
        ),
      },
    );
    expect(stdout).toBe('');
  });

  it('fails OPEN when the judge returns nothing', () => {
    const { stdout, status } = run(architect.name, 'Task', DISPATCH, {
      PURVIEW_VERDICT_FILE: join(root, 'no-such-verdict'),
    });
    expect(stdout).toBe('');
    expect(status).toBe(0);
  });

  it('is silent for a scope carrying no stance manifest (presence is enrollment)', () => {
    const { stdout } = run('nobody', 'Task', DISPATCH, {
      PURVIEW_EMIT_PAYLOAD: '1',
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
      env: { ...process.env, PURVIEW_VERDICT_FILE: file },
    });
    const twice = spawnSync('sh', [worker], {
      input,
      encoding: 'utf8',
      env: { ...process.env, PURVIEW_VERDICT_FILE: file },
    });
    expect(once.stdout).toContain('deny');
    expect(twice.stdout).toBe('');
  });
});
