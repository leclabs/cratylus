// workflow · example (decisions 0142(1), 0144): no suite of live agent runs and no
// recorded-run proof exists, nor is named as a way an example is checked; and no test
// of this repository, nor its CI, starts omp or an agent.
//
// Read off this repository's tracked files, the delivered project's among them (see
// `support/repo.ts` for what a scan leaves out: the design record, release history and
// these checks).

import { dirname, join, normalize } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  type Hit,
  hitsIn,
  inScope,
  listed,
  textOf,
  tracked,
} from './support/repo.js';

// ── workflow/1 ──────────────────────────────────────────────────────────────────

/** A path that is a recording of runs, a recorded-run proof or a live suite. */
const LIVE_OR_RECORDED_PATH =
  /(^|\/)recordings?(\/|$)|offline-proof|recorded-runs?|live-suites?|(^|\/)run-\d+\.json$/i;
/** Text naming a live suite or a recorded-run proof, in any of the forms used. */
const LIVE_OR_RECORDED_TEXT =
  /\boffline[- ]proofs?\b|\brecorded[- ]runs?\b|\brun[- ]recordings?\b|\blive[- ](agent[- ])?(suites?|runs?|batch(es)?|tests?|evidence)\b|\brecordings\b/i;
/** An environment switch for a live lane of agent runs, or for keeping recordings. The
 *  cold oracle's switch is no such lane: it decodes the corpus's signs, never an agent. */
const LIVE_SWITCH =
  /\b(?!COLD_ORACLE_LIVE\b)[A-Z][A-Z0-9_]*_LIVE\b|\bEXECUTION_RECORDINGS\b/;

function liveOrRecorded(paths: readonly string[]): Hit[] {
  return paths.flatMap((path) => {
    const text = textOf(path) ?? '';
    return [
      ...(LIVE_OR_RECORDED_PATH.test(path)
        ? [{ path, line: 0, match: 'its path' }]
        : []),
      ...hitsIn(path, text, LIVE_OR_RECORDED_TEXT),
      ...hitsIn(path, text, LIVE_SWITCH),
    ];
  });
}

describe('workflow/1 — no live suite or recorded-run proof exists, or is named as how an example is checked', () => {
  it('workflow/1: no tracked file is, or names, a live agent suite or a recorded-run proof', () => {
    const hits = liveOrRecorded(tracked().filter(inScope));
    const files = [...new Set(hits.map((h) => h.path))];
    expect(
      files,
      `${files.length} files are or name a live suite or recorded-run proof:\n${listed(hits.slice(0, 200))}`,
    ).toEqual([]);
  });

  it('FLAGS a recording, a recorded-run proof and a live lane, so the scan above is not dark', () => {
    expect(
      LIVE_OR_RECORDED_PATH.test(
        'packages/cli/test/execution-roles/recordings/15/run-1.jsonl',
      ),
    ).toBe(true);
    expect(
      LIVE_OR_RECORDED_PATH.test('packages/runtime/src/offline-proof.ts'),
    ).toBe(true);
    expect(
      LIVE_OR_RECORDED_PATH.test('design/evidence/workflow/x/run-3.json'),
    ).toBe(true);
    expect(
      'an example is checked by its offline proof over recordings',
    ).toMatch(LIVE_OR_RECORDED_TEXT);
    expect('EXECUTION_LIVE=1 enables batches').toMatch(LIVE_SWITCH);
    // The plain verb is no recording of runs, and a live runtime is no live run.
    expect('recording a decision in the LIVE runtime keyspace').not.toMatch(
      LIVE_OR_RECORDED_TEXT,
    );
    expect(
      LIVE_OR_RECORDED_PATH.test('packages/runtime/src/record-store/store.ts'),
    ).toBe(false);
  });
});

// ── workflow/2 ──────────────────────────────────────────────────────────────────

/** A test: a test or spec file, a vitest configuration, or the code of a judgment or
 *  of recorded evidence. */
const TEST_ENTRY =
  /\.(test|spec)\.[cm]?[jt]sx?$|(^|\/)vitest\.config\.[cm]?[jt]s$|^design\/(judgment|evidence)\/.*\.([cm]?[jt]sx?|sh)$/;

/** Starting omp or an agent: a program call naming one, a command line running one, a
 *  scenario runner that runs one, a live lane, or a model client. */
const STARTS_AGENT: readonly RegExp[] = [
  /\b\w*(spawn|exec|run|launch|start|session)\w*\s*\(\s*['"`](omp|claude|codex|gemini|opencode)['"`]/i,
  /(^|[\s;&|("'`])(omp|claude|codex|gemini|opencode)\s+(-p|--print|--no-session)\b/,
  /\bcreate\w*ScenarioRunner\s*\(/,
  /\b(?!COLD_ORACLE_LIVE\b)[A-Z][A-Z0-9_]*_LIVE\b/,
  /^\s*import\b[^'"]*\bfrom\s+['"](@oh-my-pi\/pi-ai|@anthropic-ai\/sdk|openai|@google\/genai)['"]/,
];

/** A line that only comments, or a match after a comment opens on its line (a comment
 *  a generated module carries, too): it starts nothing. */
const COMMENT = /^\s*(\/\/|\/\*|\*|#)/;
const commented = (line: string, match: string): boolean =>
  COMMENT.test(line) ||
  line.slice(0, Math.max(0, line.indexOf(match))).includes('//');

/** The tracked file a relative specifier from `from` names, if any. */
function resolved(
  from: string,
  spec: string,
  files: ReadonlySet<string>,
): string | undefined {
  const base = normalize(join(dirname(from), spec))
    .split('\\')
    .join('/');
  const stem = base.replace(/\.[cm]?js$/, '');
  for (const candidate of [
    base,
    `${stem}.ts`,
    `${stem}.mts`,
    `${stem}.tsx`,
    `${stem}.js`,
    `${stem}.mjs`,
    `${base}/index.ts`,
    `${base}/index.js`,
  ])
    if (files.has(candidate)) return candidate;
  return undefined;
}

/** Every file a test reaches: itself, what it imports by relative path, transitively,
 *  and each shell script any of them names. */
function reached(
  entries: readonly string[],
  all: readonly string[],
): Set<string> {
  const files = new Set(all);
  const scripts = all.filter((p) => p.endsWith('.sh'));
  const seen = new Set<string>();
  const queue = [...entries];
  while (queue.length > 0) {
    const path = queue.pop() as string;
    if (seen.has(path)) continue;
    seen.add(path);
    const text = textOf(path) ?? '';
    for (const m of text.matchAll(
      /(?:from\s+|import\s*\(\s*|require\s*\(\s*|new URL\s*\(\s*)['"`](\.{1,2}\/[^'"`]+)['"`]/g,
    )) {
      const next = m[1] === undefined ? undefined : resolved(path, m[1], files);
      if (next !== undefined) queue.push(next);
    }
    for (const m of text.matchAll(/['"`/]([\w.-]+\.sh)\b/g))
      for (const s of scripts)
        if (s.endsWith(`/${m[1]}`) || s === m[1]) queue.push(s);
  }
  return seen;
}

function startingAgents(paths: readonly string[]): Hit[] {
  return paths.flatMap((path) => {
    const text = textOf(path) ?? '';
    const lines = text.split('\n');
    return STARTS_AGENT.flatMap((pattern) =>
      hitsIn(path, text, pattern),
    ).filter((h) => !commented(lines[h.line - 1] ?? '', h.match));
  });
}

/** CI installing or running omp or an agent. Comment lines say nothing CI does. */
const CI_STARTS_AGENT =
  /oh-my-pi|pi-coding-agent|\bomp-linux|\/omp\/bin\b|\b(omp|claude|codex|gemini)\s+(-p|--print|--version|--agent)\b|@anthropic-ai\/claude-code|_LIVE\b/i;

describe('workflow/2 — no test or CI step starts omp or an agent', () => {
  it('workflow/2: no test, nor anything it reaches, starts omp or an agent', () => {
    const all = tracked().filter(inScope);
    const entries = all.filter((p) => TEST_ENTRY.test(p));
    expect(
      entries.length,
      'no test was found: the scan is dark',
    ).toBeGreaterThan(50);
    const hits = startingAgents([...reached(entries, all)]);
    const files = [...new Set(hits.map((h) => h.path))];
    expect(
      files,
      `${files.length} files of the test suite start omp or an agent:\n${listed(hits.slice(0, 200))}`,
    ).toEqual([]);
  });

  it('workflow/2: no package script runs omp or an agent', () => {
    const hits = tracked()
      .filter((p) => inScope(p) && /(^|\/)package\.json$/.test(p))
      .flatMap((path) => {
        const scripts =
          (
            JSON.parse(textOf(path) ?? '{}') as {
              scripts?: Record<string, string>;
            }
          ).scripts ?? {};
        return Object.entries(scripts).flatMap(([name, line]) =>
          /(^|&&|\|\||;|\|)\s*((npx|bunx|pnpm\s+exec|pnpm\s+dlx)\s+)?(omp|claude|codex|gemini)\b|\b(?!COLD_ORACLE_LIVE)[A-Z][A-Z0-9_]*_LIVE=/.test(
            line,
          )
            ? [{ path, line: 0, match: `${name}: ${line}` }]
            : [],
        );
      });
    expect(
      hits,
      `package scripts starting omp or an agent:\n${listed(hits)}`,
    ).toEqual([]);
  });

  it('workflow/2: CI neither installs nor runs omp or an agent', () => {
    const hits = tracked()
      .filter((p) => /^\.github\/workflows\/.*\.ya?ml$/.test(p))
      .flatMap((path) =>
        hitsIn(path, textOf(path) ?? '', CI_STARTS_AGENT).filter(
          (h) =>
            !/^\s*#/.test((textOf(path) ?? '').split('\n')[h.line - 1] ?? ''),
        ),
      );
    expect(
      hits,
      `CI steps installing or running omp or an agent:\n${listed(hits)}`,
    ).toEqual([]);
  });

  it('FLAGS a test that starts omp, one reaching a script that runs an agent, and CI installing omp, so the scans above are not dark', () => {
    for (const started of [
      "const child = spawn('omp', args, { cwd });",
      "const result = spawnSync('omp', args);",
      "await runSession('omp', args, {})",
      'cd "$SCRATCH" && claude -p --model "$MODEL"',
      'const runner = createOmpAgentScenarioRunner({});',
      "it.runIf(process.env.EXECUTION_LIVE === '1')",
    ])
      expect(
        STARTS_AGENT.some((p) => p.test(started)),
        started,
      ).toBe(true);
    for (const plain of [
      "project('omp', [base])",
      "execFileSync(process.execPath, [cli, 'project', '--harness', 'omp'])",
      "vi.mock('@oh-my-pi/pi-ai', () => ({}))",
      "it.runIf(process.env.COLD_ORACLE_LIVE === '1')",
    ])
      expect(
        STARTS_AGENT.some((p) => p.test(plain)),
        plain,
      ).toBe(false);
    expect(
      commented("  '// measured through `omp -p` on haiku',", 'omp -p'),
    ).toBe(true);
    expect(
      commented("  const r = spawnSync('omp', args);", "spawnSync('omp'"),
    ).toBe(false);
    expect(
      '            https://github.com/can1357/oh-my-pi/releases/download/v18.6.3/omp-linux-x64',
    ).toMatch(CI_STARTS_AGENT);
    expect(
      '        run: pnpm canon:project && pnpm canon:project:omp',
    ).not.toMatch(CI_STARTS_AGENT);
  });
});
