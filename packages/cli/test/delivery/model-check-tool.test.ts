// The model_check tool a session is offered once cratylus is installed for omp, run
// end to end: the installed extension, loaded in process with a fake omp API, runs
// the installed command over a scratch repository's domain model.
//
// The scratch test is composed from parts (`${call}(…)`), never written out: the
// model check over this repository would otherwise read it as an acceptance test.

import { mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import {
  type Host,
  host,
  success,
  toolJSON,
  toolText,
} from '../capability-port/fixture.js';
import { type Loaded, load } from './fixture.js';

let h: Host | undefined;
let session: Loaded | undefined;
afterEach(() => {
  session?.restore();
  h?.dispose();
  session = undefined;
  h = undefined;
});

function put(root: string, path: string, text: string) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

it('runs the model check over the session’s repository, its report the tool’s text', async () => {
  h = host();
  success(h.install);
  const project = h.cwd;
  put(
    project,
    'design/model/shop/context.md',
    '# shop\n\n**Subject:** what a shopper buys\n',
  );
  put(
    project,
    'design/model/shop/basket.md',
    [
      '# basket',
      '',
      'The goods a shopper has chosen to buy',
      '',
      '## Examples',
      '',
      '### adds an item',
      '',
      'Given an empty basket',
      'When the shopper adds a book',
      'Then the basket holds the book',
      '',
    ].join('\n'),
  );
  const call = 'it';
  put(
    project,
    'test/basket.test.ts',
    `${call}('shop/basket: adds an item', () => {});\n`,
  );
  session = await load(h);

  const passing = toolJSON(await session.call('model_check'));
  expect(realpathSync(passing.model)).toBe(
    join(realpathSync(project), 'design/model'),
  );
  expect(passing).toMatchObject({ passed: true, failures: [] });

  // Failing: the tool's result is an error, its text still the report.
  rmSync(join(project, 'test'), { recursive: true });
  const result = await session.call('model_check');
  expect(result.isError, toolText(result)).toBe(true);
  expect(JSON.parse(toolText(result))).toMatchObject({
    passed: false,
    failures: [
      expect.objectContaining({
        concept: 'shop/basket',
        example: 'adds an item',
      }),
    ],
  });
});
