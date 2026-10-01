// What a command wrote to each stream, line by line — the register is a claim about
// WHICH stream a line goes to, so a test of it has to read the two apart.

import { vi } from 'vitest';

export interface Captured {
  readonly rc: number;
  /** Lines written to stdout (the result). */
  readonly out: string[];
  /** Lines written to stderr (a failure, a warning). */
  readonly err: string[];
}

export async function capture(fn: () => Promise<number>): Promise<Captured> {
  const out: string[] = [];
  const err: string[] = [];
  const o = vi.spyOn(process.stdout, 'write').mockImplementation((s) => {
    out.push(String(s));
    return true;
  });
  const e = vi.spyOn(process.stderr, 'write').mockImplementation((s) => {
    err.push(String(s));
    return true;
  });
  let rc: number;
  try {
    rc = await fn();
  } finally {
    o.mockRestore();
    e.mockRestore();
  }
  const lines = (chunks: string[]): string[] =>
    chunks.join('').split('\n').slice(0, -1);
  return { rc, out: lines(out), err: lines(err) };
}
