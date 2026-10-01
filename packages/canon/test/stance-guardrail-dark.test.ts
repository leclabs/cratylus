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
import { basename, dirname, isAbsolute, join } from 'node:path';
import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectionFacts } from '@cratylus/forge/project';
import { resolveWorker } from '@cratylus/schema';
import { beforeAll, describe, expect, it } from 'vitest';
import { handoff } from '../src/dimensions/autonomy/handoff.js';
import { judgePayloadCapBytes } from '../src/guard-shell.js';
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

// WHICH MESSAGE. A payload fact the claude form depends on, observed live on Claude Code
// 2.1.285: a Stop payload fires BEFORE the final assistant message reaches the transcript.
// That message is only in `last_assistant_message`, so a turn that is only text had nothing
// to judge.
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

  const fireClaude = (payload: Record<string, unknown>) => {
    rmSync(recorded, { force: true });
    const r = spawnSync('sh', [claudeWorker], {
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
    return {
      r,
      seen: existsSync(recorded) ? readFileSync(recorded, 'utf8') : null,
    };
  };
  const judgedBy = (payload: Record<string, unknown>): string | null =>
    fireClaude(payload).seen;

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

  // A GUARD BINDS A PERSONA'S OWN MAIN SESSION, never a subagent it dispatches. Claude Code
  // fires the hook inside a subagent too, and only there the payload carries `agent_id`.
  it('is not bound inside a subagent: an `agent_id` payload exits 0, says nothing and leaves the judge unasked', () => {
    const payload = {
      transcript_path: write('t4.jsonl', user('do it')),
      last_assistant_message: 'SUBAGENT-CLOSE',
    };
    const inside = fireClaude({ ...payload, agent_id: 'a1b2c3' });
    expect(inside.r.status).toBe(0);
    expect(inside.r.stdout).toBe('');
    expect(inside.seen).toBeNull();
    // The same payload in a main session is judged, so the silence above is the gate's.
    expect(fireClaude(payload).seen).toContain('SUBAGENT-CLOSE');
  });
});

// The pre guard's twin of the case above: it binds the main session and no subagent.
describe('STANCE GUARDRAIL (pre) — a guard binds a main session only', () => {
  let preWorker: string;
  let scope: string;
  let home: string;

  beforeAll(() => {
    home = mkdtempSync(join(root, 'pre-main-'));
    const dir = join(home, '.claude', 'hooks', 'stance-guardrail-pre');
    mkdirSync(dir, { recursive: true });
    preWorker = join(dir, 'stance-guardrail-pre.sh');
    writeFileSync(
      preWorker,
      sourceOf(stanceGuardrailPre, 'stance-guardrail-pre.sh', 'claude'),
      'utf8',
    );
    chmodSync(preWorker, 0o755);
    scope = join(home, '.claude', 'personas', 'nico');
    mkdirSync(join(scope, 'stance'), { recursive: true });
    writeFileSync(
      join(scope, 'stance', 'manifest.json'),
      JSON.stringify({ agent: 'nico', gates: {} }),
      'utf8',
    );
  });

  const fire = (extra: Record<string, unknown>) =>
    spawnSync('sh', [preWorker], {
      input: JSON.stringify({
        stance_scope: scope,
        agent_type: 'nico',
        session_id: `pre-main-${Math.random()}`,
        cwd: home,
        tool_name: 'Agent',
        tool_input: { prompt: 'build the fold' },
        ...extra,
      }),
      encoding: 'utf8',
      env: { ...process.env, HOME: home, STANCE_EMIT_PAYLOAD: '1' },
    });

  it('exits 0, says nothing and leaves the judge unasked for an `agent_id` payload', () => {
    const inside = fire({ agent_id: 'a1b2c3' });
    expect(inside.status).toBe(0);
    expect(inside.stdout).toBe('');
    // The same payload in a main session is judged, so the silence above is the gate's.
    const main = fire({});
    expect(JSON.parse(main.stdout).payload).toContain('build the fold');
  });
});

// A JUDGEMENT FITS THE TIME ITS HARNESS ALLOWS A GUARD, so what the judge is sent is bounded.
//
// The judge's answer time grows with what it is sent, and omp kills an extension handler at
// 30 s and a Claude Code cell at 60 s, while the payload had no bound of its own: the Stop
// worker sent every assistant message since the last operator message and the whole operator
// message, the pre worker the whole menu or dispatch prompt. A judge that is merely slow was
// then reported as one that could not run. One cap, declared once in `guard-shell.ts`, bounds
// all three workers; the purview worker is held to it in `purview-guardrail.test.ts`.
//
// The workers are run in the omp form, whose bridge asks for the payload with
// `STANCE_EMIT_PAYLOAD` and later returns the verdict with `STANCE_VERDICT_FILE`; the second
// pass is the one that checks a block's EVIDENCE, and it must check it against what the first
// pass SENT, not against the transcript the first pass cut down.
describe('STANCE GUARDRAIL — the judge is sent a bounded excerpt', () => {
  const cap = judgePayloadCapBytes;
  const big = 200_000;
  let home: string;
  let scope: string;
  let tmp: string;
  let n = 0;
  const workers = {} as Record<'stop' | 'pre', string>;
  const line = (o: unknown) => `${JSON.stringify(o)}\n`;
  const said = (text: string) =>
    line({ type: 'assistant', message: { content: [{ type: 'text', text }] } });
  const tooled = line({
    type: 'assistant',
    message: { content: [{ type: 'tool_use', name: 'Bash' }] },
  });
  // Filler that no rule reads and the layer-1 pre-filter cannot match.
  const filler = (bytes: number): string => 'lorem ipsum '.repeat(bytes / 12);

  beforeAll(() => {
    home = mkdtempSync(join(root, 'bounded-'));
    tmp = join(home, 'tmp');
    mkdirSync(tmp);
    scope = join(home, '.omp', 'agent', 'personas', 'nico');
    mkdirSync(join(scope, 'stance'), { recursive: true });
    writeFileSync(
      join(scope, 'stance', 'manifest.json'),
      JSON.stringify({ agent: 'nico', gates: {} }),
      'utf8',
    );
    for (const [key, cell, file] of [
      ['stop', stanceGuardrail, 'stance-guardrail.sh'],
      ['pre', stanceGuardrailPre, 'stance-guardrail-pre.sh'],
    ] as const) {
      const dir = join(home, '.omp', 'hooks', file.replace('.sh', ''));
      mkdirSync(dir, { recursive: true });
      workers[key] = join(dir, file);
      writeFileSync(workers[key], sourceOf(cell, file, 'omp'), 'utf8');
      chmodSync(workers[key], 0o755);
    }
  });

  const fire = (
    which: 'stop' | 'pre',
    input: Record<string, unknown>,
    env: Record<string, string>,
  ) => {
    n += 1;
    return spawnSync('/bin/sh', [workers[which]], {
      input: JSON.stringify({
        stance_scope: scope,
        agent_type: 'nico',
        session_id: `bounded-${n}`,
        cwd: home,
        ...input,
      }),
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, HOME: home, TMPDIR: tmp, ...env },
    });
  };

  const transcriptOf = (...records: string[]): { transcript_path: string } => {
    const p = join(home, `turn-${n}-${records.length}.jsonl`);
    writeFileSync(p, records.join(''), 'utf8');
    return { transcript_path: p };
  };

  const emitted = (
    which: 'stop' | 'pre',
    input: Record<string, unknown>,
  ): string => {
    const r = fire(which, input, { STANCE_EMIT_PAYLOAD: '1' });
    expect(r.status).toBe(0);
    const envelope: { payload: string } = JSON.parse(r.stdout);
    return envelope.payload;
  };

  // The turn: an operator message and an agent turn of 200000 bytes each. The operator's
  // instruction is at its END, and so is the close's marker, in its last 200 bytes.
  const bigTurn = () => ({
    operator: `OPERATOR-HEAD-ELIDED ${filler(big)} OPERATOR-TAIL-KEPT`,
    close: `CLOSE-HEAD-ELIDED words ${filler(big)} CLOSE-TAIL-KEPT then the marker CLOSE-MARKER-${Math.random().toString(36).slice(2)}`,
  });
  const bigInput = (t = bigTurn()) =>
    transcriptOf(
      line({ type: 'user', message: { content: t.operator } }),
      said(t.close),
    );

  it('Stop worker: a 200000-byte operator message and turn are sent within the cap, close and tail kept', () => {
    const t = bigTurn();
    const payload = emitted('stop', bigInput(t));
    expect(Buffer.byteLength(payload)).toBeLessThanOrEqual(cap);
    // The close is what every firing rule reads, and its last bytes are the turn's last.
    expect(payload).toContain(t.close.slice(-200));
    expect(payload).toContain('OPERATOR-TAIL-KEPT');
    expect(payload).not.toContain('CLOSE-HEAD-ELIDED');
    expect(payload).not.toContain('OPERATOR-HEAD-ELIDED');
    // The judge is told it reads an excerpt, so a seam is never taken for the agent's words.
    expect(payload).toMatch(
      /\[ELIDED: the first \d+ of \d+ bytes of the agent turn/,
    );
    expect(payload).toMatch(
      /\[ELIDED: the first \d+ of \d+ bytes of the operator message/,
    );
  });

  it('Stop worker: a short close survives a preamble that is what overflows', () => {
    const payload = emitted(
      'stop',
      transcriptOf(
        line({ type: 'user', message: { content: 'go' } }),
        said(`PREAMBLE-ELIDED ${filler(big)}`),
        tooled,
        said('Four commits shipped. Tree clean. SHORT-CLOSE-KEPT'),
      ),
    );
    expect(Buffer.byteLength(payload)).toBeLessThanOrEqual(cap);
    expect(payload).toContain(
      'Four commits shipped. Tree clean. SHORT-CLOSE-KEPT',
    );
    expect(payload).not.toContain('PREAMBLE-ELIDED');
  });

  it('Stop worker: a cut never lands inside a character', () => {
    const payload = emitted(
      'stop',
      bigInput({
        operator: 'é'.repeat(big / 2),
        close: `${'é'.repeat(big / 2)} end`,
      }),
    );
    expect(Buffer.byteLength(payload)).toBeLessThanOrEqual(cap);
    expect(payload).not.toContain('\uFFFD');
  });

  it('Stop worker: a turn under the cap is sent whole and unmarked', () => {
    const payload = emitted(
      'stop',
      transcriptOf(
        line({ type: 'user', message: { content: 'go' } }),
        said('SMALL-TURN-WHOLE'),
      ),
    );
    expect(payload).toContain('SMALL-TURN-WHOLE');
    expect(payload).not.toContain('ELIDED');
  });

  it('Stop worker: a BLOCK quoting a span the cap elided is discarded, one quoting the sent close stands', () => {
    const input = bigInput();
    const verdict = (span: string): string => {
      const p = join(home, `verdict-${Math.random()}`);
      writeFileSync(
        p,
        `VERDICT: BLOCK\nREASON: collapsed\nEVIDENCE: ${span}\n`,
      );
      return p;
    };
    const elided = fire('stop', input, {
      STANCE_VERDICT_FILE: verdict('CLOSE-HEAD-ELIDED words lorem ipsum'),
    });
    expect(elided.stdout).toMatch(/BLOCK DISCARDED/);
    expect(elided.stdout).not.toMatch(/"decision":"block"/);
    const sent = fire('stop', input, {
      STANCE_VERDICT_FILE: verdict('CLOSE-TAIL-KEPT then the marker'),
    });
    expect(sent.status).toBe(0);
    expect(JSON.parse(sent.stdout)).toMatchObject({ decision: 'block' });
  });

  it('pre worker: a 200000-byte menu and a 200000-byte dispatch prompt are each sent within the cap', () => {
    const menu = emitted('pre', {
      tool_name: 'AskUserQuestion',
      tool_input: {
        questions: [
          {
            question: `MENU-HEAD ${filler(big)} MENU-TAIL`,
            options: [{ label: 'a' }, { label: 'b' }],
          },
        ],
      },
    });
    const dispatch = emitted('pre', {
      tool_name: 'Agent',
      tool_input: { prompt: `PROMPT-HEAD ${filler(big)} PROMPT-TAIL` },
    });
    for (const [payload, head, tail] of [
      [menu, 'MENU-HEAD', 'MENU-TAIL'],
      [dispatch, 'PROMPT-HEAD', 'PROMPT-TAIL'],
    ] as const) {
      expect(Buffer.byteLength(payload)).toBeLessThanOrEqual(cap);
      // The instruction of a menu or a dispatch may sit at either end, so both are kept.
      expect(payload).toContain(head);
      expect(payload).toContain(tail);
      expect(payload).toMatch(/\[ELIDED: \d+ of \d+ bytes from the middle/);
    }
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

    // A refusal never strands the agent: each worker names the file where the agent states why it
    // holds a refusal wrong. The judge is a stub that counts its calls and always BLOCKs, quoting a
    // span that is in the close, so a contested fire that was judged shows as a count that moved.
    const REASON = 'the guard holds this act collapsed';
    const WHY = 'the operator asked for exactly this';
    const closing = 'the close has this exact span in it';
    const contesting = (name: string) => {
      const calls = join(home, `${name}-calls`);
      const judge = join(home, `${name}-judge.sh`);
      const log = join(tmp, `${name}-contests.log`);
      writeFileSync(
        judge,
        `#!/bin/sh\ncat >/dev/null\nprintf x >> "${calls}"\nprintf 'VERDICT: BLOCK\\nREASON: ${REASON}\\nEVIDENCE: ${closing}\\n'\n`,
      );
      return {
        env: { STANCE_JUDGE_CMD: `sh ${judge}`, GUARD_CONTEST_LOG: log },
        log,
        calls: () =>
          existsSync(calls) ? readFileSync(calls, 'utf8').length : 0,
        logged: (): Record<string, string>[] =>
          existsSync(log)
            ? readFileSync(log, 'utf8')
                .trim()
                .split('\n')
                .map((l) => JSON.parse(l) as Record<string, string>)
            : [],
      };
    };

    if (w.subject === 'call') {
      it('judges a retried refused call again and denies it again', () => {
        const calls = join(home, 'judge-calls');
        const counting = join(home, 'counting-judge.sh');
        writeFileSync(
          counting,
          `#!/bin/sh\ncat >/dev/null\nprintf x >> "${calls}"\nprintf 'VERDICT: BLOCK\\nREASON: a menu\\n'\n`,
        );
        const same = payload();
        const env = { STANCE_JUDGE_CMD: `sh ${counting}` };
        for (const attempt of [1, 2]) {
          const r = fire(env, same);
          expect(r.status, `attempt ${attempt}`).toBe(0);
          expect(r.stdout, `attempt ${attempt}`).toContain(
            'permissionDecision',
          );
          expect(r.stdout, `attempt ${attempt}`).toContain('deny');
        }
        expect(readFileSync(calls, 'utf8')).toBe('xx');
      });

      it('says so when the payload names no tool', () => {
        expect(said(fire({}, { tool_name: '' }))).toMatch(/names no tool/);
      });

      // A refusal never strands the agent: the call an agent contests goes through unjudged, the
      // contest is logged for the operator, and the same call afterwards is judged again.
      const deniedAt = (
        r: SpawnSyncReturns<string>,
        session: string,
      ): string => {
        expect(r.status).toBe(0);
        const out = JSON.parse(r.stdout).hookSpecificOutput as {
          permissionDecision: string;
          permissionDecisionReason: string;
        };
        expect(out.permissionDecision).toBe('deny');
        expect(out.permissionDecisionReason).toContain(`${REASON} `);
        const path =
          out.permissionDecisionReason.match(/> '([^']+\.contest)'/)?.[1] ?? '';
        expect(isAbsolute(path)).toBe(true);
        expect(dirname(path)).toBe(
          join(tmp, 'guardrail-contest', w.dir, session),
        );
        expect(basename(path)).toMatch(/^\d+\.contest$/);
        return path;
      };

      it('lets a contested call through unjudged, said and logged, and judges the same call again after', () => {
        const j = contesting('call');
        const session = `contest-${w.dir}-${form.harness}-call`;
        const same = { ...payload(), session_id: session };
        const path = deniedAt(fire(j.env, same), session);
        expect(readFileSync(path.replace(/contest$/, 'refused'), 'utf8')).toBe(
          `${REASON}\n`,
        );
        expect(j.calls()).toBe(1);

        writeFileSync(path, `${WHY}\n`);
        const contested = fire(j.env, same);
        expect(contested.status).toBe(0);
        expect(contested.stdout).not.toContain('permissionDecision');
        const text = form.notice(contested.stdout);
        expect(text).toContain(w.guard);
        expect(text).toContain(WHY);
        expect(text).toContain(j.log);
        expect(j.calls()).toBe(1);
        expect(j.logged()).toMatchObject([
          {
            guard: w.dir,
            act: 'AskUserQuestion',
            session,
            agent: 'nico',
            refusal: REASON,
            contest: WHY,
          },
        ]);
        expect(existsSync(path)).toBe(false);

        deniedAt(fire(j.env, same), session);
        expect(j.calls()).toBe(2);
      });

      it('leaves a call denied when the contest was written for another call', () => {
        const j = contesting('other');
        const session = `contest-${w.dir}-${form.harness}-other`;
        const path = deniedAt(
          fire(j.env, { ...payload(), session_id: session }),
          session,
        );
        writeFileSync(path, `${WHY}\n`);
        deniedAt(fire(j.env, { ...payload(), session_id: session }), session);
        expect(j.calls()).toBe(2);
        expect(existsSync(path)).toBe(true);
      });

      // A contest answers a refusal that stands: written before the refusal it would answer, it is
      // discarded unheard and the call is judged as usual.
      it('judges a call whose contest was written before any refusal, discards that contest, and judges the same call again', () => {
        const j = contesting('ahead');
        const session = `ahead-${w.dir}-${form.harness}-call`;
        const same = { ...payload(), session_id: session };
        const path = deniedAt(fire(j.env, same), session);
        rmSync(path.replace(/contest$/, 'refused'));
        expect(j.calls()).toBe(1);

        writeFileSync(path, `${WHY}\n`);
        const ahead = fire(j.env, same);
        expect(deniedAt(ahead, session)).toBe(path);
        expect(ahead.stdout).not.toContain('contested');
        expect(j.calls()).toBe(2);
        expect(existsSync(j.log)).toBe(false);
        expect(existsSync(path)).toBe(false);

        expect(deniedAt(fire(j.env, same), session)).toBe(path);
        expect(j.calls()).toBe(3);
        expect(existsSync(j.log)).toBe(false);
      });
    } else {
      const closed = (name: string, text: string = closing): string => {
        const t = join(home, name);
        writeFileSync(
          t,
          `${JSON.stringify({ type: 'user', message: { content: 'go' } })}\n${JSON.stringify(
            {
              type: 'assistant',
              message: { content: [{ type: 'text', text }] },
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

      it('blocks the same collapsed turn every time it is fired fresh in one session', () => {
        const file = join(home, 'block-same');
        writeFileSync(file, BLOCK_VERDICT(closing));
        const same = {
          transcript_path: closed('tsame.jsonl'),
          session_id: `same-${form.harness}`,
          stop_hook_active: false,
        };
        for (const attempt of [1, 2, 3]) {
          const r = fire({ STANCE_VERDICT_FILE: file }, same);
          expect(r.status, `attempt ${attempt}`).toBe(0);
          expect(r.stdout, `attempt ${attempt}`).toContain(
            '"decision":"block"',
          );
        }
      });

      it('blocks four different collapsed turns each fired fresh in one session', () => {
        const session = `four-${form.harness}`;
        for (const i of [1, 2, 3, 4]) {
          const span = `collapsed close number ${i} with its own span`;
          const file = join(home, `block-four-${i}`);
          writeFileSync(file, BLOCK_VERDICT(span));
          const r = fire(
            { STANCE_VERDICT_FILE: file },
            {
              transcript_path: closed(`tfour${i}.jsonl`, span),
              session_id: session,
              stop_hook_active: false,
            },
          );
          expect(r.status, `turn ${i}`).toBe(0);
          expect(r.stdout, `turn ${i}`).toContain('"decision":"block"');
        }
      });

      it('reads no block cap: a collapsed turn blocks whatever STANCE_BLOCK_CAP says', () => {
        const file = join(home, 'block-uncapped');
        writeFileSync(file, BLOCK_VERDICT(closing));
        const r = fire(
          { STANCE_VERDICT_FILE: file, STANCE_BLOCK_CAP: '0' },
          { transcript_path: closed('tuncapped.jsonl') },
        );
        expect(r.status).toBe(0);
        expect(r.stdout).toContain('"decision":"block"');
      });

      it('blocks a collapsed turn even when its state cannot be written', () => {
        const file = join(home, 'block-turn');
        writeFileSync(file, BLOCK_VERDICT(closing));
        const notDir = join(home, 'a-file-not-a-dir');
        writeFileSync(notDir, '');
        const r = fire(
          { STANCE_VERDICT_FILE: file, TMPDIR: notDir },
          { transcript_path: closed('tstate.jsonl') },
        );
        expect(r.status).toBe(0);
        expect(r.stdout).toContain('"decision":"block"');
      });

      // THE TURN END IS THE ONE EXCEPTION TO A REFUSED ACT STAYING REFUSED, and only for one stop.
      // A judge that counts its calls and always blocks, quoting a span that is in the close, is
      // fired the way a harness fires it: the first stop with `stop_hook_active` false, each stop
      // after a block with it true.
      const counted = (
        name: string,
      ): { env: Record<string, string>; calls: () => number } => {
        const calls = join(home, `${name}-calls`);
        const judge = join(home, `${name}-judge.sh`);
        writeFileSync(
          judge,
          `#!/bin/sh\ncat >/dev/null\nprintf x >> "${calls}"\nprintf 'VERDICT: BLOCK\\nREASON: collapsed\\nEVIDENCE: ${closing}\\n'\n`,
        );
        return {
          env: { STANCE_JUDGE_CMD: `sh ${judge}` },
          calls: () =>
            existsSync(calls) ? readFileSync(calls, 'utf8').length : 0,
        };
      };

      /** Exits 0, prints no block decision, and says the stop was let through UNRESOLVED. */
      const letThrough = (r: SpawnSyncReturns<string>, why: string): void => {
        expect(r.status, why).toBe(0);
        expect(r.stdout, why).not.toContain('"decision":"block"');
        const text = form.notice(r.stdout);
        expect(text, why).toContain(w.guard);
        expect(text, why).toContain('UNRESOLVED');
      };
      const blocked = (r: SpawnSyncReturns<string>, why: string): void => {
        expect(r.status, why).toBe(0);
        expect(r.stdout, why).toContain('"decision":"block"');
      };

      it('lets a repeated stop through, said, and blocks the next fresh stop again', () => {
        const j = counted('repeat');
        const turn = {
          transcript_path: closed('trepeat.jsonl'),
          session_id: `repeat-${form.harness}`,
        };
        blocked(
          fire(j.env, { ...turn, stop_hook_active: false }),
          'the first stop',
        );
        letThrough(
          fire(j.env, { ...turn, stop_hook_active: true }),
          'the same turn after the block',
        );
        expect(j.calls()).toBe(2);
        blocked(
          fire(j.env, { ...turn, stop_hook_active: false }),
          'a fresh stop after the let-through',
        );
      });

      it('lets a fourth refused stop through, said, and blocks the next fresh stop again', () => {
        const j = counted('run');
        const session = `run-${form.harness}`;
        const stop = (i: number, active: boolean) =>
          fire(j.env, {
            transcript_path: closed(`trun${i}.jsonl`, `${closing} ${i}`),
            session_id: session,
            stop_hook_active: active,
          });
        blocked(stop(1, false), 'stop 1');
        blocked(stop(2, true), 'stop 2');
        blocked(stop(3, true), 'stop 3');
        letThrough(stop(4, true), 'stop 4');
        expect(j.calls()).toBe(4);
        blocked(stop(5, false), 'a fresh stop after the let-through');
      });

      it('never lets a stop through that follows no block, however many different ones come', () => {
        const j = counted('fresh');
        const session = `fresh-${form.harness}`;
        for (const i of [1, 2, 3, 4, 5]) {
          blocked(
            fire(j.env, {
              transcript_path: closed(`tfresh${i}.jsonl`, `${closing} ${i}`),
              session_id: session,
              stop_hook_active: false,
            }),
            `fresh stop ${i}`,
          );
        }
        expect(j.calls()).toBe(5);
      });

      it('counts a run per session: another session continues nothing of it', () => {
        const j = counted('apart');
        const stop = (session: string, i: number, active: boolean) =>
          fire(j.env, {
            transcript_path: closed(
              `tapart${session}${i}.jsonl`,
              `${closing} ${i}`,
            ),
            session_id: `apart-${form.harness}-${session}`,
            stop_hook_active: active,
          });
        for (const i of [1, 2, 3]) blocked(stop('a', i, i > 1), `a ${i}`);
        blocked(
          stop('b', 1, true),
          'a stop of another session holds no run of its own',
        );
      });

      it('lets a stop through that follows a block when its run cannot be counted, and still blocks a fresh one', () => {
        const j = counted('uncountable');
        const notDir = join(home, 'a-file-not-a-tmpdir');
        writeFileSync(notDir, '');
        const env = { ...j.env, TMPDIR: notDir };
        const turn = { transcript_path: closed('tuncountable.jsonl') };
        blocked(
          fire(env, { ...turn, stop_hook_active: false }),
          'a fresh stop with no state',
        );
        letThrough(
          fire(env, { ...turn, stop_hook_active: true }),
          'a stop after a block with no state',
        );
        expect(j.calls()).toBe(2);
      });

      // A refusal never strands the agent: the stop an agent contests goes through whatever the run
      // of blocks, and the next stop that follows no contest is judged and blocked again.
      it('lets a contested stop through unjudged, said and logged, and blocks the next stop that carries no contest', () => {
        const j = contesting('stop');
        const session = `contest-${w.dir}-${form.harness}-stop`;
        const at = join(tmp, 'guardrail-contest', w.dir, session, 'stop');
        const turn = { session_id: session };
        const first = fire(j.env, {
          ...turn,
          transcript_path: closed('tcontest1.jsonl'),
          stop_hook_active: false,
        });
        blocked(first, 'the first stop');
        const reason = String(JSON.parse(first.stdout).reason);
        expect(reason).toContain(`${REASON} `);
        expect(reason).toContain(`> '${at}.contest'`);
        expect(readFileSync(`${at}.refused`, 'utf8').trim()).toBe(REASON);
        expect(j.calls()).toBe(1);

        writeFileSync(`${at}.contest`, `${WHY}\n`);
        const contested = fire(j.env, {
          ...turn,
          transcript_path: closed('tcontest2.jsonl', `${closing} again`),
          stop_hook_active: true,
        });
        expect(contested.status).toBe(0);
        expect(contested.stdout).not.toContain('"decision":"block"');
        const text = form.notice(contested.stdout);
        expect(text).toContain(w.guard);
        expect(text).toContain(WHY);
        expect(text).toContain(j.log);
        expect(j.calls()).toBe(1);
        expect(j.logged()).toMatchObject([
          {
            guard: w.dir,
            act: 'stop',
            session,
            agent: 'nico',
            refusal: REASON,
            contest: WHY,
          },
        ]);
        expect(existsSync(`${at}.contest`)).toBe(false);

        blocked(
          fire(j.env, {
            ...turn,
            transcript_path: closed('tcontest3.jsonl', `${closing} once more`),
            stop_hook_active: false,
          }),
          'a stop that follows the spent contest',
        );
        expect(j.calls()).toBe(2);
      });

      // A contest answers a refusal that stands: written before the refusal it would answer, it is
      // discarded unheard and the stop is judged as usual.
      it('judges a stop whose contest was written before any refusal, discards that contest, and blocks the next stop again', () => {
        const j = contesting('stop-ahead');
        const session = `ahead-${w.dir}-${form.harness}-stop`;
        const at = join(tmp, 'guardrail-contest', w.dir, session, 'stop');
        mkdirSync(dirname(at), { recursive: true });
        writeFileSync(`${at}.contest`, `${WHY}\n`);
        const turn = { session_id: session };

        const ahead = fire(j.env, {
          ...turn,
          transcript_path: closed('tahead1.jsonl'),
          stop_hook_active: false,
        });
        blocked(ahead, 'a stop that follows a contest written ahead');
        expect(String(JSON.parse(ahead.stdout).reason)).toContain(
          `> '${at}.contest'`,
        );
        expect(ahead.stdout).not.toContain('contested');
        expect(j.calls()).toBe(1);
        expect(existsSync(j.log)).toBe(false);
        expect(existsSync(`${at}.contest`)).toBe(false);

        blocked(
          fire(j.env, {
            ...turn,
            transcript_path: closed('tahead2.jsonl', `${closing} again`),
            stop_hook_active: true,
          }),
          'the next stop, with no contest written',
        );
        expect(j.calls()).toBe(2);
        expect(existsSync(j.log)).toBe(false);
      });

      // A refusal stands from the fire that refused it until the next fire of that key: a stop the
      // agent complied with, and the judge then passed, leaves no refusal for a later contest.
      it('lets a refusal lapse at the next stop, so a contest written after it answers nothing', () => {
        const calls = join(home, 'lapse-calls');
        const verdict = join(home, 'lapse-verdict');
        const judge = join(home, 'lapse-judge.sh');
        const log = join(tmp, 'lapse-contests.log');
        writeFileSync(
          judge,
          `#!/bin/sh\ncat >/dev/null\nprintf x >> "${calls}"\ncat "${verdict}"\n`,
        );
        const env = { STANCE_JUDGE_CMD: `sh ${judge}`, GUARD_CONTEST_LOG: log };
        const count = (): number =>
          existsSync(calls) ? readFileSync(calls, 'utf8').length : 0;
        const session = `lapse-${w.dir}-${form.harness}-stop`;
        const at = join(tmp, 'guardrail-contest', w.dir, session, 'stop');
        const stop = (name: string, active: boolean) =>
          fire(env, {
            session_id: session,
            transcript_path: closed(name, `${closing} ${name}`),
            stop_hook_active: active,
          });

        writeFileSync(verdict, BLOCK_VERDICT(closing));
        blocked(stop('tlapse1.jsonl', false), 'the stop the judge blocks');
        expect(count()).toBe(1);
        expect(existsSync(`${at}.refused`)).toBe(true);

        writeFileSync(verdict, 'VERDICT: PASS\nREASON: nothing collapsed\n');
        const passed = stop('tlapse2.jsonl', true);
        expect(passed.status).toBe(0);
        expect(passed.stdout).toBe('');
        expect(count()).toBe(2);
        expect(existsSync(`${at}.refused`)).toBe(false);
        expect(existsSync(`${at}.contest`)).toBe(false);

        writeFileSync(verdict, BLOCK_VERDICT(closing));
        writeFileSync(`${at}.contest`, `${WHY}\n`);
        const after = stop('tlapse3.jsonl', false);
        blocked(after, 'a stop after the refusal lapsed');
        expect(after.stdout).not.toContain('contested');
        expect(count()).toBe(3);
        expect(existsSync(log)).toBe(false);
        expect(existsSync(`${at}.contest`)).toBe(false);
        expect(existsSync(`${at}.refused`)).toBe(true);
      });
    }
  },
);
