// ─────────────────────────────────────────────────────────────────────────────
// The memory capability, as a runtime strategy — memory's implementation
// of the `MemoryStrategy` PORT (`@cratylus/runtime`). This is the REHOUSING
// of the standalone tool's verb bodies (once `src/cli.ts`'s `run*` handlers) into
// ONE typed object: each verb becomes a method that returns typed data instead of
// a `CliResult`. The heavy mechanism stays where it was tested — `store` (encode ·
// read · drain), `node`/`fold` (scope), `dream` (apply), `session`/`lock` (the
// registries), `audit`, `migrate`. This file only re-shapes their I/O to the port.
//
// A strategy INSTANCE is bound to a single agent home, resolved by the `home()`
// law (c13e911, preserved EXACTLY): explicit `--home`/`homeOverride` ▸ `$AGENT_HOME`
// env ▸ `name` ⇒ `~/.agents/<name>`. The default instance (the one the runtime
// plugin carries) binds NOTHING, so it resolves the deployment's `$AGENT_HOME` at
// each call; a caller may pin `{name}`/`{home}` at construction instead.
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import type {
  ApplyResult,
  AuditOptions,
  AuditReport,
  DrainOptions,
  DrainResult,
  EncodeEntry,
  EpisodicRecord,
  FoldEntry,
  InitResult,
  LockAcquire,
  LockRelease,
  LockStatus,
  MemoryStrategy,
  MigrateOptions,
  MigrateResult,
  NodeResolution,
  ReadQuery,
  RouteDecision,
  SessionBegin,
  SessionEntry,
  SessionStatus,
} from '@cratylus/runtime';
import {
  BACKLOG_WATERMARK,
  STORE_WATERMARK,
  auditHome,
  loadLines,
  refusesReplace,
  repoKeysFromConfig,
} from './audit.js';
import { applyRoutes, resolveTarget } from './dream.js';
import { foldRecords } from './fold.js';
import { acquireLock, lockStatus, releaseLock } from './lock.js';
import { migrateFile } from './migrate.js';
import {
  type NodeConfig,
  canonical,
  loadNodeConfig,
  resolveNode,
  underOrEqual,
} from './node.js';
import type { StoreName } from './route.js';
import { seedTemplates } from './seeds.js';
import {
  heartbeat,
  listSessions,
  liveSessions,
  registerSession,
  releaseSession,
  sessionStatus,
} from './session.js';
import {
  EpisodicStore,
  defaultDerive,
  homeForName,
  resolveSession,
} from './store.js';

/** Construction-time binding — an instance may pin its home/name, else it
 *  resolves the deployment's `$AGENT_HOME` at call time (the plugin default). */
export interface AgentMemoryOptions {
  /** Bare agent name → `~/.agents/<name>` fallback (the lowest-precedence source). */
  name?: string;
  /** Explicit home dir — the highest-precedence source (like `--home`). */
  home?: string;
}

/**
 * The memory {@link MemoryStrategy} implementation, bound to one home.
 * Every verb acts on the home resolved by {@link home}. Constructed with an
 * optional `{name, home}` binding; the runtime plugin carries a bindingless
 * instance that reads `$AGENT_HOME` at each call.
 */
export class AgentMemory implements MemoryStrategy {
  private readonly boundName?: string;
  private readonly boundHome?: string;

  constructor(opts: AgentMemoryOptions = {}) {
    this.boundName = opts.name;
    this.boundHome = opts.home;
  }

  /**
   * Resolve the agent home — the c13e911 law, override-first:
   * `homeOverride`/bound home ▸ `$AGENT_HOME` env ▸ `name`/bound name ⇒
   * `~/.agents/<name>`. At least one source MUST resolve, else it throws. Returns
   * an ABSOLUTE path. Identical precedence to the tool's `requireHome`.
   */
  home(name?: string, homeOverride?: string): string {
    const explicit = homeOverride ?? this.boundHome;
    if (explicit !== undefined) return resolve(explicit);
    const env = process.env.AGENT_HOME;
    if (env !== undefined && env !== '') return resolve(env);
    const n = name ?? this.boundName;
    if (n !== undefined) return homeForName(n);
    throw new Error(
      '--home <dir>, $AGENT_HOME, or --name <agent-name> is required',
    );
  }

  /** `--config` > `$AGENT_FACTORY_CONFIG` > a cwd-present `.agent-factory.config` > none. */
  private configPath(override?: string): string | undefined {
    return (
      override ??
      process.env.AGENT_FACTORY_CONFIG ??
      (existsSync('.agent-factory.config')
        ? '.agent-factory.config'
        : undefined)
    );
  }

  private nodeConfig(override?: string): NodeConfig {
    return loadNodeConfig(this.configPath(override));
  }

  /**
   * Provision a fresh home: mkdir + seed `{SEMANTIC.md, PROCEDURAL.md,
   * EPISODIC.jsonl}` IF-ABSENT (never clobbered). The seed name stamps the store
   * headings — explicit `name`, else the bound name, else the home's basename.
   */
  init(name?: string): InitResult {
    const home = this.home(name);
    const seedName = name ?? this.boundName ?? basename(home);
    mkdirSync(home, { recursive: true });
    const seeded: string[] = [];
    const present: string[] = [];
    for (const [fname, seedfn] of seedTemplates) {
      const file = join(home, fname);
      if (existsSync(file)) present.push(fname);
      else {
        writeFileSync(file, seedfn(seedName), 'utf8');
        seeded.push(fname);
      }
    }
    return { home, seeded, present };
  }

  /**
   * Append one open record + return its minted ULID. The session is bound BEFORE
   * capture ({@link resolveSession}: `entry.session` ▸ `$AGENT_SESSION_ID` ▸ the
   * sole live registered session; throws on none/ambiguous), so no record is
   * sessionless; `{host, cwd}` are DERIVED. Encode heartbeats its session.
   */
  encode(entry: EncodeEntry): string {
    const home = this.home();
    const session = resolveSession(home, { flag: entry.session });
    const store = new EpisodicStore({
      home,
      derive: { ...defaultDerive, session: () => session },
    });
    const rec = store.encode(
      {
        body: entry.body,
        ...(entry.tags !== undefined && entry.tags.length > 0
          ? { tags: entry.tags }
          : {}),
      },
      entry.path,
    );
    registerSession(home, session);
    return rec.id;
  }

  /**
   * List records under the query (or the whole log when empty). `under` keeps
   * same-host records whose `node(cwd)` sits under the boundary (foreign-host +
   * legacy records drop); `forSession` drops LIVE OTHER sessions' records.
   */
  read(query: ReadQuery = {}): EpisodicRecord[] {
    const home = this.home();
    const store = new EpisodicStore({ home });
    let records = store.read(query.path);

    if (query.scope !== undefined) {
      const scope = query.scope;
      records = records.filter(
        (r) => r.scope === scope || r.tags?.includes(scope),
      );
    }

    if (query.under !== undefined) {
      const under = canonical(resolve(query.under));
      const cfg = this.nodeConfig();
      records = records.filter((r) => {
        if (r.cwd === undefined) return false;
        if (r.host !== undefined && r.host !== cfg.currentHost) return false;
        const { node } = resolveNode(r.cwd, r.host, cfg);
        return underOrEqual(node, under);
      });
    }

    if (query.forSession !== undefined) {
      const forSession = query.forSession;
      const live =
        query.stale !== undefined
          ? liveSessions(home, Date.now(), query.stale)
          : liveSessions(home);
      records = records.filter(
        (r) =>
          r.session === undefined ||
          r.session === forSession ||
          !live.has(r.session),
      );
    }

    return records;
  }

  /** Resolve a path to its boundary node (nearest reflexive marker-holding ancestor). */
  node(path: string): NodeResolution {
    const cfg = this.nodeConfig();
    const { node, basis } = resolveNode(path, cfg.currentHost, cfg);
    return { node, basis };
  }

  /** Emit the deterministic dream routing manifest — one `{id, node, basis}` per record. */
  fold(path?: string): FoldEntry[] {
    const store = new EpisodicStore({ home: this.home() });
    return foldRecords(store.read(path), this.nodeConfig());
  }

  /** The dream mutual-exclusion lock on `<home>/dream.lock` (O_EXCL; stale > 2h stolen). */
  lock(action: 'acquire'): LockAcquire;
  lock(action: 'release'): LockRelease;
  lock(action: 'status'): LockStatus;
  lock(
    action: 'acquire' | 'release' | 'status',
  ): LockAcquire | LockRelease | LockStatus {
    const home = this.home();
    switch (action) {
      case 'acquire':
        return acquireLock(home);
      case 'release':
        return releaseLock(home);
      case 'status':
        return lockStatus(home);
    }
  }

  /**
   * The session-liveness registry. Mutating actions (`register`/`heartbeat`/
   * `release`) act on the CURRENT session — `opts.id` ▸ `$AGENT_SESSION_ID`;
   * `register` MINTS a uuid when neither is present (never sessionless).
   * `status`/`list` are read verbs.
   */
  session(
    action: 'register' | 'heartbeat' | 'release',
    opts?: { id?: string },
  ): SessionEntry;
  session(
    action: 'status',
    opts?: { id?: string; stale?: number },
  ): SessionStatus;
  session(action: 'list', opts?: { stale?: number }): SessionEntry[];
  session(
    action: 'begin',
    opts?: { id?: string; under?: string },
  ): SessionBegin;
  session(
    action: 'register' | 'heartbeat' | 'release' | 'status' | 'list' | 'begin',
    opts: { id?: string; stale?: number; under?: string } = {},
  ): SessionEntry | SessionStatus | SessionEntry[] | SessionBegin {
    const home = this.home();
    const staleArgs: [number, number] | [] =
      opts.stale !== undefined ? [Date.now(), opts.stale] : [];

    // The mutating verbs need a NAMED current session (you cannot touch one you
    // did not first name): `id` override ▸ $AGENT_SESSION_ID; throw if neither.
    const currentId = (): string => {
      const id = opts.id ?? defaultDerive.session();
      if (id === undefined)
        throw new Error(
          'no session id: set $AGENT_SESSION_ID or pass an id override',
        );
      return id;
    };

    switch (action) {
      case 'begin': {
        // The whole session-start sequence, kept INSIDE the strategy: this file
        // owns the home layout and the store format, so it is the only correct
        // place to decide whether a migration is owed. A caller composing these
        // primitives would have to know both.
        this.migrateIfOwed();
        const id = opts.id ?? defaultDerive.session() ?? randomUUID();
        // `begin` is the ONLY writer of origin — this is what makes "was I
        // woken?" answerable at all. Every other path (encode's heartbeat)
        // registers without it, and register PRESERVES it across re-register.
        const entry = this.toEntry(
          registerSession(home, id, { origin: 'wake' }),
        );
        // consolidationOwed is a BACKLOG predicate, and its name says so. It
        // used to be `audit().findings.length > 0` — a PURITY measure, which
        // meant a store could grow without bound and still report nothing owed,
        // and an un-drained EPISODIC raised no signal at all. Three causes now,
        // each of which a dream actually discharges: raw records waiting to be
        // folded, a store over its byte watermark (the `depalimpsest` trigger),
        // and scope pollution (the original signal, retained).
        const semantic = this.readStore('SEMANTIC');
        const procedural = this.readStore('PROCEDURAL');
        const episodic = this.read({
          forSession: entry.id,
          ...(opts.under ? { under: opts.under } : {}),
        });
        return {
          session: entry.id,
          semantic,
          procedural,
          episodic,
          consolidationOwed: this.consolidationOwed(),
          bytes: {
            semantic: Buffer.byteLength(semantic, 'utf8'),
            procedural: Buffer.byteLength(procedural, 'utf8'),
            episodic: episodic.reduce(
              (n, r) => n + Buffer.byteLength(JSON.stringify(r), 'utf8'),
              0,
            ),
          },
        };
      }
      case 'register': {
        // register is the one verb that MINTS an id when none is present.
        const id = opts.id ?? defaultDerive.session() ?? randomUUID();
        return this.toEntry(registerSession(home, id));
      }
      case 'heartbeat': {
        const id = currentId();
        const e = heartbeat(home, id);
        if (e === undefined) throw new Error(`unknown session: ${id}`);
        return this.toEntry(e);
      }
      case 'release': {
        const id = currentId();
        releaseSession(home, id);
        // Re-read the released entry's liveness to shape a SessionEntry.
        const s = sessionStatus(home, id, ...staleArgs);
        return { id, lastBeat: s.lastBeat ?? 0, released: s.released };
      }
      case 'status':
        return sessionStatus(home, currentId(), ...staleArgs);
      case 'list':
        return listSessions(home, ...staleArgs).map((s) => ({
          id: s.id,
          lastBeat: s.lastBeat ?? 0,
          released: s.released,
        }));
    }
  }

  /** Narrow the store's rich {@link SessionEntry} to the port's `{id, lastBeat, released}`. */
  private toEntry(e: {
    id: string;
    lastBeat: number;
    released?: boolean;
    origin?: 'wake';
  }): SessionEntry {
    return {
      id: e.id,
      lastBeat: e.lastBeat,
      released: e.released ?? false,
      ...(e.origin !== undefined ? { origin: e.origin } : {}),
    };
  }

  /**
   * The dreamer's post-consolidation clear: archive the raw log (verified) then
   * empty it, keeping only the newest `keep` archives. Liveness-aware — with
   * `completedOnly` (or `forSession`, which also drains the caller's own live S)
   * a LIVE OTHER session's records are RETAINED; no flag ⇒ the whole log drains.
   */
  drain(opts: DrainOptions = {}): DrainResult {
    const home = this.home();
    const keep = opts.keep ?? 5;
    if (!Number.isInteger(keep) || keep < 0)
      throw new Error('keep must be a non-negative integer');
    const store = new EpisodicStore({ home });

    let retain: ((rec: EpisodicRecord) => boolean) | undefined;
    if (opts.forSession !== undefined || opts.completedOnly === true) {
      const live = liveSessions(home);
      const forSession = opts.forSession;
      retain = (rec) =>
        rec.session !== undefined &&
        rec.session !== forSession &&
        live.has(rec.session);
    }

    return store.drain({
      keep,
      ...(opts.path !== undefined ? { path: opts.path } : {}),
      ...(retain !== undefined ? { retain } : {}),
    });
  }

  /** Read a prose store whole; absent reads as empty (a fresh home is not an error). */
  private readStore(store: 'SEMANTIC' | 'PROCEDURAL'): string {
    const p = join(this.home(), `${store}.md`);
    return existsSync(p) ? readFileSync(p, 'utf-8') : '';
  }

  /**
   * Is a dream owed? ONE home for the predicate — the shell-side nudge hook
   * previously computed its own backlog count by `awk`-ing the raw log, which
   * put a second home on the same concept and made a harness face read the
   * being's store layout.
   *
   * Owed on any of three, each of which a dream discharges: unfolded records
   * waiting in the raw log, a prose store over its byte watermark, or scope
   * pollution. Size is included because it is the trigger `depalimpsest` has
   * always lacked — a purity-only predicate reports a 39 KB store as clean.
   */
  consolidationOwed(opts: { backlogWatermark?: number } = {}): boolean {
    const backlogWatermark = opts.backlogWatermark ?? BACKLOG_WATERMARK;
    if (this.read().length >= backlogWatermark) return true;
    const report = this.audit();
    return report.pressure.length > 0 || report.findings.length > 0;
  }

  /**
   * Perform any store-format migration this strategy owes, idempotently. THIS is
   * where format knowledge belongs: the legacy markdown log predates the jsonl
   * stream, and only the strategy knows both. A caller that had to ask "is a
   * migration owed?" would be reasoning about a file format it must not see.
   */
  private migrateIfOwed(): void {
    const home = this.home();
    const legacy = join(home, 'EPISODIC.md');
    const current = join(home, 'EPISODIC.jsonl');
    if (existsSync(legacy) && !existsSync(current)) {
      this.migrate(legacy, current);
    }
  }

  /**
   * Land the agent's dream route DECISIONS (computed by the agent, handed in as
   * DATA). A listed record's decision is applied; an UNLISTED record is RETAINED
   * untouched (mapped to an EPISODIC target) — never dropped. The strategy owns
   * none of the reasoning; {@link applyRoutes} lands content + atomically compacts.
   */
  apply(decisions: RouteDecision[], path?: string): ApplyResult {
    const home = this.home();
    const byId = new Map<string, { targets: RouteDecision['targets'] }>();
    for (const d of decisions) byId.set(d.id, { targets: d.targets });
    const classifier = (rec: EpisodicRecord) =>
      byId.get(rec.id) ?? { targets: [{ store: 'EPISODIC' as StoreName }] };
    const store = new EpisodicStore({ home });
    return applyRoutes(store, path, classifier);
  }

  /**
   * Whole-file supersede of a resident prose store (the depalimpsest write):
   * overwrite `<home>/{SEMANTIC,PROCEDURAL}.md` with `body`. EPISODIC (the raw
   * log, not a whole-file prose store) is rejected loudly.
   */
  replace(store: 'SEMANTIC' | 'PROCEDURAL', body: string): void {
    const home = this.home();
    const file = resolveTarget(home, { store: store as StoreName });
    if (file === null)
      throw new Error(
        'replace targets a prose store (SEMANTIC | PROCEDURAL); EPISODIC is the raw log, not a whole-file prose store',
      );
    const text = body.endsWith('\n') ? body : `${body}\n`;
    // The SAME asymmetric predicate the CLI's `replaceGuarded` takes. This method
    // is the port implementation (`MemoryStrategy.replace`), a second write path
    // into the same file — and it took no ceiling at all, so the bound bound only
    // the path that happened to be exercised. A guard with a sibling entry point
    // that skips it is not a guard. Strict shrink still escapes: an over-ceiling
    // store must remain repairable, or the ceiling bricks it.
    const before = existsSync(file) ? statSync(file).size : 0;
    const after = Buffer.byteLength(text, 'utf8');
    if (refusesReplace(before, after))
      throw new Error(
        `${store}.md would be ${after}B, over the ${STORE_WATERMARK}B store ceiling, and is not a strict shrink from ${before}B. Refused — distil it smaller, or shrink first.`,
      );
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text, 'utf8');
  }

  /**
   * Dream's exit gate: scan `<home>/{SEMANTIC,PROCEDURAL}.md` for scope-pollution
   * markers. Allow-file resolution: `allowFile` ▸ `<home>/audit-allow.txt` ▸ none.
   * Repo keys are EXPLICIT (config + `repoKeys`), never sniffed.
   */
  audit(opts: AuditOptions = {}): AuditReport {
    const home = this.home();
    const defaultAllow = join(home, 'audit-allow.txt');
    const allowFile =
      opts.allowFile ?? (existsSync(defaultAllow) ? defaultAllow : undefined);
    const allowPins = allowFile !== undefined ? loadLines(allowFile) : [];

    const repoKeys: string[] = [...(opts.repoKeys ?? [])];
    const configPath = this.configPath(opts.configPath);
    if (configPath !== undefined && existsSync(configPath))
      repoKeys.push(...repoKeysFromConfig(configPath));

    const report = auditHome(home, {
      allowPins,
      repoKeys,
      ...(opts.watermark !== undefined ? { watermark: opts.watermark } : {}),
    });
    return {
      findings: report.findings,
      scanned: report.scanned,
      pinned: report.pinned.map((p) => p.match),
      stalePins: report.stalePins,
      pressure: report.pressure,
    };
  }

  /** Convert a markdown `EPISODIC.md` to `EPISODIC.jsonl` (no-loss gated). */
  migrate(src: string, dest: string, opts: MigrateOptions = {}): MigrateResult {
    const { itemCount, written } = migrateFile(src, dest, {
      dryRun: opts.dryRun === true,
      overwrite: opts.overwrite === true,
    });
    return { itemCount, written };
  }
}
