#!/usr/bin/env node
// sync-shards — project `spec.mjs` into an `## Execution` block in every shard.
//
// TWO HOMES WOULD DRIFT, so this is a PROJECTION, not a second source. `spec.mjs` is
// authoritative; this writes a derived block; `praxis-execution-spec.test.ts` asserts the block
// still equals what `spec.mjs` says. Edit the block by hand and the gate convicts you.
//
// It exists because a shard is opened ALONE by an executor who will not read the plan's data
// file. `∀ t : content(t) ⊨ spec(t)` is a claim about the SHARD, not about the plan.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHARDS } from './spec.mjs';

const PLAN = dirname(fileURLToPath(import.meta.url));
const MARK = '## Execution';
const SEQ = '## Sequence — R and the waves';
const list = (xs) => (xs.length ? xs.map((x) => `\`${x}\``).join(' · ') : '—');

export function block(id) {
  const t = SHARDS[id];
  const wave = waveOf(id);
  return [
    MARK,
    '',
    '<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->',
    '',
    `- **slice** ${t.slice} · **wave** ${wave}`,
    `- **depends on** ${list(t.deps)}`,
    `- **writes** ${list(t.outputs)}`,
    `- **compiles against** ${list(t.refs)}`,
    `- **evidence** ${list(t.static)}`,
    t.blockedBy
      ? `- **RULING OWED — not dispatchable** ${t.blockedBy}`
      : '- **dispatchable** no ruling owed',
    '',
  ].join('\n');
}

export function waves() {
  // Completed shards leave the schedule: they cannot contend, and keeping them would
  // invent conflicts that cannot occur. Their deps count as satisfied.
  const closed = existsSync(join(PLAN, 'completed'))
    ? new Set(
        readdirSync(join(PLAN, 'completed'))
          .filter((f) => f.endsWith('.md'))
          .map((f) => f.slice(0, -3)),
      )
    : new Set();
  const done = new Set(closed);
  const out = [];
  let left = Object.keys(SHARDS).filter((id) => !closed.has(id));
  while (left.length) {
    const w = left.filter((t) => SHARDS[t].deps.every((d) => done.has(d)));
    if (!w.length) return [...out, left];
    for (const t of w) done.add(t);
    out.push(w.sort());
    left = left.filter((t) => !done.has(t));
  }
  return out;
}
function waveOf(id) {
  return waves().findIndex((w) => w.includes(id));
}

/** The `## Sequence` section of PLAN.md — `mirror(state, R, content) emits R ∧ waves`. */
export function sequence() {
  const W = waves();
  const bySlice = new Map();
  for (const [id, t] of Object.entries(SHARDS))
    bySlice.set(t.slice, [...(bySlice.get(t.slice) ?? []), id]);
  const rows = W.map((w, i) => {
    const open = w.filter((t) => !SHARDS[t].blockedBy);
    return `| **${i}** | ${w.length} | ${open.length} | ${w.map((t) => (SHARDS[t].blockedBy ? `~~${t}~~` : `\`${t}\``)).join(' · ')} |`;
  });
  return [
    SEQ,
    '',
    '<!-- GENERATED from ./spec.mjs by ./sync-shards.mjs. Edit the spec, not this section. -->',
    '',
    'Computed, not asserted: `wave(0) ≜ { t | ∄ u : (t,u) ∈ R }`, and each later wave is what its',
    'predecessors unblock. `packages/canon/test/praxis-execution-spec.test.ts` proves every wave',
    'satisfies the concurrency precondition — no two members write the same file, and none writes a',
    'file another compiles against — so **a wave can be fanned out with no isolation**.',
    '',
    '`~~struck~~` = a RULING is owed. It sits in its wave but is not dispatchable; the count beside it',
    'is what can actually be sent.',
    '',
    '| wave | shards | dispatchable | members |',
    '| ---- | ------ | ------------ | ------- |',
    ...rows,
    '',
    `**Slices** — a partition, ${bySlice.size} of them, cut to minimize cross-slice edges in \`R\`:`,
    '',
    ...[...bySlice.entries()].map(
      ([k, v]) =>
        `- \`${k}\` (${v.length}) — ${v.map((x) => `\`${x}\``).join(' · ')}`,
    ),
    '',
  ].join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let n = 0;
  for (const id of Object.keys(SHARDS)) {
    const path = ['ready', 'pending', 'active']
      .map((s) => join(PLAN, s, `${id}.md`))
      .find(existsSync);
    // A completed shard has left the open states; it keeps its spec entry (deps still name it)
    // but owns no live Execution block. Silence here, not an error.
    if (!path) continue;
    const text = readFileSync(path, 'utf8');
    const i = text.indexOf(`\n${MARK}\n`);
    const body = i === -1 ? text.trimEnd() : text.slice(0, i).trimEnd();
    writeFileSync(path, `${body}\n\n${block(id)}`);
    n++;
  }
  const planPath = join(PLAN, 'PLAN.md');
  const plan = readFileSync(planPath, 'utf8');
  const i = plan.indexOf(`\n${SEQ}\n`);
  const j = i === -1 ? -1 : plan.indexOf('\n## ', i + 1);
  const next =
    i === -1
      ? plan.replace(/\n## Landed\n/, `\n${sequence()}\n## Landed\n`)
      : plan.slice(0, i + 1) + sequence() + (j === -1 ? '' : plan.slice(j + 1));
  writeFileSync(planPath, next);
  console.log(`synced ${n} shards + PLAN.md sequence`);
}
