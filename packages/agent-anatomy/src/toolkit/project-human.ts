// The `project-human` wiring for the dimension READMEs: read a dimension's value cells
// from `src/dimensions/<dimension>/` and render its human-view via agent-forge's
// harness-agnostic `projectHumanDimension`. The PROJECTION LOGIC is agent-forge's; this
// step only walks agent-anatomy's value cells and wires them to it (agent-anatomy =
// agent-forge's source). Shared by the writer CLI (`project-human-cli.ts`) and the
// byte-lock gate (`test/projection-boundary.test.ts`) — one renderer, one home.

import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  type Dimension,
  projectHumanDimension,
} from '@leclabs/agent-forge/anatomy';
import { DIMENSION_DOCS } from './dimension-docs.js';

const here = dirname(fileURLToPath(import.meta.url));
const dimensionsRoot = join(here, '..', 'dimensions');

/** Every string export of a value-cell module (its branded body ⟨α, residue⟩). */
async function valuesOf(modPath: string): Promise<string[]> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  return Object.values(mod).filter((v): v is string => typeof v === 'string');
}

/** Load a dimension's value bodies from `src/dimensions/<dimension>/*.ts`, sorted. */
export async function fragments(dimension: Dimension): Promise<string[]> {
  const dir = join(dimensionsRoot, dimension);
  const bodies: string[] = [];
  for await (const p of glob('*.ts', { cwd: dir })) {
    bodies.push(...(await valuesOf(join(dir, p))));
  }
  return bodies.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** The canonical human-view README for a dimension (`project-human` over its cells). */
export async function renderDimensionReadme(
  dimension: Dimension,
): Promise<string> {
  const values = await fragments(dimension);
  return projectHumanDimension(dimension, values, DIMENSION_DOCS[dimension]);
}

/** The committed README path for a dimension (`src/dimensions/<dimension>/README.md`). */
export function dimensionReadmePath(dimension: Dimension): string {
  return join(dimensionsRoot, dimension, 'README.md');
}
