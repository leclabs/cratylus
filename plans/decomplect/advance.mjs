#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
// advance — move every shard to the state praxis says it should be in.
//
// `state(t) = completed` is recorded by residence in `completed/`. Everything else follows:
// `ready` iff every dep is completed AND no ruling is owed; `pending` otherwise. Doing this by
// hand is how the frontier went stale twice in one day, so it is a command.
//
//   node plans/decomplect/advance.mjs            # report
//   node plans/decomplect/advance.mjs --apply    # git mv into place
import { existsSync, readdirSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHARDS } from './spec.mjs';

const PLAN = dirname(fileURLToPath(import.meta.url));
const STATES = ['pending', 'ready', 'active', 'completed'];
const apply = process.argv.includes('--apply');

const where = {};
for (const s of STATES)
  for (const f of existsSync(join(PLAN, s)) ? readdirSync(join(PLAN, s)) : [])
    if (f.endsWith('.md')) where[f.slice(0, -3)] = s;

const completed = new Set(
  Object.entries(where)
    .filter(([, s]) => s === 'completed')
    .map(([k]) => k),
);
let moved = 0;
for (const [id, t] of Object.entries(SHARDS)) {
  const at = where[id];
  if (!at || at === 'completed' || at === 'active') continue;
  const want =
    !t.blockedBy && t.deps.every((d) => completed.has(d)) ? 'ready' : 'pending';
  if (at === want) continue;
  console.log(`${at} → ${want}  ${id}`);
  if (apply) {
    const from = join(PLAN, at, `${id}.md`);
    const to = join(PLAN, want, `${id}.md`);
    // `git mv` refuses an UNTRACKED file, and a freshly filed shard is untracked until staged.
    // A plain rename is the same act to the plan; git notices it at `add` time.
    try {
      execFileSync('git', ['mv', from, to], { stdio: 'pipe' });
    } catch {
      renameSync(from, to);
    }
  }
  moved++;
}
console.log(apply ? `applied ${moved}` : `${moved} would move (pass --apply)`);
