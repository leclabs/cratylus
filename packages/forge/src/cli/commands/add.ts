// `cratylus add <package>` — wire a plugin into `cratylus.config.ts`'s `extends`.
//
// Config is code, so `add` edits the config SOURCE: it inserts a real `import` for
// the package and appends its binding to the `extends` array (idempotent). The
// npm INSTALL is left out-of-band (printed as the next step, not run) so `add`
// stays hermetic + deterministic — including the pre-publish `file:`-link
// workflow: `npm i <package>@file:../<local-plugin>` then `cratylus compose`
// to inspect the locally-linked plugin's contribution before it ships.

import { CLI_BIN } from '../../bin-name.js';
import { addPlugin } from '../../config/index.js';
import { fail, say } from '../style.js';

export interface AddOpts {
  plugin: string;
  cwd?: string;
}

export async function runAdd(opts: AddOpts): Promise<number> {
  const cwd = opts.cwd ?? process.cwd();
  let result: Awaited<ReturnType<typeof addPlugin>>;
  try {
    result = await addPlugin(cwd, opts.plugin);
  } catch (e) {
    fail('add', (e as Error).message);
    return 1;
  }

  if (!result.changed) {
    say(`'${opts.plugin}' is already in extends; ${result.path} unchanged`);
    return 0;
  }

  say(
    `wired '${opts.plugin}' (as \`${result.ident}\`) into extends in ${result.path}`,
  );
  // Install is the caller's next step (kept out-of-band; also the file:-link path).
  say(
    `next: npm i ${opts.plugin} (or npm i ${opts.plugin}@file:../<local> to link a pre-publish plugin), then ${CLI_BIN} compose`,
  );
  return 0;
}
