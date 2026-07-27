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

import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { checkIn } from '../src/dimensions/autonomy/check-in.js';
import { stanceGuardrail } from '../src/hooks/stance-guardrail.js';

let root: string;
let worker: string;
let transcript: string;

/** The guardrail cell projects several files; the worker is the hook entrypoint. */
function workerSource(): string {
  const f = stanceGuardrail.workers?.find(
    (x) => x.filename === 'stance-guardrail.sh',
  );
  if (!f) throw new Error('stance-guardrail.sh not found on the cell');
  return f.content;
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

/** Run the worker inside an opted-in git repo, with the judge command under our control. */
function run(judgeCmd: string, opts: { enabled?: boolean } = {}) {
  const enabled = opts.enabled ?? true;
  const repo = mkdtempSync(join(root, 'repo-'));
  mkdirSync(join(repo, '.git'), { recursive: true });
  spawnSync('git', ['init', '-q'], { cwd: repo });
  if (enabled) {
    spawnSync('git', ['config', 'agentfactory.stanceGuard', 'true'], {
      cwd: repo,
    });
  }
  return spawnSync('sh', [worker], {
    input: JSON.stringify({
      session_id: 'dark-test',
      cwd: repo,
      agent_type: 'nico',
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

  it('stays SILENT when the repo never opted in — the negative control', () => {
    const broken = join(root, 'broken-judge.sh');
    const res = run(`sh ${broken}`, { enabled: false });
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
// The rubric's "check-in laws" section is headed "the agent's DECLARED contract — judge against
// these" and then TRANSCRIBES the dimension value by hand. Nothing reads the cell. Change
// `dimensions/autonomy/check-in.ts` and the rubric goes on judging against the stale string,
// silently, while claiming to be the declaration.
//
// That is two homes for one concept (MODEL: `|home(c)| = 1`), and it is the shape that makes
// autonomy un-configurable: the agent's declared authority and the gate that enforces it are
// independent transcriptions of one intent, so editing the declaration changes nothing about
// what is enforced. Until the adapter can compile a dimension into a predicate, the least this
// corpus can do is FAIL when the two drift — a distinction living only in prose will be lost.
describe('STANCE RUBRIC — the transcribed dimension value tracks its cell', () => {
  it('quotes `check-in` exactly as the autonomy cell declares it', () => {
    const rubric = stanceGuardrail.workers?.find(
      (w) => w.filename === 'stance-judge-prompt.md',
    )?.content;
    expect(rubric, 'rubric worker not found on the cell').toBeTruthy();
    // The single source: the dimension cell itself.
    expect(rubric).toContain(checkIn);
  });
});
