// COMMAND-VERACITY gate — a text that tells a reader to run a named command must
// name a command that exists.
//
// The law is a TRUTHFULNESS constraint, not a freshness one. A document saying
// `pnpm foo` asserts that `foo` is runnable. When it is not, the document is
// simply false, and it is false in the one direction that costs a reader the most:
// they try it, it fails, and nothing in the repository told them what to run
// instead.
//
// WHY NOTHING CAUGHT THIS. A command name inside a string or a markdown fence has
// ZERO compiler pressure. Identifiers get renamed under type-check pressure; the
// prose that names them does not move, and no gate read it. `canon:*` was once
// `anatomy:*`; the scripts were renamed and eight citations were not. One of them
// is a CLI help string — a surface whose entire job is telling a reader what to
// run, naming something that does not exist.
//
// SCOPE — stated, because a self-selected scope is how a coverage claim disguises
// itself as a conformance claim (see `reader-density.test.ts`'s reach leg).
// IN: every tracked file a reader could act on today.
// OUT, each for a reason that is about the PROPERTY, not about convenience:
//   - `plans/*/completed/**` — a closed record of what was true when it was written.
//     It is not instructing anyone now, and holding history to today's script names
//     would forbid recording history accurately. (`plans/.retired/**` was the other
//     half of this exclusion and is gone: `retire` means DELETE, so no such path can
//     ever be tracked again, and a skip for a path that cannot exist is dead code.)
//   - `**/test/**` — specimen carriers. A test that names a command is MENTIONING
//     one, not telling a reader to run it; the same use/mention line that keeps the
//     stance rubric's quoted collapse examples out of the density gate. THIS FILE is
//     the proof: it must cite dead commands in order to test for them, and an
//     unqualified scan convicts it for doing its job — the meta-gate's "haystack
//     contains the needle" hazard, in its own source.
//   - `node_modules`, `graphify-out`, `dist` — not authored here.
//
// THE RATCHET IS GONE, AT ZERO. It held four pins, all naming one defect record inside
// `decomplect` that quoted the dead `anatomy:*` scripts in order to document them. Retiring
// that plan deleted the citations, so the ratchet shrank to ∅ — and an exemption list with no
// members is a mechanism with no subject: `every pin still FAILS` iterates nothing and reads
// green for having looked at nothing, which is the shape this suite exists to reject. The
// list and its shrink-only leg are therefore deleted rather than emptied, and the gate is
// STRICTLY STRONGER for it — every cited command must now resolve, with no excuse available.
// A future defect record that must quote a dead script rebuilds the mechanism then, when it
// has a live subject to protect.
//
// RESOLUTION. A token resolves if it is a script key in the root `package.json` or
// in any workspace package's. Workspace scripts count because `pnpm --filter <pkg>
// <script>` and an in-package invocation are both legitimate. pnpm's own verbs are
// skipped by an explicit roster: a builtin is not a claim about this repository.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
);

/** pnpm's own verbs — a builtin asserts nothing about this repository's scripts. */
const PNPM_BUILTINS = new Set([
  'add',
  'approve-builds',
  'audit',
  'bin',
  'config',
  'create',
  'dedupe',
  'deploy',
  'dlx',
  'doctor',
  'env',
  'exec',
  'fetch',
  'import',
  'init',
  'install',
  'licenses',
  'link',
  'list',
  'ls',
  'outdated',
  'pack',
  'patch',
  'prune',
  'publish',
  'rebuild',
  'remove',
  'root',
  'run',
  'server',
  'setup',
  'start',
  'store',
  'unlink',
  'update',
  'why',
  'i',
  'up',
  'rm',
  'it',
  'dx',
]);

interface Citation {
  readonly file: string;
  readonly line: number;
  readonly script: string;
  readonly raw: string;
}

/** What a failure reports — file and script, plus the line so it can be found. */
function label(c: Citation): string {
  return `${c.file}:${c.line} → ${c.script}`;
}

function tracked(): string[] {
  return execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

/** IN-scope ⇔ a reader could act on it today. Every exclusion is argued in the header. */
function inScope(rel: string): boolean {
  if (/^plans\/[^/]+\/completed\//.test(rel)) return false;
  if (rel.includes('/test/') || rel.endsWith('.test.ts')) return false;
  if (rel.startsWith('graphify-out/')) return false;
  return /\.(ts|tsx|mjs|js|md|sh|json|ya?ml)$/.test(rel);
}

/** Every script key declared anywhere in the workspace. */
function declaredScripts(): Set<string> {
  const out = new Set<string>();
  const manifests = tracked().filter(
    (f) => f === 'package.json' || /^packages\/[^/]+\/package\.json$/.test(f),
  );
  for (const m of manifests) {
    const pkg = JSON.parse(readFileSync(join(repoRoot, m), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    for (const k of Object.keys(pkg.scripts ?? {})) out.add(k);
  }
  return out;
}

const RUN =
  /\b(?:pnpm|npm)\s+((?:(?:--?[\w-]+|@?[\w./-]+)\s+)*?)(run\s+)?([a-zA-Z][\w:.-]*)/g;

/**
 * The spans of a line that are CODE — backtick-delimited, or the whole line when
 * it sits inside a fence or is a shell script's own text.
 *
 * USE vs MENTION, and it is load-bearing. `npm` appears all over this repo's prose
 * as a noun — "the npm scope", "npm reads the manifest", "an npm package". None of
 * those tells anyone to run anything, and a matcher that counts them reports twenty
 * failures that are not failures, which is how a gate gets switched off. A citation
 * is an INSTRUCTION, and this corpus writes instructions in code voice.
 */
function codeSpans(
  lineText: string,
  inFence: boolean,
  wholeFileIsCode: boolean,
): string[] {
  if (inFence || wholeFileIsCode) return [lineText];
  return [...lineText.matchAll(/`([^`]+)`/g)].map((m) => m[1] as string);
}

/**
 * Every place a text tells a reader to run a named script.
 *
 * `pnpm <script>` · `pnpm run <script>` · `npm run <script>`, with leading flags
 * (`--filter <pkg>`, `-r`, …) skipped so a filtered invocation still yields its
 * script token. Bare `npm <word>` is NOT a citation — npm has no script shorthand,
 * so it is prose.
 */
function citations(): Citation[] {
  const out: Citation[] = [];
  for (const rel of tracked().filter(inScope)) {
    let text: string;
    try {
      text = readFileSync(join(repoRoot, rel), 'utf8');
    } catch {
      continue;
    }
    const wholeFileIsCode =
      /\.(sh|mjs|ya?ml|json)$/.test(rel) === false ? false : /\.sh$/.test(rel);
    let inFence = false;
    text.split('\n').forEach((lineText, i) => {
      if (/^\s*```/.test(lineText)) {
        inFence = !inFence;
        return;
      }
      for (const span of codeSpans(lineText, inFence, wholeFileIsCode)) {
        for (const m of span.matchAll(RUN)) {
          const leading = m[1] ?? '';
          const isNpm = /\bnpm\s/.test(m[0]) && !/\bpnpm\s/.test(m[0]);
          const script = m[3] as string;
          // npm has no script shorthand: without `run`, it is a builtin or prose.
          if (isNpm && !m[2]) continue;
          if (PNPM_BUILTINS.has(script) && !m[2]) continue;
          if (!/[a-zA-Z]/.test(script)) continue;
          if (leading.includes('dlx') || leading.includes('exec')) continue;
          out.push({ file: rel, line: i + 1, script, raw: m[0] });
        }
      }
    });
  }
  return out;
}

describe('COMMAND-VERACITY gate — a named command must exist', () => {
  // REACH. Without this, an empty ratchet below says only that nothing was read.
  it('reads a real, non-trivial set of citations across more than one file type', () => {
    const cs = citations();
    expect(
      cs.length,
      'no citations found — the matcher is broken',
    ).toBeGreaterThan(10);
    const exts = new Set(cs.map((c) => c.file.match(/\.(\w+)$/)?.[1] ?? ''));
    // Markdown AND source: three of the known-bad citations were markdown, so a
    // source-only scan would have reported the corpus clean.
    expect([...exts]).toContain('md');
    expect([...exts]).toContain('ts');
    // Named anchors, not a count — a count is an exit code wearing a number.
    // Both are surfaces whose whole job is telling a reader what to run, and both
    // held a false citation before this gate existed.
    const files = new Set(cs.map((c) => c.file));
    expect(files).toContain('packages/canon/src/toolkit/guardrail/README.md');
    expect(files).toContain(
      'packages/canon/src/toolkit/project-targets-cli.ts',
    );
  });

  it('the declared-script set is real', () => {
    const declared = declaredScripts();
    expect(declared.size).toBeGreaterThan(20);
    expect(declared).toContain('canon:project');
    expect(declared).toContain('canon:deploy:hooks');
  });

  it('every cited command resolves — no exemption', () => {
    const declared = declaredScripts();
    const failures = citations()
      .filter((c) => !declared.has(c.script))
      .map(
        (c) =>
          `VERACITY ${label(c)} — no such script (cited as \`${c.raw.trim()}\`)`,
      );
    expect(failures, failures.join('\n')).toEqual([]);
  });

  // The convicting fixture — the known-answer control that separates "corpus is
  // clean" from "gate is dark". It travels the SAME path as the live check: the
  // real matcher, over synthetic text, against the real declared-script set.
  it('FAILS a citation naming a script that does not exist', () => {
    const declared = declaredScripts();
    // Assert the defect is PRESENT before reading the result (meta-gate hazard 1).
    const bogus = 'anatomy:project:targets';
    expect(
      declared.has(bogus),
      'fixture is stale — that script now exists',
    ).toBe(false);
    expect(declared.has('canon:project:targets')).toBe(true);

    const seen = new Map<string, string[]>();
    const probe = [
      'run `pnpm anatomy:project:targets` to regenerate',
      'then `pnpm canon:project` — this one is real',
      // A --filter citation, so the control covers that shape too. It named
      // `project` until `t-build-steps-proxy-the-cli` deleted canon's private
      // `project` / `project:codex` scripts along with the CLIs they drove;
      // `project:targets` is the surviving filtered script.
      'pnpm --filter @cratylus/canon project:targets',
      'pnpm install',
    ];
    probe.forEach((lineText, i) => {
      const RUN =
        /\b(?:pnpm|npm|yarn)\s+((?:(?:--?[\w-]+|@?[\w./-]+)\s+)*?)(run\s+)?([a-zA-Z][\w:.-]*)/g;
      for (const m of lineText.matchAll(RUN)) {
        const script = m[3] as string;
        if (PNPM_BUILTINS.has(script) && !m[2]) continue;
        const arr = seen.get(script) ?? [];
        arr.push(String(i));
        seen.set(script, arr);
      }
    });
    const unresolved = [...seen.keys()].filter((s) => !declared.has(s));
    // Convicts the bogus one, and ONLY it: `canon:project` and `project:targets`
    // resolve, `install` is a builtin. A control that convicted everything would
    // prove nothing.
    expect(unresolved).toEqual([bogus]);
  });
});
