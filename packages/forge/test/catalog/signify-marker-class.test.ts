// THE GATE FOR THE CLASS — zero owed-signification markers outside `plans/`.
//
// WHY THIS EXISTS, precisely. A census counted the owed-signification markers in this
// repo and reported exactly one. It measured with a pattern anchored on the marker word
// followed by a COLON. The second marker was written with an EM-DASH, and it sat unseen
// inside the very file the census had already opened, four lines from the one it found.
//
// The defect is not the missed marker. It is that a check whose SCOPE is narrower than
// its CLAIM reads as conformance when it is only coverage: "exactly one" was a true
// statement about the pattern and a false statement about the repo, and nothing in the
// green result distinguished the two readings.
//
// SO THE PATTERN IS DERIVED FROM THE CLASS, NOT FROM AN INSTANCE. Across the two known
// historical forms the punctuation VARIED (`:` and `—`) and the marker WORD IN CAPS did
// not. The punctuation is therefore the accident and the caps token is the invariant, so
// the gate keys on the token and accepts whatever delimiter follows — colon, em-dash,
// en-dash, hyphen, bracket, bang, or nothing at all. A second arm catches the same
// annotation written in lower case, which needs a bracket and a delimiter to tell it
// apart from the ubiquitous ordinary prose use of the same word.
//
// WHAT IT DELIBERATELY DOES NOT MATCH, and why each is a decision rather than an
// oversight:
//   - the bare lower-case word in running prose, and the `signify` SKILL's own name and
//     path. Roughly forty files outside `plans/` use it legitimately; a case-insensitive
//     bare-token pattern would flag every one and the gate would be turned off within a
//     day. Arm 1 requires caps; arm 2 requires a bracket AND a delimiter.
//   - a markdown link to that skill — `[signify](./skill.ts)` — because `]` is not an
//     opening delimiter. `[<word>]` standing alone IS caught, by arm 1.
//   - the token inside a longer identifier or word (a `signifyCell` member, a
//     `SIGNIFYING` in prose): both arms are word-bounded.
//   - `plans/`, wholesale. That directory is where this corpus legitimately RECORDS
//     debt; a marker there is the record working, not the debt shipping.
//
// SELF-EXEMPTION: NONE — the literal is built from parts instead.
// This file necessarily discusses marker-shaped text, so it would convict itself. The
// two available repairs are not equivalent. Excluding this path from the scan would put
// a permanent blind spot in the one file every future author of a marker-adjacent check
// opens first, and a check that exempts itself from its own claim is the exact defect
// this gate was written to catch — one level up. So the scan covers this file like any
// other, and every marker-shaped string here is ASSEMBLED AT RUNTIME from fragments that
// are not themselves markers. The bytes on disk contain no marker; the fixtures do.

import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/** The marker word, assembled — see SELF-EXEMPTION above. Never written whole. */
const WORD = `SIGN${'IFY'}`;

/**
 * ARM 1 — the CAPS token, word-bounded, with ANY following punctuation or none. The
 * invariant across every known form, and what makes this a gate for the class: the
 * delimiter is simply not consulted, so no delimiter can be missing from the list.
 */
const CAPS = new RegExp(`(?<![A-Za-z0-9_])${WORD}(?![A-Za-z0-9_])`);

/**
 * ARM 2 — the same annotation written in ANY case. Case-insensitivity costs a
 * precondition, since the lower-case word is ordinary vocabulary here: it must be
 * bracketed AND followed by an opening delimiter. Two separate regexes rather than one
 * alternation because a single `i` flag cannot apply to one alternative and not the
 * other, and arm 1 must stay case-SENSITIVE.
 */
const BRACKETED = new RegExp(`\\[[ \\t]*${WORD}[ \\t]*[:\\-–—]`, 'i');

/** Does `text` carry an owed-signification marker in ANY form? The pure predicate —
 *  the live scan and every fixture below go through this one function, so a fixture
 *  cannot pass by a mechanism the live gate does not use. */
function hasMarker(text: string): boolean {
  return CAPS.test(text) || BRACKETED.test(text);
}

/** Derived, ephemeral, or vendored trees — none of them an AUTHORED surface, so a hit
 *  there is a copy of a hit elsewhere. `plans/` is excluded for the opposite reason:
 *  it is authored, and it is the sanctioned home for recorded debt. */
const SKIP_DIRS: ReadonlySet<string> = new Set([
  '.git',
  '.turbo',
  '.scratchpad',
  '__pycache__',
  'node_modules',
  'dist',
  'coverage',
  'graphify-out',
  '.render',
  '.render-ts',
  '.render-ts-codex',
  'plans',
]);

/** Non-text payloads, skipped for speed only — a marker is a thing a person TYPES. */
const BINARY = /\.(png|jpe?g|gif|ico|webp|pdf|zip|woff2?|ttf|otf|node)$/i;

/** Every scanned file under `root`, as `/`-joined relative paths. */
function filesUnder(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name));
      } else if (entry.isFile() && !BINARY.test(entry.name)) {
        out.push(relative(root, join(dir, entry.name)).split(sep).join('/'));
      }
    }
  };
  walk(root);
  return out.sort();
}

/** Scan a tree → the relative paths carrying a marker. */
function scan(root: string): string[] {
  return filesUnder(root).filter((rel) => {
    const abs = join(root, rel);
    if (statSync(abs).size > 1_000_000) return false;
    return hasMarker(readFileSync(abs, 'utf8'));
  });
}

/** `packages/forge/test/catalog/` → the repo root. */
const repoRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
);

describe('owed-signification markers — the gate is for the CLASS, not one punctuation variant', () => {
  it('reaches the live tree — an empty scan is a DARK scan, not a clean one', () => {
    // The census's failure with the walk substituted for the pattern: a mistyped root
    // or a too-eager skip list would report zero markers over zero files read.
    const seen = filesUnder(repoRoot);
    expect(seen.length).toBeGreaterThan(100);
    expect(seen).toContain('packages/forge/src/catalog/index.ts');
    expect(seen).toContain(
      'packages/forge/test/catalog/signify-marker-class.test.ts',
    );
  });

  it('the live tree carries ZERO owed-signification markers outside plans/', () => {
    const carrying = scan(repoRoot);
    expect(
      carrying,
      `owed-signification markers ship in these files — record the debt under plans/ or discharge it:\n${carrying.join('\n')}`,
    ).toEqual([]);
  });

  it('FLAGS a planted marker in the COLON form — the variant the census could see', () => {
    const root = mkdtempSync(join(tmpdir(), 'marker-colon-'));
    try {
      const body = `// value-type a minted node carries. [${WORD}: arity→kind map.]\n`;
      mkdirSync(join(root, 'src'), { recursive: true });
      writeFileSync(join(root, 'src', 'planted.ts'), body);
      // The injection landed: assert the defect is PRESENT before reading the verdict.
      expect(readFileSync(join(root, 'src', 'planted.ts'), 'utf8')).toContain(
        `[${WORD}:`,
      );
      expect(scan(root)).toEqual(['src/planted.ts']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('FLAGS a planted marker in the EM-DASH form — the variant the census could NOT see', () => {
    const root = mkdtempSync(join(tmpdir(), 'marker-emdash-'));
    try {
      const body = `// [${WORD} — engine-internal names pending a cold-decode pass.]\n`;
      mkdirSync(join(root, 'src'), { recursive: true });
      writeFileSync(join(root, 'src', 'planted.ts'), body);
      expect(readFileSync(join(root, 'src', 'planted.ts'), 'utf8')).toContain(
        `[${WORD} —`,
      );
      expect(scan(root)).toEqual(['src/planted.ts']);
      // The colon-anchored pattern the census used, reconstructed: it reads this file
      // as clean. That divergence IS the bug, held here so it cannot recur silently.
      expect(new RegExp(`${WORD}:`).test(body)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('FLAGS every other plausible delimiter, and a bare bracketed marker', () => {
    for (const form of [
      `// [${WORD}] anchor not yet derived`,
      `// [${WORD} - hyphen form]`,
      `// [${WORD} – en-dash form]`,
      `// ${WORD}: no brackets at all`,
      `/* ${WORD}! */`,
      `// [${WORD.toLowerCase()}: written in lower case]`,
    ])
      expect(hasMarker(form), form).toBe(true);
  });

  it('exonerates a clean tree, and the legitimate lower-case uses it must not police', () => {
    const root = mkdtempSync(join(tmpdir(), 'marker-clean-'));
    try {
      mkdirSync(join(root, 'src'), { recursive: true });
      writeFileSync(join(root, 'src', 'ok.ts'), '// a clean module\n');
      expect(scan(root)).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
    const w = WORD.toLowerCase();
    for (const clean of [
      `use the \`${w}\` skill to name a concept`,
      `import { skill } from '../skills/${w}/skill.js';`,
      `see [${w}](./packages/canon/src/skills/${w}/skill.ts)`,
      `stage 2 of exemplify — ${w} assigns the anchor`,
      `const ${w}Cell = {};`,
      `${WORD}ING is not a marker`,
    ])
      expect(hasMarker(clean), clean).toBe(false);
  });
});
