// ─────────────────────────────────────────────────────────────────────────────
// The memory capability PORT — the memory protocol's typed contract face.
//
// {@link MemoryStrategy} distills the standalone `memory` tool's verb surface
// (encode · read · session · audit · fold · drain · apply · replace · node ·
// home · migrate · init · lock) into ONE typed interface: each verb is a method.
// A MemoryStrategy instance is BOUND to a single agent home (resolved by the
// `home()` law below); every other verb acts on that home. This file is a pure
// INTERFACE surface — no implementation, no I/O, zero deps — so a runtime plugin
// (memory) supplies the one implementation and a runtime consumer codes
// against the contract. Every supporting type is defined HERE so the port decodes
// from this file alone.
// ─────────────────────────────────────────────────────────────────────────────

// ── Value types the verbs traffic in (self-contained; not imported) ──────────

/** Any JSON-serializable value — the open shape of a captured event body. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * One EPISODIC record as written at capture time — minimal and **open**. The
 * tool DERIVES `{session?, host, cwd}` from the process environment; the caller
 * supplies only `body` (and optional `tags`). Scope is NOT stored — it is
 * computed as `node(cwd)` at fold time, never captured. The `scope`/`path` fields
 * are inert v1-legacy data (they never route); `routes` is stamped only by a
 * dream pass on records it retains.
 */
export interface EpisodicRecord {
  /** ULID — lexicographically time-sortable; orders events in the log. */
  id: string;
  /** Harness session id, when the environment carries one. Derived. */
  session?: string;
  /** Short hostname at capture. Derived. Absent only on v1 records. */
  host?: string;
  /** Absolute working directory at capture. Derived. Absent only on v1 records. */
  cwd?: string;
  /** The open event payload — any JSON value. */
  body: JsonValue;
  /** Free refinement labels — refine, never route. */
  tags?: string[];
  /** v1 legacy routing tag — INERT data; the fold never consults it. */
  scope?: string;
  /** v1 legacy store-file selector — INERT data. */
  path?: string;
  /** Homes this record landed in after a dream pass — stamped only on retain. */
  routes?: string[];
}

/**
 * The persisted memory stores (the CoALA taxonomy's durable homes):
 *  - `SEMANTIC`   — identity facts + durable agent-intrinsic knowledge.
 *  - `PROCEDURAL` — generalized cross-project wisdom no projection already carries.
 *  - `EPISODIC`   — the raw forward-looking log; a target here means "retain".
 */
export type StoreName = 'SEMANTIC' | 'PROCEDURAL' | 'EPISODIC';

/**
 * One home a record's distilled content lands in. `content` appends to the
 * `SEMANTIC`/`PROCEDURAL` prose store; it is omitted for an `EPISODIC` target
 * (the raw record simply stays put).
 */
export interface RouteTarget {
  store: StoreName;
  content?: string;
}

/**
 * The agent's dream verdict for one record, addressed by id — the set of homes
 * it splits to. One target routes to a single store; ≥2 splits it to several; an
 * empty target set drops it. A verdict that omits this record's id retains the
 * record untouched.
 */
export interface RouteDecision {
  id: string;
  targets: RouteTarget[];
}

// ── Per-verb option + result envelopes ───────────────────────────────────────

/** `encode` input: the caller supplies only the body (+ optional refinements). */
export interface EncodeEntry {
  body: JsonValue;
  tags?: string[];
  /** Explicit session override; else the tool derives + binds the live one. */
  session?: string;
  /** Alternate log path override (defaults to the home's EPISODIC.jsonl). */
  path?: string;
}

/** `read` filters — all orthogonal and optional; absent ⇒ the whole log. */
export interface ReadQuery {
  /** Same-host records whose `node(cwd)` sits under this boundary node. */
  under?: string;
  /** Liveness filter: exclude records of a LIVE OTHER session (own + completed pass). */
  forSession?: string;
  /** Inert-field label filter (compat) — never routes. */
  scope?: string;
  /** Liveness staleness window override, in ms (default 2h). */
  stale?: number;
  /** Alternate log path override. */
  path?: string;
}

/** A path resolved to its boundary node, with the marker that decided it. */
export interface NodeResolution {
  /** The boundary node — the nearest marker-holding ancestor (reflexive). */
  node: string;
  /** Which marker (`.git`, a manifest, `PLAN.md`, `$HOME`, …) decided the node. */
  basis: string;
}

/** One `fold` manifest line: a record mapped to its computed scope node. */
export interface FoldEntry {
  id: string;
  node: string;
  basis: string;
}

/** `session` liveness — a session is live iff registered ∧ not released ∧ fresh. */
export type SessionState = 'live' | 'completed' | 'absent';

/** A registered session's registry entry. */
export interface SessionEntry {
  id: string;
  /** Epoch-ms of the last heartbeat (encode is a heartbeat). */
  lastBeat: number;
  /** Whether the session was cleanly released. */
  released: boolean;
  /**
   * `wake` iff the session ran the reconstitution ritual. Absent means it was
   * registered as a side effect of a write — every encode registers, so without
   * this an encode-only session is indistinguishable from a woken one.
   */
  origin?: 'wake';
}

/** A session's resolved liveness at a point in time. */
export interface SessionStatus {
  id: string;
  state: SessionState;
  lastBeat?: number;
  released?: boolean;
  /** `wake` iff this session was reconstituted; absent ⇒ it was not. */
  origin?: 'wake';
}

/** `lock acquire` outcome on `<home>/dream.lock` (O_EXCL; stale > 2h stolen). */
export interface LockAcquire {
  acquired: boolean;
  /** True when acquisition stole a stale lock. */
  stolen?: boolean;
  /** Age of the observed lock, in ms. */
  ageMs?: number;
  /** The prior holder, when recorded. */
  holder?: string;
}

/** `lock release` outcome. */
export interface LockRelease {
  released: boolean;
}

/** `lock status` — whether the dream lock is currently held. */
export interface LockStatus {
  held: boolean;
  ageMs?: number;
  holder?: string;
}

/** `drain` outcome: the archive written (or null if the log was empty) + retention. */
export interface DrainResult {
  /** Path of the archive written, or null when there was nothing to archive. */
  archived: string | null;
  /** How many records were drained. */
  records: number;
  /** Archives retained under `.bak/` (newest `keep`). */
  kept: string[];
  /** Archives pruned. */
  pruned: string[];
}

/** `drain` retention policy — liveness-aware, matching the tool's flags. */
export interface DrainOptions {
  /** Newest N archives to retain under `.bak/` (default 5). */
  keep?: number;
  /** Alternate log path override. */
  path?: string;
  /** Drain only completed sessions, retaining LIVE OTHER records. */
  completedOnly?: boolean;
  /** Drain completed + the caller's own live session S, retaining other live ones. */
  forSession?: string;
}

/** `apply` outcome: what the mechanical write-back consumed / retained / landed. */
export interface ApplyResult {
  /** Ids of records removed by compaction after their content landed. */
  consumed: string[];
  /** Ids of records kept in the raw log. */
  retained: string[];
  /** Home files content landed in. */
  landed: string[];
}

/** One `audit` finding — a scope-pollution hit in a prose store. */
export interface AuditFinding {
  /** The store file the hit is in. */
  file: string;
  /** 1-based line number of the hit. */
  line: number;
  /** The finding class (the marker category matched). */
  cls: string;
  /** The offending matched text. */
  match: string;
}

/** `audit` report over `<home>/{SEMANTIC,PROCEDURAL}.md` — dream's exit gate. */
/**
 * A store over the size at which loading it whole stays affordable. NOT an
 * {@link AuditFinding}: nothing in the file is wrong, so it carries no line and
 * no matched text — it is a property of the store rather than of a line in it.
 */
export interface StorePressure {
  file: string;
  bytes: number;
  /** The byte watermark it exceeded. */
  watermark: number;
}

export interface AuditReport {
  findings: AuditFinding[];
  /** Files scanned. */
  scanned: string[];
  /** Allow-pinned findings (reported, not failing). */
  pinned: string[];
  /** Allow pins that matched nothing (the ratchet shrinks these at review). */
  stalePins: string[];
  /**
   * Stores over the byte watermark. This is the QUANTITY signal the report
   * previously lacked: every other field is a purity predicate, so a store
   * could grow without bound and still audit clean — leaving `depalimpsest`
   * with no condition that could ever fire it.
   */
  pressure: StorePressure[];
}

/** `audit` inputs — allow-file, repo keys, and node config, all explicit. */
export interface AuditOptions {
  /** Allow-file path; else `<home>/audit-allow.txt` if present; else none. */
  allowFile?: string;
  /** Byte watermark per store; the strategy supplies the default. */
  watermark?: number;
  /** Repo-specific keys the detector treats as expected (never sniffed). */
  repoKeys?: string[];
  /** Node-marker config path (`.cratylus.config`) override. */
  configPath?: string;
}

/** `migrate` outcome: a markdown EPISODIC.md converted to EPISODIC.jsonl. */
export interface MigrateResult {
  /** How many items were parsed. */
  itemCount: number;
  /** Whether the destination was written (false on a dry run). */
  written: boolean;
}

/** `migrate` options. */
export interface MigrateOptions {
  dryRun?: boolean;
  overwrite?: boolean;
}

/** `init` outcome: a provisioned home + which stores were seeded vs already present. */
export interface InitResult {
  /** The resolved home directory. */
  home: string;
  /** Store files freshly seeded. */
  seeded: string[];
  /** Store files already present and left untouched (never clobbered). */
  present: string[];
}

// ── The port ─────────────────────────────────────────────────────────────────

/**
 * The memory capability port: the memory protocol's verb surface as one typed
 * contract. Each method is a memory verb; a strategy INSTANCE is bound to a
 * single agent home (see {@link MemoryStrategy.home}) and every verb acts on it.
 * An LLM agent cannot hand-mint a ULID or reason its own scope, so both are the
 * strategy's job (`encode` mints the id and derives `{session, host, cwd}`;
 * `node`/`fold` compute scope). Implemented by the memory runtime plugin;
 * this port owns none of the mechanism, only its shape.
 */
/**
 * Everything a WAKING session needs, resolved BY the strategy.
 *
 * This exists so a caller never composes primitives to wake. Composition is what
 * leaks strategy: to assemble a wake from `home` + `migrate` + `session register`
 * + `read`, a caller must know that memory HAS a home path, that it may need a
 * format migration, and how scope is computed — none of which survives a different
 * strategy (a remote or vector-backed memory has no home path and nothing to
 * migrate). The strategy binds its own home, performs whatever preparation it
 * requires, and returns the state to load.
 */
export interface SessionBegin {
  /** The registered session id (minted when absent — never sessionless). */
  readonly session: string;
  /** Identity + durable agent-intrinsic knowledge, whole. */
  readonly semantic: string;
  /** Generalized cross-project wisdom, whole. */
  readonly procedural: string;
  /** The raw stream this session may see, already scoped by the strategy. */
  readonly episodic: readonly EpisodicRecord[];
  /** Consolidation is owed before proceeding (a crashed/undreamt predecessor). */
  readonly consolidationOwed: boolean;
  /**
   * What this wake COST, per partition, in bytes. Wake loads the prose stores
   * whole, so their size is a per-session context cost rather than a disk one —
   * and it was previously invisible at the only moment it could be acted on.
   * Reporting it keeps the strategy the sole decider of what a wake contains
   * (a caller still never composes primitives to wake) while making the price
   * of that decision legible to the agent paying it.
   */
  readonly bytes: {
    readonly semantic: number;
    readonly procedural: number;
    readonly episodic: number;
  };
}

export interface MemoryStrategy {
  /**
   * Resolve the agent home this strategy binds to — the strategy's LAW, applied
   * override-first with an intelligent default:
   *
   *   `homeOverride` (explicit `--home`) ▸ `$AGENT_HOME` env ▸ `name` ⇒ `~/.agents/<name>`
   *
   * An explicit home wins; else the deployment's `$AGENT_HOME`; else a bare
   * `name` derives the canonical uv-tool-style `~/.agents/<name>`. At least one
   * source MUST be present — the strategy throws when none resolves. Returns the
   * resolved ABSOLUTE home path (no hardcoded path in any caller).
   */
  home(name?: string, homeOverride?: string): string;

  /**
   * Provision a fresh home: create the dir and seed the `{SEMANTIC.md,
   * PROCEDURAL.md, EPISODIC.jsonl}` stores IF-ABSENT (an existing store is never
   * clobbered). The seed name stamps the store headings.
   */
  init(name?: string): InitResult;

  /**
   * Append one open record to the home log and return its minted ULID. The tool
   * derives `{session, host, cwd}` (never caller-supplied) and binds the session
   * before capture (never sessionless); encode also heartbeats that session.
   */
  encode(entry: EncodeEntry): string;

  /**
   * List records from the home log under the given orthogonal filters (or the
   * whole log when none are set). Foreign-host and legacy records are excluded
   * from an `under` query; the liveness filter drops LIVE OTHER sessions.
   */
  read(query?: ReadQuery): EpisodicRecord[];

  /**
   * Resolve a path to its boundary node: the nearest ancestor (reflexive)
   * holding a marker (`.git`, a package manifest, `PLAN.md`, or `$HOME`;
   * extensible via node config). Markerless ⇒ the path is its own boundary.
   */
  node(path: string): NodeResolution;

  /**
   * Emit the deterministic dream routing manifest — one `{id, node, basis}` line
   * per record in log order. Records without `cwd` fold to the `legacy` bucket.
   */
  fold(path?: string): FoldEntry[];

  /**
   * The dream mutual-exclusion lock on `<home>/dream.lock`. `acquire` is O_EXCL
   * and steals a lock older than 2h; `release` frees it; `status` reports it.
   */
  lock(action: 'acquire'): LockAcquire;
  lock(action: 'release'): LockRelease;
  lock(action: 'status'): LockStatus;

  /**
   * The session-liveness registry (one file per session). The mutating actions
   * act on the CURRENT session (id derived from the environment, or `id`
   * override). `register` MINTS an id when none is present; `status`/`list` are
   * read verbs. A session is live iff registered ∧ not released ∧ fresh (< 2h).
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
  /**
   * Begin a session: prepare this agent's memory and return what to load. The
   * ONE verb a wake protocol calls — see {@link SessionBegin} for why the
   * primitives must not be composed by the caller.
   */
  session(
    action: 'begin',
    opts?: { id?: string; under?: string },
  ): SessionBegin;

  /**
   * The dreamer's post-consolidation clear: archive the raw log (verified) then
   * empty it, keeping only the newest `keep` archives. Liveness-aware — LIVE
   * OTHER records are retained; every completed session drains together.
   */
  drain(opts?: DrainOptions): DrainResult;

  /**
   * Land the agent's dream route DECISIONS (computed by the agent, handed in as
   * DATA). A listed record's decision is applied (content appends to prose
   * stores; an EPISODIC target retains it; an empty target set drops it); an
   * UNLISTED record is retained untouched — never dropped. The strategy owns none
   * of the reasoning; it only executes + compacts.
   */
  apply(decisions: RouteDecision[], path?: string): ApplyResult;

  /**
   * Whole-file supersede of a resident prose store (the depalimpsest write):
   * overwrite `<home>/{SEMANTIC,PROCEDURAL}.md` with `body`. `EPISODIC` (the raw
   * log, not a whole-file prose store) is rejected loudly.
   */
  replace(store: 'SEMANTIC' | 'PROCEDURAL', body: string): void;

  /**
   * Dream's exit gate: scan `<home>/{SEMANTIC,PROCEDURAL}.md` for scope-pollution
   * markers, reporting each unpinned hit. Allow-file resolution: `allowFile` ▸
   * `<home>/audit-allow.txt` ▸ none. Repo keys are EXPLICIT (never sniffed).
   */
  audit(opts?: AuditOptions): AuditReport;

  /**
   * Convert a markdown `EPISODIC.md` to `EPISODIC.jsonl` (no-loss gated).
   */
  migrate(src: string, dest: string, opts?: MigrateOptions): MigrateResult;
}
