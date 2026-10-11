import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { BehavioralCheck } from '@cratylus/runtime';
import {
  type HeldDrift,
  countHeldDrift,
  deliveredEvidence,
  totalHeldDrift,
} from './rubric-delivered.js';

export interface Judgment {
  status: 'judged' | 'unjudged';
  model: string;
  attempts: { error?: string }[];
}

/** Read only the named model role, never import the host's remaining settings. */
export function judgeModel(subjects: readonly string[]): string {
  let model: unknown = process.env.EXECUTION_JUDGE_MODEL;
  if (model === undefined) {
    const path = join(homedir(), '.omp/agent/config.yml');
    // Bun is omp's runtime; use its YAML parser, as the other host fixtures do.
    const parsed = spawnSync(
      'bun',
      [
        '-e',
        'console.log(JSON.stringify(Bun.YAML.parse(await Bun.stdin.text())))',
      ],
      { input: readFileSync(path, 'utf8'), encoding: 'utf8', timeout: 10_000 },
    );
    if (parsed.error) throw parsed.error;
    if (parsed.status !== 0)
      throw new Error(`Cannot read judge model role: ${parsed.stderr}`);
    const config = JSON.parse(parsed.stdout);
    model = config?.modelRoles?.['frontier-other-family'];
  }
  if (typeof model !== 'string' || !/^[^/\s]+\/\S+$/.test(model))
    throw new Error(
      'Judge requires EXECUTION_JUDGE_MODEL or host modelRoles.frontier-other-family as provider/model',
    );
  const provider = model.split('/')[0]!;
  const family = provider === 'openai-codex' ? 'openai' : provider;
  for (const subject of subjects) {
    const provider = subject.split('/')[0]!;
    if ((provider === 'openai-codex' ? 'openai' : provider) === family)
      throw new Error(
        `Refusing same-family rubric judge ${model} for subject ${subject}`,
      );
  }
  return model;
}

/** Use actual assistant-message model provenance, including every resumed turn. */
export function subjectModels(recording: { messages: unknown[] }): string[] {
  const models = new Set<string>();
  for (const message of recording.messages) {
    if (
      !message ||
      typeof message !== 'object' ||
      !('role' in message) ||
      message.role !== 'assistant'
    )
      continue;
    if (
      'provider' in message &&
      typeof message.provider === 'string' &&
      'model' in message &&
      typeof message.model === 'string'
    )
      models.add(`${message.provider}/${message.model}`);
  }
  if (models.size === 0)
    throw new Error(
      'Subject model provenance is missing; cannot establish judge independence',
    );
  return [...models];
}

/** One retry judges only the retained subject; errors are not rubric verdicts. */
export async function judgeSubject<
  R extends {
    answers: Record<string, { pass: boolean; evidence: string }>;
    messages?: unknown[];
  },
>(
  subject: R,
  output: string,
  subjects: readonly string[],
  evaluate: (
    model: string,
    attemptOutput: string,
  ) => R['answers'] | Promise<R['answers']>,
  signal?: AbortSignal,
): Promise<R & { judgment: Judgment; heldDrift: HeldDrift[] }> {
  signal?.throwIfAborted();
  mkdirSync(output, { recursive: true });
  writeFileSync(join(output, 'subject.json'), JSON.stringify(subject, null, 2));
  // Resolve and refuse before creating or launching any judge session.
  const model = judgeModel(subjects);
  const judgment: Judgment = { status: 'unjudged', model, attempts: [] };
  const result = {
    ...subject,
    answers: {},
    judgment,
    heldDrift: deliveredEvidence(subject.messages ?? []).heldDrift,
  };
  for (let attempt = 1; attempt <= 2; attempt++) {
    signal?.throwIfAborted();
    try {
      result.answers = await evaluate(
        model,
        join(output, 'rubric', `attempt-${attempt}`),
      );
      judgment.status = 'judged';
      judgment.attempts.push({});
    } catch (error) {
      signal?.throwIfAborted();
      judgment.attempts.push({ error: String(error) });
    }
    writeFileSync(
      join(output, 'recording.json'),
      JSON.stringify(result, null, 2),
    );
    writeFileSync(join(output, 'judged.json'), JSON.stringify(result, null, 2));
    if (judgment.status === 'judged') break;
  }
  return result;
}

function isJudged(run: unknown): boolean {
  if (!run || typeof run !== 'object' || !('judgment' in run)) return false;
  const judgment = run.judgment;
  return (
    judgment !== null &&
    typeof judgment === 'object' &&
    'status' in judgment &&
    judgment.status === 'judged'
  );
}

function batchVerdicts<R>(
  source: BehavioralCheck<R>,
  verdicts: Record<string, boolean>[],
) {
  const judged = verdicts.length;
  const assertions = source.assertions.map(({ id, never = false }) => {
    const held = verdicts.filter((verdict) => verdict[id] === true).length;
    return {
      id,
      never,
      held,
      runs: judged,
      passed: never ? held === judged : held >= 4,
    };
  });
  const failed = assertions.some(({ never, held }) =>
    never ? held < judged : judged - held >= 2,
  );
  const passed =
    !failed && judged >= 4 && assertions.every((assertion) => assertion.passed);
  const status = failed ? 'failed' : passed ? 'passed' : 'incomplete';
  return { status, passed, judged, unjudged: 5 - judged, assertions };
}

/** 0088: stop when each fixed assertion's outcome is decided, not at five. */
export async function judgeRuns<R>(
  source: BehavioralCheck<R>,
  runs: readonly R[],
) {
  const verdicts = [];
  for (const run of runs)
    if (isJudged(run)) verdicts.push(await source.judge(run));
  const summaries = runs.map((run, index) => ({
    index: index + 1,
    status: isJudged(run) ? 'judged' : 'unjudged',
    heldDrift: countHeldDrift(run),
  }));
  return {
    ...batchVerdicts(source, verdicts),
    runs: summaries,
    heldDrift: totalHeldDrift(summaries.map((run) => run.heldDrift)),
  };
}

/** Launch all five independently; cancellation reaches every outstanding session. */
export async function liveBatch<R>(
  source: BehavioralCheck<R>,
  run: (index: number, signal: AbortSignal) => Promise<R>,
  output: string,
) {
  mkdirSync(output, { recursive: true });
  const controllers = Array.from({ length: 5 }, () => new AbortController());
  type Outcome = { index: number; record?: R; error?: string };
  const pending = new Map<number, Promise<Outcome>>();
  const runs = Array.from({ length: 5 }, (_, index) => ({
    index: index + 1,
    status: 'not-run',
    error: undefined as string | undefined,
    heldDrift: countHeldDrift(undefined),
  }));
  let completed = 0;
  let judgeAttempts = 0;
  const verdicts: Record<string, boolean>[] = [];
  const errors: string[] = [];
  for (let index = 1; index <= 5; index++) {
    pending.set(
      index,
      Promise.resolve()
        .then(() => run(index, controllers[index - 1]!.signal))
        .then(
          (record) => ({ index, record }),
          (error) => ({ index, error: String(error) }),
        ),
    );
  }
  let batch = batchVerdicts(source, verdicts);
  while (pending.size > 0 && batch.status === 'incomplete') {
    const result = await Promise.race(pending.values());
    pending.delete(result.index);
    completed++;
    const state = runs[result.index - 1]!;
    state.status = 'unjudged';
    state.error = result.error;
    if (result.record !== undefined) {
      const record = result.record;
      state.heldDrift = countHeldDrift(record);
      if (record && typeof record === 'object' && 'judgment' in record) {
        const judgment = record.judgment;
        if (
          judgment &&
          typeof judgment === 'object' &&
          'attempts' in judgment &&
          Array.isArray(judgment.attempts)
        )
          judgeAttempts += judgment.attempts.length;
      }
      if (isJudged(record)) {
        try {
          verdicts.push(await source.judge(record));
          state.status = 'judged';
        } catch (error) {
          state.error = String(error);
        }
      }
    }
    if (state.error) errors.push(`Run ${result.index}: ${state.error}`);
    batch = batchVerdicts(source, verdicts);
  }
  const cancelled = pending.size;
  for (const index of pending.keys())
    controllers[index - 1]!.abort(
      new Error(`Batch ${batch.status}; run ${index} not run`),
    );
  // Await process closure and fixture disposal, never leave cancelled children behind.
  const remaining = await Promise.all(pending.values());
  // A sibling may already have returned when fail-fast decided the verdict.
  // Its drift still belongs in the report, even though its rubric is not counted.
  for (const result of remaining)
    if (result.record !== undefined)
      runs[result.index - 1]!.heldDrift = countHeldDrift(result.record);
  const result = {
    ...batch,
    cancelled,
    notRun: 5 - batch.judged,
    runsSpent: { started: 5, completed, judgeAttempts },
    runs,
    heldDrift: totalHeldDrift(runs.map((run) => run.heldDrift)),
  };
  writeFileSync(join(output, 'errors.json'), JSON.stringify(errors, null, 2));
  writeFileSync(
    join(output, 'assessment.json'),
    JSON.stringify(result, null, 2),
  );
  return result;
}

interface SessionResult {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
}

/** Asynchronous omp transport; abort/timeout kills the whole session process group. */
export function runSession(
  executable: string,
  args: string[],
  options: {
    cwd: string;
    env: NodeJS.ProcessEnv;
    timeout: number;
    signal?: AbortSignal;
  },
): Promise<SessionResult> {
  // The package's ES2022 lib predates withResolvers (as in closed-pipe.test.ts).
  return new Promise<SessionResult>((resolve) => {
    let stdout = '';
    let stderr = '';
    let bytes = 0;
    let error: Error | undefined;
    const { signal } = options;
    if (signal?.aborted) {
      resolve({ status: null, stdout, stderr, error: signal.reason });
      return;
    }
    const child = spawn(executable, args, {
      cwd: options.cwd,
      env: options.env,
      detached: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    function stop(reason: Error) {
      error ??= reason;
      if (child.pid) {
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch (failure) {
          if (
            !failure ||
            typeof failure !== 'object' ||
            !('code' in failure) ||
            failure.code !== 'ESRCH'
          )
            throw failure;
        }
      }
    }
    const abort = () =>
      stop(
        signal?.reason instanceof Error
          ? signal.reason
          : new Error('Session cancelled'),
      );
    signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(
      () => stop(new Error('Session timed out')),
      options.timeout,
    );
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (text: string) => {
      stdout += text;
      bytes += Buffer.byteLength(text);
      if (bytes > 32 * 1024 * 1024)
        stop(new Error('Session output exceeds 32 MiB'));
    });
    child.stderr.on('data', (text: string) => {
      stderr += text;
      bytes += Buffer.byteLength(text);
      if (bytes > 32 * 1024 * 1024)
        stop(new Error('Session output exceeds 32 MiB'));
    });
    child.on('error', (failure) => {
      error ??= failure;
    });
    child.on('close', (status) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      resolve({ status, stdout, stderr, error });
    });
    child.stdin.end();
  });
}
