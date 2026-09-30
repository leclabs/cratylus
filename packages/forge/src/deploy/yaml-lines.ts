// Reading a host-owned YAML file as LINES, for the two deploy steps that edit one by
// inserting text: `model-roles.ts` and `status-line.ts`.
//
// Neither reads the file with a YAML library or writes it with one, because a library
// that reads then serializes rewrites the operator's comments, quoting, key order and
// every key that is not the one being added — and those bytes must survive. What is
// needed instead is small: where each line ends, which lines are keys, and what a
// key's inline value is. That is all this holds, so the two editors read a file the
// same way and disagree about nothing.

/** One `key:` at the head of a line — quoted or plain. A plain key may not open with
 *  a YAML indicator, which is what keeps `- item`, `[a]`, `{a: b}` and `&a x: y`
 *  from reading as keys. */
export const TOP_LEVEL_KEY =
  /^(?:"([^"]*)"|'([^']*)'|((?!-(?:[ \t]|$))[^\s#'"[\]{}?&*!|>%@`,][^:#]*?))[ \t]*:(?:[ \t]|$)/;

/** `[text, terminator]` for each line, so the file's own line endings are kept. */
export function splitLines(text: string): [string, string][] {
  const lines: [string, string][] = [];
  const re = /([^\r\n]*)(\r\n|\n|\r|$)/gy;
  let m: RegExpExecArray | null = re.exec(text);
  while (m !== null && m.index < text.length) {
    lines.push([m[1] as string, m[2] as string]);
    m = re.exec(text);
  }
  return lines;
}

/** Whether a line carries nothing a YAML reader would take as content. */
export function isBlankOrComment(line: string): boolean {
  const t = line.trim();
  return t === '' || t.startsWith('#');
}

/** The key a `key: value` line names, or `undefined` when it is not one. */
export function keyOf(content: string): string | undefined {
  const m = TOP_LEVEL_KEY.exec(content);
  if (m === null) return undefined;
  return (m[1] ?? m[2] ?? m[3] ?? '').trim();
}

/** The value text on a line after its key's colon, comment removed. */
export function inlineValue(afterColon: string): string {
  return afterColon.replace(/(^|[ \t])#.*$/, '').trim();
}
