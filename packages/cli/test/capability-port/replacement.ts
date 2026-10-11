// A deliberately distinguishable NEW runtime package, installed by npm. This is
// a test double for a future release, not an adapter double: every original
// journal act still runs, while its observable JSON carries the release marker.
import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { type Host, run, success } from './fixture.js';

export function replaceRuntime(h: Host, explanation?: unknown) {
  const work = join(
    h.root,
    `replacement-${explanation ? 'explanation' : 'behavior'}`,
  );
  mkdirSync(work);
  const packed: string[] = [];
  for (const name of ['@cratylus/runtime', 'cratylus']) {
    const directory = join(work, name.replace('/', '-'));
    cpSync(join(h.prefix, 'node_modules', name), directory, {
      recursive: true,
    });
    const manifestPath = join(directory, 'package.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.version = '999.0.0-cut6';
    manifest.scripts = undefined;
    if (name === 'cratylus')
      manifest.dependencies['@cratylus/runtime'] = '999.0.0-cut6';
    else {
      const entrypoints = new Set<string>();
      function collect(value: unknown) {
        if (typeof value === 'string' && /\.m?js$/.test(value))
          entrypoints.add(value);
        else if (value && typeof value === 'object')
          for (const child of Object.values(value)) collect(child);
      }
      collect(manifest.exports);
      const patch = `\nconst cut6Key = Symbol.for('cut6.package.replacement');
if (!globalThis[cut6Key]) {
  globalThis[cut6Key] = true;
  const original = process.stdout.write.bind(process.stdout);
  process.stdout.write = function(chunk, ...args) {
    // Only the journal changes in this stand-in release; other capabilities pass through.
    if (process.argv[2] !== 'concepts') return original(chunk, ...args);
    let data;
    try { data = JSON.parse(String(chunk)); } catch { return original(chunk, ...args); }
    if (process.argv.includes('--explain')) {
      const explanation = ${JSON.stringify(explanation ?? null)};
      if (explanation) {
        const verb = process.argv[process.argv.indexOf('concepts') + 1];
        data = verb === '--explain' ? explanation : explanation.verbs.find(v => v.name === verb);
      }
    } else data = { ...data, cut6Runtime: 'newer-installed-package' };
    return original(JSON.stringify(data) + '\\n', ...args);
  };
}\n`;
      for (const entry of entrypoints) {
        const file = join(directory, entry);
        writeFileSync(file, readFileSync(file, 'utf8') + patch);
      }
    }
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    success(
      run(
        'pnpm',
        [
          '--ignore-scripts',
          '--ignore-workspace',
          'pack',
          '--pack-destination',
          work,
        ],
        directory,
      ),
    );
  }
  packed.push(
    ...readdirSync(work)
      .filter((f) => f.endsWith('.tgz'))
      .map((f) => join(work, f)),
  );
  success(
    run(
      'npm',
      [
        'install',
        '--prefix',
        h.prefix,
        '--prefer-offline',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        ...packed,
      ],
      h.root,
      process.env,
      180_000,
    ),
  );
}
