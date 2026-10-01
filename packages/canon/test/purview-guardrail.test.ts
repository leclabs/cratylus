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
// discarded, an unenrolled scope is silent, and a refused call is refused again on retry.

import { type SpawnSyncReturns, spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectionFacts } from '@cratylus/forge/project';
import { hookIrOf, resolveWorker } from '@cratylus/schema';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { architect } from '../src/agents/architect.js';
import { mav } from '../src/agents/mav.js';
import { judgePayloadCapBytes } from '../src/guard-shell.js';
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

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
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

  it('names the act and its target and nothing else — the definitions of what an act produces are the rubric’s', () => {
    const actLine = (
      agent: string,
      tool: string,
      input: Record<string, unknown>,
    ): string => {
      const { payload } = JSON.parse(
        run(agent, tool, input, { STANCE_EMIT_PAYLOAD: '1' }).stdout,
      ) as { payload: string };
      const lines = payload.split('\n');
      return lines[lines.indexOf('=== THE ACT ABOUT TO FIRE ===') + 1] ?? '';
    };
    expect(actLine(architect.name, 'Task', DISPATCH)).toBe(
      'DISPATCH to `implementer`',
    );
    expect(actLine(mav.name, 'Write', { file_path: '/repo/src/a.ts' })).toBe(
      'WRITE to /repo/src/a.ts',
    );
  });

  it('hands the judge a rubric of a few sentences, not a treatise', () => {
    const rubric = purviewGuardrail.workers?.find(
      (w) => w.filename === 'purview-judge-prompt.md',
    );
    expect(Buffer.byteLength(rubric?.content ?? '')).toBeLessThanOrEqual(2048);
  });

  it('reads a route by name off both spellings of a dispatch — Agent by its role, SendMessage by the running agent’s name', () => {
    const closed =
      'guided-install closed. Make its line whole and ask for release.';
    const fresh = JSON.parse(
      run(
        architect.name,
        'Agent',
        { subagent_type: 'integrator', prompt: closed },
        { STANCE_EMIT_PAYLOAD: '1' },
      ).stdout,
    ) as { payload: string };
    expect(fresh.payload).toContain('DISPATCH to `integrator`');
    expect(fresh.payload.endsWith(`\n${closed}`)).toBe(true);

    const running = JSON.parse(
      run(
        architect.name,
        'SendMessage',
        { agent: 'GuidedInstallIntegrator3', message: closed },
        { STANCE_EMIT_PAYLOAD: '1' },
      ).stdout,
    ) as { payload: string };
    expect(running.payload).toContain('DISPATCH to `GuidedInstallIntegrator3`');
    expect(running.payload.endsWith(`\n${closed}`)).toBe(true);
  });

  it('bounds a 200000-byte dispatch prompt to the judge cap, contract intact, both ends kept', () => {
    const prompt = `HEAD-OF-PROMPT ${'x'.repeat(200_000)} TAIL-OF-PROMPT`;
    const { stdout } = run(
      architect.name,
      'Task',
      { subagent_type: 'planner', prompt },
      { STANCE_EMIT_PAYLOAD: '1' },
    );
    const { payload } = JSON.parse(stdout) as { payload: string };
    expect(Buffer.byteLength(payload)).toBeLessThanOrEqual(
      judgePayloadCapBytes,
    );
    // The law is the holder's own contract and is never what gets cut.
    expect(payload).toContain(architect.role);
    // The instruction of a dispatch may sit at either end.
    expect(payload).toContain('HEAD-OF-PROMPT');
    expect(payload).toContain('TAIL-OF-PROMPT');
    expect(payload).toMatch(/\[ELIDED: \d+ of \d+ bytes from the middle/);
  });

  it('discards a BLOCK citing a span the cap elided, and keeps one citing a span it sent', () => {
    const prompt = `HEAD-SPAN-KEPT ${'y'.repeat(50_000)} MIDDLE-SPAN-ELIDED ${'y'.repeat(50_000)} TAIL-SPAN-KEPT`;
    const dispatch = { subagent_type: 'planner', prompt };
    const verdict = (span: string): string =>
      verdictFile(
        `VERDICT: BLOCK\nREASON: outside the arrow\nEVIDENCE: ${span}\n`,
      );
    const elided = run(architect.name, 'Task', dispatch, {
      STANCE_VERDICT_FILE: verdict('MIDDLE-SPAN-ELIDED'),
    });
    expect(elided.stdout).toMatch(/BLOCK DISCARDED/);
    expect(elided.stdout).not.toMatch(/"permissionDecision":"deny"/);
    const sent = run(architect.name, 'Task', dispatch, {
      STANCE_VERDICT_FILE: verdict('TAIL-SPAN-KEPT'),
    });
    expect(sent.stdout).toMatch(/"permissionDecision":"deny"/);
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

  it('DENIES a BLOCK whose evidence is in the payload', () => {
    const { stdout, status } = run(architect.name, 'Task', DISPATCH, {
      STANCE_VERDICT_FILE: verdictFile(
        'VERDICT: BLOCK\nREASON: the dispatch writes spec, which this arrow excludes\nEVIDENCE: build the fold exactly as written\n',
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

  it('DISCARDS a BLOCK citing evidence the payload does not contain', () => {
    const { stdout } = run(architect.name, 'Task', DISPATCH, {
      STANCE_VERDICT_FILE: verdictFile(
        'VERDICT: BLOCK\nREASON: fabricated\nEVIDENCE: this text never appeared anywhere\n',
      ),
    });
    expect(stdout).not.toContain('permissionDecision');
    expect(stdout).toMatch(/BLOCK DISCARDED/);
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
    expect(stdout).toMatch(/PURVIEW GUARDRAIL — DARK.*NOT judged/);
    expect(status).toBe(0);
  });

  it('is silent for a scope carrying no stance manifest (presence is enrollment)', () => {
    const { stdout } = run('nobody', 'Task', DISPATCH, {
      STANCE_EMIT_PAYLOAD: '1',
    });
    expect(stdout).toBe('');
  });

  it('judges a retry of a refused call again and denies it again — the refusal stays', () => {
    // The stub counts how often the judge is reached. A guard that remembers a denial and
    // lets the identical second call through unjudged would leave the count at 1.
    const counter = join(root, `judged-${Math.random()}.log`);
    const stub = join(root, `judge-stub-${Math.random()}.sh`);
    writeFileSync(
      stub,
      `#!/bin/sh\ncat >/dev/null\necho x >> "${counter}"\nprintf 'VERDICT: BLOCK\\nREASON: outside the arrow\\nEVIDENCE: build the fold exactly as written\\n'\n`,
      'utf8',
    );
    const input = JSON.stringify({
      stance_scope: scopeOf(architect.name),
      tool_name: 'Task',
      tool_input: DISPATCH,
      session_id: `retry-${process.pid}-${Date.now()}`,
      cwd: root,
    });
    const fireOnce = (): string =>
      spawnSync('sh', [worker], {
        input,
        encoding: 'utf8',
        env: { ...process.env, STANCE_JUDGE_CMD: `sh ${stub}` },
      }).stdout;
    const once = fireOnce();
    const twice = fireOnce();
    expect(once).toMatch(/"permissionDecision":"deny"/);
    expect(twice).toMatch(/"permissionDecision":"deny"/);
    expect(readFileSync(counter, 'utf8').trim().split('\n')).toHaveLength(2);
  });

  it('denies a BLOCK that carries no evidence line', () => {
    const { stdout } = run(architect.name, 'Task', DISPATCH, {
      STANCE_VERDICT_FILE: verdictFile(
        'VERDICT: BLOCK\nREASON: the dispatch writes spec, which this arrow excludes\n',
      ),
    });
    expect(stdout).toMatch(/"permissionDecision":"deny"/);
  });
});

// A GUARD THAT LETS A CALL THROUGH WITHOUT A VERDICT SAYS SO, where the operator reads it.
//
// Silence is the answer for "judged, pass" and nothing else: a purview guard whose judge is
// gone, whose `jq` is missing or whose Target never landed is observationally identical to a
// guard that found nothing, forever. On Claude Code a hook's plain stdout on exit 0 reaches
// nobody, so the notice is the hook's JSON `systemMessage`; omp's extension bridge reads the
// worker's plain stdout, so its form is the bare line. The workers are run as each harness
// receives them — resolved against that harness's own facts — under a PATH that holds only
// `sh` and `cat` where the point is that `jq` is gone.
const FORMS = [
  {
    harness: 'omp',
    hooks: ['.omp', 'hooks'],
    base: ['.omp', 'agent'],
    enroll: (scope: string): Record<string, unknown> => ({
      stance_scope: scope,
    }),
    notice: (stdout: string): string => {
      expect(stdout.trim(), 'nothing was said').not.toBe('');
      expect(stdout.startsWith('{'), 'omp reads a bare line').toBe(false);
      return stdout;
    },
  },
  {
    harness: 'claude',
    hooks: ['.claude', 'hooks'],
    base: ['.claude'],
    enroll: (): Record<string, unknown> => ({ agent_type: architect.name }),
    notice: (stdout: string): string => {
      expect(stdout.trim(), 'nothing was said').not.toBe('');
      const said = JSON.parse(stdout) as Record<string, unknown>;
      expect(Object.keys(said)).toEqual(['systemMessage']);
      return String(said.systemMessage);
    },
  },
] as const;

describe.each(FORMS)(
  'purview guardrail — $harness: a call let through without a verdict says so',
  (form) => {
    let home: string;
    let workerPath: string;
    let scope: string;
    let stub: string;
    let dead: string;

    beforeAll(() => {
      home = mkdtempSync(join(root, `${form.harness}-`));
      const hooks = join(home, ...form.hooks, 'purview-guardrail');
      mkdirSync(hooks, { recursive: true });
      workerPath = join(hooks, 'purview-guardrail.sh');
      writeFileSync(workerPath, workerSource(form.harness), 'utf8');
      chmodSync(workerPath, 0o755);
      const agents = join(home, ...form.base, 'agents');
      mkdirSync(agents, { recursive: true });
      writeFileSync(
        join(agents, `${architect.name}.md`),
        `# ${architect.name}\n\n## Role\n\n${architect.role}\n\n## Formality\n\nplain\n`,
        'utf8',
      );
      scope = join(home, ...form.base, 'personas', architect.name);
      mkdirSync(join(scope, 'stance'), { recursive: true });
      writeFileSync(
        join(scope, 'stance', 'manifest.json'),
        JSON.stringify({ agent: architect.name, gates: {} }),
        'utf8',
      );
      stub = join(home, 'stub');
      mkdirSync(stub);
      symlinkSync('/bin/sh', join(stub, 'sh'));
      symlinkSync('/bin/cat', join(stub, 'cat'));
      dead = join(home, 'dead-judge.sh');
      writeFileSync(dead, '#!/bin/sh\nexit 5\n');
    });

    const fire = (
      env: Record<string, string>,
      over: Record<string, unknown> = {},
      stdin?: string,
    ) =>
      spawnSync('/bin/sh', [workerPath], {
        input:
          stdin ??
          JSON.stringify({
            ...form.enroll(scope),
            tool_name: 'Task',
            tool_input: DISPATCH,
            session_id: `open-${Math.random()}`,
            cwd: home,
            ...over,
          }),
        encoding: 'utf8',
        env: { ...process.env, ...env },
      });

    /** Exits 0, and names the guard and that the call was not judged. */
    const said = (r: SpawnSyncReturns<string>): string => {
      expect(r.status).toBe(0);
      const text = form.notice(r.stdout);
      expect(text).toContain('PURVIEW GUARDRAIL');
      expect(text).toMatch(/NOT judged/);
      return text;
    };

    it('says so when jq is missing — a PATH of sh and cat', () => {
      const r = spawnSync('/bin/sh', [workerPath], {
        input: JSON.stringify({
          ...form.enroll(scope),
          tool_name: 'Task',
          tool_input: DISPATCH,
          session_id: 'nojq',
          cwd: home,
        }),
        encoding: 'utf8',
        env: { PATH: stub },
      });
      expect(said(r)).toMatch(/jq/);
    });

    it('says so when the hook receives no input', () => {
      expect(said(fire({}, {}, ''))).toMatch(/no input/);
    });

    it('says so when the judge file names nothing', () => {
      const r = fire({ STANCE_VERDICT_FILE: join(home, 'no-such-verdict') });
      expect(said(r)).toMatch(/judge did not answer/);
    });

    it('says so when the judge command fails', () => {
      const r = fire({ STANCE_JUDGE_CMD: `sh ${dead}` });
      expect(said(r)).toMatch(/judge did not answer/);
    });

    it('says so when the verdict is unparseable', () => {
      const r = fire({
        STANCE_VERDICT_FILE: verdictFile(
          'the model rambled and gave no verdict',
        ),
      });
      expect(said(r)).toMatch(/unparseable/);
    });

    it('says so when the persona’s Target never landed', () => {
      const r = fire({ PURVIEW_AGENT_MD: join(home, 'no-such-target.md') });
      expect(said(r)).toMatch(/Target/);
    });

    it('says so when the manifest names no agent', () => {
      const anon = join(home, 'anon');
      mkdirSync(join(anon, 'stance'), { recursive: true });
      writeFileSync(
        join(anon, 'stance', 'manifest.json'),
        JSON.stringify({ gates: {} }),
        'utf8',
      );
      expect(said(fire({}, { stance_scope: anon }))).toMatch(/names no agent/);
    });

    it('says so when the payload names no tool', () => {
      expect(said(fire({}, { tool_name: '' }))).toMatch(/names no tool/);
    });

    it('denies the same call every time it is retried, and says nothing about a cap', () => {
      const file = verdictFile(
        'VERDICT: BLOCK\nREASON: outside the arrow\nEVIDENCE: build the fold exactly as written\n',
      );
      const session = {
        session_id: `retry-${form.harness}-${process.pid}-${Date.now()}`,
      };
      for (const attempt of [1, 2, 3]) {
        const r = fire({ STANCE_VERDICT_FILE: file }, session);
        expect(r.stdout, `attempt ${attempt}`).toContain('permissionDecision');
        expect(r.stdout).not.toMatch(/re-entry cap/);
      }
    });

    it('says so when a block is discarded for citing evidence the call does not contain', () => {
      const r = fire({
        STANCE_VERDICT_FILE: verdictFile(
          'VERDICT: BLOCK\nREASON: fabricated\nEVIDENCE: this text never appeared anywhere\n',
        ),
      });
      expect(said(r)).toMatch(/BLOCK DISCARDED/);
      expect(r.stdout).not.toContain('permissionDecision');
    });

    it('carries quotes and backslashes in a notice intact', () => {
      const span = 'he said "no" \\ and left';
      const r = fire({
        STANCE_VERDICT_FILE: verdictFile(
          `VERDICT: BLOCK\nREASON: fabricated\nEVIDENCE: ${span}\n`,
        ),
      });
      expect(said(r)).toContain(span);
    });

    it('stays SILENT on a judged pass — the one silent verdict', () => {
      const r = fire({
        STANCE_VERDICT_FILE: verdictFile(
          'VERDICT: PASS\nREASON: routes to plan\n',
        ),
      });
      expect(r.status).toBe(0);
      expect(r.stdout).toBe('');
    });

    it('stays SILENT for a persona no manifest enrolls, and for a read', () => {
      const bare = join(home, 'bare');
      mkdirSync(bare);
      expect(fire({}, { stance_scope: bare, agent_type: '' }).stdout).toBe('');
      expect(fire({}, { tool_name: 'Read' }).stdout).toBe('');
    });

    // A REFUSAL NEVER STRANDS THE AGENT. The judge here is a stub that counts its calls and
    // always BLOCKs, so a contested fire that is not judged shows as a count that did not move.
    describe('a refusal can be contested', () => {
      const REASON = 'the dispatch carries a spec, which this arrow excludes';
      const NOTICE = 'the unit is routed by name';
      let tmp: string;
      let env: Record<string, string>;
      let counter: string;
      let session: string;

      beforeEach(() => {
        tmp = mkdtempSync(join(home, 'contest-'));
        counter = join(tmp, 'judged');
        const judge = join(tmp, 'judge.sh');
        writeFileSync(
          judge,
          `#!/bin/sh\ncat >/dev/null\necho x >> "${counter}"\nprintf 'VERDICT: BLOCK\\nREASON: ${REASON}\\nEVIDENCE: build the fold exactly as written\\n'\n`,
        );
        env = {
          STANCE_JUDGE_CMD: `sh ${judge}`,
          TMPDIR: tmp,
          GUARD_CONTEST_LOG: join(tmp, 'logs', 'contests.log'),
        };
        session = `contest-${Math.random()}`;
      });

      const judged = (): number =>
        existsSync(counter)
          ? readFileSync(counter, 'utf8').trim().split('\n').length
          : 0;
      const fireDispatch = (prompt = DISPATCH.prompt, over = env) =>
        fire(over, {
          session_id: session,
          tool_input: { ...DISPATCH, prompt },
        });
      /** The deny, and the absolute path of the `.contest` file its reason spells out. */
      const refusedAt = (r: SpawnSyncReturns<string>): string => {
        const out = JSON.parse(r.stdout) as {
          hookSpecificOutput: {
            permissionDecision: string;
            permissionDecisionReason: string;
          };
        };
        expect(out.hookSpecificOutput.permissionDecision).toBe('deny');
        const reason = out.hookSpecificOutput.permissionDecisionReason;
        expect(
          reason.startsWith(
            `PURVIEW GUARDRAIL — denied this Task call: ${REASON}`,
          ),
        ).toBe(true);
        const path = reason.match(/> '([^']+\.contest)'/)?.[1] ?? '';
        expect(isAbsolute(path)).toBe(true);
        const dir = join(
          tmp,
          'guardrail-contest',
          'purview-guardrail',
          session,
        );
        expect(dirname(path)).toBe(dir);
        expect(basename(path)).toMatch(/^\d+\.contest$/);
        return path;
      };
      const logged = (): Record<string, string>[] =>
        readFileSync(env.GUARD_CONTEST_LOG as string, 'utf8')
          .trim()
          .split('\n')
          .map((l) => JSON.parse(l) as Record<string, string>);

      it('names the way forward in the refusal, records the judge’s reason, and lets the contested call through unjudged — once', () => {
        const path = refusedAt(fireDispatch());
        expect(judged()).toBe(1);
        expect(
          readFileSync(path.replace(/contest$/, 'refused'), 'utf8').trim(),
        ).toBe(REASON);

        writeFileSync(path, `${NOTICE}\n`);
        const contested = fireDispatch();
        expect(contested.status).toBe(0);
        expect(contested.stdout).not.toContain('permissionDecision');
        const said = form.notice(contested.stdout);
        expect(said).toContain('PURVIEW GUARDRAIL');
        expect(said).toContain(NOTICE);
        expect(said).toContain(env.GUARD_CONTEST_LOG as string);
        expect(judged()).toBe(1);
        expect(existsSync(path)).toBe(false);
        expect(existsSync(path.replace(/contest$/, 'refused'))).toBe(false);
        const [line, ...more] = logged();
        expect(more).toEqual([]);
        expect(Object.keys(line ?? {}).sort()).toEqual([
          'act',
          'agent',
          'contest',
          'guard',
          'refusal',
          'session',
          'time',
        ]);
        expect(line).toMatchObject({
          guard: 'purview-guardrail',
          session,
          agent: architect.name,
          act: 'Task',
          refusal: REASON,
          contest: NOTICE,
        });
        expect(line?.time).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);

        // The contest was spent: the same call is judged again and refused again.
        refusedAt(fireDispatch());
        expect(judged()).toBe(2);
      });

      it('leaves a call judged when the contest was written for another call', () => {
        const other = refusedAt(fireDispatch());
        writeFileSync(other, `${NOTICE}\n`);
        refusedAt(fireDispatch(`${DISPATCH.prompt} and then some`));
        expect(judged()).toBe(2);
        expect(existsSync(other)).toBe(true);
      });

      it('does not take an empty contest for one', () => {
        const path = refusedAt(fireDispatch());
        writeFileSync(path, '');
        refusedAt(fireDispatch());
        expect(judged()).toBe(2);
      });

      it('reads a session id that is not one path segment as nosession', () => {
        session = '../escape';
        const reason = JSON.parse(fireDispatch().stdout).hookSpecificOutput
          .permissionDecisionReason as string;
        expect(reason).toContain(
          `${join(tmp, 'guardrail-contest', 'purview-guardrail', 'nosession')}/`,
        );
      });

      it('lets a write under the contest directory through without asking the judge', () => {
        const r = fire(env, {
          session_id: session,
          tool_name: 'Write',
          tool_input: {
            file_path: join(
              tmp,
              'guardrail-contest',
              'purview-guardrail',
              session,
              '1.contest',
            ),
            content: 'why',
          },
        });
        expect(r.status).toBe(0);
        expect(r.stdout).toBe('');
        expect(judged()).toBe(0);
      });

      it('does not let a path that climbs out of the contest directory through', () => {
        const r = fire(env, {
          session_id: session,
          tool_name: 'Write',
          tool_input: {
            file_path: `${join(tmp, 'guardrail-contest')}/../elsewhere.ts`,
            content: 'build the fold exactly as written',
          },
        });
        expect(r.status).toBe(0);
        expect(judged()).toBe(1);
      });

      it('still lets the contested call through, and says it was not recorded, when the log cannot be written', () => {
        const file = join(tmp, 'a-file');
        writeFileSync(file, '');
        const unwritable = {
          ...env,
          GUARD_CONTEST_LOG: join(file, 'contests.log'),
        };
        const path = refusedAt(fireDispatch(DISPATCH.prompt, unwritable));
        writeFileSync(path, `${NOTICE}\n`);
        const contested = fireDispatch(DISPATCH.prompt, unwritable);
        expect(contested.status).toBe(0);
        expect(contested.stdout).not.toContain('permissionDecision');
        const said = form.notice(contested.stdout);
        expect(said).toContain(NOTICE);
        expect(said).toMatch(/was not recorded/);
        expect(judged()).toBe(1);
      });
    });
  },
);

// THE CLAUDE FORM OF THE SCOPE. Claude Code places no dispatcher, so the payload carries
// no `stance_scope`; it NAMES the running agent as `agent_type` (on the main thread of a
// `claude --agent` session, and on neither for a bare session). The
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

  it('is not bound inside a subagent: an `agent_id` payload exits 0, says nothing and leaves the judge unasked', () => {
    const inside = runClaude({
      agent_type: architect.name,
      agent_id: 'a1b2c3',
    });
    expect(inside.status).toBe(0);
    expect(inside.stdout).toBe('');
    // The same payload in a main session is judged, so the silence above is the gate's.
    const { payload } = JSON.parse(
      runClaude({ agent_type: architect.name }).stdout,
    ) as { payload: string };
    expect(payload).toContain(architect.role);
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
    const ctx = { model: {}, agent: { kind: 'main', id: '0-main', depth: 0 } };
    for (const h of handlers) await h({ toolName, input }, ctx);
    return stubbed.slice(before);
  };

  it('judges a write — the act the arrow reserves — with the contract of the persona whose scope holds the module', async () => {
    const judged = await fire('write', { path: '/repo/src/a.ts' });
    expect(judged).toHaveLength(1);
    expect(judged[0]).toContain('agent: mav');
    expect(judged[0]).toContain('WRITE to /repo/src/a.ts');
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
