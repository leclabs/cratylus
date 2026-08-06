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
//
//     AND THAT ARGUMENT IS ABOUT COMMANDS, NOT ABOUT TEST FILES. It is stated here
//     because the exclusion above was read, once, as a ruling about a LOCATION, and
//     a location cannot decide use from mention. The two classes come apart:
//
//       a command name in a test body    → MENTION. The test's subject IS the
//         token; it must be able to name a dead one to prove the gate convicts it.
//         Holding it to today's script set forbids the gate from testing itself.
//       a SHARD DESIGNATOR in a test's own header comment → USE. Nothing in that
//         file tests the designator. The author is CITING A WARRANT — "this test is
//         shaped this way because that shard ruled so" — to a reader who now cannot
//         follow it. Same defect as a dead `plans/` path in a source file, in a
//         surface the command law happens not to walk.
//
//     `packages/*/test/**` was repaired on that reading: 45 dead citations over 26
//     files in canon, forge and memory, in three shapes — a retired shard named with
//     its section sigil; a BARE sigil whose plan is gone, so not even the plan name
//     survives to look up; and a deleted DOCUMENT plus a section of it. Each one
//     either INLINES what the cited ruling actually said or WITHDRAWS the claim so
//     the sentence stands on its own. None was re-pointed.
//
//     NO DEAD ID IS QUOTED IN THIS PARAGRAPH, deliberately. Naming them as examples
//     would be a mention and defensible, but it would also re-mint the exact tokens
//     a sweep looks for — and a sweep that has to be taught which occurrences are the
//     record of the repair is a sweep with an exemption list. The shapes are stated
//     instead; the sites carry the specifics.
//
//     `inScope` IS DELIBERATELY UNCHANGED. The repair above is a fact about those
//     sites; whether this walk should reach them is a SCOPE decision, and it belongs
//     to whoever has to live with the false positives a widened walk would produce on
//     the mention class — this file's own dead commands first among them.
//   - a CLOSED RECORD — a verbatim transcription of a turn that happened. Same
//     use/mention line, one step further: the turn really did say that, and holding
//     a transcription to today's truth would forbid transcribing accurately. This
//     one is recognised by CONTENT (see the discriminator below), not by path.
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
//
// ─────────────────────────────────────────────────────────────────────────────
// PLAN-PATH VERACITY — the second law, over the SAME walk.
//
// A text that cites `plans/<plan>/…` as the warrant for a claim asserts that a
// reader can go read it. `retire` MEANS DELETE, so every retirement mints a batch
// of false assertions of exactly that kind, and they are worse than a dead script
// name: a dead `pnpm foo` fails loudly the moment a reader tries it, whereas a dead
// path is discovered only by someone who went looking for the evidence — the reader
// who was doing the right thing. Thirteen were standing when this law was written,
// naming six plans retired long ago.
//
// The repair is never to re-point the path. A retired plan's bytes are in git, which
// is precisely WHY deletion is legal; but a live source that leans on git history has
// simply moved its dangle one indirection out. Repair means the claim stands on its
// own — the citation's cargo inlined, or the claim withdrawn.
//
// MENTION vs CITATION, and it is the whole design. `plans/` tokens appear in this
// corpus for four reasons, and only one of them is a citation:
//   - a SHAPE, not a path — `plans/<plan>/<state>/`, `plans/*/spec.mjs`,
//     `plans/**/CLAUDE.md`, `plans/[^/]+` inside a sed program. The matcher takes
//     only fully LITERAL segments, so a metavariable or a glob is not a path at all.
//   - a path in ANOTHER tree — `<target>/plans/founding/` is what `deploy` writes
//     into someone else's repo. A citation is repo-relative; a token preceded by a
//     path character names a location this tree cannot resolve and must not judge.
//   - a MENTION inside a CLOSED RECORD — see the discriminator below.
//   - a CITATION: a literal, repo-relative plan path in a source a reader acts on.
//
// THE CLOSED-RECORD DISCRIMINATOR — derived from what a file IS, never from where
// it sits. `stance-guardrail.sh` writes each turn payload it hands the judge under a
// fixed capture banner, and the tracked fixtures are those payloads byte-identical.
// A file that OPENS with that banner is a verbatim transcription of a turn that
// really happened, at a time when its paths really did resolve. Rewriting one would
// falsify the record — evidence restated as the present — and this corpus has already
// paid for that mistake once. So the exemption keys on the banner, which the producer
// controls, not on a fixture directory, which the next author controls: a third
// fixture dir is spared automatically, a `.txt` that is prose is gated automatically,
// and a rename from `.txt` to `.md` changes nothing. `TURN_CAPTURE_BANNER` is held to
// the producer's own text by a leg below, so the discriminator cannot rot silently.
//
// `plans/**` IS OUT, and for the property, not for convenience. That subtree is the
// record system whose own lifecycle DELETES plan directories; a retirement plan must
// be able to name the directory it retires, and a gate that forbids naming a path in
// order to delete it forbids the mechanism from documenting itself. Plan-to-plan
// references live inside a system where expiry is designed. The class this law names
// is a citation that ESCAPED that system into a source with no other warrant.
//
// REACH is measured on MENTIONS, not citations, and deliberately. The corpus's honest
// steady state is zero live citations — every one of them is a defect — so a reach leg
// counting citations would read green for having looked at nothing the day the corpus
// went clean. `planPathMentions()` scans every tracked text file with no exclusion at
// all; it is the proof that the matcher fires, and it stays large while the citation
// set stays empty. That is what separates "found nothing" from "clean".

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
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

/** IN-scope ⇔ a reader could act on it today. Every exclusion is argued in the header. */
function inScope(rel: string): boolean {
  if (/^plans\/[^/]+\/completed\//.test(rel)) return false;
  if (rel.includes('/test/') || rel.endsWith('.test.ts')) return false;
  if (rel.startsWith('graphify-out/')) return false;
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
 * THE ONE WALK. Every in-scope, non-transcript tracked file, line by line. Both laws
 * below read this; neither walks the tree a second time, so a scope ruling argued
 * once cannot come apart between them.
 */
function authoredLines(): Line[] {
  const out: Line[] = [];
  for (const rel of tracked().filter(inScope)) {
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

/**
 * A repo-relative `plans/<…>` path, every segment LITERAL.
 *
 * Leading guard: the token must not be preceded by a path character, so
 * `<target>/plans/founding/` — a path in a tree this repo writes but does not own —
 * is not a citation about here. Segments are `[A-Za-z0-9_][A-Za-z0-9._-]*`, which is
 * what excludes a shape (`plans/<plan>/`), a glob (a `plans` star segment), a shell
 * expansion (`plans/${plan}`), a regex fragment (`plans/[^/]+`) and the
 * dot-directory `plans/.retired/` — none of which is a path a reader can open, and
 * the last of which is named in the corpus precisely to say it no longer exists.
 */
const PLAN_PATH =
  /(?:^|[^A-Za-z0-9_./-])(plans\/[A-Za-z0-9_][A-Za-z0-9._-]*(?:\/[A-Za-z0-9_][A-Za-z0-9._-]*)*)/g;

function planPathsIn(text: string): string[] {
  return [...text.matchAll(PLAN_PATH)].map((m) => m[1] as string);
}

interface PathCitation {
  readonly file: string;
  readonly line: number;
  readonly path: string;
}

/**
 * Every `plans/<…>` path token in every tracked text file — history, test specimen,
 * plan-to-plan reference and all. NOT the law's subject; the law's REACH. It is what
 * proves the matcher fires on a corpus whose citation set is legitimately empty.
 */
function planPathMentions(): PathCitation[] {
  const out: PathCitation[] = [];
  for (const rel of tracked().filter(
    (f) => TEXT.test(f) && !f.startsWith('graphify-out/'),
  )) {
    let text: string;
    try {
      text = readFileSync(join(repoRoot, rel), 'utf8');
    } catch {
      continue;
    }
    text.split('\n').forEach((lineText, i) => {
      for (const p of planPathsIn(lineText))
        out.push({ file: rel, line: i + 1, path: p });
    });
  }
  return out;
}

/** The mentions that are INSTRUCTIONS — a reader could follow them today. */
function planPathCitations(): PathCitation[] {
  const out: PathCitation[] = [];
  for (const ln of authoredLines()) {
    if (ln.file.startsWith('plans/')) continue;
    for (const p of planPathsIn(ln.text))
      out.push({ file: ln.file, line: ln.line, path: p });
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

describe('PLAN-PATH VERACITY gate — a cited plan path must resolve', () => {
  // REACH, measured on MENTIONS. The citation set below is legitimately empty when
  // the corpus is healthy, so it can prove nothing about whether anything was read.
  // This is the leg that reds if the matcher is narrowed.
  it('reads a real, non-trivial set of plan-path mentions across more than one file type', () => {
    const ms = planPathMentions();
    expect(
      ms.length,
      'no plan paths found — the matcher is broken',
    ).toBeGreaterThan(8);
    const exts = new Set(ms.map((m) => m.file.match(/\.(\w+)$/)?.[1] ?? ''));
    // Three voices, because each is a shape the matcher could be narrowed out of:
    // prose in a plan (`md`), a docstring (`ts`), and a recorded turn (`txt`) — the
    // last of which a `.md|.ts`-only scan would have reported clean.
    expect([...exts]).toContain('md');
    expect([...exts]).toContain('ts');
    expect([...exts]).toContain('txt');
    // Both SHAPES, because seven of the thirteen defects were a bare plan
    // DIRECTORY (`plans/scoped-memory-v2`, no file), which a matcher requiring a
    // file extension would report clean while missing over half the class.
    expect(
      ms.some((m) => m.path.endsWith('.md')),
      'no path-to-a-file mentions — the matcher lost the file shape',
    ).toBe(true);
    expect(
      ms.some((m) => !/\.\w+$/.test(m.path)),
      'no bare-directory mentions — the matcher lost the directory shape',
    ).toBe(true);
  });

  it('the resolver CAN resolve — "found nothing" is separated from "could not look"', () => {
    // THIS LEG READ `existsSync(join(repoRoot, 'plans'))` AND ASSERTED IT TRUE. It
    // reded the moment the last plan retired — the fourth instance in this corpus of
    // a check whose subject is the live tree dying when the live tree empties, and
    // the second in this very file, three lines above a header that had already
    // written the lesson down for its sibling control.
    //
    // IT WAS ALSO GUARDING A HAZARD THAT DOES NOT EXIST IN THAT DIRECTION. Resolution
    // is `existsSync` per citation, so an absent `plans/` makes every plan-path
    // citation FAIL — the gate gets louder, never darker. The dark-scan hazard lives
    // entirely in the citation SET going empty, and the reach leg above (mentions > 8,
    // three extensions, both shapes) is what holds that.
    //
    // What survives is the real law, on a subject this test BUILDS: the resolver
    // distinguishes a path that exists from one that does not. Synthetic, so it holds
    // at zero plans and at fifty alike.
    const sandbox = mkdtempSync(join(tmpdir(), 'plan-path-reach-'));
    mkdirSync(join(sandbox, 'plans', 'probe-plan'), { recursive: true });
    writeFileSync(join(sandbox, 'plans/probe-plan/PLAN.md'), '# probe\n');
    expect(existsSync(join(sandbox, 'plans/probe-plan/PLAN.md'))).toBe(true);
    expect(existsSync(join(sandbox, 'plans/no-such-plan/PLAN.md'))).toBe(false);
    rmSync(sandbox, { recursive: true, force: true });
  });

  // ZERO PLANS IS A LEGITIMATE STATE, and this gate must survive it — `retire` means
  // DELETE, so the corpus reaches zero every time the last plan lands. The control below
  // is written against that, and it is the second staleness trap in a row here: a PINNED
  // plan name goes stale at that plan's retirement (the first trap, correctly avoided),
  // and a name DERIVED from the live corpus dies when the corpus is empty (the second,
  // hit the moment `retire-decomplect` retired). The positive case is therefore
  // SYNTHETIC — built in a tmpdir, depending on neither. Same reasoning `plan-set.test.ts`
  // already applies to git history: a check whose subject is the live tree goes dark when
  // the live tree empties; one that builds its own subject cannot.

  it('every cited plan path resolves — no exemption', () => {
    const failures = planPathCitations()
      .filter((c) => !existsSync(join(repoRoot, c.path)))
      .map((c) => `PLAN-PATH ${c.file}:${c.line} → ${c.path} — no such path`);
    expect(failures, failures.join('\n')).toEqual([]);
  });

  // The convicting fixture — the known-answer control, over the real matcher and the
  // real filesystem.
  it('FAILS a citation naming a plan path that does not exist', () => {
    const dead = 'plans/no-such-plan/PLAN.md';
    // Assert the defect is PRESENT before reading the result (meta-gate hazard 1).
    expect(
      existsSync(join(repoRoot, dead)),
      'fixture is stale — that plan now exists',
    ).toBe(false);
    // The positive case is SYNTHETIC — neither pinned nor read off the live corpus, both
    // of which go stale at a retirement. Resolution is `existsSync` against a root, so the
    // control supplies its own root and the matcher never knows the difference.
    const sandbox = mkdtempSync(join(tmpdir(), 'plan-path-'));
    const live = 'plans/probe-plan/PLAN.md';
    mkdirSync(join(sandbox, 'plans', 'probe-plan'), { recursive: true });
    writeFileSync(join(sandbox, live), '# probe\n');
    // …and it must genuinely resolve THERE while genuinely not resolving here, or the
    // control is testing the sandbox rather than the matcher.
    expect(existsSync(join(sandbox, live))).toBe(true);
    expect(existsSync(join(repoRoot, live))).toBe(false);

    const probe = [
      `the derivation record is ${dead}`,
      `see \`${live}\` for the sequencing`,
      'the layout is `plans/<plan>/<state>/` — a shape, not a path',
      'deploy writes `<target>/plans/founding/` into the target tree',
      '`plans/.retired/` no longer names anything',
    ];
    // Resolved against the SANDBOX: `probe-plan` exists there, `no-such-plan` does not,
    // and neither exists in the repo — so the verdict comes from the matcher, not from
    // whatever the corpus happens to hold today.
    const unresolved = probe
      .flatMap((t) => planPathsIn(t))
      .filter((p) => !existsSync(join(sandbox, p)));
    rmSync(sandbox, { recursive: true, force: true });
    // Convicts the dead one and ONLY it. The shape, the foreign-tree path and the
    // dot-directory are not paths this tree can be held to; the probe plan resolves.
    expect(unresolved).toEqual([dead]);
  });

  // The closed-record discriminator, BOTH directions, on real fixture bytes.
  it('exonerates a recorded turn and convicts the same citation in a live source', () => {
    const rec = 'packages/canon/src/toolkit/guardrail/fixtures/turn-193.txt';
    const text = readFileSync(join(repoRoot, rec), 'utf8');

    // The record really does carry a dead citation — otherwise what follows is the
    // exoneration of nothing.
    const dead = planPathsIn(text).filter(
      (p) => !existsSync(join(repoRoot, p)),
    );
    expect(dead, 'the fixture no longer cites a dead plan path').toContain(
      'plans/discipline-anchor/PLAN.md',
    );

    // Direction 1 — in scope by path and extension, spared by what it IS.
    expect(inScope(rec)).toBe(true);
    expect(isTranscript(text)).toBe(true);
    expect(planPathCitations().map((c) => c.file)).not.toContain(rec);

    // Direction 2 — the same bytes with the capture banner gone are a live source,
    // and the same matcher convicts them. Nothing but the banner changed.
    const stripped = text.split('\n').slice(1).join('\n');
    expect(isTranscript(stripped)).toBe(false);
    expect(
      planPathsIn(stripped).filter((p) => !existsSync(join(repoRoot, p))),
    ).toContain('plans/discipline-anchor/PLAN.md');
  });

  // ANTI-ROT. The discriminator is a fact about the PRODUCER. If the producer stops
  // writing this banner, the exemption silently stops recognising its own records —
  // so the coupling is asserted rather than assumed.
  it('the capture banner it discriminates on is the one the producer writes', () => {
    const producer = readFileSync(
      join(
        repoRoot,
        'packages/canon/src/toolkit/guardrail/stance-guardrail.sh',
      ),
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
