// ─────────────────────────────────────────────────────────────────────────────
// VERBS — the verbs each capability has, declared once beside the capability,
// each with its purpose in a line, which its help prints. A verb takes no
// arguments: it is called by its name alone, and `verbOf` refuses any token
// after it.
// ─────────────────────────────────────────────────────────────────────────────

/** One verb, declared once: its purpose in a line, which its help prints. */
export interface Verb {
  readonly purpose: string;
}

/** The verbs of a capability, by verb. */
export type Verbs<V extends string = string, T extends Verb = Verb> = {
  readonly [verb in V]: T;
};
