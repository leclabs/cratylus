/**
 * E4.S4 — canonical event taxonomy round-trips.
 *
 * Ground truth: documented native event dialects per RETURN §2 —
 * claude PascalCase 27+ [CC6], codex 7 PascalCase [CX4], copilot 12 camelCase
 * [CP4], cursor camelCase ~20 [CU2], gemini 11 [GM4], cline 6 [CL2],
 * opencode plugin events (verified subset) [OC5].
 */

import { rmSync } from 'node:fs';
import { afterEach, describe, expect } from 'vitest';

import { claudeToCanonical } from '../../../src/adapters/claude/events.js';
import { codexToCanonical } from '../../../src/adapters/codex/events.js';
import { copilotToCanonical } from '../../../src/adapters/copilot/events.js';
import { cursorToCanonical } from '../../../src/adapters/cursor/events.js';
import { geminiToCanonical } from '../../../src/adapters/gemini/events.js';
import { opencodeToCanonical } from '../../../src/adapters/opencode/events.js';
import type { CanonicalEvent, Hook, IR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, adapterById, makeTmpDir, story } from '../helpers.js';
import { canonicalEvents, manifest } from './support.js';

/** Documented native event names per dialect (RETURN §2). */
const DOCUMENTED: Record<string, { events: readonly string[]; ref: string }> = {
  claude: {
    ref: '[CC6]',
    events: [
      'SessionStart',
      'Setup',
      'UserPromptSubmit',
      'UserPromptExpansion',
      'PreToolUse',
      'PermissionRequest',
      'PermissionDenied',
      'PostToolUse',
      'PostToolUseFailure',
      'PostToolBatch',
      'Notification',
      'MessageDisplay',
      'SubagentStart',
      'SubagentStop',
      'TaskCreated',
      'TaskCompleted',
      'Stop',
      'StopFailure',
      'TeammateIdle',
      'InstructionsLoaded',
      'ConfigChange',
      'CwdChanged',
      'FileChanged',
      'WorktreeCreate',
      'WorktreeRemove',
      'PreCompact',
      'PostCompact',
      'Elicitation',
      'ElicitationResult',
      'SessionEnd',
    ],
  },
  codex: {
    ref: '[CX4]',
    events: [
      'PreToolUse',
      'PostToolUse',
      'PreCompact',
      'PostCompact',
      'SessionStart',
      'UserPromptSubmit',
      'Stop',
    ],
  },
  copilot: {
    ref: '[CP4]',
    events: [
      'sessionStart',
      'preToolUse',
      'postToolUse',
      'postToolUseFailure',
      'permissionRequest',
      'agentStop',
      'subagentStart',
      'subagentStop',
      'errorOccurred',
      'notification',
      'userPromptSubmitted',
      'preCompact',
    ],
  },
  cursor: {
    ref: '[CU2]',
    events: [
      'sessionStart',
      'sessionEnd',
      'preToolUse',
      'postToolUse',
      'postToolUseFailure',
      'subagentStart',
      'subagentStop',
      'beforeShellExecution',
      'afterShellExecution',
      'beforeMCPExecution',
      'afterMCPExecution',
      'beforeReadFile',
      'afterFileEdit',
      'beforeSubmitPrompt',
      'preCompact',
      'stop',
      'afterAgentResponse',
      'afterAgentThought',
      'beforeTabFileRead',
      'afterTabFileEdit',
      'workspaceOpen',
    ],
  },
  gemini: {
    ref: '[GM4][GM8]',
    events: [
      'BeforeTool',
      'AfterTool',
      'BeforeAgent',
      'AfterAgent',
      'BeforeModel',
      'BeforeToolSelection',
      'AfterModel',
      'SessionStart',
      'SessionEnd',
      'Notification',
      'PreCompress',
    ],
  },
  cline: {
    ref: '[CL2]',
    events: [
      'PreToolUse',
      'PostToolUse',
      'UserPromptSubmit',
      'TaskStart',
      'TaskResume',
      'TaskCancel',
    ],
  },
};

/** opencode plugin events verified in current docs [OC5]; the rest of the
 * adapter's map is UNVERIFIED (not asserted absent). */
const OPENCODE_VERIFIED: Partial<Record<CanonicalEvent, string>> = {
  'tool.use.pre': 'tool.execute.before',
  'tool.use.post': 'tool.execute.after',
  'session.start': 'session.created',
  'file.edit.post': 'file.edited',
};

const REVERSE: Record<string, Record<string, CanonicalEvent>> = {
  claude: claudeToCanonical,
  codex: codexToCanonical,
  copilot: copilotToCanonical,
  cursor: cursorToCanonical,
  gemini: geminiToCanonical,
  opencode: opencodeToCanonical,
};

function requireAdapter(id: string) {
  const a = adapterById.get(id);
  if (!a) throw new Error(`unknown adapter '${id}'`);
  return a;
}

function nativeNames(id: string): string[] {
  const map = requireAdapter(id).eventMap ?? {};
  return Object.values(map).filter((v): v is string => Boolean(v));
}

const cleanups: string[] = [];
afterEach(() => {
  for (const dir of cleanups.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('E4.S4 · event taxonomy', () => {
  // ── dialect exactness: emitted native names ∈ documented set ──
  for (const id of ['claude', 'cursor', 'gemini'] as const) {
    story(
      'E4.S4',
      `${id}: every mapped native event name is documented, case-exact ${DOCUMENTED[id].ref}`,
      () => {
        const documented = new Set(DOCUMENTED[id].events);
        const undocumented = nativeNames(id).filter((n) => !documented.has(n));
        expect(undocumented).toEqual([]);
      },
    );
  }

  story(
    'E4.S4',
    'codex: documented subset of the map is case-exact [CX4]',
    () => {
      const documented = new Set(DOCUMENTED.codex.events);
      const good = nativeNames('codex').filter((n) => documented.has(n));
      expect(good.length).toBeGreaterThanOrEqual(5);
    },
  );

  story(
    'E4.S4',
    'codex: fabricated PermissionRequest is gone (documented set is 7 events) [CX4]',
    () => {
      const documented = new Set(DOCUMENTED.codex.events);
      expect(nativeNames('codex').filter((n) => !documented.has(n))).toEqual(
        [],
      );
    },
  );

  story.tracked(
    'E4.S4',
    'cline: fabricated TaskComplete/PreCompact are gone (documented set is 6 events) [CL2]',
    () => {
      const documented = new Set(DOCUMENTED.cline.events);
      expect(nativeNames('cline').filter((n) => !documented.has(n))).toEqual(
        [],
      );
    },
  );

  story(
    'E4.S4',
    'copilot: native names use the documented camelCase dialect, not PascalCase [CP4]',
    () => {
      const documented = new Set(DOCUMENTED.copilot.events);
      expect(nativeNames('copilot').filter((n) => !documented.has(n))).toEqual(
        [],
      );
    },
  );

  story(
    'E4.S4',
    'opencode: verified plugin events map with exact names [OC5]',
    () => {
      const map = requireAdapter('opencode').eventMap ?? {};
      for (const [canonical, native] of Object.entries(OPENCODE_VERIFIED)) {
        expect(map[canonical as CanonicalEvent]).toBe(native);
      }
    },
  );

  // ── toNative∘toCanonical identity over the supported set ──
  for (const id of [
    'claude',
    'codex',
    'copilot',
    'cursor',
    'gemini',
  ] as const) {
    story(
      'E4.S4',
      `${id}: toCanonical(toNative(e)) = e for every supported event`,
      () => {
        const adapter = requireAdapter(id);
        const map = adapter.eventMap ?? {};
        for (const e of adapter.capabilities.hooks.supported) {
          const native = map[e];
          expect(
            native,
            `${id} supports ${e} but eventMap lacks it`,
          ).toBeTruthy();
          expect(REVERSE[id][native as string]).toBe(e);
        }
      },
    );
  }

  story(
    'E4.S4',
    'cline: canonical→native mapping is injective over the supported set',
    () => {
      const adapter = requireAdapter('cline');
      const map = adapter.eventMap ?? {};
      const seen = new Map<string, CanonicalEvent>();
      for (const e of adapter.capabilities.hooks.supported) {
        const native = map[e];
        expect(native).toBeTruthy();
        expect(
          seen.get(native as string),
          `cline: ${native} claimed by both ${seen.get(native as string)} and ${e}`,
        ).toBeUndefined();
        seen.set(native as string, e);
      }
    },
  );

  story.tracked(
    'E4.S4',
    'opencode: toCanonical(toNative(e)) = e (agent.idle and turn.end collide on session.idle)',
    () => {
      const adapter = requireAdapter('opencode');
      const map = adapter.eventMap ?? {};
      for (const e of adapter.capabilities.hooks.supported) {
        const native = map[e];
        expect(native).toBeTruthy();
        expect(opencodeToCanonical[native as string]).toBe(e);
      }
    },
  );

  // ── supported + skipped = 28, skips named canonically ──
  for (const adapter of ALL_ADAPTERS) {
    story(
      'E4.S4',
      `${adapter.id}: count(supported) + count(skipped) = 28; skips name the canonical event`,
      async () => {
        const events = canonicalEvents();
        expect(events).toHaveLength(28);
        const cwd = makeTmpDir(`af-e4s4-${adapter.id}-`);
        cleanups.push(cwd);
        const hooks = events.map(
          (e): Hook => ({
            id: e.replace(/\./g, '-'),
            events: [e],
            command: 'echo x',
          }),
        );
        const ir: IR = { manifest: manifest(adapter.id), hooks };
        const report = await adapter.write(ir, 'project', cwd, {});

        const supported = new Set(adapter.capabilities.hooks.supported);
        const mentions = (e: CanonicalEvent) =>
          report.skipped.some(
            (s) =>
              s.path.includes(e) ||
              s.reason.includes(e) ||
              s.path.includes(e.replace(/\./g, '-')),
          );
        for (const e of events) {
          if (supported.has(e)) {
            expect(mentions(e), `${adapter.id} skipped supported ${e}`).toBe(
              false,
            );
          } else {
            expect(mentions(e), `${adapter.id} lost ${e} silently`).toBe(true);
          }
        }
        expect(report.skipped).toHaveLength(28 - supported.size);
      },
    );
  }

  // ── injectivity (acceptance amended 2026-07): per adapter, the
  // canonical→native map restricted to supported events must be INJECTIVE so
  // native→canonical is its exact inverse — two canonical events sharing one
  // native name make reimport unable to disambiguate. ──
  function collisions(adapterId: string): string[] {
    const map = requireAdapter(adapterId).eventMap ?? {};
    const byNative = new Map<string, string>();
    const out: string[] = [];
    for (const [canonical, native] of Object.entries(map)) {
      if (native == null) continue;
      const prior = byNative.get(native);
      if (prior) out.push(`${adapterId}: ${prior} + ${canonical} → ${native}`);
      else byNative.set(native, canonical);
    }
    return out;
  }

  for (const adapter of ALL_ADAPTERS.filter(
    (a) => a.id !== 'opencode' && a.eventMap,
  )) {
    story(
      'E4.S4',
      `${adapter.id}: canonical→native is injective (native→canonical is its exact inverse)`,
      () => {
        expect(collisions(adapter.id)).toEqual([]);
      },
    );
  }

  story.tracked(
    'E4.S4',
    'opencode: eventMap injective — agent.idle and turn.end must not collide on session.idle',
    () => {
      expect(collisions('opencode')).toEqual([]);
    },
  );
});
