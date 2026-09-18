// HARNESS-INDEPENDENCE gate — no projection may reach into another harness.
//
// The invariant, stated by the operator and adopted as law: **each harness's
// deployment is self-contained.** A projection may share an artifact through a
// universal, vendor-neutral root (`~/.agents`), and it may carry harness-specific
// artifacts in that harness's own root. What it may never do is depend on a
// DIFFERENT harness — not on its directories, and not on its CLI.
//
// This is a gate rather than a paragraph because the two breaches it holds were
// both live, both invisible, and both discovered only by tracing a failure
// backwards:
//
//   · `stance-guardrail-pre` named `$HOME/.claude/hooks/stance-guardrail` for its
//     judge and its rubric, so the copy deployed under `~/.omp/hooks/` reached
//     across into the CLAUDE tree at fire time. On a host with no claude
//     deployment it found nothing, failed open, and appended its misses to a
//     directory that does not exist.
//
//   · `stance-judge.sh` defaulted its judge binary to `claude` on EVERY harness,
//     so codex's guard and omp's both required a third vendor's CLI installed and
//     separately authenticated. That CLI's OAuth lapsed on the author's host, and
//     every verdict on every harness failed open in silence — a gate deployed,
//     opted in, correctly scoped, and judging nothing.
//
// Both were repaired by DERIVATION rather than by a literal: the worker resolves
// its siblings from its own location, and the judge binary is a projection fact
// each adapter answers with its own name (or with the empty string, where it
// judges in-process and needs no subprocess at all).
//
// WHAT THIS SCANS, and why it is the committed bytes. `targets/` holds the
// resolved worker bytes every harness deploys — the same bytes `projectPluginSet`
// emits, byte-locked by `hook-rule-boundary`. A leak here is a leak everywhere.
// Prose is exempt: a comment naming the defect it fixed is how the repair stays
// legible, and a rule that forbids naming `claude` in a sentence would delete the
// record along with the bug.

import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const targetsRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'targets',
);

/** The cell templates — `workers[].content` before any fact is substituted. */
const hooksRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'hooks',
);

/** Every harness root a deployed artifact could name. */
const HARNESS_HOMES = ['.claude', '.codex', '.omp'] as const;

/** Every harness CLI a deployed artifact could spawn. */
const HARNESS_CLIS = ['claude', 'codex', 'omp'] as const;

async function shellTargets(): Promise<{ path: string; lines: string[] }[]> {
  const out: { path: string; lines: string[] }[] = [];
  for await (const rel of glob('**/*.sh', { cwd: targetsRoot })) {
    out.push({
      path: rel,
      lines: readFileSync(join(targetsRoot, rel), 'utf8').split('\n'),
    });
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Lines that DO something, with comments and blanks dropped.
 *
 * The distinction is the whole usability of this gate. `#`-led prose is where a
 * repair explains itself, and both breaches below are documented in exactly that
 * register inside the files they were removed from.
 */
function code(lines: string[]): { n: number; text: string }[] {
  return lines
    .map((text, i) => ({ n: i + 1, text }))
    .filter(({ text }) => text.trim() !== '' && !text.trim().startsWith('#'));
}

describe('harness independence', () => {
  it('names no harness home in executable shell', async () => {
    const found: string[] = [];
    for (const { path, lines } of await shellTargets()) {
      for (const { n, text } of code(lines)) {
        for (const home of HARNESS_HOMES) {
          // A harness root reached through `$HOME`/`~` is the breach. A path
          // DERIVED from the script's own location is not, and cannot be: it
          // resolves to whichever root the copy was deployed into.
          if (
            new RegExp(
              `(\\$HOME|~|\\$\\{HOME\\})/${home.replace('.', '\\.')}\\b`,
            ).test(text)
          ) {
            found.push(`${path}:${n}: ${text.trim()}`);
          }
        }
      }
    }
    expect(found).toEqual([]);
  });

  it('names no harness CLI in a cell template — only the projection fact', async () => {
    // AIMED AT THE TEMPLATE, NOT THE RESOLVED BYTES, and the distinction is the
    // gate. `targets/` holds ONE harness's resolution (claude's, the byte
    // anchor), so `:-claude}` is correct there and says nothing about the other
    // two. The cell is what every projection shares, so a vendor literal THERE
    // is a literal in all three — which is exactly how the judge came to default
    // to `claude` on codex and omp alike.
    //
    // The repair is `{{fact:harness-judge-bin}}`: claude resolves `claude`, codex
    // resolves `codex`, and omp resolves EMPTY because it judges in-process.
    const cells: { path: string; lines: string[] }[] = [];
    for await (const rel of glob('*.ts', { cwd: hooksRoot })) {
      cells.push({
        path: rel,
        lines: readFileSync(join(hooksRoot, rel), 'utf8').split('\n'),
      });
    }
    expect(cells.length).toBeGreaterThanOrEqual(2);
    const found: string[] = [];
    for (const { path, lines } of cells) {
      for (const { n, text } of code(lines)) {
        for (const cli of HARNESS_CLIS) {
          if (new RegExp(`:-${cli}\\}`).test(text)) {
            found.push(`${path}:${n}: ${text.trim()}`);
          }
        }
      }
    }
    expect(found).toEqual([]);
  });

  it('keeps the scan non-vacuous — it reads real committed workers', async () => {
    // A gate over an empty file set is green for the wrong reason, and this one
    // globs a directory whose layout has already moved once.
    const targets = await shellTargets();
    expect(targets.length).toBeGreaterThanOrEqual(5);
    expect(targets.some((t) => t.path.includes('stance-guardrail'))).toBe(true);
    expect(code(targets.flatMap((t) => t.lines)).length).toBeGreaterThan(200);
  });
});
