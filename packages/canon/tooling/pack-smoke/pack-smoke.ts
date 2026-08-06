// ─────────────────────────────────────────────────────────────────────────────
// PACK SMOKE — the predicates. What a tarball must satisfy to be publishable.
//
// A PUBLISHED TARBALL IS THE ONE ARTIFACT NO TEST READS. `pnpm test` drives `src/`; the
// render oracle drives the projected corpus; the type-checker drives both. The bytes a
// consumer actually installs — the packed manifest, with pnpm's protocol rewrite applied
// and its lifecycle scripts stripped — are produced by a command nothing in the suite runs.
// And they are IRREVOCABLE: npm unpublish is a 72-hour window and then never.
//
// FOUR WAYS A GREEN SUITE STILL SHIPS A BROKEN TARBALL, each a real shape in this
// workspace rather than an imagined one:
//
//   1. A pnpm-only PROTOCOL survives the pack. `workspace:` and `catalog:` are pnpm
//      inventions and npm's resolver installs neither. pnpm rewrites them during `pack`;
//      `npm pack` does not. Locally the workspace link satisfies either, so the defect is
//      invisible until someone else installs.
//   2. A declared TARGET is not in the tarball. `files`, the `exports` map and the bundler's
//      entry list are three enumerations of one fact. forge already ships a WILDCARD subpath
//      (`./adapters/*`), which an exact-string checker is silently dark on.
//   3. A LIFECYCLE SCRIPT survives. pnpm's manifest obfuscation strips `prepack` and its
//      siblings; npm's does not. A survivor makes a consumer's own `npm pack` try to run
//      THIS repository's build — and its presence is an exact detector for "this tarball was
//      not packed by pnpm", the same evidence as (1) read off an independent field.
//   4. A LICENSE claim with no license. Every manifest here declares `"license": "MIT"`;
//      npm includes a LICENSE file automatically WHEN IT EXISTS, so `files: ["dist"]` is not
//      the cause and a glob is not the repair.
//
// PURE, AND THAT IS THE POINT. Every function takes data and returns findings. Packing,
// extraction and the `pnpm -r pack` invocation live in the CLI beside this file, so the
// gate can feed these the exact convicting shapes above without packing anything — the
// meta-gate's rule that a control must travel the SAME PATH as the thing under test,
// satisfied by there being only one path.
// ─────────────────────────────────────────────────────────────────────────────

/** A manifest as it appears INSIDE the tarball — post-rewrite, post-obfuscation. */
export interface PackedManifest {
  readonly name?: string;
  readonly version?: string;
  readonly [field: string]: unknown;
}

export type Law = 'protocol' | 'target' | 'lifecycle' | 'license';

export interface Finding {
  readonly pkg: string;
  readonly law: Law;
  /** Where the defect is, in JSON-path form — never a line number. */
  readonly at: string;
  readonly detail: string;
}

/** The publish lifecycle verbs pnpm's manifest obfuscation removes. */
const PUBLISH_LIFECYCLE = [
  'prepublish',
  'preprepare',
  'prepare',
  'postprepare',
  'prepublishOnly',
  'prepack',
  'postpack',
  'publish',
  'postpublish',
] as const;

const PNPM_ONLY_PROTOCOL = /^(workspace|catalog):/;

/**
 * Every string value in a JSON tree, with its path.
 *
 * TOTAL over the manifest rather than an enumeration of the fields this workspace happens
 * to use today. An enumeration is exactly how a checker goes dark: `resolutions`,
 * `pnpm.overrides`, or a field npm adds next year would slip past a four-map loop while
 * reading as thorough.
 */
function* strings(
  value: unknown,
  at: string,
): Generator<readonly [string, string]> {
  if (typeof value === 'string') {
    yield [at, value];
    return;
  }
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const [i, v] of value.entries()) yield* strings(v, `${at}[${i}]`);
    return;
  }
  // Bracket-quote anything that is not a bare identifier. `exports` keys are subpaths
  // like `./adapters/*`, and `$.exports../adapters/*` is not a path a reader can follow
  // back to the field — this string's only job is telling someone where to look.
  for (const [k, v] of Object.entries(value))
    yield* strings(
      v,
      /^[A-Za-z_$][\w$]*$/.test(k) ? `${at}.${k}` : `${at}["${k}"]`,
    );
}

/** Every pnpm-only protocol range anywhere in the manifest. */
export function protocolRanges(
  manifest: PackedManifest,
): ReadonlyArray<readonly [string, string]> {
  return [...strings(manifest, '$')].filter(([, v]) =>
    PNPM_ONLY_PROTOCOL.test(v),
  );
}

/** Every surviving publish-lifecycle script. */
export function lifecycleScripts(
  manifest: PackedManifest,
): ReadonlyArray<readonly [string, string]> {
  const scripts = manifest.scripts;
  if (scripts === null || typeof scripts !== 'object') return [];
  return Object.entries(scripts as Record<string, unknown>)
    .filter(
      ([k, v]) =>
        typeof v === 'string' &&
        (PUBLISH_LIFECYCLE as readonly string[]).includes(k),
    )
    .map(([k, v]) => [`$.scripts.${k}`, v as string] as const);
}

/**
 * Every FILE TARGET the manifest declares: `bin`, `main`, `module`, `types`, and every
 * relative string reachable in the `exports` tree — through any nesting of condition
 * objects, subpath keys and arrays.
 */
export function declaredTargets(
  manifest: PackedManifest,
): ReadonlyArray<readonly [string, string]> {
  const out: Array<readonly [string, string]> = [];
  for (const field of ['main', 'module', 'types', 'typings'] as const) {
    const v = manifest[field];
    if (typeof v === 'string') out.push([`$.${field}`, v]);
  }
  const bin = manifest.bin;
  if (typeof bin === 'string') out.push(['$.bin', bin]);
  else if (bin !== null && typeof bin === 'object')
    for (const [name, t] of Object.entries(bin))
      if (typeof t === 'string') out.push([`$.bin["${name}"]`, t]);
  // `exports` targets are exactly the RELATIVE strings; a bare condition name or a
  // package specifier (`"./x": "some-pkg"`) is not this package's file.
  for (const [at, v] of strings(manifest.exports, '$.exports'))
    if (v.startsWith('./')) out.push([at, v]);
  return out;
}

const escapeRe = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Does `target` resolve to at least one entry in the tarball?
 *
 * WILDCARDS ARE THE REASON THIS IS NOT `entries.includes(target)`. forge declares
 * `"./adapters/*"`, whose target is `./dist/adapters/*.js`; an exact compare finds no such
 * file and would convict a correct package, or — worse — an author would "fix" it by
 * dropping the wildcard case and the check would go dark on every subpath forge actually
 * ships.
 */
export function targetResolves(
  target: string,
  entries: readonly string[],
): boolean {
  const rel = target.replace(/^\.\//, '');
  if (!rel.includes('*')) return entries.includes(rel);
  const re = new RegExp(`^${rel.split('*').map(escapeRe).join('[^/]+')}$`);
  return entries.some((e) => re.test(e));
}

/** A packed package: its manifest and the paths it contains, both relative to the root. */
export interface Packed {
  readonly pkg: string;
  readonly manifest: PackedManifest;
  readonly entries: readonly string[];
}

/** Every finding, over every packed package. */
export function findings(packed: readonly Packed[]): Finding[] {
  const out: Finding[] = [];
  for (const { pkg, manifest, entries } of packed) {
    for (const [at, range] of protocolRanges(manifest))
      out.push({
        pkg,
        law: 'protocol',
        at,
        detail: `${range} — a pnpm-only protocol npm cannot install`,
      });
    for (const [at, script] of lifecycleScripts(manifest))
      out.push({
        pkg,
        law: 'lifecycle',
        at,
        detail: `${script} — survived the pack, so this was not packed by pnpm`,
      });
    for (const [at, target] of declaredTargets(manifest))
      if (!targetResolves(target, entries))
        out.push({
          pkg,
          law: 'target',
          at,
          detail: `${target} — declared but absent from the tarball`,
        });
    if (
      typeof manifest.license === 'string' &&
      !entries.some((e) => /^LICEN[CS]E(\.\w+)?$/i.test(e))
    )
      out.push({
        pkg,
        law: 'license',
        at: '$.license',
        detail: `${manifest.license} — declared with no LICENSE file in the tarball`,
      });
  }
  return out;
}

/** One line per finding, for a human reading a failed job. */
export function report(fs: readonly Finding[]): string {
  return fs
    .map((f) => `PACK ${f.pkg} [${f.law}] ${f.at}: ${f.detail}`)
    .join('\n');
}
