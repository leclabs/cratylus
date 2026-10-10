import { createRequire, syncBuiltinESMExports } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// What a judge may read from the operator's host: 'env:<NAME>', 'file:<absolute path>', 'clock', 'home'.
export type HostRead = string;
export type BehavioralCheck<R = unknown> = Readonly<{
  example: string;
  assertions: readonly Readonly<{
    id: string;
    binds: readonly string[];
    never?: boolean;
  }>[];
  judge: (
    recording: R,
  ) =>
    | Readonly<Record<string, boolean>>
    | Promise<Readonly<Record<string, boolean>>>;
  host?: readonly Readonly<{ read: HostRead; binds: readonly string[] }>[];
}>;
export type ProofRecordings<R = unknown> = Readonly<{
  golden: readonly Readonly<{ name: string; recording: R }>[];
  negative: readonly Readonly<{ name: string; recording: R; breaks: string }>[];
}>;
export type ProofFinding = Readonly<{
  kind:
    | 'golden-rejected'
    | 'negative-accepted'
    | 'negative-breaks-other'
    | 'never-seen-failing'
    | 'unbound'
    | 'binds-unfixed'
    | 'host-read';
  assertion?: string;
  recording?: string;
  words?: readonly string[];
  read?: HostRead;
}>;
export type ProofResult = Readonly<{
  proven: boolean;
  findings: readonly ProofFinding[];
}>;
export type BatchResult = Readonly<{
  passed: boolean;
  assertions: readonly Readonly<{
    id: string;
    never: boolean;
    held: number;
    runs: number;
    passed: boolean;
  }>[];
}>;

// Offline proof: judge only the given recordings, never live work. Proven exactly when nothing is found.
export async function proveOffline<R>(
  check: BehavioralCheck<R>,
  recordings: ProofRecordings<R>,
): Promise<ProofResult> {
  const findings: ProofFinding[] = [];
  const example = tokens(check.example);
  for (const { ref, binds } of [
    ...check.assertions.map(({ id, binds }) => ({
      ref: { assertion: id },
      binds,
    })),
    ...(check.host ?? []).map(({ read, binds }) => ({ ref: { read }, binds })),
  ]) {
    const missing = binds.filter(
      (phrase) => !contains(example, tokens(phrase)),
    );
    if (missing.length === binds.length)
      findings.push({ kind: 'unbound', ...ref });
    if (missing.length > 0)
      findings.push({ kind: 'binds-unfixed', ...ref, words: missing });
  }

  const reads = new Set<HostRead>();
  for (const { name, recording } of recordings.golden) {
    const verdict = await observeHost(reads, () => check.judge(recording));
    if (!verdict) findings.push({ kind: 'golden-rejected', recording: name });
    else
      for (const { id } of check.assertions)
        if (verdict[id] !== true)
          findings.push({
            kind: 'golden-rejected',
            assertion: id,
            recording: name,
          });
  }
  const seenFailing = new Set<string>();
  for (const { name, recording, breaks } of recordings.negative) {
    const verdict = await observeHost(reads, () => check.judge(recording));
    if (!verdict) {
      findings.push({ kind: 'negative-breaks-other', recording: name });
      continue;
    }
    const failed = check.assertions.filter(({ id }) => verdict[id] !== true);
    if (failed.length === 0)
      findings.push({
        kind: 'negative-accepted',
        assertion: breaks,
        recording: name,
      });
    for (const { id } of failed)
      if (id === breaks) seenFailing.add(id);
      else
        findings.push({
          kind: 'negative-breaks-other',
          assertion: id,
          recording: name,
        });
  }
  for (const { id } of check.assertions)
    if (!seenFailing.has(id))
      findings.push({ kind: 'never-seen-failing', assertion: id });

  const declared = new Set((check.host ?? []).map(({ read }) => read));
  for (const read of reads)
    if (!declared.has(read)) findings.push({ kind: 'host-read', read });
  return { proven: findings.length === 0, findings };
}

// A batch of runs: an ordinary assertion must hold in at least `atLeast` runs, a never-assertion in every run.
export async function judgeBatch<R>(
  check: BehavioralCheck<R>,
  recordings: readonly R[],
  threshold: Readonly<{ atLeast: number; of: number }>,
): Promise<BatchResult> {
  if (threshold.of !== recordings.length)
    throw new Error(
      `judgeBatch: threshold is of ${threshold.of} runs, but ${recordings.length} recordings were given`,
    );
  const verdicts: Readonly<Record<string, boolean>>[] = [];
  for (const recording of recordings)
    verdicts.push(await check.judge(recording));
  const assertions = check.assertions.map(({ id, never = false }) => {
    const held = verdicts.filter((verdict) => verdict[id] === true).length;
    const runs = recordings.length;
    return {
      id,
      never,
      held,
      runs,
      passed: never ? held === runs : held >= threshold.atLeast,
    };
  });
  return { passed: assertions.every(({ passed }) => passed), assertions };
}

// Words compared case-, whitespace- and punctuation-insensitively; currency symbols stay words.
function tokens(text: string): string[] {
  return (
    text
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[\u2018\u2019\u02bc'`]/g, '')
      .match(/[\p{L}\p{N}]+|\p{Sc}/gu) ?? []
  );
}

function contains(
  haystack: readonly string[],
  needle: readonly string[],
): boolean {
  if (needle.length === 0) return false;
  for (let start = 0; start + needle.length <= haystack.length; start++)
    if (needle.every((word, offset) => haystack[start + offset] === word))
      return true;
  return false;
}

// ── Host observation ────────────────────────────────────────────────────────
// While a judge runs, the host's environment, home directory, file system and clock are wrapped so each read
// is recorded. Builtin modules are patched on their CommonJS exports and synced into their ESM named exports,
// so `import { readFileSync } from 'node:fs'` is observed too. Everything is restored when judging ends.

const require = createRequire(import.meta.url);
const FS_READS = [
  'access',
  'accessSync',
  'createReadStream',
  'exists',
  'existsSync',
  'lstat',
  'lstatSync',
  'open',
  'openSync',
  'opendir',
  'opendirSync',
  'readFile',
  'readFileSync',
  'readdir',
  'readdirSync',
  'readlink',
  'readlinkSync',
  'realpath',
  'realpathSync',
  'stat',
  'statSync',
  'statfs',
  'statfsSync',
] as const;
const FS_PROMISES_READS = [
  'access',
  'lstat',
  'open',
  'opendir',
  'readFile',
  'readdir',
  'readlink',
  'realpath',
  'stat',
  'statfs',
] as const;

const sinks = new Set<Set<HostRead>>();
let restore: (() => void) | undefined;

async function observeHost<T>(
  sink: Set<HostRead>,
  run: () => T | Promise<T>,
): Promise<Awaited<T> | undefined> {
  if (sinks.size === 0) restore = install();
  sinks.add(sink);
  try {
    return await run();
  } catch {
    return undefined;
  } finally {
    sinks.delete(sink);
    if (sinks.size === 0) {
      restore?.();
      restore = undefined;
    }
  }
}

let recording = false;
function record(read: HostRead): void {
  if (recording) return;
  for (const sink of sinks) sink.add(read);
}

// Calls made inside an observed builtin (its own internal reads) are not recorded twice.
function observed<F extends (...args: never[]) => unknown>(
  original: F,
  read: (args: Parameters<F>) => HostRead | undefined,
): F {
  const wrapper = function (this: unknown, ...args: Parameters<F>) {
    if (recording) return original.apply(this, args);
    const host = read(args);
    if (host) record(host);
    recording = true;
    try {
      return original.apply(this, args);
    } finally {
      recording = false;
    }
  };
  return Object.assign(wrapper, original) as unknown as F;
}

function filePath(target: unknown): HostRead | undefined {
  if (typeof target === 'string') return `file:${resolve(target)}`;
  if (target instanceof URL) return `file:${fileURLToPath(target)}`;
  if (target instanceof Uint8Array)
    return `file:${resolve(Buffer.from(target).toString())}`;
  return undefined;
}

function install(): () => void {
  const undo: (() => void)[] = [];
  const patch = (
    target: Record<string, unknown>,
    key: string,
    value: unknown,
  ) => {
    const original = Object.getOwnPropertyDescriptor(target, key);
    if (!original) return;
    Object.defineProperty(target, key, { ...original, value });
    undo.push(() => Object.defineProperty(target, key, original));
  };

  const fs = require('node:fs') as Record<string, unknown>;
  const fsPromises = require('node:fs/promises') as Record<string, unknown>;
  const os = require('node:os') as Record<string, unknown>;
  for (const [module, names] of [
    [fs, FS_READS],
    [fsPromises, FS_PROMISES_READS],
  ] as const)
    for (const name of names) {
      const original = module[name];
      if (typeof original === 'function')
        patch(
          module,
          name,
          observed(original as (...args: unknown[]) => unknown, ([target]) =>
            filePath(target),
          ),
        );
    }
  patch(
    os,
    'homedir',
    observed(os.homedir as () => string, () => 'home'),
  );
  syncBuiltinESMExports();

  const env = process.env;
  const observedEnv = new Proxy(env, {
    get(target, key, receiver) {
      if (typeof key === 'string') record(`env:${key}`);
      return Reflect.get(target, key, receiver);
    },
    has(target, key) {
      if (typeof key === 'string') record(`env:${key}`);
      return Reflect.has(target, key);
    },
  });
  patch(process as unknown as Record<string, unknown>, 'env', observedEnv);

  const OriginalDate = Date;
  const now = observed(OriginalDate.now, () => 'clock');
  const ObservedDate: DateConstructor = new Proxy(OriginalDate, {
    construct(target, args, newTarget): object {
      if (args.length === 0) record('clock');
      return Reflect.construct(
        target,
        args,
        newTarget === ObservedDate ? target : newTarget,
      );
    },
    apply(target, self, args) {
      record('clock');
      return Reflect.apply(target, self, args);
    },
    get(target, key, receiver) {
      return key === 'now' ? now : Reflect.get(target, key, receiver);
    },
  });
  patch(globalThis as unknown as Record<string, unknown>, 'Date', ObservedDate);

  return () => {
    for (const step of undo.reverse()) step();
    syncBuiltinESMExports();
  };
}
