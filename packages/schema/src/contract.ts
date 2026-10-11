// ─────────────────────────────────────────────────────────────────────────────
// TYPED HANDOFFS — the JSON Schema an agent's assignment and deliverable carry, and
// the one check every handoff runs an assignment through.
//
// An agent hands work over and gets it back as JSON, never as prose a reader must
// trust: the assignment arrives as one fenced `assignment` block in the dispatch
// text, and the deliverable is the harness's own output schema. The schemas are the
// corpus's (its assignment and deliverable values carry them); this module states
// only their shape and the check.
//
// ONE CHECK, EVERY CALLER. The harness extension refusing a dispatch, a launch
// refusing a session and an evaluation refusing a scenario all ask `checkAssignment`,
// so an evaluation never gets a weaker input contract than a real dispatch.
//
// SELF-CONTAINED BY CONSTRUCTION. `assignmentIn` and `checkAssignment` reference
// nothing outside their own bodies, so a harness module that cannot import this
// package may carry their source verbatim (`String(checkAssignment)`) and run the
// very same check.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The JSON Schema subset a typed handoff is written in: an object's properties
 * and the ones it requires, an array's items and least length, a scalar's type
 * and allowed values. Plain JSON, so a harness reads it as its own output schema.
 */
export interface JsonSchema {
  readonly type?:
    | 'object'
    | 'array'
    | 'string'
    | 'boolean'
    | 'number'
    | 'integer'
    | 'null';
  readonly description?: string;
  readonly properties?: { readonly [field: string]: JsonSchema };
  readonly required?: readonly string[];
  /** The schema every property not named in `properties` must fit. */
  readonly additionalProperties?: JsonSchema | boolean;
  readonly items?: JsonSchema;
  readonly minItems?: number;
  readonly enum?: readonly (string | number | boolean)[];
}

/**
 * An agent's typed handoff: the schema its assignment must fit when it is
 * dispatched or launched, and the schema its deliverable must fit when it returns.
 * Either is absent where the agent's value carries none (free-text intent).
 */
export interface AgentContract {
  readonly assignment?: JsonSchema;
  readonly deliverable?: JsonSchema;
}

/** What `checkAssignment` found: every missing and every ill-typed field, by path. */
export interface ContractCheck {
  /** Required fields absent, as paths (`examples`, `outcomes[0].evidence`). */
  readonly missing: readonly string[];
  /** Fields present with the wrong type, too few items or a value not allowed, each with what was expected. */
  readonly illTyped: readonly string[];
  /** The refusal naming the agent and each field (`lead assignment is missing: examples`); absent when the assignment fits. */
  readonly reason?: string;
}

/**
 * The assignment a dispatch text carries: the JSON of its first fenced code block
 * with info string `assignment`. `undefined` when there is none; the block's raw
 * text when it is not JSON, which `checkAssignment` then names as ill-typed.
 */
export function assignmentIn(text: string): unknown {
  const block = /```assignment[ \t]*\r?\n([\s\S]*?)\r?\n?```/.exec(text);
  if (!block) return undefined;
  const raw = (block[1] ?? '').trim();
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/**
 * Check an assignment against an agent's assignment schema, naming each missing
 * and each ill-typed field. `undefined` (no assignment given) is missing every
 * required field. Nothing is coerced, defaulted or removed.
 */
export function checkAssignment(
  agent: string,
  schema: JsonSchema,
  value: unknown,
): ContractCheck {
  const missing: string[] = [];
  const illTyped: string[] = [];
  const visit = (s: JsonSchema, v: unknown, path: string): void => {
    const at = path || 'assignment';
    const actual =
      v === null
        ? 'null'
        : Array.isArray(v)
          ? 'array'
          : Number.isInteger(v)
            ? 'integer'
            : typeof v;
    if (
      s.type !== undefined &&
      actual !== s.type &&
      !(s.type === 'number' && actual === 'integer')
    ) {
      illTyped.push(`${at} (expected ${s.type})`);
      return;
    }
    if (s.enum !== undefined && !s.enum.some((allowed) => allowed === v)) {
      illTyped.push(`${at} (expected one of ${s.enum.join(', ')})`);
      return;
    }
    if (Array.isArray(v)) {
      if (s.minItems !== undefined && v.length < s.minItems)
        illTyped.push(
          `${at} (expected at least ${s.minItems} item${s.minItems === 1 ? '' : 's'})`,
        );
      if (s.items !== undefined)
        for (const [i, item] of v.entries())
          visit(s.items, item, `${path}[${i}]`);
      return;
    }
    if (typeof v !== 'object' || v === null) return;
    const record = v as Record<string, unknown>;
    const prefix = path ? `${path}.` : '';
    for (const field of s.required ?? [])
      if (record[field] === undefined) missing.push(`${prefix}${field}`);
    for (const [field, item] of Object.entries(record)) {
      if (item === undefined) continue;
      const declared = s.properties?.[field];
      if (declared !== undefined) visit(declared, item, `${prefix}${field}`);
      else if (s.additionalProperties === false)
        illTyped.push(`${prefix}${field} (not a field of this contract)`);
      else if (typeof s.additionalProperties === 'object')
        visit(s.additionalProperties, item, `${prefix}${field}`);
    }
  };
  if (value === undefined)
    for (const field of schema.required ?? []) missing.push(field);
  else visit(schema, value, '');
  const parts = [
    ...(missing.length > 0 ? [`is missing: ${missing.join(', ')}`] : []),
    ...(illTyped.length > 0 ? [`is ill-typed: ${illTyped.join(', ')}`] : []),
  ];
  return parts.length === 0
    ? { missing, illTyped }
    : { missing, illTyped, reason: `${agent} assignment ${parts.join('; ')}` };
}
