// SKILL-HOOK-CAP gate — every shipped skill fits what claude will let one hook print.
//
// A `--agent` main session on Claude Code gets a persona's skills from one hook per
// skill, and Claude caps each hook's output. A skill over the cap is not carried: it
// degrades to required reading and projection warns. That is the right behaviour for
// a corpus that outgrows the cap, and the wrong thing to find out by a warning in
// somebody's install — so the corpus is held under the cap here, where growing a skill
// past it is a red test with the number in it.
//
// It prints every skill's size beside the cap, so the headroom is read off the run
// and not guessed: the largest skill sits within a few dozen characters of the cap.
//
// The size is what the hook prints with `$HOME` unexpanded; a host whose home is
// longer than that adds the difference to each skill (see `personaSkillOutputSize`).

import { claudeHarnessAdapter } from '@cratylus/forge/adapters/claude';
import { projectPluginSet } from '@cratylus/forge/project';
import { beforeAll, describe, expect, it } from 'vitest';
import canonPlugin from '../src/index.js';

const hook = claudeHarnessAdapter.mainSessionSkillHook;

/** The skills of `files` (`skills/<name>/SKILL.md`) with the hook's output size. */
function sizesOf(
  files: readonly { path: string; content: string }[],
): { name: string; size: number }[] {
  return files
    .flatMap((f) => {
      const m = /^skills\/([^/]+)\/SKILL\.md$/.exec(f.path);
      return m ? [{ name: m[1] as string, content: f.content }] : [];
    })
    .map(({ name, content }) => ({
      name,
      size: (hook as NonNullable<typeof hook>).size(name, content),
    }))
    .sort((a, b) => b.size - a.size);
}

/** The skills over the cap — the ONE predicate the gate and its fixture share. */
const overCap = (sizes: readonly { name: string; size: number }[]) =>
  sizes.filter((s) => s.size > (hook as NonNullable<typeof hook>).cap);

let shipped: { name: string; size: number }[] = [];
let warnings: string[] = [];

beforeAll(async () => {
  const collected: string[] = [];
  const tree = await projectPluginSet({
    plugins: [canonPlugin],
    adapter: claudeHarnessAdapter,
    warn: (line) => collected.push(line),
  });
  warnings = collected;
  shipped = sizesOf(tree.files);
}, 120_000);

describe('every shipped skill fits claude’s per-hook output cap', () => {
  it('declares a cap to weigh against', () => {
    expect(hook?.cap).toBe(10_000);
  });

  it('is not vacuous — the projection shipped skills to weigh', () => {
    expect(shipped.length).toBeGreaterThan(0);
  });

  it('holds every skill under the cap, and prints each size against it', () => {
    const cap = hook?.cap ?? 0;
    console.log(
      [
        `claude per-hook output cap: ${cap} characters`,
        ...shipped.map(
          (s) =>
            `  ${s.name.padEnd(14)} ${String(s.size).padStart(6)}  (${cap - s.size} to spare)`,
        ),
      ].join('\n'),
    );
    expect(
      overCap(shipped),
      'skills over the cap arrive as a preview, or degrade to required reading',
    ).toEqual([]);
  });

  it('projects with no warning about a skill over the cap', () => {
    expect(warnings.filter((w) => w.includes('per-hook output cap'))).toEqual(
      [],
    );
  });

  // The known-answer control: the same predicate, fed a skill built one character past
  // the cap, must name it — else a clean corpus above is a dark gate.
  it('FLAGS a skill one character over the cap, and passes one exactly at it', () => {
    const cap = hook?.cap ?? 0;
    const overhead = (hook as NonNullable<typeof hook>).size('probe', '');
    // `x…x\n` prints `chars` characters once the label, directory and blank line are counted.
    const at = (chars: number) => ({
      path: 'skills/probe/SKILL.md',
      content: `${'x'.repeat(chars - overhead - 1)}\n`,
    });
    expect(sizesOf([at(cap)])[0]?.size).toBe(cap);
    expect(overCap(sizesOf([at(cap)]))).toEqual([]);
    expect(overCap(sizesOf([at(cap + 1)])).map((s) => s.name)).toEqual([
      'probe',
    ]);
  });
});
