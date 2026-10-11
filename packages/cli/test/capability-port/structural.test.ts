import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { repositoryRoot } from '../concept-journal/fixture.js';
import {
  type Explanation,
  checkExplanation,
  checkToolExplanation,
  sentinelExplanation,
} from './explanation.js';
import {
  argv,
  files,
  host,
  openDecision,
  seedWindow,
  snapshot,
  success,
  toolJSON,
} from './fixture.js';
import { replaceRuntime } from './replacement.js';

describe('capability port: installed package', () => {
  it('example 1: command and omp tool reach the project without the source workspace', () => {
    const h = host();
    try {
      seedWindow(h);
      const command = h.concepts('state');
      // Ambient discovery, not only an explicit module load.
      h.offered(h.inspect([], ['concept_journal'], h.cwd, false));
      const wiring = h.inspect([{ verb: 'state' }]);
      h.offered(wiring);
      success(h.install);
      expect(toolJSON(wiring.results[0]!.result)).toEqual(command);
      expect(JSON.stringify(command)).toContain('delivery window');
      const bin = realpathSync(join(h.prefix, 'node_modules/.bin/cratylus'));
      expect(bin.startsWith(`${h.prefix}/`)).toBe(true);
      for (const root of [h.prefix, h.home])
        for (const path of files(root)) {
          expect(
            [h.prefix, h.home].some((owned) =>
              realpathSync(path).startsWith(`${owned}/`),
            ),
            path,
          ).toBe(true);
          if (!lstatSync(path).isSymbolicLink())
            expect(
              readFileSync(path).includes(Buffer.from(repositoryRoot)),
              path,
            ).toBe(false);
        }
      for (const value of [h.cwd, h.env.HOME, h.env.NODE_PATH, h.env.PATH])
        expect(value).not.toContain(repositoryRoot);
    } finally {
      h.dispose();
    }
  });

  it('example 2: routes share changes and the next installed runtime, not adapter state', () => {
    const h = host();
    try {
      seedWindow(h);
      const fromCommand = h.call({ verb: 'design' });
      expect(toolJSON(fromCommand.result)).toEqual(h.concepts('design'));
      expect(JSON.stringify(toolJSON(fromCommand.result))).toContain(
        'A two-hour interval.',
      );
      toolJSON(
        h.call({
          verb: 'supersede',
          concept: 'delivery window',
          context: 'booking',
          wording: 'A one-hour interval.',
          reason: 'Shorter deliveries.',
        }).result,
      );
      expect(JSON.stringify(h.concepts('design'))).toContain(
        'A one-hour interval.',
      );
      const adapter = snapshot(join(h.home, '.cratylus/omp/extensions'));
      const before = h.concepts('state');
      replaceRuntime(h);
      const after = h.concepts('state');
      expect(after).not.toEqual(before);
      expect(after.cut6Runtime).toBe('newer-installed-package');
      expect(toolJSON(h.call({ verb: 'state' }).result)).toEqual(after);
      const written = h.call({
        verb: 'define',
        concept: 'delivery promise',
        context: 'booking',
        wording: 'A promised window.',
        reason: 'Exercise the newer append behavior.',
      });
      expect(toolJSON(written.result).cut6Runtime).toBe(
        'newer-installed-package',
      );
      expect(toolJSON(h.call({ verb: 'state' }).result)).toEqual(
        h.concepts('state'),
      );
      expect(snapshot(join(h.home, '.cratylus/omp/extensions'))).toEqual(
        adapter,
      );
    } finally {
      h.dispose();
    }
  });

  it('example 3: every journal act is offered and all four readings agree', () => {
    const h = host();
    try {
      const offered = h.offered(h.inspect());
      expect(offered.parameters.required).toContain('verb');
      const explanation = h.concepts<Explanation>('--explain');
      expect(
        [...(offered.parameters.properties.verb!.enum as string[])].sort(),
      ).toEqual(explanation.verbs.map((verb) => verb.name).sort());
      for (const args of [
        {
          verb: 'context',
          context: 'booking',
          subject: 'Scheduling deliveries.',
        },
        {
          verb: 'define',
          concept: 'delivery window',
          context: 'booking',
          wording: 'A two-hour interval.',
          reason: 'Initial design.',
        },
        {
          verb: 'supersede',
          concept: 'delivery window',
          context: 'booking',
          wording: 'A one-hour interval.',
          reason: 'Shorter deliveries.',
        },
        {
          verb: 'retire',
          concept: 'delivery window',
          context: 'booking',
          reason: 'Stop scheduling deliveries.',
        },
        openDecision,
      ]) {
        const call = h.call(args);
        toolJSON(call.result);
        expect(call.approval).toBe('write');
      }
      expect(h.concepts('decisions').decisions).toEqual([
        expect.objectContaining({ id: 'window', status: 'open' }),
      ]);
      const beforeAccept = snapshot(join(h.cwd, 'design/journal'));
      const accepted = h.call({
        verb: 'accept',
        id: 'window',
        reason: 'We agree.',
      });
      toolJSON(accepted.result);
      expect(accepted.approval).toBe('write');
      const afterAccept = snapshot(join(h.cwd, 'design/journal'));
      for (const [path, bytes] of Object.entries(beforeAccept))
        expect(afterAccept[path]).toBe(bytes);
      expect(Object.keys(afterAccept)).toHaveLength(
        Object.keys(beforeAccept).length + 1,
      );
      expect(h.concepts('decisions').decisions).toEqual([
        expect.objectContaining({ id: 'window', status: 'accepted' }),
      ]);
      for (const args of [
        { verb: 'state' },
        { verb: 'design' },
        { verb: 'history', concept: 'delivery window', context: 'booking' },
        { verb: 'decisions' },
      ]) {
        const call = h.call(args);
        expect(call.approval).toBe('read');
        expect(toolJSON(call.result)).toEqual(h.concepts(...argv(args)));
      }
    } finally {
      h.dispose();
    }
  });

  it('example 4: runtime explanations supply the entire offered interface', () => {
    const h = host();
    try {
      const explanation = checkExplanation(h);
      checkToolExplanation(h.offered(h.inspect()), explanation);
      const adapter = snapshot(join(h.home, '.cratylus/omp/extensions'));
      const sentinel = sentinelExplanation(explanation);
      replaceRuntime(h, sentinel);
      const changed = h.offered(h.inspect());
      checkToolExplanation(changed, sentinel, true);
      expect(snapshot(join(h.home, '.cratylus/omp/extensions'))).toEqual(
        adapter,
      );
    } finally {
      h.dispose();
    }
  });

  it('example 5: everything installed for omp carries a tool, never a hand-work recipe', () => {
    const h = host();
    try {
      const tool = h.offered(h.inspect());
      success(h.install);
      expect(Object.keys(h.placed).length).toBeGreaterThan(0);
      const explanation = h.concepts<Explanation>('--explain');
      const journalRecipe = new RegExp(
        String.raw`(?:pnpm\s+(?:exec\s+)?|npx\s+)?cratylus\s+concepts\s+(?:${explanation.verbs
          .map((verb) => verb.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('|')})\b`,
      );
      // Inspect every placed textual surface, including skills, roles, config,
      // and module source. Other capabilities' prose is not a journal recipe.
      for (const [path, bytes] of Object.entries(h.placed)) {
        const text = Buffer.from(bytes, 'base64').toString('utf8');
        if (
          realpathSync(join(h.home, path)) ===
          realpathSync(tool.sourceInfo.path)
        )
          continue;
        expect(text, path).not.toMatch(journalRecipe);
        expect(text, path).not.toMatch(
          /design\/journal|journal\/[^\s]+\.(?:json|jsonl)|append[^\n]{0,80}(?:journal file|ULID)/i,
        );
        if (/SKILL\.md$/i.test(path))
          expect(text, path).not.toMatch(
            /^(?:name:\s*|#\s+)["']?concept[ _-]journal["']?\s*$/im,
          );
      }
      // Module may invoke the runtime, but cannot carry its rules or descriptions.
      const moduleText = readFileSync(tool.sourceInfo.path, 'utf8');
      expect(moduleText).not.toMatch(
        /design\/journal|[0-9]A-HJKMNP|supersededBy|competingDescriptions/,
      );
    } finally {
      h.dispose();
    }
  });
});
