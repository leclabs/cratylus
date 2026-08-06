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
//     `inScope` IS STILL UNCHANGED, AND THE SCOPE DECISION HAS NOW BEEN TAKEN — the
//     third law below reaches test files, `inScope` does not, and both are right.
//     What made that possible is that the walk stopped being the scope: `authoredLines`
//     now reads the whole authored corpus once and each law filters it by a predicate
//     argued against the class that law names. So the false positives a widened walk
//     would produce on the mention class never arise — this file's own dead commands
//     are still out of the command law's reach, exactly as before.
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
import {
  everDesignated,
  liveDesignators,
  retiredDesignators,
} from '../tooling/plan-set.js';

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

/**
 * IN-scope ⇔ a reader could act on it today, FOR THE COMMAND AND PLAN-PATH LAWS.
 * Every exclusion is argued in the header. The designator law takes a different
 * scope — `designatorScope` below, and the divergence is argued where it is used.
 */
function inScope(rel: string): boolean {
  if (/^plans\/[^/]+\/completed\//.test(rel)) return false;
  if (rel.includes('/test/') || rel.endsWith('.test.ts')) return false;
  if (rel.startsWith('graphify-out/')) return false;
  return TEXT.test(rel);
}

/**
 * IN-scope for the DESIGNATOR law: everything the walk reaches except the plan set
 * itself.
 *
 * `**​/test/**` IS IN, and that is the whole difference. The header's ruling: a
 * command name in a test body is a MENTION (the test's subject IS the token, and it
 * must be able to name a dead one to prove the gate convicts), whereas a shard
 * designator in a test's own header comment is a USE — nothing in that file tests
 * the designator, the author is citing a warrant to a reader who now cannot follow
 * it. The two classes come apart, so their scopes do too; a single ruling for both
 * would have to sacrifice one of them.
 *
 * `plans/**` IS OUT, for the reason the plan-path law already gives: the plan set is
 * the record system whose own lifecycle deletes shards, and a plan must be able to
 * name the shard it retires, the dep it waits on, and the predecessor it refutes. A
 * gate that forbids that forbids the mechanism from documenting itself.
 */
function designatorScope(rel: string): boolean {
  return !rel.startsWith('plans/');
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
 * THE ONE WALK. Every tracked text file that is not a closed record, line by line.
 * All three laws below read this and none walks the tree a second time — so the
 * VOICE facts (`inFence`, `wholeFileIsCode`) and the closed-record discriminator are
 * decided once for the whole corpus and cannot come apart between laws.
 *
 * SCOPE IS APPLIED BY THE LAW, NOT BY THE WALK, and that is a correction. This
 * function used to filter by `inScope` and its docstring claimed the stronger
 * property that one scope ruling served every law. That claim did not survive the
 * third law: the header's own use/mention argument shows a test file is a MENTION
 * carrier for command names and a USE carrier for shard designators, so one ruling
 * cannot be right for both. Widening the walk and narrowing per law keeps the single
 * traversal — which is what the property was protecting — while letting each
 * exclusion be argued against the class it excludes. `inScope` is unchanged, and the
 * command and plan-path laws still read exactly the lines they always did.
 */
function authoredLines(): Line[] {
  const out: Line[] = [];
  for (const rel of tracked().filter(
    (f) => TEXT.test(f) && !f.startsWith('graphify-out/'),
  )) {
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
    if (!inScope(ln.file) || ln.file.startsWith('plans/')) continue;
    for (const p of planPathsIn(ln.text))
      out.push({ file: ln.file, line: ln.line, path: p });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGNATOR VERACITY — the third law, over the SAME walk.
//
// A shard designator cited in a live source — `AMENDED (t-some-shard)`, "the shape
// `s4-widget` ruled" — is a warrant no reader can follow, and it becomes one
// SILENTLY: at the retirement of the plan that held the shard, in a commit that
// touches neither the citing file nor anything near it. The plan-path law above
// catches the citation written as a PATH; this one catches it written as a NAME,
// which is how an author writing prose actually writes it.
//
// THE ORACLE IS A SET DIFFERENCE, HAND-MAINTAINED BY NOBODY. `retiredDesignators`
// (`tooling/plan-set.ts`) enumerates every shard basename git has seen under a
// state folder and removes every one the worktree still holds. No manifest, no
// checked-in id list, no marker: the same derived-on-demand-never-stored discipline
// the plan tier's `retirement(P)` already ships, one tier down. The full argument —
// including why the empty plan set is this oracle's EASY case rather than its blind
// spot — lives at the definition; it is not restated here.
//
// SCOPE. `designatorScope` — everything the walk reaches except `plans/**`. Test
// files are IN, and the header's use/mention ruling is why: a test never has a
// designator as its SUBJECT, so a designator in a test is a citation like any other.
//
// REACH IS MEASURED AS A DENOMINATOR, and it has to be. The corpus's honest steady
// state for this law is ZERO violations, so a leg counting violations would report
// green for having enumerated nothing the day the last one was repaired — and this
// law's enumeration is exactly what can silently go to nothing, since it depends on
// a git walk, a regex built from `PLAN_STATES`, and a directory that legitimately
// empties. The reach leg therefore prints and asserts the two factors of the search
// space: HOW MANY IDS the oracle enumerated, and HOW MANY FILES the walk read.
//
// THE CEILING, stated where the law lands because it is the first thing an author
// repairing a violation will run into. A repair that EXPLAINS ITSELF re-mints the
// token it repaired: "this used to cite `t-some-shard`, which is dead" is a MENTION,
// and this gate is shape-decidable, so it reads it as a USE and convicts the repair.
// That is not a bug to be exempted away. The closed-record exemption keys on the
// capture banner — it covers a transcribed turn and deliberately does NOT cover a
// source comment — and widening it to cover explanatory prose would blind the gate
// to the commonest real violation there is: an author citing a warrant in a header.
// So the ceiling stands, and the cheap move is the one both repair shards
// independently arrived at: CARRY THE FACT WITHOUT RESPELLING THE ID. Inline what
// the cited ruling actually said, or withdraw the claim so the sentence stands on
// its own. Neither needs the id, and neither needs an exemption.
//
// THE ONE EXEMPTION IS A CRATYLIC COLLISION, and it is measured, not anticipated.
// praxis qualifies a shard id with the work it does, so a designator and a concept
// share a STEM but not a SIGN: the shard that builds a law is named for the law PLUS
// the work, and the law keeps the bare stem. (No example is spelled out here. This
// paragraph named one on its first run and the gate below convicted it — the ceiling
// above, demonstrating itself on the author who was writing it down.) Where an OLDER
// plan named a shard with the bare concept, the id and the corpus's live sign for
// that concept are the same string, and no shape can separate them. `EXONERATED`
// below holds those, each one verified to be a genuinely retired
// id (or it exonerates nothing) and the list as a whole verified to be LOAD-BEARING
// (or it is ceremony, and the terminal state of an exemption with no subject is
// deletion, not ∅).

/**
 * Designators whose string is ALSO the corpus's live sign for a concept, so an
 * occurrence is a use of the CONCEPT and not a citation of the shard. Measured
 * against the live corpus, not guessed: each names a law or an oracle this corpus
 * still enforces (`cold-decode` the oracle, `root-cause` the diagnosis,
 * `extend-reach` and `explicit-omit-to-inherit` the laws their gates carry in their
 * own titles).
 *
 * This is an exemption keyed on IDENTITY, so it is corpus-wide: a genuine dangling
 * citation of one of these four would pass unseen. Four names is the price of not
 * convicting every gate in the suite for naming its own law.
 */
const EXONERATED: readonly string[] = [
  'cold-decode',
  'explicit-omit-to-inherit',
  'extend-reach',
  'root-cause',
];

/**
 * The designator-shaped tokens on a line.
 *
 * LEADING GUARD, borrowed verbatim from `PLAN_PATH` and load-bearing for the same
 * reason: a token preceded by a path character is a path SEGMENT, not a bare
 * designator. `plans/fleet-cutover` is a plan path, which the law above already
 * owns; `mav/B9-toolkit-hardening` is a branch name in a specimen. Both are what
 * their prefix says they are, and neither is an author citing a shard. Without this
 * guard the two laws would convict the same token twice and the specimen carriers
 * that MUST name a plan path in order to test a scanner for plan paths would red.
 */
const DESIGNATOR_TOKEN =
  /(?<![A-Za-z0-9_./-])[A-Za-z0-9][A-Za-z0-9_-]*(?![A-Za-z0-9_-])/g;

interface DesignatorCitation {
  readonly file: string;
  readonly line: number;
  readonly id: string;
}

/** Every occurrence of a RETIRED designator, exonerated collisions included — the
 *  raw readout the law and its load-bearing check both fold over. */
function designatorHits(dead: ReadonlySet<string>): DesignatorCitation[] {
  const out: DesignatorCitation[] = [];
  for (const ln of authoredLines()) {
    if (!designatorScope(ln.file)) continue;
    for (const m of ln.text.matchAll(DESIGNATOR_TOKEN)) {
      if (dead.has(m[0])) out.push({ file: ln.file, line: ln.line, id: m[0] });
    }
  }
  return out;
}

/** The hits that are the law's subject — collisions discharged. */
function designatorCitations(dead: ReadonlySet<string>): DesignatorCitation[] {
  const spared = new Set(EXONERATED);
  return designatorHits(dead).filter((h) => !spared.has(h.id));
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
      // `project` until canon's private `project` / `project:codex` scripts were
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
    const rec = 'packages/canon/test/fixtures/guardrail/turn-193.txt';
    const text = readFileSync(join(repoRoot, rec), 'utf8');

    // The record really does carry a dead citation — otherwise what follows is the
    // exoneration of nothing.
    const dead = planPathsIn(text).filter(
      (p) => !existsSync(join(repoRoot, p)),
    );
    expect(dead, 'the fixture no longer cites a dead plan path').toContain(
      'plans/discipline-anchor/PLAN.md',
    );

    // Direction 1 — spared by what it IS, demonstrated on a subject this test BUILDS.
    //
    // THIS LEG USED TO READ `expect(inScope(rec)).toBe(true)`, and it held only while the
    // fixture lived under `src/`. Fixtures are test material and now live under `test/`,
    // which `inScope` excludes by path — so the exclusion would pre-empt the content
    // discriminator and this leg would be demonstrating nothing at all. The exemption's
    // whole claim is that a closed record is recognised by CONTENT, "derived from what a
    // file IS, never from where it sits"; a demonstration that depends on where the file
    // sits cannot show that.
    //
    // So the in-scope subject is synthetic: the fixture's real bytes at a path `inScope`
    // accepts. Same reasoning the sibling control here already applies, and the same
    // reasoning `praxis.sh` and the plan-path reach leg took when their live subjects
    // vanished — build your own subject, and it holds however the tree is arranged.
    const inScopePath = 'packages/canon/src/recorded-turn.txt';
    expect(inScope(inScopePath), 'the synthetic path is not in scope').toBe(
      true,
    );
    // In scope by PATH, and exempt by CONTENT. `authoredLines` drops a file when
    // `isTranscript` holds, so those two facts together are the exemption: the path
    // would have admitted these bytes, and what spares them is the banner alone.
    expect(isTranscript(text)).toBe(true);
    // …and the live fixture is genuinely out of the citation set, by whichever route.
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

describe('DESIGNATOR-VERACITY gate — a cited shard designator must be live', () => {
  // REACH, AS A DENOMINATOR. Not a violation count: the honest steady state of this
  // law is zero violations, so a count proves nothing about whether anything was
  // enumerated. The search space is `ids × files`, and BOTH factors can silently go
  // to nothing — the git walk through a path filter, the id regex through
  // `PLAN_STATES`, the file set through a scope predicate. Each is asserted, and the
  // numbers are printed so a shrinking denominator is visible before it is fatal.
  it('enumerates a real retired-id set over a real file set — both denominators', () => {
    const t0 = Date.now();
    const dead = retiredDesignators();
    const ms = Date.now() - t0;

    const files = new Set<string>();
    let lines = 0;
    for (const ln of authoredLines()) {
      if (!designatorScope(ln.file)) continue;
      files.add(ln.file);
      lines += 1;
    }
    console.log(
      `DESIGNATOR reach — ids ${dead.length} (of ${everDesignated().size} ever, ${liveDesignators().size} live) · files ${files.size} · lines ${lines} · oracle ${ms}ms`,
    );

    // Denominator 1 — the oracle enumerated. The historical leg cannot empty while
    // git holds a single retired shard, which is why this floor is safe to set high.
    expect(
      dead.length,
      'the retired-id set collapsed — the git leg or the state regex stopped matching',
    ).toBeGreaterThan(200);
    // Accept 1: derived from git alone, on demand. A second's budget is two orders of
    // magnitude above the measured cost; the floor is there to catch an algorithm
    // change, not to time this machine.
    expect(ms, 'the oracle got slow enough to be worth caching').toBeLessThan(
      1000,
    );

    // Denominator 2 — the walk read. `plans/**` is the only exclusion, so this is
    // essentially the whole authored corpus.
    expect(
      files.size,
      'the walk collapsed — a scope predicate is excluding almost everything',
    ).toBeGreaterThan(200);
    expect(lines).toBeGreaterThan(10000);

    // The SCOPE DECISION, made observable. Test files are in scope for this law and
    // out of scope for the two above; a silent re-narrowing to `inScope` would take
    // the whole USE class with it and leave every other leg green.
    expect(
      [...files].some((f) => f.endsWith('.test.ts')),
      'test files left the designator walk — the USE class this law exists for is unpoliced',
    ).toBe(true);
    expect([...files].some((f) => f.startsWith('packages/forge/test/'))).toBe(
      true,
    );
    // Three voices, each a shape a narrowed walk could drop.
    const exts = new Set([...files].map((f) => f.match(/\.(\w+)$/)?.[1] ?? ''));
    expect([...exts]).toContain('md');
    expect([...exts]).toContain('ts');
    expect([...exts]).toContain('sh');
  });

  // ACCEPT 2 — the empty plan set, asserted DIRECTLY rather than hoped for. The
  // corpus reaches `plans/ = ∅` every time the last plan lands, and it has taken a
  // gate down each time. Here it is the oracle's easy case: the live leg empties,
  // nothing removes anything from the historical leg, and every id git ever saw reads
  // dead. The subject is SYNTHETIC — a temp repo with its own history — so the leg
  // holds at zero plans and at fifty alike, and does not depend on this corpus ever
  // reaching either.
  it('reports every historical id dead when the plan set is empty — no throw, no silence', () => {
    const repo = mkdtempSync(join(tmpdir(), 'designator-empty-'));
    const g = (...args: string[]): string =>
      execFileSync('git', args, { cwd: repo, encoding: 'utf8' });
    try {
      g('init', '-q');
      g('config', 'user.email', 'test@example.com');
      g('config', 'user.name', 'test');
      const ctx = { repoRoot: repo };

      mkdirSync(join(repo, 'plans/demo/completed'), { recursive: true });
      writeFileSync(join(repo, 'plans/demo/PLAN.md'), '# demo\n');
      writeFileSync(join(repo, 'plans/demo/completed/t-alpha.md'), '# a\n');
      writeFileSync(join(repo, 'plans/demo/completed/t-beta.md'), '# b\n');
      g('add', '-A');
      g('commit', '-q', '-m', 'author a plan');

      // Live: both shards on disk, nothing dead.
      expect([...liveDesignators(ctx)].sort()).toEqual(['t-alpha', 't-beta']);
      expect(retiredDesignators(ctx)).toEqual([]);

      // Retire the whole plan set, directory and all — the state that has bitten
      // this corpus five times.
      rmSync(join(repo, 'plans'), { recursive: true, force: true });
      g('add', '-A');
      g('commit', '-q', '-m', 'retire the plan set');
      expect(existsSync(join(repo, 'plans'))).toBe(false);

      // It RUNS: no throw from the absent directory…
      expect(liveDesignators(ctx).size).toBe(0);
      // …and it does not read green for having found nothing. Every historical id is
      // dead, which is the CORRECT answer, and it is the loud one.
      expect(retiredDesignators(ctx)).toEqual(['t-alpha', 't-beta']);
      expect(everDesignated(ctx).size).toBe(2);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it('every cited designator is live — no exemption beyond the measured collisions', () => {
    const dead = new Set(retiredDesignators());
    const failures = designatorCitations(dead).map(
      (c) =>
        `DESIGNATOR ${c.file}:${c.line} → ${c.id} — that shard is retired; inline what it ruled or withdraw the claim (do NOT re-point, and do NOT respell the id to explain the repair)`,
    );
    expect(failures, failures.join('\n')).toEqual([]);
  });

  // The CONVICTING fixture — the known-answer control. It travels the same path as
  // the live law: the real oracle's dead set, the real token matcher, over text this
  // test supplies.
  it('FAILS a live source citing a genuinely retired designator', () => {
    const dead = new Set(retiredDesignators());
    // Assert the defect is PRESENT before reading the result (meta-gate hazard 1).
    // Read off the oracle rather than pinned, because a pinned id is a claim about
    // history that the next `git filter-repo` falsifies — and asserting a NON-EMPTY
    // oracle is the same assertion, one quantifier weaker.
    const victim = [...dead].sort()[0];
    expect(victim, 'the oracle enumerated nothing to convict with').toBeTypeOf(
      'string',
    );
    const id = victim as string;
    expect(liveDesignators().has(id)).toBe(false);

    const probe = [
      `// AMENDED (${id}): the assertion moved to the constant.`,
      '// the layout is `plans/<plan>/<state>/` — a shape, not a designator',
      `// a path segment is not a citation: plans/${id}/PLAN.md`,
      '// and an unrelated live word: retirement',
    ];
    const hits = probe.flatMap((t) =>
      [...t.matchAll(DESIGNATOR_TOKEN)]
        .map((m) => m[0])
        .filter((tok) => dead.has(tok)),
    );
    // Convicts the citation and ONLY it: the shape carries no designator, and the
    // path form belongs to the plan-path law — the leading guard hands it over
    // rather than convicting the same token twice.
    expect(hits).toEqual([id]);
  });

  // The EXONERATING fixture — the other half, and the one that proves the gate does
  // not bite wrongly. Without it, a matcher that convicted every hyphenated word in
  // the corpus would still pass the convicting control above.
  it('exonerates the measured cratylic collisions and the non-citation shapes', () => {
    const dead = new Set(retiredDesignators());

    // Each exonerated name really IS a retired designator — otherwise the list
    // exonerates nothing and is silently widening the gate's blind spot.
    for (const name of EXONERATED)
      expect(
        dead.has(name),
        `${name} is no longer a retired designator — drop it from EXONERATED`,
      ).toBe(true);

    // The four collisions, in the voice the corpus actually writes them.
    const spared = [
      '// the cold-decode oracle IS this agent’s executable oracle',
      '// READER-REACH gate — `extend-reach`: the reader binding ρ enforced',
      '// Law (explicit-omit-to-inherit): a dimension key holds a fragment OR null',
      '// Sage archetype of root-cause diagnosis — symptom to fault',
      '// a branch specimen: mav/B9-toolkit-hardening',
      '// a plan path, owned by the law above: plans/fleet-cutover',
    ];
    const survivors = spared.flatMap((t) =>
      [...t.matchAll(DESIGNATOR_TOKEN)]
        .map((m) => m[0])
        .filter((tok) => dead.has(tok) && !EXONERATED.includes(tok)),
    );
    expect(survivors, `wrongly convicted: ${survivors.join(', ')}`).toEqual([]);
    // …and the collisions were genuinely THERE to be spared — an exoneration that
    // fired on nothing proves nothing (meta-gate hazard 1, negative direction).
    const seen = spared.flatMap((t) =>
      [...t.matchAll(DESIGNATOR_TOKEN)]
        .map((m) => m[0])
        .filter((tok) => EXONERATED.includes(tok)),
    );
    expect([...new Set(seen)].sort()).toEqual([...EXONERATED].sort());
  });

  // ANTI-CEREMONY. An exemption list with no live subject is a mechanism protecting
  // nothing, and its terminal state is DELETION, not ∅ — the meta-gate's own ruling.
  // This is the leg that says so out loud, in the aggregate rather than per name, so
  // that editing any one collision site is not a gate failure.
  it('the exoneration list is LOAD-BEARING — it is not carrying ceremony', () => {
    const dead = new Set(retiredDesignators());
    const all = designatorHits(dead).length;
    const subject = designatorCitations(dead).length;
    expect(
      all - subject,
      'EXONERATED spares nothing in the live corpus — delete the list and its legs; the gate gets strictly stronger',
    ).toBeGreaterThan(0);
  });
});
