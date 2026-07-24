/**
 * Deterministic MAP.md renderer — the story↔test map is GENERATED from the
 * scanned call sites (tools/render-map.ts writes it; coverage.test.ts asserts
 * the committed file is current). No timestamps: content is a pure function of
 * the test sources.
 */

import {
  EPICS,
  EXCLUDED,
  STORY_IDS,
  TESTABLE_IDS,
  epicOf,
} from './registry.js';
import type { StoryRef } from './scan.js';

/**
 * Markdown-table-safe name: raw `|` would split the cell; raw backticks would
 * break the code-span wrapper (see mdCell).
 */
export function mdSafe(name: string): string {
  return name.replace(/\|/g, '¦').replace(/`/g, 'ˋ');
}

/**
 * A test name rendered as a code span — prettier (pre-commit) rewrites
 * emphasis markers in plain table text (`*.md` → `_.md`), which would corrupt
 * names out of sync with their call sites; code spans are left verbatim.
 */
export function mdCell(name: string): string {
  return `\`${mdSafe(name)}\``;
}

export function renderMap(refs: StoryRef[]): string {
  const byId = new Map<string, StoryRef[]>();
  for (const r of refs) {
    const list = byId.get(r.id) ?? [];
    list.push(r);
    byId.set(r.id, list);
  }
  const trackedRefs = refs.filter((r) => r.tracked);
  const trackedByEpic = new Map<string, number>();
  for (const r of trackedRefs) {
    trackedByEpic.set(epicOf(r.id), (trackedByEpic.get(epicOf(r.id)) ?? 0) + 1);
  }

  const lines: string[] = [];
  lines.push('# story↔test map — the agent-forge story library');
  lines.push('');
  lines.push(
    'GENERATED — do not hand-edit. Regenerate: `pnpm exec tsx test/stories/tools/render-map.ts`',
  );
  lines.push(
    '(coverage.test.ts fails when this file is stale). Source of truth: the',
  );
  lines.push(
    '`story()` / `story.tracked()` call sites under `test/stories/E*/`.',
  );
  lines.push('');
  lines.push(
    `Library: ${STORY_IDS.length} stories · excluded-by-marker ${
      Object.keys(EXCLUDED).length
    } (${Object.entries(EXCLUDED)
      .map(([id, why]) => `${id} ${why}`)
      .join(' · ')}) · testable ${TESTABLE_IDS.length}.`,
  );
  lines.push(
    `Tests: ${refs.length} total · green ${refs.length - trackedRefs.length} · tracked-failing ${
      trackedRefs.length
    } (${[...trackedByEpic.entries()]
      .sort(([a], [b]) => Number(a.slice(1)) - Number(b.slice(1)))
      .map(([e, n]) => `${e}:${n}`)
      .join(' ')}) — enumerated with reasons in TRACKED-FAILING.md.`,
  );
  lines.push('');
  lines.push('## Story → tests');
  lines.push('');
  lines.push('| Story | Tests | Status | File · test name |');
  lines.push('| ----- | ----- | ------ | ---------------- |');
  for (const id of STORY_IDS) {
    if (id in EXCLUDED) {
      lines.push(`| ${id} | — | EXCLUDED (${EXCLUDED[id]}) | — |`);
      continue;
    }
    const list = byId.get(id) ?? [];
    const status = list.every((r) => !r.tracked)
      ? 'green'
      : list.every((r) => r.tracked)
        ? 'tracked'
        : 'mixed';
    const cell = list
      .map((r) => `${r.file} · ${mdCell(r.name)}${r.tracked ? ' ⟂' : ''}`)
      .join('<br>');
    lines.push(`| ${id} | ${list.length} | ${status} | ${cell} |`);
  }
  lines.push('');
  lines.push('(⟂ = tracked-failing test.)');
  lines.push('');
  lines.push('## Test file → stories');
  lines.push('');
  lines.push('| File | Stories |');
  lines.push('| ---- | ------- |');
  const byFile = new Map<string, Set<string>>();
  for (const r of refs) {
    const set = byFile.get(r.file) ?? new Set<string>();
    set.add(r.id);
    byFile.set(r.file, set);
  }
  for (const [file, ids] of [...byFile.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    lines.push(
      `| ${file} | ${[...ids]
        .sort((a, b) => STORY_IDS.indexOf(a) - STORY_IDS.indexOf(b))
        .join(' ')} |`,
    );
  }
  lines.push('');
  lines.push(
    `Epics: ${Object.entries(EPICS)
      .map(([k, v]) => `${k} ${v}`)
      .join(' · ')}.`,
  );
  lines.push('');
  return lines.join('\n');
}
