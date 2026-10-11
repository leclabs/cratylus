// ─────────────────────────────────────────────────────────────────────────────
// THE OWNED ROOT — everything cratylus places for one user on one harness, under one
// directory it owns: `<home>/.cratylus/<harness>/`.
//
// What lives there is cratylus's by CONSTRUCTION, never inferred from a name, a
// content or a digest: the root is cratylus's alone, so an install replaces it whole
// and an uninstall removes it whole, and a change the host makes inside it is not kept.
// For omp the root is an extension package, laid out as omp reads one:
//
//   agents/<name>.md        the corpus's agent declarations
//   skills/<name>/…         the corpus's skills
//   extensions/<module>.ts  the harness's adapters (the capability tools, the session
//                           hooks, the dispatch isolation)
//   hooks/<id>/<worker>     the workers the session hooks run
//   package.json            the package: its name, the VERSION of cratylus that
//                           projected it, and the modules omp loads (`omp.extensions`)
//   runtime.json            each capability's configuration, where the corpus has any
//   installation.json       what install did outside the root: the references it
//                           placed; the practices it installed; and which of the
//                           operator's choices it has been answered, never their
//                           values, which are the host's own settings
//
// THE HARNESS'S OWN SURFACES ONLY REFER INTO IT. omp loads an extension package for
// every project of a user from its plugin directory (`~/.omp/plugins`), as `omp plugin
// link` places one: a link `node_modules/<package>` → the root, and the package's
// dependency entry in the directory's `package.json`. Those are the references, and
// the record names each, so an uninstall removes exactly them.
// ─────────────────────────────────────────────────────────────────────────────

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  renameSync,
  rmSync,
  rmdirSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  INSTALLATIONS_DIR,
  RUNTIME_CONFIG_FILE,
} from '@cratylus/runtime/runtime-config';
import { CLI_BIN } from '../bin-name.js';
import {
  ENFORCING_STAGE_DIR,
  type HarnessAdapter,
} from '../core/harness-adapter.js';
import { settingsJson } from './settings-json.js';
import type { RenderTree } from './types.js';

/** One file of a render tree, or of the root: its path, its bytes, and whether it is
 *  executable. */
export interface RenderedFile {
  readonly path: string;
  readonly content: string;
  readonly executable?: boolean;
  /** Set on a scoped artifact that is a module the harness loads: the package names
   *  it among its extensions. */
  readonly module?: true;
}

/** The record of what install did outside the root, kept inside it. */
export const INSTALLATION_RECORD = 'installation.json';

/** The package manifest the harness reads the root as a package by. */
const PACKAGE_MANIFEST = 'package.json';

/** A reference the harness's own surfaces hold into the root, by its path relative to
 *  the harness's home: a link to the root, or a dependency entry naming it in a
 *  package manifest (`created` where install made that manifest). */
export type OwnedReference =
  | { readonly kind: 'link'; readonly path: string }
  | {
      readonly kind: 'dependency';
      readonly path: string;
      readonly name: string;
      readonly created: boolean;
    };

/** An operator's choice install asks for and writes as the host's own setting:
 *  whether the status line shows the session's agent. */
export type OperatorChoice = 'agentStatus';

/** What install did outside the root, and the practices it installed. */
export interface InstallationRecord {
  /** The practices installed, in the corpus's order; absent where the corpus
   *  declares none. */
  readonly practices?: readonly string[];
  readonly references: readonly OwnedReference[];
  /** The operator's choices install has been answered, by flag or question: each
   *  answer is the host's own setting from then on, so no later install asks for it
   *  or applies it again. Absent where none has been. */
  readonly answered?: readonly OperatorChoice[];
}

/** The owned root of `adapter`'s harness under `home` (the process's home when none
 *  is given): `<home>/.<bin>/<harness>`. */
export function ownedRootIn(
  adapter: Pick<HarnessAdapter, 'name'>,
  home?: string | null,
): string {
  return join(
    home ? resolve(home) : homedir(),
    INSTALLATIONS_DIR,
    adapter.name,
  );
}

/** The package name the root is referred to by: `<bin>-<harness>`. */
function packageName(adapter: Pick<HarnessAdapter, 'name'>): string {
  return `${CLI_BIN}-${adapter.name}`;
}

/** The record in `root`, or `null` where nothing is installed there. */
export function readInstallationRecord(
  root: string,
): InstallationRecord | null {
  const file = join(root, INSTALLATION_RECORD);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf8')) as InstallationRecord;
}

/**
 * The render tree's files as they land in the root, sorted by path: each agent where
 * the adapter puts it (`agentRel`), each skill's files under each of its destinations
 * (`skillRel`), each scoped artifact where the adapter puts its scope (`scopedRel`),
 * and every other file (hook workers, capability prose) at its own path.
 */
export function rootFiles(
  adapter: HarnessAdapter,
  files: readonly RenderedFile[],
): RenderedFile[] {
  const placed = files.flatMap((file) => {
    const [top, ...rest] = file.path.split('/');
    let paths: readonly string[] = [file.path];
    if (top === 'agents' && rest.length === 1) {
      const name = (rest[0] as string).slice(0, -adapter.agentExt.length);
      paths = [adapter.agentRel(name)];
    } else if (top === 'skills' && rest.length >= 2) {
      paths = adapter
        .skillRel(rest[0] as string, [])
        .map((dir) => join(dir, ...rest.slice(1)));
    } else if (top === ENFORCING_STAGE_DIR && rest.length >= 2) {
      if (adapter.scopedRel === undefined) {
        throw new Error(
          `the '${adapter.name}' adapter places no scoped artifact, but the render tree stages '${file.path}'; project the tree again`,
        );
      }
      paths = [adapter.scopedRel(rest.slice(1).join('/'), rest[0])];
      if (/\.(?:[cm]?js|ts)$/.test(file.path))
        return paths.map((path) => ({ ...file, path, module: true as const }));
    }
    return paths.map((path) => ({ ...file, path }));
  });
  return placed.sort((a, b) =>
    a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
  );
}

/** A render tree on disk, read back as files: its agents, its skills, and under its
 *  hooks root the scoped artifacts and the hook workers. */
export function readRenderTree(tree: RenderTree): RenderedFile[] {
  const files: RenderedFile[] = [];
  const walk = (dir: string, under: string): void => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      const path = join(under, entry.name);
      if (entry.isDirectory()) walk(abs, path);
      else if (entry.isFile())
        files.push({
          path,
          content: readFileSync(abs, 'utf8'),
          ...((statSync(abs).mode & 0o111) !== 0 ? { executable: true } : {}),
        });
    }
  };
  walk(tree.agentsDir, 'agents');
  walk(tree.skillsDir, 'skills');
  if (tree.hooksDir !== undefined) {
    walk(join(tree.hooksDir, ENFORCING_STAGE_DIR), ENFORCING_STAGE_DIR);
    walk(join(tree.hooksDir, 'hooks'), 'hooks');
  }
  return files;
}

/** What placing the root did, or would do. */
export interface PlaceRootResult {
  readonly root: string;
  /** Every file the root holds, by its path in the root. */
  readonly files: readonly string[];
  /** The extension modules the package names. */
  readonly extensions: readonly string[];
}

/**
 * Place `files` (already in the root's layout) as the WHOLE of `root`, with the
 * package manifest (the `version` that projected it, and the extension modules the
 * harness loads), the capability configuration where there is any, and the record.
 * Whatever the root held before is gone, edits and additions alike: the new root is
 * built beside it and moved into its place. Under `dry`, nothing is written.
 */
export function placeOwnedRoot(opts: {
  readonly adapter: HarnessAdapter;
  readonly root: string;
  readonly files: readonly RenderedFile[];
  readonly version?: string;
  readonly configuration: Readonly<Record<string, unknown>>;
  readonly record: InstallationRecord;
  readonly dry: boolean;
}): PlaceRootResult {
  const { adapter, root } = opts;
  const extensions = opts.files
    .filter((f) => f.module === true)
    .map((f) => `./${f.path}`);
  const manifest = {
    name: packageName(adapter),
    ...(opts.version === undefined ? {} : { version: opts.version }),
    private: true,
    description: `What ${CLI_BIN} installs for ${adapter.name}: placed whole by \`${CLI_BIN} install\`, removed whole by \`${CLI_BIN} uninstall\`.`,
    // The harness reads its own key for the modules it loads (`omp.extensions`).
    [adapter.name]: { extensions },
  };
  const all: RenderedFile[] = [
    ...opts.files,
    {
      path: PACKAGE_MANIFEST,
      content: `${JSON.stringify(manifest, null, 2)}\n`,
    },
    ...(Object.keys(opts.configuration).length > 0
      ? [
          {
            path: RUNTIME_CONFIG_FILE,
            content: `${JSON.stringify({ configuration: opts.configuration }, null, 2)}\n`,
          },
        ]
      : []),
    {
      path: INSTALLATION_RECORD,
      content: `${JSON.stringify(opts.record, null, 2)}\n`,
    },
  ];
  const result = { root, files: all.map((f) => f.path), extensions };
  if (opts.dry) return result;
  const next = `${root}.next`;
  rmSync(next, { recursive: true, force: true });
  for (const file of all) {
    const abs = join(next, file.path);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, file.content, {
      mode: file.executable === true ? 0o755 : 0o644,
    });
  }
  rmSync(root, { recursive: true, force: true });
  renameSync(next, root);
  return result;
}

/** What linking or unlinking the root did, or would do. */
export interface ReferenceReport {
  readonly references: readonly OwnedReference[];
  /** Each reference placed or removed (or, dry, to be), by its absolute path. */
  readonly changed: readonly string[];
  /** What stood in a reference's way, or was not a reference of this root, and why. */
  readonly left: readonly { readonly what: string; readonly why: string }[];
}

/** A JSON object read from `file`, or a reason it is not one. */
function jsonObject(
  file: string,
): { doc: Record<string, unknown>; text: string } | { why: string } {
  const text = readFileSync(file, 'utf8');
  try {
    const doc: unknown = JSON.parse(text);
    if (doc !== null && typeof doc === 'object' && !Array.isArray(doc))
      return { doc: doc as Record<string, unknown>, text };
  } catch {
    // reported below
  }
  return { why: 'it is not a JSON object' };
}

/** The dependencies block of a package manifest, as an object. */
function dependenciesOf(doc: Record<string, unknown>): Record<string, unknown> {
  const deps = doc.dependencies;
  return deps !== null && typeof deps === 'object' && !Array.isArray(deps)
    ? (deps as Record<string, unknown>)
    : {};
}

/**
 * Make the harness's own surfaces refer into `root`: where the harness loads an
 * extension package by name for every project (`adapter.packageDir`), a link to the
 * root under the package's name, and the package's dependency entry, naming the root,
 * in that directory's manifest — as the harness's own `plugin link` would. Whatever
 * else the directory holds is the host's and stays. A reference location the host
 * holds otherwise — a path that is not a link, a link pointing elsewhere, an entry
 * naming something else — is the host's: left as it is, claimed in no record, and
 * reported with what the operator must do. `prior` is the record of the installation
 * this one replaces, which says whether install made the manifest.
 */
export function linkOwnedRoot(opts: {
  readonly adapter: HarnessAdapter;
  readonly harnessDir: string;
  readonly root: string;
  readonly prior: InstallationRecord | null;
  readonly dry: boolean;
}): ReferenceReport {
  const { adapter, harnessDir, root, dry } = opts;
  if (adapter.packageDir === undefined)
    return { references: [], changed: [], left: [] };
  const name = packageName(adapter);
  const references: OwnedReference[] = [];
  const changed: string[] = [];
  const left: { what: string; why: string }[] = [];

  const linkRel = join(adapter.packageDir, 'node_modules', name);
  const link = join(harnessDir, linkRel);
  const stat = lstatSync(link, { throwIfNoEntry: false });
  const target =
    stat?.isSymbolicLink() === true
      ? resolve(dirname(link), readlinkSync(link))
      : undefined;
  if (stat !== undefined && target !== root) {
    left.push({
      what: link,
      why: `${target === undefined ? 'it is not a link' : `it points at ${target}`}, the host's own, so ${adapter.name} does not load ${root} from there; to have it do so, move it away and install again`,
    });
  } else {
    references.push({ kind: 'link', path: linkRel });
    if (stat === undefined) {
      changed.push(link);
      if (!dry) {
        mkdirSync(dirname(link), { recursive: true });
        symlinkSync(root, link, 'dir');
      }
    }
  }

  const manifestRel = join(adapter.packageDir, PACKAGE_MANIFEST);
  const manifest = join(harnessDir, manifestRel);
  const existed = existsSync(manifest);
  const read = existed ? jsonObject(manifest) : { doc: {}, text: undefined };
  if ('why' in read) {
    left.push({
      what: manifest,
      why: `${read.why}, so ${adapter.name} is not told of ${name} there; repair it and install again`,
    });
    return { references, changed, left };
  }
  const href = pathToFileURL(root).href;
  const deps = dependenciesOf(read.doc);
  if (Object.hasOwn(deps, name) && deps[name] !== href) {
    left.push({
      what: `${manifest}: dependencies.${name}`,
      why: `it names ${String(deps[name])}, the host's own, not ${root}; to have ${adapter.name} load ${root}, take that entry out and install again`,
    });
    return { references, changed, left };
  }
  const priorRef = opts.prior?.references.find(
    (r) => r.kind === 'dependency' && r.path === manifestRel,
  );
  const created = priorRef?.kind === 'dependency' ? priorRef.created : !existed;
  references.push({ kind: 'dependency', path: manifestRel, name, created });
  if (deps[name] !== href) {
    changed.push(manifest);
    if (!dry) {
      mkdirSync(dirname(manifest), { recursive: true });
      writeFileSync(
        manifest,
        settingsJson(
          { ...read.doc, dependencies: { ...deps, [name]: href } },
          read.text,
        ),
      );
    }
  }
  return { references, changed, left };
}

/** Remove the empty directories from `dir` up to, not including, `stop`. */
function pruneEmpty(dir: string, stop: string): void {
  const top = resolve(stop);
  let at = resolve(dir);
  while (at !== top && at.startsWith(`${top}/`)) {
    try {
      rmdirSync(at);
    } catch {
      return; // not empty — the host's files are in it
    }
    at = dirname(at);
  }
}

/**
 * Take back the references `record` names into `root`: a link while it still points
 * at the root, a dependency entry while it still names it (and the manifest, where
 * install made it and nothing else is left in it). A reference the host has since
 * pointed elsewhere is the host's, left and reported.
 */
export function unlinkOwnedRoot(opts: {
  readonly harnessDir: string;
  readonly root: string;
  readonly record: InstallationRecord;
  readonly dry: boolean;
}): ReferenceReport {
  const { harnessDir, root, dry } = opts;
  const changed: string[] = [];
  const left: { what: string; why: string }[] = [];
  for (const ref of opts.record.references) {
    const abs = join(harnessDir, ref.path);
    if (ref.kind === 'link') {
      const stat = lstatSync(abs, { throwIfNoEntry: false });
      if (stat === undefined) continue;
      if (
        !stat.isSymbolicLink() ||
        resolve(dirname(abs), readlinkSync(abs)) !== root
      ) {
        left.push({ what: abs, why: `it no longer points at ${root}` });
        continue;
      }
      changed.push(abs);
      if (!dry) {
        unlinkSync(abs);
        pruneEmpty(dirname(abs), harnessDir);
      }
      continue;
    }
    if (!existsSync(abs)) continue;
    const read = jsonObject(abs);
    if ('why' in read) {
      left.push({
        what: abs,
        why: `${read.why}, so its entry for ${ref.name} cannot be taken out; remove it by hand`,
      });
      continue;
    }
    const deps = dependenciesOf(read.doc);
    if (deps[ref.name] !== pathToFileURL(root).href) {
      if (Object.hasOwn(deps, ref.name))
        left.push({
          what: `${abs}: dependencies.${ref.name}`,
          why: `it no longer names ${root}`,
        });
      continue;
    }
    changed.push(abs);
    if (dry) continue;
    const { [ref.name]: _ours, ...rest } = deps;
    const { dependencies: _deps, ...others } = read.doc;
    const doc =
      Object.keys(rest).length > 0 || !ref.created
        ? { ...others, dependencies: rest }
        : others;
    if (ref.created && Object.keys(doc).length === 0) {
      unlinkSync(abs);
      pruneEmpty(dirname(abs), harnessDir);
    } else {
      writeFileSync(abs, settingsJson(doc, read.text));
    }
  }
  return { references: opts.record.references, changed, left };
}

/** Remove `root` whole, and the directory holding every installation where it is
 *  left empty. */
export function removeOwnedRoot(root: string): void {
  rmSync(root, { recursive: true, force: true });
  rmSync(`${root}.next`, { recursive: true, force: true });
  pruneEmpty(dirname(root), dirname(dirname(root)));
}
