// Regenerate only from the pre-delivery packed build, never from the work under judgment.
// bun capture-earlier.ts <installed-prefix> <output.json>
import { spawnSync } from 'node:child_process';
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
const [prefix, output] = process.argv.slice(2) as [string, string];
const root = mkdtempSync(join(tmpdir(), 'delivery-capture-'));
const home = join(root, 'home');
const cwd = join(root, 'project');
mkdirSync(home);
mkdirSync(cwd);
const put = (path: string, text: string) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};
symlinkSync(join(prefix, 'node_modules'), join(cwd, 'node_modules'), 'dir');
put(join(cwd, 'package.json'), '{"type":"module"}');
put(
  join(cwd, 'agents/obsolete-agent.ts'),
  `import { holder, builderRole } from '@cratylus/canon'; export const obsolete = {...holder(builderRole), name:'obsolete-agent', description:'Earlier delivery agent'};`,
);
put(
  join(cwd, 'skills/obsolete-skill/skill.ts'),
  `export const obsolete = {name:'obsolete-skill', description:'Earlier delivery skill', formalBlock:'Earlier projection content.', composition:()=>[]};`,
);
put(
  join(cwd, 'cratylus.config.ts'),
  `import canon from '@cratylus/canon'; export default {extends:[canon,{name:'earlier-delivery',agents:'./agents',skills:'./skills',practices:[{name:'earlier-delivery',description:'Earlier delivery',preselected:true,agents:['obsolete-agent'],skills:['obsolete-skill']}]}],patches:[]};`,
);
const result = spawnSync(
  join(prefix, 'node_modules/.bin/cratylus'),
  [
    'install',
    '--harness',
    'omp',
    '--home',
    home,
    '--all',
    '--model-roles',
    'default',
  ],
  {
    cwd,
    env: {
      ...process.env,
      HOME: home,
      PATH: `${prefix}/node_modules/.bin:${process.env.PATH}`,
    },
    encoding: 'utf8',
  },
);
if (result.status !== 0) throw new Error(result.stderr + result.stdout);
const normalize = (text: string) =>
  text
    .replaceAll(home, '<HOME>')
    .replaceAll(prefix, '<PREFIX>')
    .replaceAll(cwd, '<PROJECT>');
const entries: Record<string, { text?: string; link?: string; mode?: number }> =
  {};
function walk(path: string) {
  for (const name of readdirSync(path).sort()) {
    const file = join(path, name);
    const stat = lstatSync(file);
    if (stat.isSymbolicLink())
      entries[relative(home, file)] = { link: normalize(readlinkSync(file)) };
    else if (stat.isDirectory()) walk(file);
    else
      entries[relative(home, file)] = {
        text: normalize(readFileSync(file, 'utf8')),
        mode: stat.mode & 0o777,
      };
  }
}
walk(home);
writeFileSync(
  output,
  `${JSON.stringify({ provenance: 'Pre-delivery packed cratylus 0.11.0; actual install --harness omp --all --model-roles default with an additive corpus variant; only temporary path prefixes normalized.', entries }, null, 2)}\n`,
);
console.log(result.stdout, Object.keys(entries));
rmSync(root, { recursive: true, force: true });
