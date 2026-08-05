// ─────────────────────────────────────────────────────────────────────────────
// Scaffold + edit `agents.config.ts` — the write side of the two scaffold verbs.
//
// `scaffoldAgentsConfig` writes the ZERO-CONFIG default: `extends: [canon]`
// (the canon default plugin) + empty `patches`. `addPlugin` WIRES a plugin into
// `extends` by editing the config SOURCE (config is code — the edit adds a real
// `import` + appends the binding to the `extends` array). Both operate on the
// canonical scaffold shape; `addPlugin` refuses LOUDLY on an unrecognized shape
// rather than corrupting a hand-restructured config.
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/** The config-is-code home filename. */
export const CONFIG_FILE = 'agents.config.ts';

/** The canon default plugin package — the zero-config `extends` member. */
export const CANON_PACKAGE = '@cratylus/canon';

/** The zero-config scaffold: canon through the resolver with empty patches. */
export const SCAFFOLD_SOURCE = `import { defineAgentsConfig } from '@cratylus/forge/config';
import canon from '${CANON_PACKAGE}';

// forge — config is code. This is the SINGLE config home.
// \`extends\` are REAL imports: type-checked, IDE-complete, no build step.
// Zero-config default = the canon plugin through the resolver, empty patches.
// Wire more plugins with \`forge add <package>\`.
export default defineAgentsConfig({
  extends: [canon],
  patches: [],
});
`;

export interface ScaffoldResult {
  readonly path: string;
  /** false when a config already existed (left untouched — idempotent). */
  readonly created: boolean;
}

/** Write `<cwd>/agents.config.ts` if absent (idempotent — never clobbers). */
export async function scaffoldAgentsConfig(
  cwd: string,
): Promise<ScaffoldResult> {
  const path = join(cwd, CONFIG_FILE);
  if (existsSync(path)) {
    return { path, created: false };
  }
  await writeFile(path, SCAFFOLD_SOURCE, 'utf8');
  return { path, created: true };
}

/** A malformed / unrecognized `agents.config.ts` that `addPlugin` cannot edit safely. */
export class ConfigEditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigEditError';
  }
}

/**
 * Derive a safe JS identifier from a package specifier: drop the npm scope, take
 * the final path segment, camel-case the dash/underscore/dot separators, and
 * prefix `_` if it would start with a digit. `@acme/agent-x` → `agentX`.
 */
export function identForPackage(pkg: string): string {
  const bare =
    pkg
      .replace(/^@[^/]+\//, '')
      .split('/')
      .pop() ?? pkg;
  const camel = bare
    .replace(/[-_.]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/[^A-Za-z0-9_$]/g, '');
  return /^[0-9]/.test(camel) ? `_${camel}` : camel || '_plugin';
}

export interface AddResult {
  readonly path: string;
  readonly ident: string;
  /** false when the package was already in `extends` (idempotent — no rewrite). */
  readonly changed: boolean;
}

/**
 * Wire `pkg` into `<cwd>/agents.config.ts`'s `extends`: insert a default `import`
 * for it and append its binding to the `extends` array. Idempotent (a package
 * already imported + extended is a no-op). Refuses loudly if the config is absent
 * (run `init` first) or its `extends: [ … ]` array cannot be located.
 */
export async function addPlugin(cwd: string, pkg: string): Promise<AddResult> {
  const path = join(cwd, CONFIG_FILE);
  if (!existsSync(path)) {
    throw new ConfigEditError(
      `${path}: no agents.config.ts — run \`forge init\` first`,
    );
  }
  let src = await readFile(path, 'utf8');
  const ident = identForPackage(pkg);

  // Already wired? (import from the same package present) → idempotent no-op.
  const importRe = new RegExp(
    `^import\\s+\\w+\\s+from\\s+['"]${escapeRegExp(pkg)}['"];?\\s*$`,
    'm',
  );
  if (importRe.test(src)) {
    return { path, ident, changed: false };
  }

  // Insert the import after the LAST top-level `import … from '…';` line.
  const importLine = `import ${ident} from '${pkg}';`;
  const lastImport = [...src.matchAll(/^import\s.*?;$/gm)].pop();
  if (!lastImport || lastImport.index === undefined) {
    throw new ConfigEditError(
      `${path}: no import lines found — is this a scaffolded agents.config.ts?`,
    );
  }
  const insertAt = lastImport.index + lastImport[0].length;
  src = `${src.slice(0, insertAt)}\n${importLine}${src.slice(insertAt)}`;

  // Append the binding into `extends: [ … ]` (first `]` after `extends:`).
  const extendsRe = /extends:\s*\[([^\]]*)\]/;
  const m = extendsRe.exec(src);
  if (!m) {
    throw new ConfigEditError(
      `${path}: could not locate an \`extends: [ … ]\` array to append to`,
    );
  }
  const inner = (m[1] ?? '').trim();
  const nextInner = inner ? `${inner.replace(/,\s*$/, '')}, ${ident}` : ident;
  src = src.replace(extendsRe, `extends: [${nextInner}]`);

  await writeFile(path, src, 'utf8');
  return { path, ident, changed: true };
}

/** Escape a string for literal use inside a `RegExp`. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
