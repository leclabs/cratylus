import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it } from 'vitest';
import { type Host, host } from '../capability-port/fixture.js';

// The bounded contexts whose concepts are the practice, each the skill it reaches agents as.
const PRACTICES = ['cratylic-context-design', 'behaviour-driven-development'];

// cratylus's own domain model, read at test time so the check follows the model.
const model = fileURLToPath(
  new URL('../../../../design/model/', import.meta.url),
);

let h: Host | undefined;
afterEach(() => {
  h?.dispose();
  h = undefined;
});

// A packed cratylus on PATH and a HOME of its own, with nothing installed yet.
function emptyHome(): Host {
  const fresh = host();
  rmSync(fresh.home, { recursive: true, force: true });
  mkdirSync(fresh.home);
  return fresh;
}

const entries = (dir: string) =>
  existsSync(dir) ? readdirSync(dir).sort() : [];

// The skills omp offers the user, by name, each to its SKILL.md: every
// `skills/<name>/SKILL.md` of an extension package its user plugin manifest
// links under `~/.omp/plugins/node_modules`.
function offeredSkills(home: string): Map<string, string> {
  const modules = join(home, '.omp/plugins/node_modules');
  const skills = new Map<string, string>();
  for (const name of entries(modules)) {
    const dir = join(realpathSync(join(modules, name)), 'skills');
    for (const skill of entries(dir)) {
      const file = join(dir, skill, 'SKILL.md');
      if (existsSync(file)) skills.set(skill, file);
    }
  }
  return skills;
}

interface Concept {
  record: string;
  term: string;
  correction: string;
}

// Each concept record of a bounded context: its `# ` heading is the term, the
// paragraph after it, up to its examples or the end, is the correction.
function concepts(context: string): Concept[] {
  const dir = join(model, context);
  return entries(dir)
    .filter((f) => f.endsWith('.md') && f !== 'context.md')
    .map((f) => {
      const record = `${context}/${f}`;
      const text = readFileSync(join(dir, f), 'utf8');
      const match = /^# (.+)\n([\s\S]*?)(?=\n## |$)/.exec(text);
      expect(match, `${record} opens with its term`).not.toBeNull();
      return {
        record,
        term: match![1]!.trim(),
        correction: match![2]!.trim(),
      };
    });
}

it('agent-design/practice: the practice reaches every agent as skills', () => {
  h = emptyHome();
  // Packed, user scope, no terminal: `run` hands the command an empty stdin pipe.
  const r = h.command(['install', '--harness', 'omp']);
  expect(r.code, `${r.stdout}\n${r.stderr}`).toBe(0);

  const skills = offeredSkills(h.home);
  expect([...skills.keys()]).toEqual(expect.arrayContaining(PRACTICES));

  for (const context of PRACTICES) {
    const records = concepts(context);
    expect(records.length, `${context} records concepts`).toBeGreaterThan(0);
    const skill = readFileSync(skills.get(context)!, 'utf8');
    const missing = records.flatMap(({ record, term, correction }) => [
      ...(skill.includes(term) ? [] : [`${record}: term ${term}`]),
      ...(skill.includes(correction) ? [] : [`${record}: correction`]),
    ]);
    expect(missing, `${context} skill holds each concept exactly`).toEqual([]);
  }
});
