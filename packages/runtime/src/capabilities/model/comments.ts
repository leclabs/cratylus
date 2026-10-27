// The comments of a script, blanked, so a test title only in a comment — a test
// that cannot run — binds nothing. A small scanner, not a parser: it knows the
// string, template and regular-expression literals a comment marker may sit in
// (`'http://x'`, `/\/\//`), and nothing else of the language.

/** Words after which a `/` begins a regular expression, not a division. */
const BEFORE_EXPRESSION = new Set([
  'return',
  'typeof',
  'instanceof',
  'in',
  'of',
  'new',
  'delete',
  'void',
  'throw',
  'case',
  'do',
  'else',
  'yield',
  'await',
]);

/** `source` with each comment blanked, every character of it but a line break
 *  made a space, so what is left keeps its lines and columns. String, template
 *  and regular-expression literals are kept whole. */
export function uncommented(source: string): string {
  const s = source;
  const n = s.length;
  const out = s.split('');
  const blank = (from: number, to: number) => {
    for (let k = from; k < to; k++) if (out[k] !== '\n') out[k] = ' ';
  };
  /** The brace depth outside each open `${` of a template. */
  const substitutions: number[] = [];
  let depth = 0;
  /** Whether what comes next is an operand, where `/` begins a regular expression. */
  let operand = true;

  /** From inside a template at `from`: the index after its closing backtick, or
   *  after the `${` it opens. */
  const template = (from: number): number => {
    let k = from;
    while (k < n) {
      const c = s[k];
      if (c === '\\') k += 2;
      else if (c === '`') return k + 1;
      else if (c === '$' && s[k + 1] === '{') {
        substitutions.push(depth);
        depth = 0;
        return k + 2;
      } else k++;
    }
    return n;
  };

  /** From inside a string quoted by `q` at `from`: the index after its end, or at
   *  the line break an unclosed one stops at. */
  const string = (from: number, q: string): number => {
    let k = from;
    while (k < n) {
      const c = s[k];
      if (c === '\\') k += 2;
      else if (c === q) return k + 1;
      else if (c === '\n') return k;
      else k++;
    }
    return n;
  };

  /** From inside a regular expression at `from`: the index after its closing `/`. */
  const regex = (from: number): number => {
    let k = from;
    let inClass = false;
    while (k < n) {
      const c = s[k];
      if (c === '\\') k += 2;
      else if (c === '\n') return k;
      else if (inClass) {
        if (c === ']') inClass = false;
        k++;
      } else if (c === '[') {
        inClass = true;
        k++;
      } else if (c === '/') return k + 1;
      else k++;
    }
    return n;
  };

  let i = 0;
  while (i < n) {
    const c = s[i] as string;
    if (c === '/' && s[i + 1] === '/') {
      const end = s.indexOf('\n', i);
      const to = end < 0 ? n : end;
      blank(i, to);
      i = to;
    } else if (c === '/' && s[i + 1] === '*') {
      const end = s.indexOf('*/', i + 2);
      const to = end < 0 ? n : end + 2;
      blank(i, to);
      i = to;
    } else if (c === '/' && operand) {
      i = regex(i + 1);
      operand = false;
    } else if (c === "'" || c === '"') {
      i = string(i + 1, c);
      operand = false;
    } else if (c === '`') {
      i = template(i + 1);
      operand = substitutions.length > 0 && s[i - 1] === '{';
    } else if (c === '}' && depth === 0 && substitutions.length > 0) {
      depth = substitutions.pop() as number;
      i = template(i + 1);
      operand = s[i - 1] === '{';
    } else if (/[\w$]/.test(c)) {
      let k = i + 1;
      while (k < n && /[\w$]/.test(s[k] as string)) k++;
      operand = BEFORE_EXPRESSION.has(s.slice(i, k));
      i = k;
    } else {
      if (c === '{') depth++;
      else if (c === '}') depth--;
      if (!/\s/.test(c)) operand = !(c === ')' || c === ']');
      i++;
    }
  }
  return out.join('');
}
