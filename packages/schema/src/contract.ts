// ─────────────────────────────────────────────────────────────────────────────
// TYPED HANDOFFS — the JSON Schema an agent's assignment and deliverable carry.
//
// An agent hands work over and gets it back as JSON, never as prose a reader must
// trust: the assignment arrives as one fenced `assignment` block in the dispatch
// text, and the deliverable is the harness's own output schema. The schemas are the
// corpus's (its assignment and deliverable values carry them); this module states
// only their shape.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The JSON Schema subset a typed handoff is written in: an object's properties
 * and the ones it requires, an array's items and least length, a scalar's type
 * and allowed values, and, at the top of an assignment, the alternative forms it
 * may take. Plain JSON, so a harness reads it as its own output schema.
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
  /** Alternative forms: a value fits when it fits any one of them. Read at the top level only. */
  readonly anyOf?: readonly JsonSchema[];
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
