import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  type ContextView,
  type Host,
  assertDelivered,
  deliveredPath,
  document,
  installed,
  putDocument,
  qualified,
  snapshot,
  views,
} from '../../../../packages/cli/test/workflow-delivery/fixture.js';

let h: Host | undefined;
beforeEach(() => {
  vi.stubEnv('CRATYLUS_INSTALLATION', undefined);
  h = installed();
  h.env.CRATYLUS_INSTALLATION = undefined;
  putDocument(h);
});
afterEach(() => {
  h?.dispose();
  vi.unstubAllEnvs();
});

// Canonical comparison intentionally ignores names and provenance: the held-out
// premise is identical design content, but a different recorded identity.
function content(context: ContextView) {
  return {
    subject: context.subject,
    relation: context.relation,
    concepts: context.concepts
      .map((c) => ({
        name: c.name,
        wording: c.wording ?? c.meaning,
        builtFrom: c.builtFrom,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

it.each(['design', 'overview'])(
  'held-out workflow/1 — %s keeps identical wording separate when identities differ',
  (verb) => {
    const host = h!;
    const first = host.concepts<{ id: string }>(
      'context',
      'workflow',
      '--subject',
      document.subject,
      '--relation',
      document.relation,
    );
    expect(first.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(first.id).not.toBe(document.identity);
    for (const concept of [...document.concepts].reverse()) {
      host.concepts(
        'define',
        concept.name,
        '--context',
        'workflow',
        '--wording',
        concept.wording,
        '--reason',
        'Independently owned design with the same meaning.',
        ...concept.builtFrom.flatMap((name) => ['--built-from', name]),
      );
    }
    const before = snapshot(host.cwd);
    const released = readFileSync(deliveredPath(host), 'utf8');
    const answer = views(host, verb);
    const local = answer.find((c) => (c.name ?? c.context) === 'workflow');
    expect(local).toBeDefined();
    expect(content(local!)).toEqual(content(document));
    expect(local).not.toHaveProperty('delivered');
    expect(local!.readOnly).not.toBe(true);

    // Deliberately wrong reader stand-ins, enabled only for the red proof.
    // Each suppresses the delivered design without comparing recorded identity.
    const control = process.env.WORKFLOW_DELIVERY_NEGATIVE_CONTROL;
    const observed =
      control === 'same-name'
        ? answer.filter(
            (c) => c.delivered?.context !== (local!.name ?? local!.context),
          )
        : control === 'same-content'
          ? answer.filter(
              (c) =>
                !c.delivered ||
                JSON.stringify(content(c)) !== JSON.stringify(content(local!)),
            )
          : answer;
    expect(observed.map((c) => c.name ?? c.context).sort()).toEqual(
      [qualified, 'workflow'].sort(),
    );
    assertDelivered(
      observed.find((c) => (c.name ?? c.context) === qualified),
      verb,
    );
    const ownSelected = views(host, verb, '--context', 'workflow');
    expect(ownSelected).toHaveLength(1);
    expect(content(ownSelected[0]!)).toEqual(content(document));
    expect(ownSelected[0]).not.toHaveProperty('delivered');
    const deliveredSelected = views(host, verb, '--context', qualified);
    expect(deliveredSelected).toHaveLength(1);
    assertDelivered(deliveredSelected[0], verb);
    expect(snapshot(host.cwd)).toEqual(before);
    expect(readFileSync(deliveredPath(host), 'utf8')).toBe(released);
  },
);
