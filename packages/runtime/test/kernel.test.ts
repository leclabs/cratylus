import { describe, expect, it } from 'vitest';
import { dispatch, parseArgs, verbsOf } from '../src/dispatch.js';
import type { VerbArgs } from '../src/dispatch.js';
import {
  RuntimeHost,
  UnknownCapabilityError,
  bootstrap,
  capabilitiesOf,
  discover,
} from '../src/loader.js';
import { defineRuntimePlugin } from '../src/plugin.js';
import type { EventTapHost } from '../src/ports/event-tap.js';
import type { MemoryStrategy } from '../src/ports/memory.js';

// ── A FAKE capability plugin (the falsifier's instrument) ────────────────────

// A fully-typed fake eventTap (4-verb port) that records the args each verb saw,
// so a dispatch can be PROVEN to reach the method and return its result.
function fakeEventTapPlugin() {
  const seen: { verb: string; args: VerbArgs }[] = [];
  const eventTap: EventTapHost = {
    install() {},
    remove() {},
    readCapture() {
      return [];
    },
    status() {
      // Not typed to take args, but the kernel calls it with VerbArgs; JS ignores
      // the extra argument. Record via the closure to assert reach.
      seen.push({ verb: 'status', args: { positionals: [], flags: {} } });
      return { attached: true, events: ['session.start'] as const };
    },
  };
  return { plugin: defineRuntimePlugin({ name: 'fake-tap', eventTap }), seen };
}

// A minimal fake memory port — only the verbs a test exercises, cast to the full
// MemoryStrategy (the kernel never calls the unimplemented verbs). Proves the
// SECOND capability route + that a verb receives the parsed argv tail.
function fakeMemoryPlugin() {
  const calls: VerbArgs[] = [];
  const memory = {
    home(args: VerbArgs) {
      return `/homes/${args.flags.name ?? 'default'}`;
    },
    echo(args: VerbArgs) {
      calls.push(args);
      return args;
    },
    boom() {
      throw new Error('kaboom');
    },
  } as unknown as MemoryStrategy;
  return { plugin: defineRuntimePlugin({ name: 'fake-mem', memory }), calls };
}

describe('loader / RuntimeHost', () => {
  it('registers a plugin and binds its provided capability', () => {
    const { plugin } = fakeEventTapPlugin();
    const host = new RuntimeHost().register(plugin);
    expect(host.capabilities()).toEqual(['eventTap']);
    expect(host.resolve('eventTap').pluginName).toBe('fake-tap');
  });

  it('capabilitiesOf reports only present ports', () => {
    const { plugin } = fakeEventTapPlugin();
    expect(capabilitiesOf(plugin)).toEqual(['eventTap']);
  });

  it('resolve throws UnknownCapabilityError for an unbound / unknown capability', () => {
    const host = new RuntimeHost().register(fakeEventTapPlugin().plugin);
    expect(() => host.resolve('memory')).toThrow(UnknownCapabilityError);
    expect(() => host.resolve('telepathy')).toThrow(UnknownCapabilityError);
  });

  it('rejects a duplicate plugin name', () => {
    const host = new RuntimeHost().register(fakeEventTapPlugin().plugin);
    expect(() => host.register(fakeEventTapPlugin().plugin)).toThrow(
      /duplicate plugin name/,
    );
  });

  it('rejects a capability re-claim (no silent last-wins)', () => {
    const host = new RuntimeHost().register(
      defineRuntimePlugin({
        name: 'a',
        memory: {} as unknown as MemoryStrategy,
      }),
    );
    expect(() =>
      host.register(
        defineRuntimePlugin({
          name: 'b',
          memory: {} as unknown as MemoryStrategy,
        }),
      ),
    ).toThrow(/already bound/);
  });

  it('rejects a plugin that provides no capability', () => {
    expect(() =>
      new RuntimeHost().register(defineRuntimePlugin({ name: 'empty' })),
    ).toThrow(/provides no capability/);
  });
});

describe('discover / bootstrap (host-install-based)', () => {
  it('an unresolvable specifier is skipped — not installed here', async () => {
    const found = await discover(['@cratylus/does-not-exist-xyz']);
    expect(found).toEqual([]);
  });

  it('bootstrap over no specifiers yields an empty host', async () => {
    const host = await bootstrap([]);
    expect(host.capabilities()).toEqual([]);
  });
});

describe('dispatch — happy path (the falsifier)', () => {
  it('routes <capability> <verb> to the port method and returns its result', async () => {
    const { plugin, seen } = fakeEventTapPlugin();
    const host = new RuntimeHost().register(plugin);
    const res = await dispatch(host, ['eventTap', 'status']);
    expect(res.code).toBe(0);
    expect(res.err).toBe('');
    expect(seen).toEqual([
      { verb: 'status', args: { positionals: [], flags: {} } },
    ]);
    expect(JSON.parse(res.out)).toEqual({
      attached: true,
      events: ['session.start'],
    });
  });

  it('routes the SECOND capability + hands the parsed argv tail to the verb', async () => {
    const { plugin, calls } = fakeMemoryPlugin();
    const host = new RuntimeHost().register(plugin);
    const res = await dispatch(host, [
      'memory',
      'echo',
      'pos1',
      '--flag',
      'val',
      '--bool',
    ]);
    expect(res.code).toBe(0);
    expect(calls[0]).toEqual({
      positionals: ['pos1'],
      flags: { flag: 'val', bool: true },
    });
    expect(JSON.parse(res.out)).toEqual({
      positionals: ['pos1'],
      flags: { flag: 'val', bool: true },
    });
  });

  it('serializes a bare string result as a newline-terminated line', async () => {
    const { plugin } = fakeMemoryPlugin();
    const host = new RuntimeHost().register(plugin);
    const res = await dispatch(host, ['memory', 'home', '--name', 'alice']);
    expect(res.code).toBe(0);
    expect(res.out).toBe('/homes/alice\n');
  });
});

describe('dispatch — fails LOUD (the control)', () => {
  it('unknown capability exits non-zero with a clear message', async () => {
    const host = new RuntimeHost().register(fakeEventTapPlugin().plugin);
    const res = await dispatch(host, ['telepathy', 'status']);
    expect(res.code).toBe(2);
    expect(res.out).toBe('');
    expect(res.err).toMatch(/unknown capability 'telepathy'/);
  });

  it('unknown verb exits non-zero and lists the available verbs', async () => {
    const host = new RuntimeHost().register(fakeEventTapPlugin().plugin);
    const res = await dispatch(host, ['eventTap', 'levitate']);
    expect(res.code).toBe(2);
    expect(res.out).toBe('');
    expect(res.err).toMatch(/unknown verb 'levitate'/);
    expect(res.err).toMatch(/status/); // the verb roster is surfaced
  });

  it('missing capability / verb exits non-zero (never a silent no-op)', async () => {
    const host = new RuntimeHost().register(fakeEventTapPlugin().plugin);
    expect((await dispatch(host, [])).code).toBe(2);
    expect((await dispatch(host, ['eventTap'])).code).toBe(2);
  });

  it('a throwing verb is a code-1 execution failure, distinct from not-found', async () => {
    const { plugin } = fakeMemoryPlugin();
    const host = new RuntimeHost().register(plugin);
    const res = await dispatch(host, ['memory', 'boom']);
    expect(res.code).toBe(1);
    expect(res.err).toMatch(/memory boom failed: kaboom/);
  });
});

describe('parseArgs / verbsOf', () => {
  it('parseArgs handles positionals, =flags, spaced flags, and booleans', () => {
    expect(parseArgs(['a', '--x=1', '--y', '2', '--z'])).toEqual({
      positionals: ['a'],
      flags: { x: '1', y: '2', z: true },
    });
  });

  it('verbsOf enumerates prototype methods of a class-instance port', () => {
    class Port {
      alpha() {}
      beta() {}
    }
    expect(verbsOf(new Port() as unknown as MemoryStrategy)).toEqual([
      'alpha',
      'beta',
    ]);
  });
});
