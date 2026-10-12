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

  // Assert frozen state agrees (check is not listed as frozen, text is)
  let state = query(f, 'workPackage', 'frozen');
  expect(
    state.cuts[0].checks.some(
      (p: string) =>
        p === heldOutCheckPath ||
        (p.endsWith('/') && heldOutCheckPath.startsWith(p)),
    ),
  ).toBe(false);
  expect(
    state.cuts[0].examples.some(
      (p: string) =>
        p === heldOutTextPath ||
        (p.endsWith('/') && heldOutTextPath.startsWith(p)),
    ),
  ).toBe(true);

  // Freeze checks
  freezeChecks(f);

  // Now checks in judgment folder should be frozen
  await editPath(f, extension, heldOutCheckPath, true);

  // Same for other outsiders
  for (const role of ['assayer', 'lead', 'builder']) {
    extension.restore();
    extension = await session(f, role);
    await editPath(f, extension, heldOutCheckPath, true);
  }

  // Architect can edit
  extension.restore();
  extension = await session(f, architect);
  await editPath(f, extension, heldOutCheckPath, false);

  // Assert frozen state agrees (check is listed as frozen)
  state = query(f, 'workPackage', 'frozen');
  expect(
    state.cuts[0].checks.some(
      (p: string) =>
        p === heldOutCheckPath ||
        (p.endsWith('/') && heldOutCheckPath.startsWith(p)),
    ),
  ).toBe(true);
});

it('F-route: structural edit and all tool routes refuse frozen path edits', async () => {
  f = setup();
  freezeChecks(f);

  extension = await session(f, 'lead', 'sub');

  // Write route is covered in structural.test.ts

  // Create an unfrozen file for the ast_edit test
  const unfrozenPath = 'design/unfrozen.md';
  writeFileSync(join(f.cwd, unfrozenPath), 'unfrozen');

  // ast_edit route
  await editAstPath(f, extension, examplePath, true, [examplePath]);
  await editAstPath(f, extension, checkPath, true, [checkPath]);
  await editAstPath(f, extension, checkPath, true, [checkPath, unfrozenPath]);
  await editAstPath(f, extension, unfrozenPath, false, [unfrozenPath]);

  // lsp route
  await editLspPath(f, extension, examplePath, true, 'rename');
  await editLspPath(f, extension, checkPath, true, 'rename_file');
  await editLspPath(f, extension, checkPath, true, 'code_actions', true);

  // Non-mutating code actions and reads are allowed
  await editLspPath(f, extension, checkPath, false, 'code_actions', false);
  await editLspPath(f, extension, checkPath, false, 'hover');
  await editLspPath(f, extension, checkPath, false, 'diagnostics');
  await readPath(f, extension, checkPath, false);

  extension.restore();
  extension = await session(f, architect, 'main');

  // Architect can edit
  await editAstPath(f, extension, examplePath, false, [examplePath]);
  await editAstPath(f, extension, checkPath, false, [checkPath]);
  await editLspPath(f, extension, checkPath, false, 'rename');
  await editLspPath(f, extension, checkPath, false, 'rename_file');
});

async function editAstPath(
  f: Fixture,
  extension: LoadedExtension,
  path: string,
  blocked: boolean,
  pathsList: string[],
) {
  const answer = await extension.fire('tool_call', {
    type: 'tool_call',
    toolName: 'write',
    toolCallId: `ast-${path}`,
    input: {
      path: 'xd://ast_edit',
      content: JSON.stringify({ paths: pathsList, ops: [] }),
    },
  });
  assertGate(answer, blocked);
}

async function editLspPath(
  f: Fixture,
  extension: LoadedExtension,
  path: string,
  blocked: boolean,
  action: string,
  apply?: boolean,
) {
  const answer = await extension.fire('tool_call', {
    type: 'tool_call',
    toolName: 'write',
    toolCallId: `lsp-${path}`,
    input: {
      path: 'xd://lsp',
      content: JSON.stringify({ file: path, action, apply }),
    },
  });
  assertGate(answer, blocked);
}

async function readPath(
  f: Fixture,
  extension: LoadedExtension,
  path: string,
  blocked: boolean,
) {
  const answer = await extension.fire('tool_call', {
    type: 'tool_call',
    toolName: 'read',
    toolCallId: `read-${path}`,
    input: {
      path: path,
    },
  });
  assertGate(answer, blocked);
}
