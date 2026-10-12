import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import type { Fixture } from '../../agent-launch/fixture.js';
import type { LoadedExtension } from '../../reconstitution/binding/fixture.js';
import {
  allowedChange,
  architect,
  assertGate,
  checkFolder,
  checkPath,
  context,
  define,
  editPath,
  examplePath,
  freezeChecks,
  integrate,
  ok,
  open,
  outsiders,
  paths,
  phase,
  query,
  refusedChange,
  session,
  setup,
  snapshot,
} from './fixture.js';

let f: Fixture;
let extension: LoadedExtension | undefined;
afterEach(() => {
  extension?.restore();
  extension = undefined;
  f?.dispose();
});

it('F-timing: held-out check frozen only once seen red, examples frozen from open', async () => {
  f = setup();
  const heldOutCheckPath =
    'design/judgment/library/renewal/checks/held-out.test.ts';
  const heldOutTextPath = 'design/judgment/library/renewal.md';
  mkdirSync(join(f.cwd, 'design/judgment/library/renewal/checks/'), {
    recursive: true,
  });
  writeFileSync(join(f.cwd, heldOutCheckPath), '// check');
  writeFileSync(join(f.cwd, heldOutTextPath), '# judgment');

  extension = await session(f, 'check-writer');

  // Cut is open, held-out example text should be frozen from open
  await editPath(f, extension, heldOutTextPath, true);

  // Check in judgment folder should NOT be frozen yet
  await editPath(f, extension, heldOutCheckPath, false);

  // Assert frozen state agrees
  const stateOpen = query(f, 'workPackage', 'frozen');
  expect(stateOpen.cuts[0].checks).not.toContain(heldOutCheckPath);

  // Freeze checks
  freezeChecks(f);

  // Now checks in judgment folder should be frozen
  await editPath(f, extension, heldOutCheckPath, true);

  // Same for other outsiders
  extension.restore();
  extension = await session(f, 'assayer');
  await editPath(f, extension, heldOutCheckPath, true);

  // Architect can edit
  extension.restore();
  extension = await session(f, architect);
  await editPath(f, extension, heldOutCheckPath, false);

  // Assert frozen state agrees
  const stateFrozen = query(f, 'workPackage', 'frozen');
  expect(stateFrozen.cuts[0].checks).toContain(heldOutCheckPath);
});

it('F-route: structural edit and all tool routes refuse frozen path edits', async () => {
  f = setup();
  freezeChecks(f);

  extension = await session(f, 'lead', 'sub');

  // Write route is covered in structural.test.ts
  // ast_edit route
  await editPath(f, extension, examplePath, true, 'ast_edit');
  await editPath(f, extension, checkPath, true, 'ast_edit');

  // Also any other tool that names a file in its arguments
  await editPath(f, extension, examplePath, true, 'unknown_tool');

  extension.restore();
  extension = await session(f, architect, 'main');

  // Architect can edit
  await editPath(f, extension, examplePath, false, 'ast_edit');
  await editPath(f, extension, checkPath, false, 'ast_edit');
});
