import {
  cpSync,
  existsSync,
  lstatSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import type { Host } from '../../../../packages/cli/test/capability-port/fixture.js';
import {
  assertRemoved,
  earlier,
  fresh,
  install,
  load,
  owned,
  put,
  skew,
  success,
  toolJSON,
  traceCommand,
  tree,
  uninstall,
  version,
  versions,
} from '../../../../packages/cli/test/delivery/fixture.js';
import { assertReplacement, corpus } from './fixture.js';
let h: Host | undefined;
afterEach(() => {
  h?.dispose();
  h = undefined;
});

it('delivery/1 — newer artifacts still warn about an older reached command, never select another available build', async () => {
  h = fresh();
  version(h, '3.1.0');
  success(install(h));
  const available = join(h.root, 'available');
  cpSync(h.prefix, available, { recursive: true, verbatimSymlinks: true });
  h.env.PATH += `:${available}/node_modules/.bin`;
  version(h, '3.0.0');
  const before = tree(h.home);
  const calls = traceCommand(h);
  const ext = await load(h);
  try {
    await ext.start();
    skew(ext.notifications, '3.1.0', '3.0.0');
    expect(await versions(ext)).toMatchObject({
      artifacts: '3.1.0',
      command: '3.0.0',
    });
    expect(tree(h.home)).toEqual(before);
    expect(calls().every((c) => c.version === '3.0.0')).toBe(true);
  } finally {
    ext.restore();
  }
});

it('delivery/2 — two changing upgrades followed by uninstall leave no generation of material or references and keep the host extension', () => {
  h = fresh();
  earlier(h);
  const host = join(h.home, '.omp/agent/extensions/mira.ts');
  put(host, 'export default function mira() {}\n');
  corpus(h, 'middle');
  version(h, '2.5.0');
  success(install(h));
  expect(existsSync(join(owned(h), 'agents/middle-agent.md'))).toBe(true);
  expect(existsSync(join(owned(h), 'skills/middle-skill/SKILL.md'))).toBe(true);
  corpus(h, 'latest');
  version(h, '2.6.0');
  success(install(h));
  expect(existsSync(join(owned(h), 'agents/latest-agent.md'))).toBe(true);
  expect(existsSync(join(owned(h), 'skills/latest-skill/SKILL.md'))).toBe(true);
  success(uninstall(h));
  assertRemoved(h);
  expect(JSON.stringify(tree(h.home))).not.toMatch(
    /obsolete-agent|obsolete-skill|middle-agent|middle-skill|latest-agent|latest-skill/,
  );
  expect(readFileSync(host, 'utf8')).toBe(
    'export default function mira() {}\n',
  );
});

it('delivery/3 — uninstall preserves a host replacement reference and its outside target while removing remaining root references', () => {
  h = fresh();
  success(install(h));
  const entries = Object.entries(tree(h.home));
  const reference =
    entries.find(
      ([path, item]) =>
        !path.startsWith('.cratylus/omp/') &&
        item.link &&
        (path.includes('skill') || item.link.includes('/skills/')),
    ) ??
    entries.find(
      ([path, item]) =>
        !path.startsWith('.cratylus/omp/') &&
        item.link?.includes('.cratylus/omp'),
    );
  const own = join(h.home, 'mira/skills');
  put(
    join(own, 'replacement/SKILL.md'),
    '---\nname: replacement\ndescription: Mira skill\n---\nHost skill.\n',
  );
  let replacement: string;
  if (reference) {
    replacement = join(h.home, reference[0]);
    rmSync(replacement, {
      recursive: lstatSync(replacement).isDirectory(),
      force: true,
    });
    symlinkSync(
      reference[0].endsWith('SKILL.md')
        ? join(own, 'replacement/SKILL.md')
        : own,
      replacement,
    );
  } else {
    // Config-backed reference: replace only the root path value, preserving all
    // unrelated settings. This deliberately does not prescribe a symlink layout.
    const configured = entries.find(
      ([path, item]) =>
        !path.startsWith('.cratylus/omp/') &&
        item.text?.includes('.cratylus/omp'),
    );
    expect(configured, 'install placed a replaceable reference').toBeDefined();
    replacement = join(h.home, configured![0]);
    const referenceText = configured![1].text!.match(
      /[^\s"'`=;()[\]{}<>]*\.cratylus\/omp[^\s"'`;,()[\]{}<>]*/,
    )?.[0];
    expect(referenceText).toBeDefined();
    put(replacement, configured![1].text!.replace(referenceText!, own));
  }
  const before = tree(h.home)[replacement.slice(h.home.length + 1)];
  const targetBefore = tree(own);
  success(uninstall(h));
  assertRemoved(h);
  assertReplacement(tree(h.home)[replacement.slice(h.home.length + 1)], before);
  expect(tree(own)).toEqual(targetBefore);
});

it('delivery/4 — the same session reports and calls a replaced command rather than caching its startup version or runtime', async () => {
  h = fresh();
  success(install(h));
  h.seed();
  const calls = traceCommand(h);
  const ext = await load(h);
  try {
    await ext.start();
    expect(await versions(ext)).toMatchObject({
      artifacts: '2.4.0',
      command: '2.4.0',
    });
    version(h, '2.5.0');
    const before = calls().length;
    expect(await versions(ext)).toMatchObject({
      artifacts: '2.4.0',
      command: '2.5.0',
    });
    const result = toolJSON(
      await ext.call('concept_journal', { verb: 'state' }),
    );
    expect(result).toEqual(h.concepts('state'));
    const reached = calls()
      .slice(before)
      .filter((c) => c.args[0] === 'concepts' && c.args[1] === 'state');
    expect(reached.length).toBeGreaterThan(0);
    expect(reached.every((c) => c.version === '2.5.0')).toBe(true);
  } finally {
    ext.restore();
  }
});
