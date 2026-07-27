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
