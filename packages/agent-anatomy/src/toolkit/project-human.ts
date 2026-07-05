// The `project-human` wiring for the organ READMEs: read an organ's value cells
// from `src/organs/<organ>/` and render its human-view via agent-forge's
// harness-agnostic `projectHumanOrgan`. The PROJECTION LOGIC is agent-forge's; this
// step only walks agent-anatomy's value cells and wires them to it (agent-anatomy =
// agent-forge's source). Shared by the writer CLI (`project-human-cli.ts`) and the
// byte-lock gate (`test/projection-boundary.test.ts`) — one renderer, one home.

import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  type Fragment,
  type Organ,
  projectHumanOrgan,
} from '@leclabs/agent-forge/anatomy';
import { ORGAN_DOCS } from './organ-docs.js';

const here = dirname(fileURLToPath(import.meta.url));
const organsRoot = join(here, '..', 'organs');

/** The first non-default export of a value-cell module (its `Fragment`). */
async function fragmentOf(modPath: string): Promise<Fragment> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const key = Object.keys(mod).find((k) => k !== 'default');
  return mod[key as string] as Fragment;
}

/** Load an organ's value cells from `src/organs/<organ>/*.ts`, slug-sorted. */
export async function organValues(organ: Organ): Promise<Fragment[]> {
  const dir = join(organsRoot, organ);
  const frags: Fragment[] = [];
  for await (const p of glob('*.ts', { cwd: dir })) {
    frags.push(await fragmentOf(join(dir, p)));
  }
  return frags.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
}

/** The canonical human-view README for an organ (`project-human` over its cells). */
export async function renderOrganReadme(organ: Organ): Promise<string> {
  const values = await organValues(organ);
  return projectHumanOrgan(organ, values, ORGAN_DOCS[organ]);
}

/** The committed README path for an organ (`src/organs/<organ>/README.md`). */
export function organReadmePath(organ: Organ): string {
  return join(organsRoot, organ, 'README.md');
}
