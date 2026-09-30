// GATE — a guardrail that cannot judge must not pass as one that judged and found nothing.
//
// THE CLASS, not the instance. `480b13d` fixed this exact defect in the memory nudge ("a
// broken runtime read as a clean bill of health, silently and forever") and `memory-nudge.
// test.ts` holds it there as a permanent fixture. The stance guardrail had the identical
// shape — `verdict="$(… $JUDGE_CMD …)" || allow_stop` — and NO vitest gate of any kind, so
// nothing was watching. That asymmetry is the whole reason it survived: the class was fixed
// once, at one site, and never made a rule.
//
// WHY SILENCE IS THE DANGEROUS ANSWER HERE. A working guardrail on a clean turn and a
// guardrail whose judge is gone produce the SAME observable — empty stdout, exit 0. So the
// failure mode is not a missed block; it is a guardrail that has stopped existing while
// still appearing green on every turn. `apparatus-under-zero-trust`: wired, scoped,
// byte-identical, and passing everything because it is dark.
//
// WHAT IS ASSERTED, AND WHAT IS DELIBERATELY NOT:
//   (a) a broken judge yields a DARK announcement on stdout, never a bare pass;
//   (b) it still exits 0 — never wedging a turn is load-bearing and argued in the cell,
//       and this gate must not be readable as an argument against it;
//   (c) a repo that never opted in stays SILENT — the negative control. Without it this
//       gate would pass just as well against a hook that shouted on every turn, which is
//       a different broken guardrail, not a fixed one.
//
// stderr is NOT asserted: the cell routes its subprocess calls through `2>/dev/null`, so
// stderr is empty by design and an assertion on it would itself be a dark check.

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
import { join } from 'node:path';
import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectionFacts } from '@cratylus/forge/project';
import { resolveWorker } from '@cratylus/schema';
import { beforeAll, describe, expect, it } from 'vitest';
import { handoff } from '../src/dimensions/autonomy/handoff.js';
import { stanceGuardrailPre } from '../src/hooks/stance-guardrail-pre.js';
import { stanceGuardrail } from '../src/hooks/stance-guardrail.js';

let root: string;
let worker: string;
let transcript: string;

/** The guardrail cell projects several files; the worker is the hook entrypoint. */
function workerSource(harness = 'omp'): string {
  const f = stanceGuardrail.workers?.find(
    (x) => x.filename === 'stance-guardrail.sh',
  );
  if (!f) throw new Error('stance-guardrail.sh not found on the cell');
  return resolveWorker(
    f,
    projectionFacts(adapterByName(harness)),
    stanceGuardrail.speech,
  ).content;
}

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'stance-dark-'));
  worker = join(root, 'stance-guardrail.sh');
  writeFileSync(worker, workerSource(), 'utf8');
  chmodSync(worker, 0o755);

  // A minimal but REAL transcript: one assistant turn with closing text. The guardrail must
  // get far enough to need the judge, otherwise a dark verdict would prove only that the
  // transcript was unreadable.
  transcript = join(root, 'transcript.jsonl');
  writeFileSync(
    transcript,
    `${JSON.stringify({
      type: 'user',
      message: { content: 'do the thing' },
    })}\n${JSON.stringify({
      type: 'assistant',
      message: {
        content: [{ type: 'text', text: 'I will do the thing next.' }],
      },
    })}\n`,
    'utf8',
  );
});

/** Run the worker with the judge command under our control, in an enrolled scope. */
function run(judgeCmd: string) {
  // The repo is the session's cwd and nothing more: the per-repo opt-in is gone,
  // so there is no flag to set and no off-by-default to arrange.
  const repo = mkdtempSync(join(root, 'repo-'));
  mkdirSync(join(repo, '.git'), { recursive: true });
  spawnSync('git', ['init', '-q'], { cwd: repo });
  // PRESENCE IS ENROLLMENT: the worker judges the scope it is handed, and a
  // scope carrying no manifest is silent. The fixture therefore places one —
  // which is also the shape a real persona projection lands.
  const scope = mkdtempSync(join(root, 'scope-'));
  mkdirSync(join(scope, 'stance'), { recursive: true });
  writeFileSync(
    join(scope, 'stance', 'manifest.json'),
    JSON.stringify({
      agent: 'nico',
      gates: { 'stance-guardrail': { moments: ['turn.end'] } },
    }),
    'utf8',
  );
  return spawnSync('sh', [worker], {
    input: JSON.stringify({
      session_id: 'dark-test',
      cwd: repo,
      agent_type: 'nico',
      stance_scope: scope,
      transcript_path: transcript,
    }),
    encoding: 'utf8',
    env: { ...process.env, STANCE_JUDGE_CMD: judgeCmd, HOME: root },
  });
}

describe('STANCE GUARDRAIL — a dark judge is not a clean verdict', () => {
  it('ANNOUNCES darkness when the judge cannot answer, instead of passing silently', () => {
    const broken = join(root, 'broken-judge.sh');
    writeFileSync(broken, '#!/bin/sh\necho "boom" >&2\nexit 5\n');
    chmodSync(broken, 0o755);

    const res = run(`sh ${broken}`);

    // Never wedge the turn — this stays true and the gate says so explicitly.
    expect(res.status).toBe(0);
    // And it must not be silent: silence is the "judged, no collapse" answer.
    expect(res.stdout).toMatch(/DARK/);
    expect(res.stdout).toMatch(/NOT judged/);
    // A dark turn is not a BLOCK either — it is an absence of verdict, not a conviction.
    expect(res.stdout).not.toContain('"decision"');
  });

  it('stays SILENT in a scope that carries no manifest — the negative control', () => {
    // The negative control used to be "the repo never opted in". That flag is gone: it asked
    // whether a guard may run in a DIRECTORY, and a stance belongs to the agent. The control
    // that remains is the real one — an unenrolled scope is silent, and silence there means
    // NOT ENROLLED rather than checked-and-clean.
    const broken = join(root, 'broken-judge.sh');
    const bare = mkdtempSync(join(root, 'bare-scope-'));
    const res = spawnSync('sh', [worker], {
      input: JSON.stringify({
        session_id: 'dark-test',
        cwd: root,
        agent_type: 'nico',
        stance_scope: bare,
        transcript_path: transcript,
      }),
      encoding: 'utf8',
      env: { ...process.env, STANCE_JUDGE_CMD: `sh ${broken}`, HOME: root },
    });
    expect(res.status).toBe(0);
    expect(res.stdout).toBe('');
  });

  it('carries the dark/clean distinction in the CELL, not only in the projection', () => {
    // The .sh is a byte-locked deploy target; the law has to live in the source cell or a
    // regeneration would quietly drop it.
    const src = workerSource();
    expect(src).toMatch(/dark\(\)/);
    expect(src).toMatch(/judge did not answer/);
    // The self-description must not still claim the old unconditional fail-open, or the
    // header becomes a second artifact drifting away from the behaviour.
    expect(src).toMatch(/NEVER SILENTLY-CLEAN/);
  });
});

// POSITION SOUNDNESS — the close is not the turn.
//
// Every rubric rule that can fire is a claim about how the turn ENDED. The payload used to be
// the whole turn flattened to one blob, and the EVIDENCE check grepped that blob, so a span
// from a mid-turn preamble authenticated exactly as well as a genuine dangling close. Measured
// on this hook's own authoring session: three blocks fired, every cited span preceded the last
// tool call, every turn ended with a ~3000-char report, and all three reasons were false about
// what followed. An independent replay of the live judge reproduced the stated reason 0/15.
//
// These fixtures pin the projection that fixes it. They are the shapes that actually occurred.
describe('STANCE GUARDRAIL — a mid-turn preamble is not the turn s close', () => {
  // The projection is EXTRACTED FROM THE SHIPPED CELL, never transcribed. A copied jq would
  // test a copy: the cell could regress and these fixtures would stay green against the
  // transcription — a self-description drifting from the artifact it claims to describe.
  const closeJq = (): string => {
    const src = workerSource();
    const m = src.match(/asst_close="\$\(jq -rs '([\s\S]*?)' "\$transcript"/);
    if (!m?.[1]) throw new Error('asst_close jq not found in the cell');
    return m[1].replace(/\\\\n/g, '\\n');
  };

  let seq = 0;
  const closeOf = (jsonl: string): string => {
    seq += 1;
    const f = join(root, `close-${seq}.jsonl`);
    writeFileSync(f, jsonl, 'utf8');
    const res = spawnSync('jq', ['-rs', closeJq(), f], { encoding: 'utf8' });
    expect(res.status, `jq failed: ${res.stderr}`).toBe(0);
    return res.stdout.trim();
  };

  const line = (o: unknown) => `${JSON.stringify(o)}\n`;
  const user = line({ type: 'user', message: { content: 'go' } });
  const text = (t: string) =>
    line({
      type: 'assistant',
      message: { content: [{ type: 'text', text: t }] },
    });
  const tool = line({
    type: 'assistant',
    message: { content: [{ type: 'tool_use', name: 'Bash', id: 't1' }] },
  });

  it('EXCLUDES a preamble followed by a tool call and a report — the live false-positive shape', () => {
    const close = closeOf(
      user +
        text('Adjudicating. The survey overturned my diagnosis:') +
        tool +
        text('Four commits shipped. Tree clean.'),
    );
    expect(close).toBe('Four commits shipped. Tree clean.');
    expect(close).not.toContain('Adjudicating');
  });

  it('KEEPS a dangling commitment after a tool call — the shape that MUST still convict', () => {
    expect(closeOf(user + tool + text("I'll run the suite next."))).toBe(
      "I'll run the suite next.",
    );
  });

  it('KEEPS a dangling commitment when the turn used no tools at all', () => {
    expect(closeOf(user + text("I'll run the suite next."))).toBe(
      "I'll run the suite next.",
    );
  });

  it('yields EMPTY when the turn ends ON a tool call — the deliberate fallback case', () => {
    expect(closeOf(user + text('Working.') + tool)).toBe('');
  });
});

// BUDGET EXHAUSTION IS NOT A CLEAN TURN — the same defect, third site.
//
// The cap exists so a block loop cannot wedge work, and that property is real. But exhaustion
// used to print to stderr and allow the stop, and stderr reaches neither agent nor operator —
// so an exhausted budget was observationally identical to a clean turn, for the rest of the
// session. Enforcement switched off precisely when violation density was highest (three
// convictions already), and said nothing. Observed live in this cell's own authoring session.
describe('STANCE GUARDRAIL — a spent bypass announces itself', () => {
  it('says BYPASS SPENT on stdout instead of going quiet, and still allows the stop', () => {
    const src = workerSource();
    // The notice must reach a reader: stdout, not stderr.
    expect(src).toMatch(/BYPASS SPENT/);
    expect(src).not.toMatch(/block budget %s exhausted[^\n]*>&2/);
    // It must NOT convert the bypass into a block — the escape valve is the reason it exists.
    const spent = src.slice(src.indexOf('BYPASS SPENT'));
    expect(spent.slice(0, 400)).toMatch(/allow_stop/);
    expect(spent.slice(0, 400)).not.toMatch(/"decision"\s*:\s*"block"/);
  });
});

// THE BYPASS MUST RE-ARM — a one-shot escape, never a session-wide disable.
//
// The original code compared the block count to the cap and allowed the stop WITHOUT zeroing the
// counter, so the count stayed at the cap forever and every subsequent turn passed. A one-turn
// escape valve silently became a session-wide off switch. Measured in this cell's own authoring
// session: the counter sat at 3 while collapse after collapse went unpoliced, and the two an
// operator eventually caught both fell inside that window.
describe('STANCE GUARDRAIL — spending the bypass re-arms the gate', () => {
  it('ZEROES the counter when the bypass is spent, so the next collapsed turn blocks again', () => {
    const src = workerSource();
    const i = src.indexOf('BYPASS SPENT');
    expect(i, 'no bypass branch found').toBeGreaterThan(-1);
    // The reset must be in the SAME branch, before the stop is allowed.
    const branch = src.slice(src.lastIndexOf('if [', i), i + 400);
    expect(
      branch,
      'bypass does not reset the counter — it is a session-wide disable',
    ).toMatch(/printf '0' > "\$count_file"/);
    expect(branch).toMatch(/allow_stop/);
    // And it must say the gate is re-armed, not that enforcement is off.
    expect(src).toMatch(/RE-ARMED as of now/);
    expect(src).not.toMatch(/enforcement is now OFF for this session/);
  });
});

// THE DECLARED CONTRACT MUST BE THE DECLARED CONTRACT — not a copy of it.
//
// The rubric's "handoff laws" section is headed "the agent's DECLARED contract — judge against
// these" and then TRANSCRIBES the dimension value by hand. Nothing reads the cell. Change
// `dimensions/autonomy/handoff.ts` and the rubric goes on judging against the stale string,
// silently, while claiming to be the declaration.
//
// That is two homes for one concept (MODEL: `|home(c)| = 1`), and it is the shape that makes
// autonomy un-configurable: the agent's declared authority and the gate that enforces it are
// independent transcriptions of one intent, so editing the declaration changes nothing about
// what is enforced. Until the adapter can compile a dimension into a predicate, the least this
// corpus can do is FAIL when the two drift — a distinction living only in prose will be lost.
describe('STANCE RUBRIC — the transcribed dimension value tracks its cell', () => {
  it('quotes `handoff` exactly as the autonomy cell declares it', () => {
    const rubric = stanceGuardrail.workers?.find(
      (w) => w.filename === 'stance-judge-prompt.md',
    )?.content;
    expect(rubric, 'rubric worker not found on the cell').toBeTruthy();
    // The single source: the dimension cell itself.
    expect(rubric).toContain(handoff);
  });
});

// THE CLAUDE FORM OF THE SCOPE — a guard that fires and can never judge.
//
// Claude Code places no dispatcher, so its payload carries no `stance_scope`; it names the
// running agent as `agent_type`. This worker used to read `.stance_scope` alone, so on
// claude it fired from the global settings on every turn and exited at its scope gate
// with nothing on stdout — observationally identical to a clean turn, forever. The
// worker now derives the persona's scope from the name under its own harness home
// (`<home>/hooks/<id>/` two hops up, then the persona root), and a manifest there is
// enrollment. The layout is the one the claude adapter deploys.
describe('STANCE GUARDRAIL — the claude form of the scope (agent_type only)', () => {
  let claudeWorker: string;
  let claudeTranscript: string;
  let broken: string;
  let home: string;

  beforeAll(() => {
    home = mkdtempSync(join(tmpdir(), 'stance-claude-'));
    const dir = join(home, '.claude', 'hooks', 'stance-guardrail');
    mkdirSync(dir, { recursive: true });
    claudeWorker = join(dir, 'stance-guardrail.sh');
    writeFileSync(claudeWorker, workerSource('claude'), 'utf8');
    chmodSync(claudeWorker, 0o755);
    // ONLY `nico` is enrolled: a manifest under the persona root is the whole of it.
    const scope = join(home, '.claude', 'personas', 'nico', 'stance');
    mkdirSync(scope, { recursive: true });
    writeFileSync(
      join(scope, 'manifest.json'),
      JSON.stringify({
        agent: 'nico',
        gates: { 'stance-guardrail': { moments: ['turn.end'] } },
      }),
      'utf8',
    );
    claudeTranscript = join(home, 'transcript.jsonl');
    writeFileSync(claudeTranscript, readFileSync(transcript), 'utf8');
    broken = join(home, 'broken-judge.sh');
    writeFileSync(broken, '#!/bin/sh\necho "boom" >&2\nexit 5\n');
    chmodSync(broken, 0o755);
  });

  const runClaude = (payload: Record<string, unknown>) =>
    spawnSync('sh', [claudeWorker], {
      input: JSON.stringify({
        session_id: `dark-claude-${Math.random()}`,
        cwd: home,
        transcript_path: claudeTranscript,
        ...payload,
      }),
      encoding: 'utf8',
      env: { ...process.env, STANCE_JUDGE_CMD: `sh ${broken}`, HOME: home },
    });

  it('reaches the judge for the enrolled persona the payload names — a dead judge announces itself', () => {
    const res = runClaude({ agent_type: 'nico' });
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/DARK/);
    expect(res.stdout).toMatch(/NOT judged/);
  });

  it('is silent on a bare session — the payload names no agent', () => {
    expect(runClaude({}).stdout).toBe('');
    expect(runClaude({ agent_type: '' }).stdout).toBe('');
  });

  it('is silent for a named agent that carries no manifest', () => {
    expect(runClaude({ agent_type: 'general-purpose' }).stdout).toBe('');
  });

  it('never builds a scope path out of a name that is not one directory', () => {
    expect(runClaude({ agent_type: '../personas/nico' }).stdout).toBe('');
  });
});

// WHOSE TEXT, AND WHICH MESSAGE. Two payload facts the claude form depends on, each
// observed live on Claude Code 2.1.285. A SubagentStop payload names the PARENT's
// transcript (`transcript_path`) and the subagent's own (`agent_transcript_path`), and the
// scope it resolves is the subagent's, so the turn judged must be the subagent's. And a Stop
// payload fires BEFORE the final assistant message reaches the transcript: that message is
// only in `last_assistant_message`, so a turn that is only text had nothing to judge.
describe('STANCE GUARDRAIL — what the claude form judges', () => {
  let claudeWorker: string;
  let recorded: string;
  let home: string;
  const line = (o: unknown) => `${JSON.stringify(o)}\n`;
  const user = (text: string) =>
    line({ type: 'user', message: { content: text } });
  const said = (text: string) =>
    line({ type: 'assistant', message: { content: [{ type: 'text', text }] } });
  const tooled = line({
    type: 'assistant',
    message: { content: [{ type: 'tool_use', name: 'Agent' }] },
  });

  const write = (name: string, body: string): string => {
    const p = join(home, name);
    writeFileSync(p, body, 'utf8');
    return p;
  };

  beforeAll(() => {
    home = mkdtempSync(join(tmpdir(), 'stance-claude-turn-'));
    const dir = join(home, '.claude', 'hooks', 'stance-guardrail');
    mkdirSync(dir, { recursive: true });
    claudeWorker = join(dir, 'stance-guardrail.sh');
    writeFileSync(claudeWorker, workerSource('claude'), 'utf8');
    chmodSync(claudeWorker, 0o755);
    const scope = join(home, '.claude', 'personas', 'nico', 'stance');
    mkdirSync(scope, { recursive: true });
    writeFileSync(
      join(scope, 'manifest.json'),
      JSON.stringify({ agent: 'nico', gates: {} }),
      'utf8',
    );
    // A judge that records exactly what it was handed, and passes.
    recorded = join(home, 'recorded');
    const judge = join(home, 'recording-judge.sh');
    writeFileSync(
      judge,
      `#!/bin/sh\ncat > ${recorded}\nprintf 'VERDICT: PASS\\n'\n`,
    );
    chmodSync(judge, 0o755);
  });

  const judgedBy = (payload: Record<string, unknown>): string | null => {
    rmSync(recorded, { force: true });
    spawnSync('sh', [claudeWorker], {
      input: JSON.stringify({
        session_id: `turn-${Math.random()}`,
        cwd: home,
        agent_type: 'nico',
        ...payload,
      }),
      encoding: 'utf8',
      env: {
        ...process.env,
        STANCE_JUDGE_CMD: `sh ${join(home, 'recording-judge.sh')}`,
        HOME: home,
      },
    });
    return existsSync(recorded) ? readFileSync(recorded, 'utf8') : null;
  };

  it('judges a turn that is only text, from the payload, before the transcript holds it', () => {
    const seen = judgedBy({
      transcript_path: write('t1.jsonl', user('do it')),
      last_assistant_message: 'CLOSING-TEXT-ONLY-TURN',
    });
    expect(seen).toContain('CLOSING-TEXT-ONLY-TURN');
  });

  it('judges a tool turn on its close, not on the tools alone', () => {
    const seen = judgedBy({
      transcript_path: write(
        't2.jsonl',
        user('do it') + said('preamble') + tooled,
      ),
      last_assistant_message: 'CLOSE-AFTER-THE-TOOLS',
    });
    expect(seen).toContain('CLOSE-AFTER-THE-TOOLS');
  });

  it('does not count the close twice when the transcript already holds it', () => {
    const seen = judgedBy({
      transcript_path: write(
        't3.jsonl',
        user('do it') + said('ALREADY-WRITTEN'),
      ),
      last_assistant_message: 'ALREADY-WRITTEN',
    });
    expect(seen?.match(/ALREADY-WRITTEN/g)).toHaveLength(1);
  });

  it('judges the subagent’s transcript, never the parent’s', () => {
    const seen = judgedBy({
      transcript_path: write(
        'parent.jsonl',
        user('op') + said('PARENT-MARKER-TEXT'),
      ),
      agent_transcript_path: write(
        'agent.jsonl',
        user('dispatch prompt') + said('SUBAGENT-OWN-TEXT'),
      ),
    });
    expect(seen).toContain('SUBAGENT-OWN-TEXT');
    expect(seen).not.toContain('PARENT-MARKER-TEXT');
  });

  it('goes dark, rather than falling back to the parent, when the subagent’s transcript is unreadable', () => {
    const seen = judgedBy({
      transcript_path: write(
        'parent2.jsonl',
        user('op') + said('PARENT-MARKER-TEXT'),
      ),
      agent_transcript_path: join(home, 'no-such-agent-transcript.jsonl'),
    });
    expect(seen).toBeNull();
  });
});

// A GUARD THAT LETS A TURN OR CALL THROUGH WITHOUT A VERDICT SAYS SO, where the operator reads it.
//
// Silence is the answer for "judged, no collapse" and for "not enrolled", and for nothing else.
// The turn-end worker and the pre-tool worker are run as each harness receives them, resolved
// against that harness's own facts: on Claude Code a hook's plain stdout on exit 0 reaches nobody,
// so the notice is the hook's JSON `systemMessage`; omp's extension bridge reads the worker's
// plain stdout, so its form is the bare line. Every case that is about `jq` runs under a PATH that
// holds only `sh` and `cat`, because the worker must still be able to speak with nothing else.
const sourceOf = (
  cell: typeof stanceGuardrail,
  filename: string,
  harness: string,
): string => {
  const f = cell.workers?.find((x) => x.filename === filename);
  if (!f) throw new Error(`${filename} not found on its cell`);
  return resolveWorker(f, projectionFacts(adapterByName(harness)), cell.speech)
    .content;
};

const SAYS = [
  {
    harness: 'omp',
    base: ['.omp', 'agent'],
    hooks: ['.omp', 'hooks'],
    enroll: (scope: string): Record<string, unknown> => ({
      stance_scope: scope,
      agent_type: 'nico',
    }),
    notice: (stdout: string): string => {
      expect(stdout.trim(), 'nothing was said').not.toBe('');
      expect(stdout.startsWith('{'), 'omp reads a bare line').toBe(false);
      return stdout;
    },
  },
  {
    harness: 'claude',
    base: ['.claude'],
    hooks: ['.claude', 'hooks'],
    enroll: (): Record<string, unknown> => ({ agent_type: 'nico' }),
    notice: (stdout: string): string => {
      expect(stdout.trim(), 'nothing was said').not.toBe('');
      const said = JSON.parse(stdout) as Record<string, unknown>;
      expect(Object.keys(said)).toEqual(['systemMessage']);
      return String(said.systemMessage);
    },
  },
] as const;

const WORKERS = [
  {
    name: 'stance guardrail (turn end)',
    guard: 'STANCE GUARDRAIL',
    dir: 'stance-guardrail',
    file: 'stance-guardrail.sh',
    cell: stanceGuardrail,
    subject: 'turn',
  },
  {
    name: 'stance guardrail (pre-tool)',
    guard: 'STANCE GUARDRAIL',
    dir: 'stance-guardrail-pre',
    file: 'stance-guardrail-pre.sh',
    cell: stanceGuardrailPre,
    subject: 'call',
  },
] as const;

const BLOCK_VERDICT = (span: string) =>
  `VERDICT: BLOCK\nREASON: collapsed\nEVIDENCE: ${span}\n`;
const MENU = 'which of these two options do you prefer for the naming here';

describe.each(SAYS.flatMap((form) => WORKERS.map((w) => ({ form, w }))))(
  '$w.name — $form.harness: a $w.subject let through without a verdict says so',
  ({ form, w }) => {
    let home: string;
    let workerPath: string;
    let scope: string;
    let stub: string;
    let dead: string;
    let tmp: string;
    let n = 0;

    beforeAll(() => {
      home = mkdtempSync(join(root, `${w.dir}-${form.harness}-`));
      const dir = join(home, ...form.hooks, w.dir);
      mkdirSync(dir, { recursive: true });
      workerPath = join(dir, w.file);
      writeFileSync(workerPath, sourceOf(w.cell, w.file, form.harness), 'utf8');
      chmodSync(workerPath, 0o755);
      scope = join(home, ...form.base, 'personas', 'nico');
      mkdirSync(join(scope, 'stance'), { recursive: true });
      writeFileSync(
        join(scope, 'stance', 'manifest.json'),
        JSON.stringify({
          agent: 'nico',
          gates: { [w.dir]: { moments: ['turn.end'] } },
        }),
        'utf8',
      );
      stub = join(home, 'stub');
      mkdirSync(stub);
      symlinkSync('/bin/sh', join(stub, 'sh'));
      symlinkSync('/bin/cat', join(stub, 'cat'));
      dead = join(home, 'dead-judge.sh');
      writeFileSync(dead, '#!/bin/sh\nexit 5\n');
      tmp = join(home, 'tmp');
      mkdirSync(tmp);
    });

    /** The hook payload this worker judges: the last message of a turn, or a menu handed over. */
    const payload = (
      over: Record<string, unknown> = {},
    ): Record<string, unknown> => {
      n += 1;
      const base: Record<string, unknown> = {
        ...form.enroll(scope),
        session_id: `says-${w.dir}-${n}`,
        cwd: home,
      };
      if (w.subject === 'turn') {
        const t = join(home, `t${n}.jsonl`);
        writeFileSync(
          t,
          `${JSON.stringify({ type: 'user', message: { content: 'go' } })}\n${JSON.stringify(
            {
              type: 'assistant',
              message: { content: [{ type: 'text', text: `${MENU} ${n}` }] },
            },
          )}\n`,
          'utf8',
        );
        base.transcript_path = t;
      } else {
        base.tool_name = 'AskUserQuestion';
        base.tool_input = {
          questions: [{ question: `${MENU} ${n}`, options: [{ label: 'a' }] }],
        };
      }
      return { ...base, ...over };
    };

    const fire = (
      env: Record<string, string>,
      over: Record<string, unknown> = {},
      stdin?: string,
    ) =>
      spawnSync('/bin/sh', [workerPath], {
        input: stdin ?? JSON.stringify(payload(over)),
        encoding: 'utf8',
        env: { ...process.env, HOME: home, TMPDIR: tmp, ...env },
      });

    /** Exits 0, and names the guard and that the turn was not judged. */
    const said = (r: SpawnSyncReturns<string>): string => {
      expect(r.status).toBe(0);
      const text = form.notice(r.stdout);
      expect(text).toContain(w.guard);
      expect(text).toMatch(/NOT judged/);
      return text;
    };

    it('says so when jq is missing — a PATH of sh and cat', () => {
      const r = spawnSync('/bin/sh', [workerPath], {
        input: JSON.stringify(payload()),
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
      const file = join(home, `unparseable-${w.dir}`);
      writeFileSync(file, 'the model rambled and gave no verdict\n');
      expect(said(fire({ STANCE_VERDICT_FILE: file }))).toMatch(/unparseable/);
    });

    it('stays SILENT on a judged pass — the one silent verdict', () => {
      const file = join(home, `pass-${w.dir}`);
      writeFileSync(file, 'VERDICT: PASS\nREASON: nothing collapsed\n');
      const r = fire({ STANCE_VERDICT_FILE: file });
      expect(r.status).toBe(0);
      expect(r.stdout).toBe('');
    });

    it('stays SILENT for a scope no manifest enrolls', () => {
      const bare = join(home, 'bare');
      mkdirSync(bare, { recursive: true });
      const r = fire({}, { stance_scope: bare, agent_type: '' });
      expect(r.status).toBe(0);
      expect(r.stdout).toBe('');
    });

    if (w.subject === 'call') {
      it('says so when the re-entry cap lets the second identical call through', () => {
        const file = join(home, 'deny-pre');
        writeFileSync(file, 'VERDICT: BLOCK\nREASON: a menu\n');
        const same = payload();
        const once = fire({ STANCE_VERDICT_FILE: file }, same);
        expect(once.stdout).toContain('permissionDecision');
        expect(said(fire({ STANCE_VERDICT_FILE: file }, same))).toMatch(
          /re-entry cap/,
        );
      });

      it('says so when the payload names no tool', () => {
        expect(said(fire({}, { tool_name: '' }))).toMatch(/names no tool/);
      });
    } else {
      const closing = 'the close has this exact span in it';
      const closed = (name: string): string => {
        const t = join(home, name);
        writeFileSync(
          t,
          `${JSON.stringify({ type: 'user', message: { content: 'go' } })}\n${JSON.stringify(
            {
              type: 'assistant',
              message: { content: [{ type: 'text', text: closing }] },
            },
          )}\n`,
          'utf8',
        );
        return t;
      };

      it('says so when a block is discarded for citing a span that is not there', () => {
        const file = join(home, `fabricated-${w.dir}`);
        writeFileSync(file, BLOCK_VERDICT('this text never appeared anywhere'));
        const r = fire({ STANCE_VERDICT_FILE: file });
        expect(said(r)).toMatch(/BLOCK DISCARDED/);
        expect(r.stdout).not.toMatch(/"decision"|permissionDecision/);
      });

      it('says so when a block is discarded for quoting nothing', () => {
        const file = join(home, 'unevidenced-turn');
        writeFileSync(file, 'VERDICT: BLOCK\nREASON: collapsed\n');
        expect(said(fire({ STANCE_VERDICT_FILE: file }))).toMatch(
          /BLOCK DISCARDED/,
        );
      });

      it('carries quotes and backslashes in a notice intact', () => {
        const span = 'he said "no" \\ and left';
        const file = join(home, 'quoted-turn');
        writeFileSync(file, BLOCK_VERDICT(span));
        expect(said(fire({ STANCE_VERDICT_FILE: file }))).toContain(span);
      });

      it('says so when the transcript is unreadable', () => {
        const r = fire({}, { transcript_path: join(home, 'no-such.jsonl') });
        expect(said(r)).toMatch(/transcript/);
      });

      it('says so, and does not block, when its state cannot be written', () => {
        const file = join(home, 'block-turn');
        writeFileSync(file, BLOCK_VERDICT(closing));
        const notDir = join(home, 'a-file-not-a-dir');
        writeFileSync(notDir, '');
        const r = fire(
          { STANCE_VERDICT_FILE: file, TMPDIR: notDir },
          { transcript_path: closed('tstate.jsonl') },
        );
        expect(said(r)).toMatch(/state directory/);
        expect(r.stdout).not.toContain('decision');
      });

      it('says so at the no-progress cap', () => {
        const file = join(home, 'block-noprogress');
        writeFileSync(file, BLOCK_VERDICT(closing));
        const same = {
          transcript_path: closed('tnp.jsonl'),
          session_id: `np-${form.harness}`,
        };
        const first = fire({ STANCE_VERDICT_FILE: file }, same);
        expect(first.stdout).toContain('decision');
        const second = fire({ STANCE_VERDICT_FILE: file }, same);
        expect(second.status).toBe(0);
        expect(form.notice(second.stdout)).toMatch(/NO PROGRESS/);
        expect(second.stdout).not.toMatch(/"decision"|decision":"block/);
      });

      it('says so when the block cap is spent', () => {
        const file = join(home, 'block-spent');
        writeFileSync(file, BLOCK_VERDICT(closing));
        const r = fire(
          { STANCE_VERDICT_FILE: file, STANCE_BLOCK_CAP: '0' },
          { transcript_path: closed('tspent.jsonl') },
        );
        expect(r.status).toBe(0);
        expect(form.notice(r.stdout)).toMatch(/BYPASS SPENT/);
      });
    }
  },
);
