// THE GATE THAT KEEPS SOURCE VISIBLE — no tracked authored file carries a byte that
// makes a text tool go dark on it.
//
// WHY THIS EXISTS, precisely. `packages/forge/src/adapters/codex/render.ts` was authored
// with two raw NUL bytes inside a template literal, as separators in a dedup key. The
// choice was defensible on its own terms — NUL cannot occur in a hook id, a native event
// name, or a matcher, so the key was injective. What it also did:
//
//   - `file` reported the source as `data`.
//   - BSD `grep` reported "Binary file … matches" and printed NO LINES — for every
//     pattern, including ones that matched. Exit code 0. Success, and silence.
//   - The agent `Read` tool rendered each NUL as a space, so the source DISPLAYED a
//     space-separated key that was not the key being built.
//
// Measured consequence: a grep for one symbol returned ONE hit where `git grep` returned
// FIVE, all four missing hits inside that file. The false negative supported the
// conclusion "this symbol is orphaned" — which was wrong, and was one edit away from
// deleting live code. The instrument failed OPEN and looked like evidence.
//
// THE CLASS, NOT THE INSTANCE. NUL is one member. A text tool goes dark on any byte it
// cannot decode in the active locale, so the invariant is the positive one the file name
// states: an authored source file IS TEXT. Two legs, because there are two ways to stop
// being text and both produce the same silence:
//
//   LEG 1 — CONTROL BYTES. Every byte below 0x20 except tab/newline/CR, plus DEL (0x7F).
//     These decode fine and render as nothing, which is worse than failing to decode:
//     the file looks clean in every viewer and greps as though its content were absent.
//   LEG 2 — DECODABILITY. The bytes must decode as UTF-8 under a FATAL decoder. A lone
//     continuation byte or a truncated sequence is what flips BSD `grep` to binary mode
//     on a file carrying no control byte at all.
//
// WHY BYTES AND NOT A DECODED STRING. Reading `utf8` substitutes U+FFFD for undecodable
// bytes, so leg 2 measured on a string is a measurement of the substitution, not of the
// file. Both legs read `Buffer` and neither ever converts.
//
// WHY `git ls-files` AND NOT A TREE WALK. AUTHORED is the scope, and tracked-ness is the
// corpus's own definition of authored — it excludes `dist/`, `.render*/`, `graphify-out/`
// and every other derived tree by construction rather than by a skip list that must be
// maintained. A derived file carrying a control byte is a copy of an authored one or a
// property of a generator, and neither is repaired here.
//
// SCOPE IS TRACKED-NESS, AND THAT IS A STATED BOUNDARY. A file enters this gate the
// moment it is staged, and not before — so the window between authoring a NUL and
// committing it is uncovered. Widening to `--others --exclude-standard` would close that
// window and was considered; it also makes every untracked working-tree artifact a
// potential red, which turns a gate about AUTHORED source into a gate about workspace
// hygiene. The window is narrow, the commit is where the corpus is defined, and this
// paragraph is the record that the choice was made rather than missed.
//
// WHY AN EXTENSION DENYLIST FOR BINARIES, AND NOT GIT'S OWN BINARY DETECTION. Git decides
// binary-ness by looking for a NUL in the first 8000 bytes. Excluding what git calls
// binary would excuse exactly the file this gate exists to convict — the detector and the
// defect are the same predicate. So genuine payloads are named by extension instead. The
// list is a DENYLIST and therefore fails LOUD: a new binary format not on it reddens the
// gate, which is a visible prompt to extend the list. An allowlist of text extensions
// would fail SILENT — a newly authored extension would simply go unscanned.
//
// SELF-EXEMPTION: NONE — the offending bytes are built at runtime instead.
// This file necessarily discusses control bytes, so a literal one would convict it, and
// the harness `Bash` tool independently REFUSES commands containing control characters on
// the grounds that they "would be hidden in the approval dialog" — this defect's own
// argument, already accepted one layer up. Every offending byte below is therefore
// constructed with `String.fromCharCode` / `Uint8Array`, never typed. The bytes on disk
// are printable; the fixtures are not. Excluding this path from the scan was the
// alternative, and a check that exempts itself from its own claim is this gate's defect
// one level up.
//
// AND THE REPORT ITSELF STAYS PRINTABLE. A failure message that quoted the offending byte
// would be invisible in the terminal that printed it — the gate would convict a file and
// say so in silence. Offenses are reported as `path:line byte 0xNN`; the byte is named,
// never emitted.

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

/** The three control bytes text legitimately carries. Everything else below 0x20, and
 *  DEL, is a byte no author means to type into a source file. */
const TEXT_CONTROLS: ReadonlySet<number> = new Set([0x09, 0x0a, 0x0d]);

const DEL = 0x7f;

/** Genuine binary payloads — see WHY AN EXTENSION DENYLIST above. */
const BINARY =
  /\.(png|jpe?g|gif|bmp|ico|webp|pdf|zip|gz|tgz|woff2?|ttf|otf|eot|node|wasm|so|dylib|mp[34]|mov|webm)$/i;

/** Where an offending byte sits, and which byte it is — never the byte itself. */
interface Offense {
  readonly byte: number;
  readonly line: number;
}

/**
 * LEG 1, pure. The first control byte in `bytes` outside tab/newline/CR, or `null`.
 * First-only: one report per file is enough to act on, and a file full of NULs would
 * otherwise bury every other offender in the failure message.
 */
function firstControlByte(bytes: Uint8Array): Offense | null {
  let line = 1;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i] as number;
    if (byte === 0x0a) {
      line++;
      continue;
    }
    if (byte === DEL || (byte < 0x20 && !TEXT_CONTROLS.has(byte)))
      return { byte, line };
  }
  return null;
}

/** LEG 2, pure. Do `bytes` decode as UTF-8 with no replacement? Fatal, so an
 *  undecodable byte throws rather than becoming U+FFFD and passing. */
function decodesAsUtf8(bytes: Uint8Array): boolean {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

/** `0x00`, `0x1f` — the printable name of a byte that has no printable form. */
function hex(byte: number): string {
  return `0x${byte.toString(16).padStart(2, '0')}`;
}

/**
 * Every authored file tracked under `root`, binaries excluded, THAT STILL EXISTS.
 *
 * `git ls-files` reads the INDEX; every byte read below comes from the WORKING TREE, and
 * the two disagree the moment a tracked file is moved or deleted without staging. Without
 * the existence filter this threw `ENOENT` mid-rename — failing loud, but naming a missing
 * file instead of returning a verdict, which is a red that says nothing about whether the
 * corpus is text. A gate that breaks during an ordinary rename is one developers learn to
 * skip, and a skipped gate is the dark gate this file exists to prevent.
 *
 * Skipping is not a hole: a path with no bytes in the working tree has nothing to convict,
 * and it re-enters the scan the moment it is staged — which is before any commit this gate
 * is meant to guard.
 */
function authoredFiles(root: string): string[] {
  return execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .filter((rel) => !BINARY.test(rel))
    .filter((rel) => existsSync(join(root, rel)));
}

/** Scan a tracked tree → `path:line byte 0xNN` for every file carrying a control byte.
 *  The live scan and every fixture below go through this one function, so a fixture
 *  cannot pass by a mechanism the live gate does not use. */
function scanControl(root: string): string[] {
  const out: string[] = [];
  for (const rel of authoredFiles(root)) {
    const found = firstControlByte(readFileSync(join(root, rel)));
    if (found !== null)
      out.push(`${rel}:${found.line} byte ${hex(found.byte)}`);
  }
  return out;
}

/** Scan a tracked tree → every file that does not decode as UTF-8. */
function scanUndecodable(root: string): string[] {
  return authoredFiles(root).filter(
    (rel) => !decodesAsUtf8(readFileSync(join(root, rel))),
  );
}

/** A tracked tree in a tmpdir, so `git ls-files` has something to answer. */
function plantTree(label: string, files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), label));
  execFileSync('git', ['init', '--quiet'], { cwd: root });
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), body);
  }
  execFileSync('git', ['add', '--all'], { cwd: root });
  return root;
}

describe('authored source is TEXT — a byte that blinds grep must not reach the corpus', () => {
  it('reaches the live tree — a scan of zero files is a DARK scan, not a clean one', () => {
    // The symptom's failure with the walk substituted for the pattern: a mistyped root,
    // a too-eager denylist, or a `git ls-files` run from the wrong cwd would report zero
    // offenders over zero files read, and the two legs below would pass over nothing.
    const seen = authoredFiles(repoRoot);
    expect(seen.length).toBeGreaterThan(100);
    // Three roots, so a walk that reached only one is visible: the symptom's own file,
    // this test dir (hence this file, once tracked — see SCOPE IS TRACKED-NESS above),
    // and a document at the repo root that no package path would cover.
    expect(seen).toContain('packages/forge/src/adapters/codex/render.ts');
    expect(seen).toContain('packages/canon/test/gate-convicts.test.ts');
    expect(seen).toContain('AGENTS.md');
    // And the reads land: the denylist excludes payloads, never authored source, so a
    // named file must come back with bytes in it rather than as an unread name.
    expect(
      readFileSync(
        join(repoRoot, 'packages/forge/src/adapters/codex/render.ts'),
      ).length,
    ).toBeGreaterThan(0);
  });

  it('no tracked authored file carries a control byte outside tab/newline/CR', () => {
    const carrying = scanControl(repoRoot);
    expect(
      carrying,
      `these files are invisible to grep, \`file\`, and every viewer that renders a control byte as nothing:\n${carrying.join('\n')}`,
    ).toEqual([]);
  });

  it('every tracked authored file decodes as UTF-8', () => {
    const undecodable = scanUndecodable(repoRoot);
    expect(
      undecodable,
      `BSD grep classifies these binary and prints NO LINES while exiting 0:\n${undecodable.join('\n')}`,
    ).toEqual([]);
  });

  it('FLAGS a planted NUL — the exact defect, with the byte built programmatically', () => {
    const NUL = String.fromCharCode(0);
    const root = plantTree('authored-text-nul-', {
      'src/render.ts': `const key = \`\${id}${NUL}\${native}${NUL}\${matcher}\`;\n`,
      'src/clean.ts': 'const key = JSON.stringify([id, native, matcher]);\n',
    });
    try {
      // The injection landed: assert the defect is PRESENT before reading the verdict.
      const bytes = readFileSync(join(root, 'src/render.ts'));
      expect([...bytes]).toContain(0);
      expect(scanControl(root)).toEqual(['src/render.ts:1 byte 0x00']);

      // The third symptom, held so it cannot recur silently: what the file DISPLAYS is
      // not what it CONTAINS. A viewer that renders NUL as a space shows a key built
      // from spaces — a different, and syntactically plausible, program.
      const source = bytes.toString('utf8');
      const displayed = source.split(NUL).join(' ');
      expect(displayed).toContain('${id} ${native} ${matcher}');
      expect(source).not.toContain('${id} ${native} ${matcher}');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('FAILS on every control byte outside tab/newline/CR — the class, not just NUL', () => {
    const enc = new TextEncoder();
    for (let byte = 0x00; byte <= 0x1f; byte++) {
      const bytes = enc.encode(`const a = 1;${String.fromCharCode(byte)}\n`);
      const found = firstControlByte(bytes);
      if (TEXT_CONTROLS.has(byte)) expect(found, hex(byte)).toBeNull();
      else expect(found, hex(byte)).toEqual({ byte, line: 1 });
    }
    expect(
      firstControlByte(enc.encode(`const a = 1;${String.fromCharCode(DEL)}\n`)),
    ).toEqual({ byte: DEL, line: 1 });
  });

  it('REFUSES bytes that are not valid UTF-8 — leg 2, on a file with no control byte', () => {
    // A lone continuation byte, and a truncated three-byte sequence. Neither is a
    // control byte, so leg 1 reads both as clean — which is why leg 2 exists.
    for (const tail of [[0x80], [0xe2, 0x9f]]) {
      const bytes = Uint8Array.from([
        ...new TextEncoder().encode('const a = '),
        ...tail,
        0x0a,
      ]);
      expect(firstControlByte(bytes)).toBeNull();
      expect(decodesAsUtf8(bytes)).toBe(false);
    }
    const root = plantTree('authored-text-utf8-', {
      'src/ok.ts': 'const a = 1;\n',
    });
    try {
      writeFileSync(
        join(root, 'src/broken.ts'),
        Buffer.from([0x2f, 0x2f, 0x20, 0xff, 0x0a]),
      );
      execFileSync('git', ['add', '--all'], { cwd: root });
      expect(scanUndecodable(root)).toEqual(['src/broken.ts']);
      expect(scanControl(root)).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('exonerates the bytes this corpus is built from — tabs, newlines, and its own symbols', () => {
    // The negative control leg 1 needs: a byte-level predicate written carelessly would
    // flag the continuation bytes of every `⟨`, `≜` and `·` in the canon and be turned
    // off within the day. The predicate must be blind to everything at or above 0x20.
    const enc = new TextEncoder();
    for (const clean of [
      'const a = 1;\n',
      '\tconst indented = 2;\r\n',
      'cratylism ⟨names natural ¬conventional⟩ · σ*(c) ≜ INTRINSIC — ¬coined\n',
      '// 中文 · emoji 🜁 · combining é\n',
      '',
    ]) {
      const bytes = enc.encode(clean);
      expect(firstControlByte(bytes), JSON.stringify(clean)).toBeNull();
      expect(decodesAsUtf8(bytes), JSON.stringify(clean)).toBe(true);
    }

    const root = plantTree('authored-text-clean-', {
      'src/ok.ts': "export const anchor = '⟨σ*⟩';\n",
      'README.md': '# title\r\n\r\n\tindented — with an em-dash\r\n',
    });
    try {
      expect(scanControl(root)).toEqual([]);
      expect(scanUndecodable(root)).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('reports the LINE of the offending byte, so a convicted file can be found', () => {
    const bytes = new TextEncoder().encode(
      `line one\nline two\nline ${String.fromCharCode(0x0b)}three\n`,
    );
    expect(firstControlByte(bytes)).toEqual({ byte: 0x0b, line: 3 });
  });
});
