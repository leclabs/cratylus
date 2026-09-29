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
//   - `records/**` — the records root. A record is immutable history: once written
//     it is never edited, and the immutability gate refuses a change to it. Holding
//     its text to today's script names could be satisfied only by never recording,
//     so a gate over it would forbid recording history accurately.
//   - `**/CHANGELOG.md` — release history, on the same argument. A published entry
//     records what was true at its release; it is never rewritten, so holding it to
//     today's script names would forbid recording a release accurately.
//   - `**/test/**` — specimen carriers. A test that names a command is MENTIONING
//     one, not telling a reader to run it; the same use/mention line that keeps the
//     stance rubric's quoted collapse examples out of the density gate. THIS FILE is
//     the proof: it must cite dead commands in order to test for them, and an
//     unqualified scan convicts it for doing its job — the meta-gate's "haystack
//     contains the needle" hazard, in its own source.
//   - a CLOSED RECORD — a verbatim transcription of a turn that happened. Same
//     use/mention line, one step further: the turn really did say that, and holding
//     a transcription to today's truth would forbid transcribing accurately. This
//     one is recognised by CONTENT (see the discriminator below), not by path.
//   - `node_modules`, `dist` — not authored here.
//
// THE CLOSED-RECORD DISCRIMINATOR — derived from what a file IS, never from where
// it sits. `stance-guardrail.sh` writes each turn payload it hands the judge under a
// fixed capture banner, and the tracked fixtures are those payloads byte-identical.
// A file that OPENS with that banner is a verbatim transcription of a turn that
// really happened. Rewriting one would falsify the record — evidence restated as the
// present. So the exemption keys on the banner, which the producer controls, not on a
// fixture directory, which the next author controls. `TURN_CAPTURE_BANNER` is held to
// the producer's own text by a leg below, so the discriminator cannot rot silently.
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
  // REGISTRY VERBS, added when the publish path moved off npm: `pnpm view` reads a
  // published version (the release script's idempotence check and the snapshot guard's
  // probe), and `deprecate`/`undeprecate` are how a retired name is signalled — all four
  // are pnpm builtins on 12.4.0, none is a script of this repository.
  'view',
  'info',
  'deprecate',
  'undeprecate',
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

/** The tracked files that hold authored TEXT at all. */
const TEXT = /\.(ts|tsx|mjs|js|md|sh|json|ya?ml|txt)$/;

/**
 * The banner `stance-guardrail.sh` puts at the head of every turn payload it hands
 * the judge. Held to the producer's own source by a leg below.
 */
const TURN_CAPTURE_BANNER =
  '=== OPERATOR (most recent instruction — the authorization context) ===';

/**
 * Is this file a CLOSED RECORD — a verbatim transcription of a turn that happened?
 *
 * Decided by what the file IS: it opens with the capture banner, which is what makes
 * it byte-identical to what the judge was handed. A live document that merely QUOTES
 * a transcript mid-body is not one, and is gated normally.
 */
function isTranscript(text: string): boolean {
  return text.startsWith(TURN_CAPTURE_BANNER);
}

/**
 * IN-scope ⇔ a reader could act on it today. Every exclusion is argued in the
 * header.
 */
function inScope(rel: string): boolean {
  if (rel.startsWith('records/')) return false;
  if (rel === 'CHANGELOG.md' || rel.endsWith('/CHANGELOG.md')) return false;
  if (rel.includes('/test/') || rel.endsWith('.test.ts')) return false;
  return TEXT.test(rel);
}

/** One authored line, with the two facts a matcher needs about its voice. */
interface Line {
  readonly file: string;
  readonly line: number;
  readonly text: string;
  readonly inFence: boolean;
  readonly wholeFileIsCode: boolean;
}

/**
 * THE WALK. Every tracked text file that is not a closed record, line by line, with
 * the VOICE facts (`inFence`, `wholeFileIsCode`) the matcher needs. The law applies
 * its scope (`inScope`) over what this reads.
 */
function authoredLines(): Line[] {
  const out: Line[] = [];
  for (const rel of tracked().filter((f) => TEXT.test(f))) {
    let text: string;
    try {
      text = readFileSync(join(repoRoot, rel), 'utf8');
    } catch {
      continue;
    }
    if (isTranscript(text)) continue;
    const wholeFileIsCode = /\.sh$/.test(rel);
    let inFence = false;
    text.split('\n').forEach((lineText, i) => {
      if (/^\s*```/.test(lineText)) {
        inFence = !inFence;
        return;
      }
      out.push({
        file: rel,
        line: i + 1,
        text: lineText,
        inFence,
        wholeFileIsCode,
      });
    });
  }
  return out;
}

/** Every tracked text file that IS a closed record. Membership is read, never listed. */
function transcripts(): string[] {
  return tracked()
    .filter((f) => TEXT.test(f))
    .filter((f) => {
      try {
        return isTranscript(readFileSync(join(repoRoot, f), 'utf8'));
      } catch {
        return false;
      }
    });
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
  for (const ln of authoredLines()) {
    if (!inScope(ln.file)) continue;
    for (const span of codeSpans(ln.text, ln.inFence, ln.wholeFileIsCode)) {
      for (const m of span.matchAll(RUN)) {
        const leading = m[1] ?? '';
        const isNpm = /\bnpm\s/.test(m[0]) && !/\bpnpm\s/.test(m[0]);
        const script = m[3] as string;
        // npm has no script shorthand: without `run`, it is a builtin or prose.
        if (isNpm && !m[2]) continue;
        if (PNPM_BUILTINS.has(script) && !m[2]) continue;
        if (!/[a-zA-Z]/.test(script)) continue;
        if (leading.includes('dlx') || leading.includes('exec')) continue;
        out.push({ file: ln.file, line: ln.line, script, raw: m[0] });
      }
    }
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
    expect(files).toContain('packages/canon/targets/guardrail/README.md');
    expect(files).toContain('packages/canon/tooling/project-targets-cli.ts');
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
      // `project` until canon's private `project` / `project:<harness>` scripts were
      // deleted along with the CLIs they drove; `project:targets` is the
      // surviving filtered script.
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

  // ANTI-ROT. The discriminator is a fact about the PRODUCER. If the producer stops
  // writing this banner, the exemption silently stops recognising its own records —
  // so the coupling is asserted rather than assumed.
  it('the capture banner it discriminates on is the one the producer writes', () => {
    const producer = readFileSync(
      join(repoRoot, 'packages/canon/targets/guardrail/stance-guardrail.sh'),
      'utf8',
    );
    expect(
      producer,
      'stance-guardrail.sh no longer writes this banner — the discriminator is stale',
    ).toContain(TURN_CAPTURE_BANNER);
    // …and the record set is READ, never enumerated: a new fixture directory is
    // recognised the day it lands, with no edit here.
    expect(transcripts().length).toBeGreaterThan(0);
  });
});
