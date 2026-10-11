import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import {
  type Host,
  type TemporaryRepository,
  host,
  query,
  reportsUnknown,
  temporaryRepository,
  unknownEntry,
} from '../../../../packages/cli/test/delivery-journal/fixture.js';

let installed: Host;
let journal: TemporaryRepository;
beforeAll(() => {
  installed = host();
});
afterAll(() => {
  installed?.dispose();
});
beforeEach(() => {
  journal = temporaryRepository();
});
afterEach(() => {
  journal.dispose();
});

describe('delivery journal judgment', () => {
  it.each(['design', 'state', 'decisions'])(
    'workflow/1 — %s reports an entirely uninterpreted journal without inventing known content',
    (view) => {
      for (const n of [1, 2, 3]) unknownEntry(journal.root, n);
      const value = query(installed, journal.root, view);
      if (view === 'decisions') expect(value.decisions).toEqual([]);
      else expect(value.contexts).toEqual([]);
      reportsUnknown(value, { annotation: 3 });
    },
  );
});
