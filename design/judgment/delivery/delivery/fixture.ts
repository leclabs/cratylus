import { existsSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from 'vitest';
import type { Host } from '../../../../packages/cli/test/capability-port/fixture.js';
import { put } from '../../../../packages/cli/test/delivery/fixture.js';
export function corpus(h: Host, name: string) {
  const modules = join(h.cwd, 'node_modules');
  if (!existsSync(modules))
    symlinkSync(join(h.prefix, 'node_modules'), modules, 'dir');
  put(join(h.cwd, 'package.json'), '{"type":"module"}');
  put(
    join(h.cwd, `agents-${name}/${name}.ts`),
    `import {holder,builderRole} from '@cratylus/canon'; export const agent={...holder(builderRole),name:'${name}-agent',description:'Independent corpus variant'};`,
  );
  put(
    join(h.cwd, `skills-${name}/${name}-skill/skill.ts`),
    `export const skill={name:'${name}-skill',description:'Independent corpus variant',formalBlock:'${name} content',composition:()=>[]};`,
  );
  put(
    join(h.cwd, 'cratylus.config.ts'),
    `import canon from '@cratylus/canon'; export default {extends:[canon,{name:'${name}',agents:'./agents-${name}',skills:'./skills-${name}',practices:[{name:'${name}',description:'Corpus variant',preselected:true,agents:['${name}-agent'],skills:['${name}-skill']}]}],patches:[]};`,
  );
}
export function assertReplacement(actual: unknown, before: unknown) {
  expect(actual, 'host replacement survives uninstall').toEqual(before);
}
