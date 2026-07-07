// The `project-human` wiring for the organ READMEs: read an organ's value cells
// from `src/organs/<organ>/` and render its human-view via agent-forge's
// harness-agnostic `projectHumanOrgan`. The PROJECTION LOGIC is agent-forge's; this
// step only walks agent-anatomy's value cells and wires them to it (agent-anatomy =
// agent-forge's source). Shared by the writer CLI (`project-human-cli.ts`) and the
// byte-lock gate (`test/projection-boundary.test.ts`) — one renderer, one home.

import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { type Organ, projectHumanOrgan } from '@leclabs/agent-forge/anatomy';
import { ORGAN_DOCS } from './organ-docs.js';

const here = dirname(fileURLToPath(import.meta.url));
const organsRoot = join(here, '..', 'organs');

/** Every string export of a value-cell module (its branded body ⟨α, residue⟩). */
async function valuesOf(modPath: string): Promise<string[]> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  return Object.values(mod).filter((v): v is string => typeof v === 'string');
}

/** Load an organ's value bodies from `src/organs/<organ>/*.ts`, sorted. */
export async function organValues(organ: Organ): Promise<string[]> {
  const dir = join(organsRoot, organ);
  const bodies: string[] = [];
  for await (const p of glob('*.ts', { cwd: dir })) {
    bodies.push(...(await valuesOf(join(dir, p))));
  }
  return bodies.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
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
