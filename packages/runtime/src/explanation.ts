// ─────────────────────────────────────────────────────────────────────────────
// THE CAPABILITY INTERFACE — what a capability says of itself when asked to
// explain itself: its name, its purpose and when to reach for it, and for each
// verb the concept it acts on, its purpose, when to reach for it, whether it
// reads or appends, and each parameter with its description and JSON
// schema.
//
// Nothing here is worded. The capability declares its name and when beside its
// verbs; each verb declares its concept, when and effect beside its purpose,
// positional and flags, which its help and its reading of a call already use.
// This module only reads those declarations out as data, so the explanation, the
// help and what a verb takes are one declaration and cannot drift apart.
// ─────────────────────────────────────────────────────────────────────────────

import type { Flag, Verb, VerbFlags } from './verb-flags.js';

/** A verb that explains itself: beyond its purpose, positional and flags, the
 *  term of the concept it acts on, when to reach for it, and whether it only
 *  reads or appends to what it holds. */
export interface ExplainedVerb extends Verb {
  readonly concept: string;
  readonly when: string;
  readonly effect: Effect;
}

/** What a verb does to what its capability holds: only reads it, or appends to
 *  it. */
export type Effect = 'reads' | 'appends';

/** A capability that explains itself: its name, its purpose, when to reach for
 *  it, and its verbs, in the order it declares them. */
export interface CapabilityInterface {
  readonly name: string;
  readonly purpose: string;
  readonly when: string;
  readonly verbs: VerbFlags<string, ExplainedVerb>;
}

/** A parameter's JSON Schema. */
export type ParameterSchema =
  | { readonly type: 'string' }
  | { readonly type: 'string'; readonly enum: readonly string[] }
  | { readonly type: 'boolean' }
  | { readonly type: 'array'; readonly items: { readonly type: 'string' } };

/** One parameter of a verb, as explained. */
export interface ParameterExplanation {
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
  readonly schema: ParameterSchema;
  readonly positional?: true;
}

/** One verb, as explained. */
export interface VerbExplanation {
  readonly name: string;
  readonly concept: string;
  readonly purpose: string;
  readonly when: string;
  readonly effect: Effect;
  readonly parameters: readonly ParameterExplanation[];
}

/** A capability, as explained. */
export interface Explanation {
  readonly name: string;
  readonly purpose: string;
  readonly when: string;
  readonly verbs: readonly VerbExplanation[];
}

/** The schema of the values `flag` is given. */
function schemaOf(flag: Flag): ParameterSchema {
  if (flag.takes === 'switch') return { type: 'boolean' };
  if (flag.repeats === true)
    return { type: 'array', items: { type: 'string' } };
  if (flag.values !== undefined)
    return { type: 'string', enum: [...flag.values] };
  return { type: 'string' };
}

/** Verb `name`, declared as `verb`, as explained: its positional first, then
 *  its flags in the order it declares them. */
export function explainVerb(
  name: string,
  verb: ExplainedVerb,
): VerbExplanation {
  const parameters: ParameterExplanation[] = [];
  if (verb.positional !== null)
    parameters.push({
      name: verb.positional.name,
      description: verb.positional.description,
      required: verb.positional.optional !== true,
      schema: { type: 'string' },
      positional: true,
    });
  for (const [flag, spec] of Object.entries(verb.flags))
    parameters.push({
      name: flag,
      description: spec.description,
      required: spec.required === true,
      schema: schemaOf(spec),
    });
  return {
    name,
    concept: verb.concept,
    purpose: verb.purpose,
    when: verb.when,
    effect: verb.effect,
    parameters,
  };
}

/** `capability` as explained, its verbs in the order it declares them. */
export function explain(capability: CapabilityInterface): Explanation {
  return {
    name: capability.name,
    purpose: capability.purpose,
    when: capability.when,
    verbs: Object.entries(capability.verbs).map(([name, verb]) =>
      explainVerb(name, verb),
    ),
  };
}
