import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { type BehavioralCheck, judgeBatch } from '@cratylus/runtime';

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

/** Three attempts judge the same retained subject; errors are not rubric verdicts. */
export function judgeSubject<
  R extends { answers: Record<string, { pass: boolean; evidence: string }> },
>(
  subject: R,
  output: string,
  subjects: readonly string[],
  evaluate: (model: string, attemptOutput: string) => R['answers'],
): R & { judgment: Judgment } {
  mkdirSync(output, { recursive: true });
  writeFileSync(join(output, 'subject.json'), JSON.stringify(subject, null, 2));
  // Resolve and refuse before creating or launching any judge session.
  const model = judgeModel(subjects);
  const judgment: Judgment = { status: 'unjudged', model, attempts: [] };
  const result = { ...subject, answers: {}, judgment };
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      result.answers = evaluate(
        model,
        join(output, 'rubric', `attempt-${attempt}`),
      );
      judgment.status = 'judged';
      judgment.attempts.push({});
    } catch (error) {
      judgment.attempts.push({ error: String(error) });
    }
    writeFileSync(
      join(output, 'recording.json'),
      JSON.stringify(result, null, 2),
    );
    if (judgment.status === 'judged') break;
  }
  return result;
}

/** Only a complete five-judgment batch reaches the frozen rubric aggregator. */
export async function judgeRuns<R>(
  source: BehavioralCheck<R>,
  runs: readonly R[],
) {
  const judged = runs.filter((run) => {
    if (!run || typeof run !== 'object' || !('judgment' in run)) return false;
    const judgment = run.judgment;
    return (
      judgment !== null &&
      typeof judgment === 'object' &&
      'status' in judgment &&
      judgment.status === 'judged'
    );
  });
  const counts = {
    judged: judged.length,
    unjudged: Math.max(0, 5 - judged.length),
  };
  if (runs.length !== 5 || judged.length !== 5)
    return { ...counts, status: 'incomplete', passed: false, assertions: [] };
  const result = await judgeBatch(source, judged, { atLeast: 4, of: 5 });
  return { ...result, ...counts, status: result.passed ? 'passed' : 'failed' };
}
