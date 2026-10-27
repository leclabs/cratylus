// ─────────────────────────────────────────────────────────────────────────────
// THE OWNED ROOT — everything cratylus places on one harness at one scope, under one
// directory it owns: `<home>/.cratylus/<harness>/` for the user, or
// `<project>/.cratylus/<harness>/` inside one project (`install-scope.ts`).
//
// What lives there is cratylus's by CONSTRUCTION, never inferred from a name, a
// content or a digest: the root is cratylus's alone, so an install replaces it whole
// and an uninstall removes it whole, and a change the host makes inside it is not kept.
// For omp the root is an extension package, laid out as omp reads one:
//
//   agents/<name>.md        the canon's agent declarations
//   skills/<name>/…         the canon's skills
//   rules/<name>.md         the rules chosen at install, each applied in every session
//   extensions/<module>.ts  the harness's adapters (the capability tools, the session
//                           hooks, the dispatch isolation)
//   hooks/<id>/<worker>     the workers the session hooks run
//   package.json            the package: its name, the VERSION of cratylus that
//                           projected it, and the modules omp loads (`omp.extensions`)
//   runtime.json            each capability's configuration, where the canon has any
//   installation.json       what install did outside the root: its scope (user or
//                           project; absent, user); the references it placed;
//                           whether it created the project's harness directory; the
//                           rules it installed, by name; and which
//                           of the product owner's choices it has been answered, never
//                           their values, which are the host's own settings
//
// THE HARNESS'S OWN SURFACES ONLY REFER INTO IT. omp loads an extension package for
// every project of a user from its plugin directory (`~/.omp/plugins`), and for one
// project from that project's (`<project>/.omp/plugins`, which shadows a user package
// of the same name), as `omp plugin link` places one: a link `node_modules/<package>`
// → the root, and the package's dependency entry in the directory's `package.json`;
// at project scope each is relative, so a clone elsewhere resolves it, and the
// directory's `.gitignore` gains the lines that keep the link committable. Those are
// the references; an uninstall finds each from where it points, into the root, so
// none is left dangling when the root or its record was edited or removed.
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
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  INSTALLATIONS_DIR,
  INSTALLATION_RECORD_FILE,
  type InstallScope,
  RUNTIME_CONFIG_FILE,
} from '@cratylus/runtime/runtime-config';
import { CLI_BIN } from '../bin-name.js';
import {
  ENFORCING_STAGE_DIR,
  type HarnessAdapter,
} from '../core/harness-adapter.js';
import { settingsJson } from './settings-json.js';

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

/** The package manifest the harness reads the root as a package by. */
const PACKAGE_MANIFEST = 'package.json';

/** The ignore file in the package directory at project scope, whose lines keep the
 *  link committable in a project that ignores `node_modules`. */
const IGNORE_FILE = '.gitignore';

/** A reference the harness's own surfaces hold into the root, by its path relative to
 *  the harness's home: a link to the root, or a dependency entry naming it in a
 *  package manifest (`created` where install made that manifest), or, at project
 *  scope, the block of an ignore file that re-includes the link (`created` where
 *  install made that file; `terminated` where install ended the host's last line to
 *  append the block). */
export type OwnedReference =
  | { readonly kind: 'link'; readonly path: string }
  | {
      readonly kind: 'dependency';
      readonly path: string;
      readonly name: string;
      readonly created: boolean;
    }
  | {
      readonly kind: 'ignore';
      readonly path: string;
      readonly created: boolean;
      readonly terminated: boolean;
    };

/** A product owner's choice install asks for and writes as the host's own setting:
 *  whether the status line shows the session's agent. */
export type ProductOwnerChoice = 'agentStatus';

/** What install did outside the root, and the rules it installed. */
export interface InstallationRecord {
  /** Where the installation is: for the user, or inside one project. Absent in a
   *  record written before scopes, which is a user installation. */
  readonly scope?: InstallScope;
  /** The rules chosen, by name, in the canon's order, possibly none: the choice an
   *  upgrade keeps. Absent where the canon offered no rulesets, or the choice was
   *  never made. */
  readonly rules?: readonly string[];
  readonly references: readonly OwnedReference[];
  /** Set where a project installation created the project's harness directory
   *  (`<project>/.omp`): its uninstall removes that directory where it is left empty,
   *  and never one that was there before (design/decisions/a-project-installation.md). */
  readonly createdHarnessDir?: true;
  /** The product owner's choices install has been answered, by flag or question: each
   *  answer is the host's own setting from then on, so no later install asks for it
   *  or applies it again. Absent where none has been. */
  readonly answered?: readonly ProductOwnerChoice[];
}

/** The owned root of `adapter`'s harness under `base` (the process's home when none
 *  is given): `<base>/.<bin>/<harness>`. The base is the home for the user's
 *  installation, and the project for a project's. */
export function ownedRootIn(
  adapter: Pick<HarnessAdapter, 'name'>,
  base?: string | null,
): string {
  return join(
    base ? resolve(base) : homedir(),
    INSTALLATIONS_DIR,
    adapter.name,
  );
}

/** The package name the root is referred to by: `<bin>-<harness>`. */
function packageName(adapter: Pick<HarnessAdapter, 'name'>): string {
  return `${CLI_BIN}-${adapter.name}`;
}

/** The record in `root`, or `null` where nothing is installed there or the host has
 *  edited it past reading: the root is cratylus's, but nothing in it is trusted to
 *  find what lies outside it (design/decisions/one-owned-root-per-installation-scope.md). */
export function readInstallationRecord(
  root: string,
): InstallationRecord | null {
  const file = join(root, INSTALLATION_RECORD_FILE);
  if (!existsSync(file)) return null;
  try {
    const doc: unknown = JSON.parse(readFileSync(file, 'utf8'));
    if (doc === null || typeof doc !== 'object' || Array.isArray(doc))
      return null;
    const record = doc as Partial<InstallationRecord>;
    return {
      ...record,
      references: Array.isArray(record.references) ? record.references : [],
    };
  } catch {
    return null;
  }
}

/** Whether `dir` holds files but no installation record: an earlier render tree,
 *  which an installation never takes over (design/decisions/a-project-installation.md). */
export function holdsRenderTree(dir: string): boolean {
  return (
    existsSync(dir) &&
    statSync(dir).isDirectory() &&
    readdirSync(dir).length > 0 &&
    !existsSync(join(dir, INSTALLATION_RECORD_FILE))
  );
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
      path: INSTALLATION_RECORD_FILE,
      // The record names the version that projected this root too, beside what it did.
      content: `${JSON.stringify({ ...(opts.version === undefined ? {} : { version: opts.version }), ...opts.record }, null, 2)}\n`,
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

/** The block of the package directory's ignore file that keeps the link to the
 *  package `name` committable where the project ignores `node_modules`: a comment
 *  naming cratylus, the directory re-included, everything in it ignored, the link
 *  re-included. Cratylus's by its content, found wherever it stands. */
function ignoreBlock(name: string): string[] {
  return [
    `# ${CLI_BIN}: commit the link to the project installation`,
    '!/node_modules/',
    '/node_modules/*',
    `!/node_modules/${name}`,
  ];
}

/** Where `block` stands in `text` as contiguous whole lines: the index of its first
 *  line among `text`'s lines (each with its terminator), or -1. */
function blockAt(pieces: readonly string[], block: readonly string[]): number {
  for (let at = 0; at + block.length <= pieces.length; at++) {
    if (
      block.every(
        (line, k) => (pieces[at + k] as string).replace(/\r?\n$/, '') === line,
      )
    )
      return at;
  }
  return -1;
}

/**
 * At project scope, the block of the package directory's ignore file that re-includes
 * the link: kept where it already stands, else appended whole at the file's end, so it
 * is read after every line of the host's; the file is made where there is none. No
 * line of the host's is read or touched, one identical to a line of the block
 * included. The reference records whether install made the file, and whether it ended
 * the host's last line to append the block, so uninstall leaves the host's bytes.
 */
function ignoreLink(opts: {
  readonly harnessDir: string;
  readonly packageDir: string;
  readonly name: string;
  readonly prior: InstallationRecord | null;
  readonly dry: boolean;
}): { reference: OwnedReference; changed?: string } {
  const rel = join(opts.packageDir, IGNORE_FILE);
  const file = join(opts.harnessDir, rel);
  const existed = existsSync(file);
  const text = existed ? readFileSync(file, 'utf8') : '';
  const block = ignoreBlock(opts.name);
  const priorRef = opts.prior?.references.find(
    (r) => r.kind === 'ignore' && r.path === rel,
  );
  if (blockAt(text.split(/(?<=\n)/), block) >= 0) {
    return {
      reference:
        priorRef ??
        ({
          kind: 'ignore',
          path: rel,
          created: false,
          terminated: false,
        } as const),
    };
  }
  const terminated = text !== '' && !text.endsWith('\n');
  if (!opts.dry) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(
      file,
      `${text}${terminated ? '\n' : ''}${block.join('\n')}\n`,
    );
  }
  return {
    reference: {
      kind: 'ignore',
      path: rel,
      created: priorRef?.kind === 'ignore' ? priorRef.created : !existed,
      terminated,
    },
    changed: file,
  };
}

/**
 * Make the harness's own surfaces refer into `root`: where the harness loads an
 * extension package by name (`adapter.packageDir`), a link to the root under the
 * package's name, and the package's dependency entry, naming the root, in that
 * directory's manifest — as the harness's own `plugin link` would. Whatever else the
 * directory holds is the host's and stays. A reference location the host holds
 * otherwise — a path that is not a link, a link pointing elsewhere, an entry naming
 * something else — is the host's: left as it is, claimed in no record, and reported
 * with what the product owner must do. `prior` is the record of the installation this one
 * replaces, which says whether install made the manifest.
 *
 * At user scope the references name the root absolutely, as `plugin link` does. At
 * project scope each is relative to where it stands, so a clone of the project
 * elsewhere resolves it, and the directory's ignore file gains the lines that keep
 * the link committable where the project ignores `node_modules`.
 */
export function linkOwnedRoot(opts: {
  readonly adapter: HarnessAdapter;
  readonly harnessDir: string;
  readonly root: string;
  readonly scope: InstallScope;
  readonly prior: InstallationRecord | null;
  readonly dry: boolean;
}): ReferenceReport {
  const { adapter, harnessDir, root, dry } = opts;
  if (adapter.packageDir === undefined)
    return { references: [], changed: [], left: [] };
  const project = opts.scope === 'project';
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
        symlinkSync(
          project ? relative(dirname(link), root) : root,
          link,
          'dir',
        );
      }
    }
    if (project) {
      const ignored = ignoreLink({
        harnessDir,
        packageDir: adapter.packageDir,
        name,
        prior: opts.prior,
        dry,
      });
      references.push(ignored.reference);
      if (ignored.changed !== undefined) changed.push(ignored.changed);
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
  const href = project
    ? `file:${relative(dirname(manifest), root)}`
    : pathToFileURL(root).href;
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
 * Take back every reference the harness's own surfaces hold into `root`, found from
 * where each points, never from the record: the root, or its record, may have been
 * edited or removed, and a reference into it is cratylus's by construction
 * (design/decisions/one-owned-root-per-installation-scope.md). Where the harness loads
 * extension packages (`adapter.packageDir`), that is
 * each link under `node_modules` whose target is the root or inside it, and each
 * dependency entry of the directory's manifest that names the root or a path inside
 * it. Whatever else those surfaces hold is the host's and stays. The record, where it
 * can be read, says only whether install made the manifest (so it goes once nothing
 * else is left in it) and which recorded references the host has since pointed
 * elsewhere, left and reported. At project scope the ignore file's block re-including
 * the link is taken back too, found by its content wherever it stands, and no line of
 * the host's with it; the file goes where install made it and nothing else is left.
 * And the project's harness directory goes where the record says install created it
 * and nothing is left in it.
 */
export function unlinkOwnedRoot(opts: {
  readonly adapter: Pick<HarnessAdapter, 'name' | 'packageDir'>;
  readonly harnessDir: string;
  readonly root: string;
  readonly scope: InstallScope;
  readonly record: InstallationRecord | null;
  readonly dry: boolean;
}): ReferenceReport {
  const { adapter, harnessDir, root, dry } = opts;
  const references: OwnedReference[] = [];
  const changed: string[] = [];
  const left: { what: string; why: string }[] = [];
  if (adapter.packageDir === undefined) return { references, changed, left };
  const into = (path: string): boolean =>
    path === root || path.startsWith(`${root}/`);
  const packages = join(harnessDir, adapter.packageDir);

  // The links: every entry of `node_modules`, scoped packages' too.
  const modules = join(packages, 'node_modules');
  const entries = (dir: string): string[] =>
    existsSync(dir) && statSync(dir).isDirectory()
      ? readdirSync(dir).map((name) => join(dir, name))
      : [];
  const links = entries(modules).flatMap((abs) =>
    abs.slice(modules.length + 1).startsWith('@') &&
    lstatSync(abs).isDirectory()
      ? entries(abs)
      : [abs],
  );
  for (const abs of links) {
    if (!lstatSync(abs).isSymbolicLink()) continue;
    if (!into(resolve(dirname(abs), readlinkSync(abs)))) continue;
    references.push({ kind: 'link', path: abs.slice(harnessDir.length + 1) });
    changed.push(abs);
    if (!dry) {
      unlinkSync(abs);
      pruneEmpty(dirname(abs), harnessDir);
    }
  }

  // The ignore file's block re-including the link, at project scope.
  if (opts.scope === 'project') {
    const ignoreRel = join(adapter.packageDir, IGNORE_FILE);
    const ignore = join(harnessDir, ignoreRel);
    const recordedIgnore = opts.record?.references.find(
      (r) => r.kind === 'ignore' && r.path === ignoreRel,
    );
    const ref =
      recordedIgnore?.kind === 'ignore'
        ? recordedIgnore
        : ({
            kind: 'ignore',
            path: ignoreRel,
            created: false,
            terminated: false,
          } as const);
    const pieces = existsSync(ignore)
      ? readFileSync(ignore, 'utf8').split(/(?<=\n)/)
      : [];
    const block = ignoreBlock(packageName(adapter));
    const at = blockAt(pieces, block);
    if (at >= 0) {
      pieces.splice(at, block.length);
      // The terminator install gave the host's last line goes with the block, while
      // nothing of the host's has come after it.
      if (ref.terminated && at === pieces.length && at > 0)
        pieces[at - 1] = (pieces[at - 1] as string).replace(/\n$/, '');
      const next = pieces.join('');
      references.push(ref);
      changed.push(ignore);
      if (!dry) {
        if (ref.created && next === '') {
          unlinkSync(ignore);
          pruneEmpty(dirname(ignore), harnessDir);
        } else {
          writeFileSync(ignore, next);
        }
      }
    }
  }

  // The dependency entries of the directory's manifest.
  const manifestRel = join(adapter.packageDir, PACKAGE_MANIFEST);
  const manifest = join(harnessDir, manifestRel);
  const recorded = opts.record?.references.find(
    (r) => r.kind === 'dependency' && r.path === manifestRel,
  );
  const created = recorded?.kind === 'dependency' && recorded.created;
  const read = existsSync(manifest) ? jsonObject(manifest) : undefined;
  const deps =
    read !== undefined && !('why' in read) ? dependenciesOf(read.doc) : {};
  if (read !== undefined && 'why' in read)
    left.push({
      what: manifest,
      why: `${read.why}, so its entries naming ${root} cannot be taken out; remove them by hand`,
    });
  const ours = Object.keys(deps).filter((name) => {
    const spec = deps[name];
    if (typeof spec !== 'string') return false;
    if (spec.startsWith('file://')) {
      try {
        return into(fileURLToPath(spec));
      } catch {
        return false;
      }
    }
    const local = /^(?:file|link):(.*)$/.exec(spec)?.[1];
    return local !== undefined && into(resolve(packages, local));
  });
  for (const name of ours)
    references.push({ kind: 'dependency', path: manifestRel, name, created });
  if (ours.length > 0 && read !== undefined && !('why' in read)) {
    changed.push(manifest);
    if (!dry) {
      const rest = Object.fromEntries(
        Object.entries(deps).filter(([name]) => !ours.includes(name)),
      );
      const { dependencies: _deps, ...others } = read.doc;
      const doc =
        Object.keys(rest).length > 0 || !created
          ? { ...others, dependencies: rest }
          : others;
      if (created && Object.keys(doc).length === 0) {
        unlinkSync(manifest);
        pruneEmpty(dirname(manifest), harnessDir);
      } else {
        writeFileSync(manifest, settingsJson(doc, read.text));
      }
    }
  }

  // A recorded reference the host has since pointed elsewhere is the host's.
  for (const ref of opts.record?.references ?? []) {
    const abs = join(harnessDir, ref.path);
    if (ref.kind === 'link') {
      if (
        !changed.includes(abs) &&
        lstatSync(abs, { throwIfNoEntry: false }) !== undefined
      )
        left.push({ what: abs, why: `it no longer points at ${root}` });
    } else if (
      ref.kind === 'dependency' &&
      Object.hasOwn(deps, ref.name) &&
      !ours.includes(ref.name)
    ) {
      left.push({
        what: `${abs}: dependencies.${ref.name}`,
        why: `it no longer names ${root}`,
      });
    }
  }
  if (
    !dry &&
    opts.scope === 'project' &&
    opts.record?.createdHarnessDir === true
  ) {
    try {
      rmdirSync(harnessDir);
    } catch {
      // not empty — the host's files are in it, or it is gone already
    }
  }
  return { references, changed, left };
}

/** Remove `root` whole, and the directory holding every installation where it is
 *  left empty. */
export function removeOwnedRoot(root: string): void {
  rmSync(root, { recursive: true, force: true });
  rmSync(`${root}.next`, { recursive: true, force: true });
  pruneEmpty(dirname(root), dirname(dirname(root)));
}
