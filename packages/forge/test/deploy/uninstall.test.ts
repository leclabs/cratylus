import { describe, expect, it } from 'vitest';
import { lineHunks, undoHunks } from '../../src/deploy/manifest.js';

describe('uninstall manifest line edits', () => {
    const doc = 'a: 1\nb: 2\nc: 3\n';

    it('takes two separate insertions out and leaves the lines between them', () => {
      const after = 'a: 1\nx: 9\nb: 2\nc: 3\ny: 8\n';
      const hunks = lineHunks(doc, after);
      expect(hunks).toHaveLength(2);
      const host = after.replace('b: 2', 'b: host');
      const { text, results } = undoHunks(host, hunks);
      expect(text).toBe('a: 1\nb: host\nc: 3\n');
      expect(results.map((r) => r.state)).toEqual(['undone', 'undone']);
    });

    it('records a last line install had to end apart from the lines appended beneath it', () => {
      const hunks = lineHunks('a: 1\nb: 2', 'a: 1\nb: 2\nnew: 1\n');
      expect(hunks.map((h) => [h.before, h.after])).toEqual([
        [['b: 2'], ['b: 2\n']],
        [[], ['new: 1\n']],
      ]);
    });

    it('takes a block out line by line: the host’s changed line stays under the headers it was written beneath', () => {
      const before = 'top: 1\n';
      const after = `${before}block:\n  keep: 1\n  drop: 2\n  other:\n    deep: 3\n`;
      const hunks = lineHunks(before, after);
      expect(hunks).toHaveLength(1);
      const host = after.replace('deep: 3', 'deep: host');
      const { text, results } = undoHunks(host, hunks);
      expect(text).toBe('top: 1\nblock:\n  other:\n    deep: host\n');
      expect(results[0]?.state).toBe('partial');
      expect(results[0]?.changed).toEqual(['    deep: 3\n']);
      expect(results[0]?.holding).toEqual(['block:\n', '  other:\n']);
    });

    it('restores a replaced line, and an unterminated last line, exactly', () => {
      const before = 'a: 1\nb: [x]';
      const after = 'a: 1\nb: [x, y]';
      expect(undoHunks(after, lineHunks(before, after)).text).toBe(before);
      const grown = 'a: 1\nb: [x]\nnew: 1';
      expect(undoHunks(grown, lineHunks(before, grown)).text).toBe(before);
    });

    it('touches nothing when the host changed what was written', () => {
      const after = 'a: 1\nx: 9\nb: 2\nc: 3\n';
      const hunks = lineHunks(doc, after);
      const host = after.replace('x: 9', 'x: host');
      const undone = undoHunks(host, hunks);
      expect(undone.text).toBe(host);
      expect(undone.results.map((r) => r.state)).toEqual(['changed']);
    });

    it('reads a line the host put back itself as restored', () => {
      const before = 'a: [x]\nb: 2\n';
      const after = 'a: [x, y]\nb: 2\n';
      const undone = undoHunks(before, lineHunks(before, after));
      expect(undone.text).toBe(before);
      expect(undone.results.map((r) => r.state)).toEqual(['restored']);
    });
  });
