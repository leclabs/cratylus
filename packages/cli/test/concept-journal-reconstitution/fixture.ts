import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';

export const here = dirname(fileURLToPath(import.meta.url));
export const bin = resolve(here, '../../dist/cratylus.js');
export const reservation = {
  context: 'booking',
  name: 'reservation expiry',
  old: 'Reservations expire after ten minutes.',
  current: 'Reservations expire after fifteen minutes.',
  reason: 'Customers need time to complete the payment challenge.',
  summary:
    'We are designing booking. Reservations expire after ten minutes. The deposit decision (deposit) is open. The reminder decision (reminder) is also open. Continue the conceptual design next.',
};
export function run(cwd: string, command: string, args: string[]) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    timeout: 30_000,
  });
  if (result.error) throw result.error;
  return result;
}
export function snapshot(cwd: string): Record<string, string> {
  const root = join(cwd, 'design/journal');
  const files: Record<string, string> = {};
  function visit(dir: string, prefix: string) {
    for (const item of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const name = prefix + item.name;
      if (item.isDirectory()) visit(join(dir, item.name), `${name}/`);
      else files[name] = readFileSync(join(dir, item.name)).toString('base64');
    }
  }
  if (existsSync(root)) visit(root, '');
  return files;
}
export function repository() {
  const cwd = mkdtempSync(join(tmpdir(), 'concept-reconstitution-'));
  try {
    for (const args of [
      ['init', '-q'],
      ['config', 'user.name', 'Journal check'],
      ['config', 'user.email', 'journal-check@example.invalid'],
    ])
      expect(run(cwd, 'git', args).status).toBe(0);
    mkdirSync(join(cwd, 'node_modules/.bin'), { recursive: true });
    writeFileSync(
      join(cwd, 'package.json'),
      JSON.stringify({ name: 'journal-fixture', private: true }),
    );
    // A real pnpm bin wrapper: Node executes the already-built repository bin.
    writeFileSync(
      join(cwd, 'node_modules/.bin/cratylus'),
      `#!/bin/sh\nexec ${JSON.stringify(process.execPath)} ${JSON.stringify(bin)} "$@"\n`,
      { mode: 0o755 },
    );
    const help = run(cwd, 'pnpm', ['cratylus', '--help']);
    expect(help.status, help.stderr).toBe(0);
    expect(help.stdout).toContain('cratylus');
    return {
      cwd,
      dispose: () => rmSync(cwd, { recursive: true, force: true }),
    };
  } catch (error) {
    rmSync(cwd, { recursive: true, force: true });
    throw error;
  }
}
export function append(cwd: string, ...args: string[]) {
  const before = snapshot(cwd);
  const result = run(cwd, process.execPath, [bin, 'concepts', ...args]);
  if (result.status !== 0)
    expect(
      snapshot(cwd),
      'refusal must leave every journal byte unchanged',
    ).toEqual(before);
  expect(
    result.status,
    `Missing fixture operation: concepts ${args[0]}\n${result.stderr}`,
  ).toBe(0);
  const entry = JSON.parse(result.stdout);
  expect(entry).toBeTypeOf('object');
  const after = snapshot(cwd);
  for (const [path, bytes] of Object.entries(before))
    expect(after[path]).toBe(bytes);
  expect(Object.keys(after).length).toBe(Object.keys(before).length + 1);
  return entry;
}
export function state(cwd: string) {
  const before = snapshot(cwd);
  const result = run(cwd, 'pnpm', ['cratylus', 'concepts', 'state']);
  expect(snapshot(cwd)).toEqual(before);
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout);
}
export function seedReservations(cwd: string) {
  append(
    cwd,
    'context',
    reservation.context,
    '--subject',
    'Booking reservations and payment.',
  );
  append(
    cwd,
    'define',
    reservation.name,
    '--context',
    reservation.context,
    '--wording',
    reservation.old,
    '--reason',
    'Initial checkout window.',
  );
  append(
    cwd,
    'supersede',
    reservation.name,
    '--context',
    reservation.context,
    '--wording',
    reservation.current,
    '--reason',
    reservation.reason,
  );
  const decisions = [
    {
      id: 'deposit',
      title: 'Deposit',
      situation: 'A booking can be abandoned.',
      decision: 'Collect a refundable deposit.',
      consequences: 'Refunds must be supported.',
    },
    {
      id: 'reminder',
      title: 'Reminder',
      situation: 'A reservation can expire unnoticed.',
      decision: 'Send a reminder before expiry.',
      consequences: 'A reminder channel would be needed.',
    },
  ];
  for (const d of decisions)
    append(
      cwd,
      'decide',
      d.id,
      '--context',
      reservation.context,
      '--title',
      d.title,
      '--situation',
      d.situation,
      '--decision',
      d.decision,
      '--consequences',
      d.consequences,
      '--status',
      'open',
    );
  append(
    cwd,
    'accept',
    'deposit',
    '--reason',
    'The operator approved refundable deposits.',
  );
  const current = state(cwd);
  expect(current).toMatchObject({
    contexts: [
      {
        name: reservation.context,
        subject: 'Booking reservations and payment.',
        relation: '',
        concepts: [
          {
            name: reservation.name,
            wording: reservation.current,
            builtFrom: [],
            reason: reservation.reason,
          },
        ],
        competing: [],
        retired: [],
        decisions: {
          accepted: [
            {
              ...decisions[0],
              context: reservation.context,
              status: 'accepted',
              supersedes: null,
              supersededBy: [],
            },
          ],
          open: [
            {
              ...decisions[1],
              context: reservation.context,
              status: 'open',
              supersedes: null,
              supersededBy: [],
            },
          ],
        },
      },
    ],
  });
  return current;
}
