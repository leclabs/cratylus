import { AsyncLocalStorage } from 'node:async_hooks';
import { createRequire, syncBuiltinESMExports } from 'node:module';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// What a judge may read from the operator's host: 'env:<NAME>' or 'env' (the whole environment),
// 'file:<absolute path>', 'process:<file>', 'clock', 'timezone', 'home', 'user', 'cwd', or the name of
// another host fact ('hostname', 'tmpdir', 'networkInterfaces', 'cpus', 'memoryUsage', …).
export type HostRead = string;
export type BehavioralCheck<R = unknown> = Readonly<{
  example: string;
  assertions: readonly Readonly<{
    id: string;
    binds: readonly string[];
    never?: boolean;
  }>[];
  // A method, so a check over particular recordings is also a check over `unknown` ones.
  judge(
    recording: R,
  ):
    | Readonly<Record<string, boolean>>
    | Promise<Readonly<Record<string, boolean>>>;
  host?: readonly Readonly<{ read: HostRead; binds: readonly string[] }>[];
}>;
// A check given as a loader is observed while it loads too, so its module-scope host reads are seen.
export type CheckSource<R = unknown> =
  | BehavioralCheck<R>
  | (() => BehavioralCheck<R> | Promise<BehavioralCheck<R>>);
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
    | 'host-read'
    | 'never-seen-passing'
    | 'goldens-not-varied'
    | 'undeclared'
    | 'never-mismatch';
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
type Verdict = Readonly<Record<string, boolean>>;

// Offline proof: judge only the given recordings, never live work. Proven exactly when nothing is found.
export async function proveOffline<R>(
  source: CheckSource<R>,
  recordings: ProofRecordings<R>,
): Promise<ProofResult> {
  const reads = new Set<HostRead>();
  const check =
    typeof source === 'function' ? await observeHost(reads, source) : source;
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

  const verdicts: Verdict[] = [];
  for (const { name, recording } of recordings.golden) {
    const verdict = await observeHost(reads, () =>
      check.judge(recording),
    ).catch(() => undefined);
    if (!verdict) {
      findings.push({ kind: 'golden-rejected', recording: name });
      continue;
    }
    verdicts.push(verdict);
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
    const verdict = await observeHost(reads, () =>
      check.judge(recording),
    ).catch(() => undefined);
    if (!verdict) {
      findings.push({ kind: 'negative-breaks-other', recording: name });
      continue;
    }
    verdicts.push(verdict);
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

  // A declared read is excused only by words of the example that name it.
  const excused = new Set(
    (check.host ?? [])
      .filter(({ read, binds }) =>
        binds.some((phrase) => {
          const words = tokens(phrase);
          return (
            contains(example, words) &&
            namesOf(read).some((name) => contains(words, name))
          );
        }),
      )
      .map(({ read }) => read),
  );
  // Reading the whole environment subsumes reading each of its variables.
  for (const read of reads)
    if (!excused.has(read) && !(reads.has('env') && read.startsWith('env:')))
      findings.push({ kind: 'host-read', read });

  if (recordings.golden.length === 0)
    for (const { id } of check.assertions)
      findings.push({ kind: 'never-seen-passing', assertion: id });
  if (
    new Set(recordings.golden.map(({ recording }) => JSON.stringify(recording)))
      .size < 2
  )
    findings.push({ kind: 'goldens-not-varied' });
  const declared = new Set(check.assertions.map(({ id }) => id));
  for (const key of new Set(verdicts.flatMap(Object.keys)))
    if (!declared.has(key))
      findings.push({ kind: 'undeclared', assertion: key });
  for (const { id, binds, never = false } of check.assertions) {
    const words = binds.flatMap(tokens);
    if (
      never
        ? !words.some((word) => NEGATION.test(word))
        : words.includes('never')
    )
      findings.push({ kind: 'never-mismatch', assertion: id });
  }
  return { proven: findings.length === 0, findings };
}

// A batch of runs: an ordinary assertion must hold in at least `atLeast` runs, a never-assertion in every run.
export async function judgeBatch<R>(
  source: CheckSource<R>,
  recordings: readonly R[],
  threshold: Readonly<{ atLeast: number; of: number }>,
): Promise<BatchResult> {
  if (threshold.of !== recordings.length)
    throw new Error(
      `judgeBatch: threshold is of ${threshold.of} runs, but ${recordings.length} recordings were given`,
    );
  const check = typeof source === 'function' ? await source() : source;
  const verdicts: Verdict[] = [];
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

const NEGATION =
  /^(?:never|no|not|none|nothing|nobody|nowhere|neither|nor|cannot|cant|dont|doesnt|mustnt|wont|shouldnt)$/;
const CLOCK_WORDS = [
  'date',
  'dates',
  'time',
  'times',
  'today',
  'now',
  'clock',
  'day',
  'days',
];

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

// The word sequences that name a host read; any one of them names it.
function namesOf(read: HostRead): string[][] {
  const colon = read.indexOf(':');
  const kind = colon < 0 ? read : read.slice(0, colon);
  const target = colon < 0 ? '' : read.slice(colon + 1);
  if (kind === 'env')
    return target ? [tokens(target)] : [['env'], ['environment']];
  if (kind === 'file' || kind === 'process')
    return [tokens(target), tokens(basename(target))];
  if (kind === 'clock') return CLOCK_WORDS.map((word) => [word]);
  if (kind === 'timezone') return [['timezone'], ['time', 'zone']];
  if (kind === 'cwd')
    return [['cwd'], ['working', 'directory'], ['current', 'directory']];
  return [tokens(kind.replace(/([a-z])([A-Z])/g, '$1 $2'))];
}

// ── Host observation ────────────────────────────────────────────────────────
// While any proof judges, the host's environment, file system, child processes, os facts, working
// directory, clock and time zone are wrapped so each read is recorded into the proof whose judge made
// it (AsyncLocalStorage). Builtin modules are patched on their CommonJS exports and synced into their
// ESM named exports, so `import { readFileSync } from 'node:fs'` is observed too. Everything is
// restored, and the ESM exports re-synced, when the last proof stops judging.

type Reader = (args: readonly unknown[]) => readonly HostRead[];
type Method = (this: unknown, ...args: unknown[]) => unknown;

const require = createRequire(import.meta.url);
const observing = new AsyncLocalStorage<Set<HostRead>>();
let judging = 0;
let restore: (() => void) | undefined;
// Set while an observed builtin runs, so its own internal reads are not recorded.
let inside = false;

async function observeHost<T>(
  sink: Set<HostRead>,
  run: () => T | Promise<T>,
): Promise<Awaited<T>> {
  if (judging === 0) restore = install();
  judging++;
  try {
    return await observing.run(sink, run);
  } finally {
    if (--judging === 0) {
      restore?.();
      restore = undefined;
    }
  }
}

function record(...reads: readonly HostRead[]): void {
  if (inside) return;
  const sink = observing.getStore();
  if (sink && !loaderMade()) for (const read of reads) sink.add(read);
}

// Module-loading machinery: Node's own loaders, and vite/vitest's module runner and transform.
const LOADER =
  /^node:internal\/modules\/|[\\/]node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(?:vite-node|vite|vitest|@vitest[\\/][^\\/]+)[\\/]/;

// Whether a read was made by module-loading machinery loading a check, not by the check's own code
// or a library it calls. The caller is the first frame past this module's own frames and past any
// other builtin (whose own caller made the read).
function loaderMade(): boolean {
  const limit = Error.stackTraceLimit;
  Error.stackTraceLimit = 64;
  const stack = new Error().stack ?? '';
  Error.stackTraceLimit = limit;
  const files = stack
    .split('\n')
    .slice(1)
    .flatMap((line) => /\(?([^\s()]+):\d+:\d+\)?$/.exec(line)?.[1] ?? []);
  const [own] = files;
  for (const file of files) {
    if (file === own) continue;
    if (LOADER.test(file)) return true;
    if (!file.startsWith('node:')) return false;
  }
  return false;
}

function observed(original: Method, read: Reader): Method {
  const wrapper = observedCall(original, read);
  // Carry the original's own properties (`hrtime.bigint`, `promisify.custom`, `realpathSync.native`),
  // observing those that are functions too.
  for (const key of Reflect.ownKeys(original)) {
    if (key === 'prototype') continue;
    const descriptor = Object.getOwnPropertyDescriptor(original, key);
    if (!descriptor) continue;
    if (typeof descriptor.value === 'function')
      descriptor.value = observedCall(descriptor.value, read);
    Object.defineProperty(wrapper, key, descriptor);
  }
  return wrapper;
}

function observedCall(original: Method, read: Reader): Method {
  return function (this: unknown, ...args: unknown[]) {
    if (inside) return Reflect.apply(original, this, args);
    if (observing.getStore()) record(...read(args));
    inside = true;
    try {
      return Reflect.apply(original, this, args);
    } finally {
      inside = false;
    }
  };
}

const FS_READS = [
  'access',
  'accessSync',
  'copyFile',
  'copyFileSync',
  'cp',
  'cpSync',
  'createReadStream',
  'exists',
  'existsSync',
  'glob',
  'globSync',
  'lstat',
  'lstatSync',
  'open',
  'openSync',
  'openAsBlob',
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
  'watch',
  'watchFile',
] as const;
const FS_PROMISES_READS = [
  'access',
  'copyFile',
  'cp',
  'glob',
  'lstat',
  'open',
  'opendir',
  'readFile',
  'readdir',
  'readlink',
  'realpath',
  'stat',
  'statfs',
  'watch',
] as const;
const CHILD_PROCESSES = [
  'exec',
  'execSync',
  'execFile',
  'execFileSync',
  'fork',
  'spawn',
  'spawnSync',
] as const;
const OS_READS: Readonly<Record<string, HostRead>> = {
  arch: 'arch',
  availableParallelism: 'availableParallelism',
  cpus: 'cpus',
  endianness: 'endianness',
  freemem: 'freemem',
  getPriority: 'getPriority',
  homedir: 'home',
  hostname: 'hostname',
  loadavg: 'loadavg',
  machine: 'machine',
  networkInterfaces: 'networkInterfaces',
  platform: 'platform',
  release: 'release',
  tmpdir: 'tmpdir',
  totalmem: 'totalmem',
  type: 'type',
  uptime: 'uptime',
  userInfo: 'user',
  version: 'version',
};
const PROCESS_READS: Readonly<Record<string, HostRead>> = {
  cpuUsage: 'cpuUsage',
  cwd: 'cwd',
  getegid: 'user',
  geteuid: 'user',
  getgid: 'user',
  getgroups: 'user',
  getuid: 'user',
  hrtime: 'clock',
  memoryUsage: 'memoryUsage',
  resourceUsage: 'resourceUsage',
  uptime: 'clock',
};
// Date methods whose result depends on the host's time zone.
const DATE_LOCAL = [
  'getDate',
  'getDay',
  'getFullYear',
  'getHours',
  'getMilliseconds',
  'getMinutes',
  'getMonth',
  'getSeconds',
  'getTimezoneOffset',
  'getYear',
  'setDate',
  'setFullYear',
  'setHours',
  'setMilliseconds',
  'setMinutes',
  'setMonth',
  'setSeconds',
  'setYear',
  'toDateString',
  'toString',
  'toTimeString',
] as const;
const DATE_LOCALE = [
  'toLocaleDateString',
  'toLocaleString',
  'toLocaleTimeString',
] as const;
// A date string carrying its own offset, or a bare ISO date (read as UTC), does not read the zone.
const ZONED_DATE = /(?:z|[+-]\d{2}:?\d{2})$|^\d{4}(?:-\d{2}){0,2}$/i;

function fileReads([target]: readonly unknown[]): readonly HostRead[] {
  if (typeof target === 'string') return [`file:${resolve(target)}`];
  if (target instanceof URL) return [`file:${fileURLToPath(target)}`];
  if (target instanceof Uint8Array)
    return [`file:${resolve(Buffer.from(target).toString())}`];
  return [];
}

function dateReads(args: readonly unknown[]): readonly HostRead[] {
  if (args.length === 0) return ['clock'];
  if (args.length > 1) return ['timezone'];
  const [value] = args;
  return typeof value === 'string' && !ZONED_DATE.test(value.trim())
    ? ['timezone']
    : [];
}

function zoneReads(options: unknown): readonly HostRead[] {
  return typeof options === 'object' &&
    options !== null &&
    'timeZone' in options &&
    options.timeZone !== undefined
    ? []
    : ['timezone'];
}

// Patches the host, rolling every patch back if one of them fails.
function install(): () => void {
  const undo: (() => void)[] = [];
  const restore = () => {
    for (const step of undo.reverse()) step();
    syncBuiltinESMExports();
  };
  try {
    patchHost(undo);
  } catch (error) {
    restore();
    throw error;
  }
  return restore;
}

function patchHost(undo: (() => void)[]): void {
  const define = (
    target: object,
    key: PropertyKey,
    descriptor: PropertyDescriptor,
  ) => {
    const own = Object.getOwnPropertyDescriptor(target, key);
    const base: PropertyDescriptor = own ?? {
      configurable: true,
      enumerable: false,
      ...('value' in descriptor ? { writable: true } : {}),
    };
    Object.defineProperty(target, key, { ...base, ...descriptor });
    undo.push(() =>
      own
        ? Object.defineProperty(target, key, own)
        : Reflect.deleteProperty(target, key),
    );
  };
  const wrap = (target: object, key: PropertyKey, read: Reader) => {
    const original: unknown = Reflect.get(target, key);
    if (typeof original === 'function')
      define(target, key, { value: observed(original as Method, read) });
  };

  const fs = require('node:fs') as object;
  for (const name of FS_READS) wrap(fs, name, fileReads);
  const fsPromises = require('node:fs/promises') as object;
  for (const name of FS_PROMISES_READS) wrap(fsPromises, name, fileReads);
  const childProcess = require('node:child_process') as object;
  for (const name of CHILD_PROCESSES)
    wrap(childProcess, name, ([file]) => [
      `process:${name.startsWith('exec') && !name.startsWith('execFile') ? String(file).trim().split(/\s+/)[0] : String(file)}`,
    ]);
  const os = require('node:os') as object;
  for (const [name, read] of Object.entries(OS_READS))
    wrap(os, name, () => [read]);
  for (const [name, read] of Object.entries(PROCESS_READS))
    wrap(process, name, () => [read]);
  syncBuiltinESMExports();

  const env = process.env;
  define(process, 'env', {
    value: new Proxy(env, {
      get(target, key) {
        if (typeof key === 'string') record(`env:${key}`);
        return Reflect.get(target, key);
      },
      has(target, key) {
        if (typeof key === 'string') record(`env:${key}`);
        return Reflect.has(target, key);
      },
      getOwnPropertyDescriptor(target, key) {
        if (typeof key === 'string') record(`env:${key}`);
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
      ownKeys(target) {
        record('env');
        return Reflect.ownKeys(target);
      },
    }),
  });
  // `process.env` is now a proxy, so the ESM `env` export of `node:process` follows it.
  syncBuiltinESMExports();

  const performance = globalThis.performance;
  wrap(performance, 'now', () => ['clock']);
  const timeOrigin = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(performance),
    'timeOrigin',
  )?.get;
  if (timeOrigin)
    define(performance, 'timeOrigin', {
      get(this: unknown) {
        record('clock');
        return timeOrigin.call(this);
      },
    });

  const OriginalDate = Date;
  wrap(OriginalDate, 'now', () => ['clock']);
  wrap(OriginalDate, 'parse', dateReads);
  for (const name of DATE_LOCAL)
    wrap(OriginalDate.prototype, name, () => ['timezone']);
  for (const name of DATE_LOCALE)
    wrap(OriginalDate.prototype, name, ([, options]) => zoneReads(options));
  const ObservedDate = new Proxy(OriginalDate, {
    construct(target, args, newTarget) {
      record(...dateReads(args));
      return Reflect.construct(target, args, newTarget);
    },
    apply(target, self, args) {
      record('clock', 'timezone');
      return Reflect.apply(target, self, args);
    },
  });
  define(globalThis, 'Date', { value: ObservedDate });
  define(OriginalDate.prototype, 'constructor', { value: ObservedDate });

  const DateTimeFormat = Intl.DateTimeFormat;
  const formatterReads: Reader = ([date]) =>
    date === undefined ? ['clock'] : [];
  const format = Object.getOwnPropertyDescriptor(
    DateTimeFormat.prototype,
    'format',
  )?.get;
  if (format)
    define(DateTimeFormat.prototype, 'format', {
      get(this: Intl.DateTimeFormat) {
        return observed(format.call(this), formatterReads);
      },
    });
  wrap(DateTimeFormat.prototype, 'formatToParts', formatterReads);
  define(Intl, 'DateTimeFormat', {
    value: new Proxy(DateTimeFormat, {
      construct(target, args, newTarget) {
        record(...zoneReads(args[1]));
        return Reflect.construct(target, args, newTarget);
      },
      apply(target, self, args) {
        record(...zoneReads(args[1]));
        return Reflect.apply(target, self, args);
      },
    }),
  });

  const temporal: unknown = Reflect.get(globalThis, 'Temporal');
  const now: unknown =
    typeof temporal === 'object' && temporal !== null
      ? Reflect.get(temporal, 'Now')
      : undefined;
  if (typeof now === 'object' && now !== null) {
    wrap(now, 'instant', () => ['clock']);
    wrap(now, 'timeZoneId', () => ['timezone']);
    for (const name of [
      'plainDateISO',
      'plainDateTimeISO',
      'plainTimeISO',
      'zonedDateTimeISO',
    ])
      wrap(now, name, ([zone]) =>
        zone === undefined ? ['clock', 'timezone'] : ['clock'],
      );
  }
}
