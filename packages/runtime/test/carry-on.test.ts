// carry-on capability — the turn-end GATE that makes an elevation a mechanism.
//
// The acceptance this suite holds, leg by leg:
//   (1) TERMINUS IS READ FROM DISK. All four disjuncts, over a plan set the test
//       builds in a tmpdir — including the fourth (`sharded ∧ ¬done ∧ frontier = ∅`),
//       whose absence is what wedges a session on a mis-cut plan forever.
//   (2) NOTHING READS A TRANSCRIPT. A source-level gate over every file of the
//       capability: no transcript path, no stdin slurp, no message text. This is the
//       property the predecessor mechanism lacked, and the one its mis-fires came from.
//   (3) ELEVATE CANNOT SUCCEED UN-INSTALLED. Driven with a host whose `install` is a
//       no-op — the planted defect — `elevate` REFUSES rather than reporting an
//       elevation nothing enforces.
//   (4) REVERT REMOVES EXACTLY WHAT ELEVATE INSTALLED. Foreign top-level keys and
//       foreign entries under the same event survive; the file comes back
//       byte-for-byte, with no bare `hooks: {}` residue.
//   (5) STATUS DERIVES FROM THE TARGET. A separate dispatch call — no shared memory —
//       recovers the gate AND the layout it was elevated with.
//   (6) DAG GUARD. The capability imports nothing from any sibling package.

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  type CarryOnResult,
  dispatchCarryOn,
} from '../src/capabilities/carry-on/index.js';
import {
  type PlanLayout,
  terminusOf,
} from '../src/capabilities/carry-on/terminus.js';
import { runMain } from '../src/main.js';
import type {
  CarryOnHost,
  CarryOnStatus,
  TurnGate,
} from '../src/ports/carry-on.js';
import type { RuntimeConfig } from '../src/runtime-config.js';

const here = dirname(fileURLToPath(import.meta.url));
const CAP_DIR = join(here, '..', 'src', 'capabilities', 'carry-on');

/** The host config a deployed host carries — injected, never written to a real one. */
const CONFIG: RuntimeConfig = {
  capabilities: [],
  events: {
    vocabulary: ['turn.end', 'session.start'],
    native: { 'turn.end': 'Stop', 'session.start': 'SessionStart' },
  },
};

/** The plan vocabulary canon projects. Spelled here as the CELL spells it, because
 *  this package must not know it — a test that imported canon's tuple would be
 *  asserting the runtime knows something it is forbidden to know. */
const STATES = ['pending', 'ready', 'active', 'completed'];
const FRONTIER = ['ready', 'active'];
const BOUND = '.bound';
const RULING_OWED = '.ruling-owed';

/** Build a plan set: `<root>/<plan>/<state>/<shard>` plus any markers. */
function plantPlan(
  root: string,
  plan: string,
  shards: Readonly<Record<string, string[]>>,
  markers: readonly string[] = [],
): void {
  for (const state of STATES) {
    mkdirSync(join(root, plan, state), { recursive: true });
    for (const shard of shards[state] ?? []) {
      writeFileSync(join(root, plan, state, shard), `# ${shard}\n`);
    }
  }
  for (const marker of markers) {
    writeFileSync(join(root, plan, marker), 'planted\n');
  }
}

function layoutFor(root: string): PlanLayout {
  return {
    root,
    states: STATES,
    completed: 'completed',
    frontier: FRONTIER,
    boundMarker: BOUND,
    rulingOwedMarker: RULING_OWED,
  };
}

function layoutFlags(root: string): string[] {
  return [
    '--plan-root',
    root,
    '--states',
    STATES.join(','),
    '--completed',
    'completed',
    '--frontier',
    FRONTIER.join(','),
    '--bound-marker',
    BOUND,
    '--ruling-owed-marker',
    RULING_OWED,
  ];
}

const tmpRoot = (): string => mkdtempSync(join(tmpdir(), 'carry-on-'));

// ── (1) the predicate, disjunct by disjunct ──────────────────────────────────────

describe('terminus — four disjuncts, all read from plan state on disk', () => {
  it('¬∃P: bound(P) ⇒ terminus (nothing is elevated)', () => {
    const root = tmpRoot();
    plantPlan(root, 'alpha', { ready: ['t1.md'] }); // no `.bound`
    const readout = terminusOf(layoutFor(root));
    expect(readout).toMatchObject({ terminus: true, ground: 'unbound' });
    expect(readout.plan).toBeUndefined();
  });

  it('done(P) ⇒ terminus (open states empty ∧ completed non-empty)', () => {
    const root = tmpRoot();
    plantPlan(root, 'alpha', { completed: ['t1.md', 't2.md'] }, [BOUND]);
    expect(terminusOf(layoutFor(root))).toMatchObject({
      terminus: true,
      ground: 'done',
      plan: 'alpha',
    });
  });

  it('ruling-owed(P) ⇒ terminus, and the marker text reaches the readout', () => {
    const root = tmpRoot();
    plantPlan(root, 'alpha', { ready: ['t1.md'] }, [BOUND]);
    writeFileSync(
      join(root, 'alpha', RULING_OWED),
      'rename the public export or keep the alias?\n',
    );
    const readout = terminusOf(layoutFor(root));
    expect(readout).toMatchObject({ terminus: true, ground: 'ruling-owed' });
    // The fork the principal surfaced is IN the readout: a refusal that named no
    // fork would send the operator back to the transcript to find it.
    expect(readout.detail).toContain('rename the public export');
  });

  it('sharded ∧ ¬done ∧ frontier = ∅ ⇒ terminus AND says the cut is ill-formed', () => {
    const root = tmpRoot();
    // Every shard pending, nothing ready or active: a cycle or an unsatisfiable dep.
    plantPlan(root, 'alpha', { pending: ['t1.md', 't2.md'] }, [BOUND]);
    const readout = terminusOf(layoutFor(root));
    expect(readout).toMatchObject({ terminus: true, ground: 'ill-formed' });
    expect(readout.detail).toContain('SURFACE');
  });

  it('an in-flight plan is NOT at its terminus', () => {
    const root = tmpRoot();
    plantPlan(
      root,
      'alpha',
      { pending: ['t2.md'], active: ['t1.md'], completed: ['t0.md'] },
      [BOUND],
    );
    expect(terminusOf(layoutFor(root))).toMatchObject({
      terminus: false,
      ground: 'in-flight',
      plan: 'alpha',
    });
  });

  it('a bound but UNCUT plan is in-flight — the cut is owed, not a terminus', () => {
    const root = tmpRoot();
    plantPlan(root, 'alpha', {}, [BOUND]);
    const readout = terminusOf(layoutFor(root));
    expect(readout.terminus).toBe(false);
    expect(readout.detail).toContain('cut is owed');
  });

  // ── CONVICTING: the fourth disjunct BITES ──────────────────────────────────────
  it('is non-vacuous — without the fourth disjunct the SAME corpus reads in-flight forever', () => {
    const root = tmpRoot();
    plantPlan(root, 'alpha', { pending: ['t1.md'] }, [BOUND]);
    const layout = layoutFor(root);

    // The planted defect: a layout whose frontier is EMPTY of states is exactly the
    // shape a predicate missing the fourth disjunct has — nothing is ever workable,
    // so `¬done` alone would block every turn end for the rest of the session.
    const blind: PlanLayout = { ...layout, frontier: [] };
    expect(terminusOf(blind).ground).toBe('ill-formed');
    expect(terminusOf(blind).terminus).toBe(true);

    // …and the control: the same shard ON the frontier reads in-flight through the
    // SAME predicate, so the disjunct is not a blanket "always terminus".
    const moved = tmpRoot();
    plantPlan(moved, 'alpha', { ready: ['t1.md'] }, [BOUND]);
    expect(terminusOf(layoutFor(moved))).toMatchObject({
      terminus: false,
      ground: 'in-flight',
    });
  });
});

// ── (2) the property the predecessor lacked ──────────────────────────────────────

/** Signals that a source reads the conversation rather than the plan set. */
const TRANSCRIPT_READ =
  /transcript|stop_hook_active|assistant_message|\bstdin\b|readFileSync\(0/i;

/** The source with comments removed — the USE/MENTION line this corpus already
 *  draws (`command-veracity.test.ts`). Every one of these files EXPLAINS that it
 *  reads no transcript, and a gate that convicted the explanation would force the
 *  reasoning out of the source to stay green. */
function codeOf(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

/** Every `.ts` under `dir`, recursively. */
function sourcesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...sourcesUnder(p));
    else if (e.name.endsWith('.ts')) out.push(p);
  }
  return out;
}

describe('the gate reads PLAN STATE, never a transcript', () => {
  it('no capability source reads the conversation', () => {
    const files = sourcesUnder(CAP_DIR);
    expect(files.length, 'the source read is DARK').toBeGreaterThanOrEqual(4);
    for (const f of files) {
      expect(
        TRANSCRIPT_READ.test(codeOf(readFileSync(f, 'utf-8'))),
        `${f} reads turn text — the bound condition is a predicate over plan state`,
      ).toBe(false);
    }
  });

  it('is non-vacuous — the same predicate FLAGS a source that does read one', () => {
    expect(
      TRANSCRIPT_READ.test(
        codeOf(
          "const t = JSON.parse(input).transcript_path; readFileSync(t, 'utf8');",
        ),
      ),
    ).toBe(true);
    expect(
      TRANSCRIPT_READ.test(codeOf('if (payload.stop_hook_active) return;')),
    ).toBe(true);
    // …and the use/mention line is drawn where it must be: the SAME text in a
    // comment passes, in code fails. Without this, `codeOf` could be stripping
    // everything and the leg above would be dark.
    expect(TRANSCRIPT_READ.test(codeOf('// reads no transcript, ever'))).toBe(
      false,
    );
    expect(TRANSCRIPT_READ.test(codeOf('read(transcriptPath);'))).toBe(true);
  });
});

// ── (3) elevate cannot succeed un-installed ──────────────────────────────────────

/** A host whose `install` does nothing — the planted defect. Exactly the shape of an
 *  unwritable target, a stub port, or a settings file rewritten underneath us. */
class DeafHost implements CarryOnHost {
  installs = 0;
  install(_gate: TurnGate): void {
    this.installs++;
  }
  remove(): void {}
  status(): CarryOnStatus {
    return { attached: false };
  }
}

describe('elevate — the elevation is a mechanism or it is nothing', () => {
  it('REFUSES when the gate did not attach, rather than reporting an elevation', () => {
    const root = tmpRoot();
    plantPlan(root, 'alpha', { ready: ['t1.md'] }, [BOUND]);
    const host = new DeafHost();
    expect(() =>
      dispatchCarryOn(
        ['elevate', '--event', 'turn.end', ...layoutFlags(root)],
        { host, config: CONFIG },
      ),
    ).toThrow(/REFUSING to report an elevation/);
    // The defect really was exercised: install WAS called, and the refusal came
    // from reading the target back — not from never having tried.
    expect(host.installs).toBe(1);
  });

  it('REFUSES to elevate at a terminus — there is nothing to stay out of the loop for', () => {
    const root = tmpRoot();
    plantPlan(root, 'alpha', { completed: ['t1.md'] }, [BOUND]);
    expect(() =>
      dispatchCarryOn(
        ['elevate', '--event', 'turn.end', ...layoutFlags(root)],
        {
          host: new DeafHost(),
          config: CONFIG,
        },
      ),
    ).toThrow(/already at its terminus \(done\)/);
  });

  it('REFUSES a half-configured layout, naming the flag and canon as its home', () => {
    expect(() =>
      dispatchCarryOn(
        ['elevate', '--event', 'turn.end', '--plan-root', '/tmp/x'],
        {
          host: new DeafHost(),
          config: CONFIG,
        },
      ),
    ).toThrow(/--states is required[\s\S]*plan-states\.ts/);
  });

  it('REFUSES an event this harness cannot fire', () => {
    const root = tmpRoot();
    plantPlan(root, 'alpha', { ready: ['t1.md'] }, [BOUND]);
    expect(() =>
      dispatchCarryOn(
        ['elevate', '--event', 'not.an.event', ...layoutFlags(root)],
        { host: new DeafHost(), config: CONFIG },
      ),
    ).toThrow(/unknown lifecycle event/);
  });
});

// ── (4) + (5) install / release / status against a real settings.json ────────────

interface HookEntry {
  matcher?: string;
  hooks: Array<{ type: string; command?: string; id?: string }>;
}

const FOREIGN = {
  permissions: { allow: ['Bash(ls:*)'] },
  hooks: {
    Stop: [
      {
        hooks: [
          { type: 'command', command: 'echo foreign', id: 'someone-else' },
        ],
      },
    ],
    SessionStart: [{ hooks: [{ type: 'command', command: 'echo hi' }] }],
  },
};

function settingsFixture(): { settings: string; original: string } {
  const dir = tmpRoot();
  mkdirSync(join(dir, '.claude'), { recursive: true });
  const settings = join(dir, '.claude', 'settings.json');
  const original = `${JSON.stringify(FOREIGN, null, 2)}\n`;
  writeFileSync(settings, original);
  return { settings, original };
}

describe('elevate ∘ revert — zero residue, foreign preserved', () => {
  it('elevate merges ONE gate under the native turn-end event, preserving foreign', () => {
    const { settings } = settingsFixture();
    const root = tmpRoot();
    plantPlan(root, 'alpha', { ready: ['t1.md'] }, [BOUND]);

    const result = dispatchCarryOn(
      [
        'elevate',
        '--event',
        'turn.end',
        '--settings',
        settings,
        ...layoutFlags(root),
      ],
      { config: CONFIG },
    ) as Extract<CarryOnResult, { verb: 'elevate' }>;

    expect(result).toMatchObject({
      verb: 'elevate',
      plan: 'alpha',
      attached: true,
    });
    const doc = JSON.parse(readFileSync(settings, 'utf-8')) as {
      permissions: unknown;
      hooks: Record<string, HookEntry[]>;
    };
    expect(doc.permissions).toEqual(FOREIGN.permissions);
    expect(doc.hooks.SessionStart).toEqual(FOREIGN.hooks.SessionStart);
    // The foreign Stop entry survives beside ours.
    const stop = doc.hooks.Stop ?? [];
    expect(stop).toHaveLength(2);
    expect(stop[0]?.hooks[0]?.id).toBe('someone-else');
    const ours = stop[1]?.hooks[0];
    expect(ours?.id).toMatch(/-carry-on$/);
    expect(ours?.command).toContain('carryOn terminus');
    expect(ours?.command).toContain(root);
  });

  it('elevating twice leaves ONE gate, not two', () => {
    const { settings } = settingsFixture();
    const root = tmpRoot();
    plantPlan(root, 'alpha', { ready: ['t1.md'] }, [BOUND]);
    const argv = [
      'elevate',
      '--event',
      'turn.end',
      '--settings',
      settings,
      ...layoutFlags(root),
    ];
    dispatchCarryOn(argv, { config: CONFIG });
    dispatchCarryOn(argv, { config: CONFIG });
    const doc = JSON.parse(readFileSync(settings, 'utf-8')) as {
      hooks: Record<string, HookEntry[]>;
    };
    expect(doc.hooks.Stop).toHaveLength(2); // the foreign one + exactly one of ours
  });

  it('revert restores the target byte-for-byte', () => {
    const { settings, original } = settingsFixture();
    const root = tmpRoot();
    plantPlan(root, 'alpha', { ready: ['t1.md'] }, [BOUND]);
    dispatchCarryOn(
      [
        'elevate',
        '--event',
        'turn.end',
        '--settings',
        settings,
        ...layoutFlags(root),
      ],
      { config: CONFIG },
    );
    expect(readFileSync(settings, 'utf-8')).not.toBe(original);
    dispatchCarryOn(['revert', '--settings', settings]);
    expect(readFileSync(settings, 'utf-8')).toBe(original);
  });

  it('revert leaves NO bare `hooks: {}` when the target had none of its own', () => {
    const dir = tmpRoot();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    const settings = join(dir, '.claude', 'settings.json');
    const original = `${JSON.stringify({ env: { A: '1' } }, null, 2)}\n`;
    writeFileSync(settings, original);
    const root = tmpRoot();
    plantPlan(root, 'alpha', { ready: ['t1.md'] }, [BOUND]);

    dispatchCarryOn(
      [
        'elevate',
        '--event',
        'turn.end',
        '--settings',
        settings,
        ...layoutFlags(root),
      ],
      { config: CONFIG },
    );
    dispatchCarryOn(['revert', '--settings', settings]);
    const doc = JSON.parse(readFileSync(settings, 'utf-8')) as Record<
      string,
      unknown
    >;
    expect('hooks' in doc).toBe(false);
    expect(readFileSync(settings, 'utf-8')).toBe(original);
  });

  it('revert works with NO host config — a gate you cannot lift is a trap', () => {
    const { settings, original } = settingsFixture();
    const root = tmpRoot();
    plantPlan(root, 'alpha', { ready: ['t1.md'] }, [BOUND]);
    dispatchCarryOn(
      [
        'elevate',
        '--event',
        'turn.end',
        '--settings',
        settings,
        ...layoutFlags(root),
      ],
      { config: CONFIG },
    );
    // `config: null` — the deploy-emitted config is gone; release must still work.
    expect(
      dispatchCarryOn(['revert', '--settings', settings], { config: null }),
    ).toEqual({
      verb: 'revert',
      attached: false,
    });
    expect(readFileSync(settings, 'utf-8')).toBe(original);
  });

  it('status and terminus derive from the TARGET, across separate dispatch calls', () => {
    const { settings } = settingsFixture();
    const root = tmpRoot();
    plantPlan(root, 'alpha', { active: ['t1.md'] }, [BOUND]);
    dispatchCarryOn(
      [
        'elevate',
        '--event',
        'turn.end',
        '--settings',
        settings,
        ...layoutFlags(root),
      ],
      { config: CONFIG },
    );

    // A fresh call, carrying NO layout: it recovers the elevation's own terms from
    // the installed gate command.
    expect(dispatchCarryOn(['status', '--settings', settings])).toMatchObject({
      verb: 'status',
      attached: true,
      plan: 'alpha',
      ground: 'in-flight',
    });
    const verdict = dispatchCarryOn([
      'terminus',
      '--settings',
      settings,
    ]) as Extract<CarryOnResult, { verb: 'terminus' }>;
    expect(verdict.terminus).toBe(false);
    // THE REFUSAL ITSELF: the harness's turn-end protocol payload.
    expect(verdict.decision).toBe('block');
    expect(verdict.reason).toContain('NOT at its terminus');

    // …and over a DONE plan the same verb allows the stop — the block is a verdict
    // about the plan set, not a constant.
    const done = tmpRoot();
    plantPlan(done, 'alpha', { completed: ['t1.md'] }, [BOUND]);
    const allowed = dispatchCarryOn([
      'terminus',
      ...layoutFlags(done),
    ]) as Extract<CarryOnResult, { verb: 'terminus' }>;
    expect(allowed.terminus).toBe(true);
    expect(allowed.decision).toBeUndefined();
  });

  it('status on an un-elevated host says so, and terminus REFUSES rather than guessing', () => {
    const { settings } = settingsFixture();
    expect(dispatchCarryOn(['status', '--settings', settings])).toEqual({
      verb: 'status',
      attached: false,
    });
    expect(() => dispatchCarryOn(['terminus', '--settings', settings])).toThrow(
      /no plan layout/,
    );
  });

  it('rejects an unknown verb loudly', () => {
    expect(() => dispatchCarryOn(['persist'])).toThrow(
      /unknown verb 'persist'/,
    );
  });
});

// ── the bin ROUTE — the capability is reachable by the word the shim spawns ──────
//
// The projected shim runs `<RUNTIME_BIN> carryOn <verb>`. If the bin does not route
// that word, every verb dies `unknown capability` for every agent coming through
// the skill — the exact failure that once made the event tap operator-only.

describe('the runtime bin routes the capability word the shim spawns', () => {
  it('`carryOn status` reaches the verb surface and exits 0', async () => {
    const { settings } = settingsFixture();
    const written: string[] = [];
    const out = process.stdout.write.bind(process.stdout);
    const prevCode = process.exitCode;
    process.stdout.write = ((chunk: string) => {
      written.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;
    try {
      await runMain(['carryOn', 'status', '--settings', settings]);
    } finally {
      process.stdout.write = out;
    }
    expect(process.exitCode).toBe(0);
    process.exitCode = prevCode;
    expect(JSON.parse(written.join(''))).toEqual({
      verb: 'status',
      attached: false,
    });
  });
});

// ── (6) the DAG guard ────────────────────────────────────────────────────────────

describe('the capability depends on nothing', () => {
  it('imports no sibling package', () => {
    const files = sourcesUnder(CAP_DIR);
    expect(existsSync(CAP_DIR)).toBe(true);
    for (const f of files) {
      expect(
        readFileSync(f, 'utf-8'),
        `${f} imports a sibling package — runtime depends on nothing`,
      ).not.toMatch(/from '@cratylus\//);
    }
  });
});
