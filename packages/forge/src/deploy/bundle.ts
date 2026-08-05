// Asset staging — the skill-dir committed-companion capability
// (toolkit/AGENTS.md §Dual-deploy). A `skill-dir` skill renders SKILL.md AND may
// carry committed companion files beside it:
//
// - `assets:` — committed cell-dir companions (a WARN, not a hard error, when
//   absent: a committed asset missing is a corpus mistake to surface, not a
//   deploy-blocking build gap).
//
// (The former `bundle:` build-artifact staging — the memory build artifact — is
// retired: memory is now the standalone `memory` PATH tool, installed via its
// package `bin`, not staged into a skill dir. `assets:` is the surviving,
// live mechanism.)
//
// Faithful port of `resolve._stage_assets`.
//
// ── AND the RESOLVABILITY GATE on what those companions SPAWN ────────────────
// A skill dir does not only carry inert bytes. When a cell declares `runtime:`,
// the projection emits `scripts/<capability>.mjs`, a thin shim whose entire body
// is `spawnSync(RUNTIME_BIN, …)`. Placing that file is placing a CALL, and a call
// is only as good as its binding.
//
// On 2026-08-05 that binding was a `pnpm link --global` symlink into the checkout
// that no artifact in this repository authored. The workspace directory was
// renamed, the symlink stranded, and every deployed shim died in node's module
// loader — while `bin-name-single-home.test.ts` stayed green, because it proves
// the shim spawns the RIGHT STRING and nothing had ever proved the string
// RESOLVES on the host that runs it. The gate covered the name; the failure was
// in the binding.
//
// So this module probes it, and the probe is `--version`, NOT `which`. That is
// the crux and it was paid for: `which` was satisfied by the stranded shim the
// whole time it was broken. Presence on PATH is not resolvability — only
// executing the thing distinguishes a live binding from a dead one.
//
// A deploy that places a shim against a bin that cannot execute has produced a
// broken artifact and reported success. It refuses instead, in capability terms,
// at the point of placement.

import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { basename, delimiter, join, resolve as resolvePath } from 'node:path';
import { RUNTIME_BIN } from '@cratylus/runtime/bin-name';

/** Recursively collect every file under `dir`, as paths RELATIVE to `dir`
 *  (POSIX `/` separators), sorted deterministically. Used by the skill placers
 *  to recurse a skill dir's co-located `scripts/`, `references/`, `assets/`
 *  companions instead of copying only its top-level files — the caller mkdirs
 *  each dest parent to preserve the subtree structure. */
export function walkSkillFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (rel: string): void => {
    const abs = rel ? resolvePath(dir, rel) : dir;
    for (const entry of readdirSync(abs).sort()) {
      const childRel = rel ? `${rel}/${entry}` : entry;
      const st = statSync(resolvePath(dir, childRel));
      if (st.isDirectory()) {
        walk(childRel);
      } else if (st.isFile()) {
        out.push(childRel);
      }
    }
  };
  walk('');
  return out;
}

/** One skill's committed companion-file declarations. `assets` paths are
 *  committed companions (warn if missing), relative to the declaring source's
 *  dir unless absolute. */
export interface SkillCompanions {
  // Committed asset specs (relative to assetBaseDir, or absolute).
  assets?: string[];
}

export interface StageAssetsOpts {
  // Dir the `assets:` specs resolve against (Python: the cell's dir).
  assetBaseDir: string;
  log?: (line: string) => void;
  warn?: (line: string) => void;
}

/** Copy a skill's declared committed companion assets into its rendered skill
 *  dir beside SKILL.md, byte-for-byte (binary-safe). A missing asset is a WARN
 *  (a committed-companion mistake to surface), NOT a deploy-blocking hard error.
 *  Returns the staged basenames. */
export function stageAssets(
  skill: string,
  destDir: string,
  specs: string[] | undefined,
  opts: StageAssetsOpts,
): string[] {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? (() => {});
  if (!specs || specs.length === 0) {
    return [];
  }
  mkdirSync(destDir, { recursive: true });
  const staged: string[] = [];
  for (const name of specs.map((s) => s.trim()).filter(Boolean)) {
    const src = resolvePath(opts.assetBaseDir, name);
    if (!existsSync(src)) {
      warn(`  WARN  asset ${skill}/${name} not found at ${src}`);
      continue;
    }
    const base = basename(src);
    copyFileSync(src, resolvePath(destDir, base));
    staged.push(base);
    log(`ASSET  ${skill}/${base} -> ${resolvePath(destDir, base)}`);
  }
  return staged;
}

// ─────────────────────────────────────────────────────────────────────────────
// The run-time bin resolvability probe.
// ─────────────────────────────────────────────────────────────────────────────

/** What executing the run-time bin proved. `resolvable` is the only verdict;
 *  everything else is evidence for the refusal text. */
export interface RuntimeBinProbe {
  readonly bin: string;
  readonly resolvable: boolean;
  /** What a `which` would have found — recorded precisely BECAUSE it is not the
   *  verdict. Printing it beside a failure is what makes the lesson legible: the
   *  file was there the whole time and the capability was dead anyway. */
  readonly found: string | null;
  readonly version: string | null;
  readonly reason: string | null;
  /** ONE salient line of the failure's stderr — evidence, deliberately reduced
   *  so a node module-loader stack cannot become the refusal. */
  readonly detail: string | null;
}

/**
 * Reduce a failing process's stderr to the ONE line worth quoting.
 *
 * Taking the first line is not enough and this gate's own test proved it: a
 * stranded shim's stderr OPENS with `node:internal/modules/cjs/loader:1573`, so
 * "first line" reproduces the loader frame the refusal exists to replace. Prefer
 * the error sentence — for the stranded case that is
 * `Error: Cannot find module '<the path that is gone>'`, which names the strand
 * itself — and otherwise take the first line that is not a frame, an internal
 * path, or the caret echo. If nothing qualifies, quote nothing: no evidence beats
 * misleading evidence.
 */
export function salientStderr(
  stderr: string | null | undefined,
): string | null {
  const lines = (stderr ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const isNoise = (l: string): boolean =>
    l.startsWith('node:') ||
    l.startsWith('at ') ||
    l.startsWith('throw ') ||
    /^\^+$/.test(l) ||
    /^[\w./-]+:\d+(:\d+)?$/.test(l);
  const pick =
    lines.find((l) => /^[A-Za-z_$][\w$]*Error\b/.test(l) && !isNoise(l)) ??
    lines.find((l) => !isNoise(l));
  if (!pick) return null;
  return pick.length > 200 ? `${pick.slice(0, 197)}...` : pick;
}

export interface ProbeRuntimeBinOpts {
  readonly bin?: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly timeoutMs?: number;
  /** Bypass the per-PATH memo (tests, and a deploy that just re-authored the
   *  binding under itself). */
  readonly fresh?: boolean;
}

const probeMemo = new Map<string, RuntimeBinProbe>();

/** Drop the memo. A probe spawns a process, so it is cached per ⟨bin, PATH⟩ for
 *  the life of a deploy; a test that rewrites its fixture host must clear it. */
export function resetRuntimeBinProbe(): void {
  probeMemo.clear();
}

/** PATH lookup, no spawn — the `which` this module refuses to trust as a verdict
 *  and uses only as evidence. */
export function whichOnPath(
  bin: string,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  for (const dir of (env.PATH ?? '').split(delimiter).filter(Boolean)) {
    const candidate = join(dir, bin);
    try {
      const st = statSync(candidate);
      if (st.isFile() && (st.mode & 0o111) !== 0) {
        return candidate;
      }
    } catch {
      // not here; keep looking
    }
  }
  return null;
}

/**
 * EXECUTE the bin. `<bin> --version` is the probe.
 *
 * Three distinct failures collapse to one verdict, and all three were live on
 * 2026-08-05: the name is absent from PATH; the name is present but its target is
 * stranded (spawn succeeds, the process dies in node's loader, status ≠ 0); the
 * name runs but answers nothing. Only the first is what a presence check tests,
 * and it is the one that did NOT happen.
 */
export function probeRuntimeBin(
  opts: ProbeRuntimeBinOpts = {},
): RuntimeBinProbe {
  const bin = opts.bin ?? RUNTIME_BIN;
  const env = opts.env ?? process.env;
  const key = `${bin}\u0000${env.PATH ?? ''}`;
  if (!opts.fresh) {
    const hit = probeMemo.get(key);
    if (hit) return hit;
  }

  const found = whichOnPath(bin, env);
  const res = spawnSync(bin, ['--version'], {
    encoding: 'utf-8',
    env,
    timeout: opts.timeoutMs ?? 20_000,
  });
  const version = (res.stdout ?? '').trim().split('\n')[0]?.trim() ?? '';
  const detail = salientStderr(res.stderr);

  let probe: RuntimeBinProbe;
  if (res.error) {
    probe = {
      bin,
      resolvable: false,
      found,
      version: null,
      reason:
        found === null
          ? `not found on PATH (${res.error.message})`
          : `present on PATH but could not be executed (${res.error.message})`,
      detail,
    };
  } else if (res.status !== 0) {
    probe = {
      bin,
      resolvable: false,
      found,
      version: null,
      reason: `\`${bin} --version\` exited ${String(res.status)}`,
      detail,
    };
  } else if (version === '') {
    probe = {
      bin,
      resolvable: false,
      found,
      version: null,
      reason: `\`${bin} --version\` produced no version output`,
      detail,
    };
  } else {
    probe = {
      bin,
      resolvable: true,
      found,
      version,
      reason: null,
      detail: null,
    };
  }
  probeMemo.set(key, probe);
  return probe;
}

/** The refusal, as text. A CAPABILITY-level account: what was placed, what it
 *  spawns, what happened when that was executed, and the one command that
 *  repairs it — never a node module-loader stack, which is the failure mode this
 *  message exists to replace. */
export function runtimeBinRefusal(
  probe: RuntimeBinProbe,
  shims: readonly string[],
): string {
  const lines = [
    `  REFUSED  ${probe.bin} does not run on this host, and the shims just placed spawn it.`,
    '',
    `    shims    ${shims.join(', ')}`,
    `    probe    ${probe.bin} --version`,
    `    found    ${probe.found ?? '(nothing on PATH)'}`,
    `    result   ${probe.reason ?? 'unresolvable'}`,
  ];
  if (probe.detail) {
    lines.push(`    stderr   ${probe.detail}`);
  }
  if (probe.found !== null) {
    lines.push(
      '',
      '  Presence on PATH is not resolvability. `which` was satisfied by that file',
      '  the entire time the capability was dead — only executing it tells them apart.',
    );
  }
  lines.push(
    '',
    '  These shims are deployed and INERT: each would die inside node, in a skill,',
    '  on this host — not here. Author the host binding, then deploy again:',
    '',
    '    node <checkout>/packages/invoke/dist/bin.js install',
    '',
  );
  return lines.join('\n');
}

/** Which of `relFiles` (dest-relative POSIX paths under `srcDir`) are shims that
 *  spawn the run-time bin. Scoped to `scripts/` so a SKILL.md merely NAMING the
 *  bin in prose never triggers a refusal — the subject is placed calls, not
 *  placed mentions. */
export function shimsSpawningRuntimeBin(
  srcDir: string,
  relFiles: readonly string[],
  bin: string = RUNTIME_BIN,
): string[] {
  const spawns = new RegExp(
    `spawnSync\\(\\s*['"\`]${bin.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`,
  );
  const out: string[] = [];
  for (const rel of relFiles) {
    if (!rel.startsWith('scripts/')) continue;
    let text: string;
    try {
      text = readFileSync(resolvePath(srcDir, rel), 'utf-8');
    } catch {
      continue;
    }
    if (spawns.test(text)) {
      out.push(rel);
    }
  }
  return out;
}

export interface AssertShimsOpts extends ProbeRuntimeBinOpts {
  /** A dry run places nothing, so it convicts nothing. */
  readonly dry?: boolean;
}

/**
 * The gate, as a pure verdict: given the files a placer just laid down for one
 * skill, return the refusal text if any of them spawns a bin that does not
 * execute, else `null`.
 *
 * Returning text rather than throwing is deliberate. The placer's contract is
 * `rc: 0 | 2` plus warnings; a throw out of the middle of placement would leave
 * the deploy manifest unwritten and the half-placed tree unattributable —
 * trading a loud failure for an unrecoverable one. The caller reports this and
 * returns 2, which is a non-zero exit: the deploy does not get to claim success.
 */
export function assertShimsResolvable(
  srcDir: string,
  relFiles: readonly string[],
  opts: AssertShimsOpts = {},
): string | null {
  if (opts.dry) return null;
  const bin = opts.bin ?? RUNTIME_BIN;
  const shims = shimsSpawningRuntimeBin(srcDir, relFiles, bin);
  if (shims.length === 0) return null;
  const probe = probeRuntimeBin(opts);
  return probe.resolvable ? null : runtimeBinRefusal(probe, shims);
}
