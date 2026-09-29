// ⚠ PROVISIONAL PATH — see `src/ports/provisional-mailbox.ts`: the mailbox's anchor is
// undiscovered and is /signify's to derive, so nothing here coins one.
//
// The one law this file holds the store to: a claim is atomic under concurrent producers.
// `tmp → rename → ready`, because `rename(2)` is atomic within a filesystem and an append
// is not. FALSIFIER — a read-then-delete claim DESTROYS deposits that land in its gap, and
// duplicates what two drainers read at once; this file fails on exactly that.

import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EnvelopeStore } from '../src/capabilities/provisional-mailbox/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', 'src');

function tmp(): string {
  return mkdtempSync(join(tmpdir(), 'cratylus-mailbox-'));
}

describe('accept 2: the drain is atomic under concurrent producers', () => {
  it('destroys nothing and duplicates nothing while producers race the claim', async () => {
    const store = new EnvelopeStore({ dir: tmp() });
    const PRODUCERS = 8;
    const PER = 40;
    const TOTAL = PRODUCERS * PER;

    let producersDone = false;
    const produced = Promise.all(
      Array.from({ length: PRODUCERS }, (_, p) =>
        (async () => {
          for (let i = 0; i < PER; i++) {
            await store.deposit(
              { id: p * PER + i },
              `producer-${p}`,
              Date.now(),
            );
          }
        })(),
      ),
    ).then(() => {
      producersDone = true;
    });

    const seen = new Set<number>();
    const duplicates: number[] = [];
    const take = (envelopes: { body: unknown }[]) => {
      for (const e of envelopes) {
        const { id } = e.body as { id: number };
        if (seen.has(id)) duplicates.push(id);
        seen.add(id);
      }
    };

    // Claim in a tight loop WHILE the producers are still depositing — the whole
    // point is that a claim and a deposit are in flight at the same instant.
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      take(await store.claim());
      if (producersDone) break;
      await new Promise((r) => setImmediate(r));
    }
    await produced;
    // Two settling claims: anything deposited after the loop's last claim must
    // still be recoverable — a deposit that races a claim is delayed, never lost.
    take(await store.claim());
    take(await store.claim());

    expect(duplicates).toEqual([]);
    const missing = Array.from({ length: TOTAL }, (_, i) => i).filter(
      (i) => !seen.has(i),
    );
    expect(missing).toEqual([]);
    expect(seen.size).toBe(TOTAL);
  });

  it('hands each envelope to exactly one of two concurrent drainers', async () => {
    const store = new EnvelopeStore({ dir: tmp() });
    const TOTAL = 200;
    for (let i = 0; i < TOTAL; i++) {
      await store.deposit({ id: i }, 'seed', Date.now());
    }

    const claimed: number[] = [];
    const drainer = async () => {
      for (let round = 0; round < 40; round++) {
        for (const e of await store.claim()) {
          claimed.push((e.body as { id: number }).id);
        }
        await new Promise((r) => setImmediate(r));
      }
    };
    await Promise.all([drainer(), drainer()]);

    expect(claimed.length).toBe(TOTAL);
    expect(new Set(claimed).size).toBe(TOTAL);
    expect(await store.pending()).toBe(0);
  });

  it('reports pending accurately and returns empty when there is nothing', async () => {
    const store = new EnvelopeStore({ dir: tmp() });
    expect(await store.claim()).toEqual([]);
    expect(await store.pending()).toBe(0);
    await store.deposit({ n: 1 }, 'local', 111);
    await store.deposit({ n: 2 }, 'local', 222);
    expect(await store.pending()).toBe(2);
    const got = await store.claim();
    expect(got.map((e) => e.body)).toEqual([{ n: 1 }, { n: 2 }]);
    expect(got[0]?.source).toBe('local');
    expect(got[0]?.at).toBe(111);
    expect(await store.pending()).toBe(0);
    expect(await store.claim()).toEqual([]);
  });
});
