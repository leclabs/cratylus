// GATE — a cell names the ACT; the adapter computes the SELECTOR; a harness that
// cannot narrow SAYS SO.
//
// WHAT WAS WRONG. `stance-guardrail-pre` bound `tool.use.pre` and narrowed it with
// `matcher: 'AskUserQuestion|Agent|SendMessage'` — three claude tool names sitting on
// a shape whose entire claim is harness-neutrality. The claude adapter read the
// field; the codex adapter did not, dropped it, and said NOTHING. So on codex the
// guardrail's worker was spawned on every single tool call, and the render looked
// clean either way. The divergence was invisible to every gate that checks what IS
// emitted.
//
// WHY THERE IS NO TOOL VOCABULARY. The obvious repair — a canonical tool enum with
// per-adapter maps, in the shape `CanonicalEvent` already has — is a category error.
// Harnesses share a LIFECYCLE, which is closed; their TOOL SETS are open-world (MCP
// servers add tools at run time, users add their own, and two harnesses overlap only
// in shell/file primitives). A closed enum over a runtime-extensible set is
// permanently incomplete. The vocabulary was already the event vocabulary: the cell's
// own residue had factored three tool names into TWO ACTS four lines above the field
// that flattened them back.
//
// SO THIS FILE HOLDS THREE THINGS, and the third is the one that failed before:
//   1. the cell declares acts and NO selector — there is no field left to hold one;
//   2. claude COMPUTES the selector the cell no longer spells;
//   3. codex REPORTS the selector it cannot express, through the warnings channel it
//      already had. The gap was never the defect. The SILENCE was.

import {
  canonicalActToClaude,
  claudeHarnessAdapter,
} from '@cratylus/forge/adapters/claude';
import {
  canonicalActToCodex,
  codexHarnessAdapter,
} from '@cratylus/forge/adapters/codex';
import { hookIrOf } from '@cratylus/schema';
import type { Hook } from '@cratylus/schema/hook';
import { describe, expect, it } from 'vitest';
import { stanceGuardrailPre } from '../src/hooks/stance-guardrail-pre.js';
import { CANONICAL_EVENTS } from '../src/manifest.js';
import { harnessHookCells } from '../src/toolkit/hooks.js';

/** The acts, DERIVED from the claude bindings — never re-enumerated here. */
const ACTS = Object.keys(canonicalActToClaude).sort();

/** Lift a cell exactly as the projector does, for the adapter under test. */
function irFor(
  adapter: typeof claudeHarnessAdapter,
  cell = stanceGuardrailPre,
) {
  return hookIrOf(cell, adapter.hookCommand);
}

/** Project one hook through an adapter's own `hooks()` op. */
function project(adapter: typeof claudeHarnessAdapter, hook: Hook) {
  const render = adapter.hooks;
  if (!render) throw new Error(`${adapter.name} projects no hook surface`);
  return render([hook]);
}

/** The native entries an adapter emitted under one native event. */
function entriesUnder(
  settings: Record<string, unknown>,
  native: string,
): { matcher?: string }[] {
  return (settings[native] ?? []) as { matcher?: string }[];
}

describe('the ACT vocabulary — two members, and no tool enum', () => {
  it('both acts are ordinary members of the corpus tuple', () => {
    // They are not a second vocabulary living beside the events. An act IS an event:
    // a name for a moment, one the harness reaches through a tool rather than a
    // callback. That is the whole reason no tool enum was needed.
    for (const act of ACTS)
      expect(
        CANONICAL_EVENTS as readonly string[],
        `'${act}' is bound by a cell but signified nowhere`,
      ).toContain(act);
  });

  it('EXACTLY TWO, and both adapters bind the same two', () => {
    // A third act has no site in this corpus. The count is pinned so a future one
    // arrives as a signification decision rather than as an adapter-local addition.
    expect(ACTS).toHaveLength(2);
    expect(Object.keys(canonicalActToCodex).sort()).toEqual(ACTS);
  });

  it('claude answers each act with a SELECTOR; codex answers with a declared LOSS', () => {
    for (const act of ACTS) {
      expect(
        canonicalActToClaude[act]?.matcher,
        `claude binds '${act}' to no selector — the narrowing died in transit`,
      ).toBeTruthy();
      expect(
        canonicalActToCodex[act]?.unnarrowed,
        `codex binds '${act}' with neither a selector nor a stated reason — that is the silence this gate exists for`,
      ).toBeTruthy();
    }
  });
});

describe('the CELL declares the act and cannot declare a selector', () => {
  it('stance-guardrail-pre binds the two acts and nothing else', () => {
    expect([...stanceGuardrailPre.events].sort()).toEqual(ACTS);
  });

  it('NO hook cell carries a selector — the field does not exist to be filled', () => {
    // The structural half. `HookCell.matcher` is gone from the schema, so this can
    // only fail if someone re-adds the field; the compiler holds the rest.
    for (const cell of harnessHookCells)
      expect(
        Object.keys(cell),
        `${cell.id} carries a selector on the SOURCE cell`,
      ).not.toContain('matcher');
  });

  it('the IR that crosses to an adapter spells no vendor tool name', () => {
    // The lift is where a claude string used to leave the canon. Assert over the
    // WHOLE serialized IR rather than one field, so a selector smuggled in under
    // another name is caught too.
    const ir = JSON.stringify(irFor(claudeHarnessAdapter));
    for (const vendor of ['AskUserQuestion', 'SendMessage'])
      expect(
        ir,
        `the hook IR carries the vendor tool name ${vendor}`,
      ).not.toContain(vendor);
    expect(Object.keys(irFor(claudeHarnessAdapter))).not.toContain('matcher');
  });
});

describe('CLAUDE — the selector is COMPUTED at projection', () => {
  const { settings, warnings } = project(
    claudeHarnessAdapter,
    irFor(claudeHarnessAdapter),
  );

  it('both acts land on PreToolUse, each narrowed to the tools that perform it', () => {
    const matchers = entriesUnder(settings, 'PreToolUse')
      .map((e) => e.matcher)
      .sort();
    expect(matchers).toEqual(['Agent|SendMessage', 'AskUserQuestion']);
  });

  it('claude reports no loss — it can express both selectors', () => {
    expect(warnings).toEqual([]);
  });

  it('the narrowing is no WIDER than the string it replaced', () => {
    // The old cell matched `AskUserQuestion|Agent|SendMessage` in one entry. Two
    // entries over the same three tools is the same set of intercepted calls — the
    // repair must not have quietly loosened the guard.
    const covered = entriesUnder(settings, 'PreToolUse')
      .flatMap((e) => (e.matcher ?? '').split('|'))
      .sort();
    expect(covered).toEqual(['Agent', 'AskUserQuestion', 'SendMessage']);
  });
});

describe('CODEX — the loss is SPOKEN, and the hook still deploys', () => {
  const { settings, warnings, skipped } = project(
    codexHarnessAdapter,
    irFor(codexHarnessAdapter),
  );

  it('names BOTH acts it could not narrow, and the cell they came from', () => {
    // THE PROPERTY THE OLD TREE FAILED. `.render-ts-codex/hooks.json` carried no
    // matcher and the projection carried no warning; there was nothing anywhere to
    // read the divergence off.
    expect(warnings).toHaveLength(2);
    for (const act of ACTS)
      expect(
        warnings.join(' | '),
        `codex dropped the narrowing of '${act}' without saying so`,
      ).toContain(act);
    expect(warnings.join(' | ')).toContain('stance-guardrail-pre');
    expect(warnings.join(' | ')).toContain('agent_type');
  });

  it('reports without DROPPING — the guardrail still runs on codex', () => {
    // A codex agent with no stance guard at all was the older, worse failure. The
    // repair reports the degradation; it does not restore the outage.
    expect(skipped).toEqual([]);
    expect(entriesUnder(settings, 'PreToolUse').length).toBeGreaterThan(0);
  });

  it('registers the worker ONCE, though two acts collapse onto one native event', () => {
    // A doubling this repair could have introduced: both acts are `PreToolUse` here
    // and neither carries a selector, so a naive loop would spawn the worker twice
    // per tool call.
    const entries = entriesUnder(settings, 'PreToolUse');
    expect(entries).toHaveLength(1);
    expect(entries[0]?.matcher).toBeUndefined();
  });
});

describe('CONVICTING FIXTURE — the shape this replaced, projected to codex', () => {
  /** The pre-repair binding: a plain tool event, narrowed by a field codex ignored. */
  const legacyShape: Hook = {
    id: 'stance-guardrail-pre',
    events: ['tool.use.pre'],
    command: 'sh "$HOME/.codex/hooks/stance-guardrail-pre/x.sh"',
  };

  it('CONVICTS: the old binding projects to codex in TOTAL SILENCE', () => {
    // Run the SAME projector over the shape the cell used to have. `tool.use.pre` is
    // an ordinary mapped event, so codex emits it, narrows nothing, and — because
    // there is no act to declare a loss for — has nothing to say. That silence is
    // exactly what shipped, and it is what the act binding removed.
    const { settings, warnings, skipped } = project(
      codexHarnessAdapter,
      legacyShape,
    );
    expect(entriesUnder(settings, 'PreToolUse')).toHaveLength(1);
    expect(entriesUnder(settings, 'PreToolUse')[0]?.matcher).toBeUndefined();
    expect(warnings, 'the old shape warned about something').toEqual([]);
    expect(skipped).toEqual([]);
  });

  it('the live cell over the SAME projector does not go quiet', () => {
    // The control's other half: the difference is the CELL, not a change of judge.
    expect(
      project(codexHarnessAdapter, irFor(codexHarnessAdapter)).warnings.length,
    ).toBeGreaterThan(0);
  });
});
