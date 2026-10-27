// The tools a session is offered once cratylus is installed for omp: the installed
// extension is loaded in process with a fake omp API, never by starting omp.

import { afterEach, expect, it } from 'vitest';
import { type Host, host, success } from '../capability-port/fixture.js';
import { type Loaded, load } from './fixture.js';

let h: Host | undefined;
let session: Loaded | undefined;
afterEach(() => {
  session?.restore();
  h?.dispose();
  session = undefined;
  h = undefined;
});

it('delivery/capability: the tools cratylus adds', async () => {
  h = host();
  success(h.install);
  session = await load(h);
  expect(session.tools.map((t) => t.name).sort()).toEqual([
    'model_check',
    'version_skew',
  ]);
});
