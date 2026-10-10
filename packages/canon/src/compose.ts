// ─────────────────────────────────────────────────────────────────────────────
// COMPOSITION — how an agent is made from the catalog.
//
// A role is a full default vector: one stated list per factor, every factor
// present (`roles/<role>.ts`). Its generic holder is that vector made an agent:
// each stated value becomes an `Entry` carrying its enforcement level (the
// factor's default unless stated). A persona is the residue over a role: its own
// mark, single values that replace the role's, set values that extend the role's,
// and reach it narrows. Everything it does not state is the role's.
//
// Composition REFUSES rather than silently ignores (master design §2): a persona
// that widens reach, removes or weakens a guardrail, states the role, takes from
// a set, names an unknown factor, or carries no mark of its own is never made.
// Every refusal is a `CompositionRefusal` whose message names what it refused.
// ─────────────────────────────────────────────────────────────────────────────

import {
  type DimensionManifest,
  type DimensionMeta,
  type EnforcementLevel,
  type Entry,
  type KebabToCamel,
  type Mark,
  type Value,
  anchorOf,
  kebabToCamel,
} from '@cratylus/schema';
import { type Agent, type Dimension, MANIFEST } from './manifest.js';

/** The factors an agent holds a field for: every factor that is not an attribute. */
type HeldFactor = {
  [D in Dimension]: (typeof MANIFEST)[D]['arity'] extends 'attribute'
    ? never
    : D;
}[Dimension];

/** The field a held factor occupies on a role cell and a composed agent. */
export type FactorField = KebabToCamel<HeldFactor>;

/** A value as a role or persona states it: bare, or with its level, slot or note. */
export type Stated<D extends string = string> =
  | Value<D>
  | {
      readonly value: Value<D>;
      readonly level?: EnforcementLevel | null;
      readonly slot?: string;
      readonly note?: string;
    };

/** A role: its full default vector, every non-attribute factor stated. */
export interface RoleCell {
  /** The role's anchor; the generic holder's name. */
  readonly name: string;
  readonly description: string;
  /** Roles carry no mark (the master design gives none). */
  readonly mark: Mark | null;
  readonly values: {
    readonly [D in HeldFactor as KebabToCamel<D>]: readonly Stated<D>[];
  };
}

/** A persona: what it states over its role, by field; everything else is the role's. */
export interface Residue {
  readonly name: string;
  readonly description: string;
  readonly mark: Mark;
  readonly values?: { readonly [field: string]: readonly Stated[] };
  readonly removes?: { readonly [field: string]: readonly Value<string>[] };
}

/** A composition the design forbids; the message names what was refused. */
export class CompositionRefusal extends Error {
  override readonly name = 'CompositionRefusal';
}

interface Held {
  readonly factor: string;
  readonly field: string;
  readonly meta: DimensionMeta;
}

const HELD: readonly Held[] = Object.entries(
  MANIFEST as unknown as DimensionManifest,
)
  .filter(([, meta]) => meta.arity !== 'attribute')
  .map(([factor, meta]) => ({ factor, field: kebabToCamel(factor), meta }));

const BY_FIELD = new Map(HELD.map((held) => [held.field, held]));

/** Enforcement levels from weakest to strongest; `null` holds weakest of all. */
const STRENGTH: readonly (EnforcementLevel | null)[] = [
  null,
  'advisory',
  'firm',
  'fixed',
];

function refuse(message: string): never {
  throw new CompositionRefusal(message);
}

type StatedObject = Exclude<Stated, Value<string>>;

const statedObject = (stated: Stated): StatedObject =>
  typeof stated === 'object' && stated !== null && 'value' in stated
    ? stated
    : { value: stated };

function entryOf(stated: Stated, held: Held): Entry {
  const { value, level, slot, note } = statedObject(stated);
  return {
    value,
    level: level === undefined ? held.meta.level : level,
    ...(slot === undefined ? {} : { slot }),
    ...(note === undefined ? {} : { note }),
  };
}

function heldFactor(field: string, who: string): Held {
  return (
    BY_FIELD.get(field) ??
    refuse(
      `${who} states an unknown factor: ${field.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`,
    )
  );
}

/** A role's entries for one factor, checked against its arity; slots in slot order. */
function checked(role: string, held: Held, entries: Entry[]): Entry[] {
  const { factor, meta } = held;
  if (meta.arity === 'scalar' && entries.length !== 1)
    refuse(
      `role ${role} states ${entries.length} values for ${factor}, which holds exactly one`,
    );
  if (meta.required && entries.length === 0)
    refuse(`role ${role} holds no ${factor}; ${factor} may not be empty`);
  if (meta.arity !== 'slots') return entries;
  const slots = meta.slots ?? [];
  for (const entry of entries)
    if (!slots.some((slot) => slot.name === entry.slot))
      refuse(
        `role ${role} states ${factor} ${anchorOf(entry.value)} in no slot of ${factor}`,
      );
  return slots.map((slot) => {
    const filling = entries.filter((entry) => entry.slot === slot.name);
    if (filling.length !== 1)
      refuse(
        `role ${role} fills the ${factor} slot ${slot.name} ${filling.length} times; it takes exactly one value`,
      );
    return filling[0] as Entry;
  });
}

/** The identity face derived from a vector, followed by the vector itself. */
function agentOf(
  identity: {
    readonly name: string;
    readonly description: string;
    readonly mark: Mark | null;
    readonly holds: string;
  },
  vector: Readonly<Record<string, readonly Entry[]>>,
): Agent {
  const anchors = (field: string) =>
    (vector[field] ?? []).map((entry) => anchorOf(entry.value));
  const slotAnchor = (field: string, slot: string) => {
    const entry = (vector[field] ?? []).find((e) => e.slot === slot);
    return entry ? anchorOf(entry.value) : '';
  };
  const action = anchors('actionScope');
  const readOnly = action.length === 1 && action[0] === 'none';
  return {
    name: identity.name,
    description: identity.description,
    mark: identity.mark,
    key: null,
    holds: identity.holds,
    dispatches: anchors('handoffs'),
    routing: {
      tier: slotAnchor('model', 'tier'),
      effort: slotAnchor('model', 'effort'),
    },
    ...(readOnly ? { readOnly: true as const } : {}),
    ...vector,
  } as unknown as Agent;
}

function vectorOfCell(cell: RoleCell): Record<string, Entry[]> {
  const values = cell.values as unknown as Readonly<
    Record<string, readonly Stated[] | undefined>
  >;
  for (const field of Object.keys(values))
    heldFactor(field, `role ${cell.name}`);
  const vector: Record<string, Entry[]> = {};
  for (const held of HELD) {
    const stated = values[held.field];
    if (!Array.isArray(stated))
      refuse(`role ${cell.name} states no ${held.factor}`);
    vector[held.field] = checked(
      cell.name,
      held,
      stated.map((s) => entryOf(s, held)),
    );
  }
  return vector;
}

/** The generic holder of a role: the role's vector, named for the role. */
export function holder(cell: RoleCell): Agent {
  return agentOf(
    {
      name: cell.name,
      description: cell.description,
      mark: cell.mark,
      holds: cell.name,
    },
    vectorOfCell(cell),
  );
}

/** A persona over a role: the role's vector, then the residue's precedence. */
export function persona(over: RoleCell, residue: Residue): Agent {
  const who = `persona ${residue.name}`;
  if (!residue.mark) refuse(`${who} carries no mark`);
  if (
    over.mark &&
    over.mark.emoji === residue.mark.emoji &&
    over.mark.hue === residue.mark.hue
  )
    refuse(`${who} carries its role ${over.name}'s own mark`);
  const vector = vectorOfCell(over);

  for (const [field, stated] of Object.entries(residue.values ?? {})) {
    const held = heldFactor(field, who);
    const { factor, meta } = held;
    if (factor === 'role')
      refuse(`${who} states role; the role is ${over.name}'s`);
    const entries = vector[field] as Entry[];
    if (meta.arity === 'scalar') {
      if (stated.length !== 1)
        refuse(
          `${who} states ${stated.length} values for ${factor}, which holds exactly one`,
        );
      vector[field] = stated.map((s) => entryOf(s, held));
      continue;
    }
    if (meta.arity === 'slots') {
      for (const s of stated) {
        const entry = entryOf(s, held);
        if (entry.slot === undefined)
          refuse(
            `${who} states ${factor} ${anchorOf(entry.value)} without a slot`,
          );
        const at = entries.findIndex((e) => e.slot === entry.slot);
        if (at < 0)
          refuse(
            `${who} states ${factor} ${anchorOf(entry.value)} in ${entry.slot}, which is no slot of ${factor}`,
          );
        entries[at] = entry;
      }
      continue;
    }
    for (const s of stated) {
      const { value, level, note } = statedObject(s);
      const anchor = anchorOf(value);
      const at = entries.findIndex((e) => anchorOf(e.value) === anchor);
      if (at < 0) {
        if (meta.group === 'Reach')
          refuse(
            `${who} widens ${factor} with ${anchor}, which its role ${over.name} does not hold`,
          );
        entries.push(entryOf(s, held));
        continue;
      }
      const prev = entries[at] as Entry;
      const next: Entry = {
        ...prev,
        ...(level === undefined ? {} : { level }),
        ...(note === undefined ? {} : { note }),
      };
      if (
        factor === 'guardrails' &&
        STRENGTH.indexOf(next.level) < STRENGTH.indexOf(prev.level)
      )
        refuse(
          `${who} weakens the guardrail ${anchor} from ${prev.level} to ${next.level}`,
        );
      entries[at] = next;
    }
  }

  for (const [field, removed] of Object.entries(residue.removes ?? {})) {
    const { factor, meta } = heldFactor(field, who);
    const entries = vector[field] as Entry[];
    for (const value of removed) {
      const anchor = anchorOf(value);
      if (factor === 'guardrails')
        refuse(`${who} removes the guardrail ${anchor}`);
      if (meta.group !== 'Reach')
        refuse(
          `${who} removes ${anchor} from ${factor}; a persona extends sets, it never takes from them`,
        );
      const at = entries.findIndex((e) => anchorOf(e.value) === anchor);
      if (at < 0)
        refuse(
          `${who} removes ${anchor} from ${factor}, which its role ${over.name} does not hold`,
        );
      entries.splice(at, 1);
    }
  }

  return agentOf(
    {
      name: residue.name,
      description: residue.description,
      mark: residue.mark,
      holds: over.name,
    },
    vector,
  );
}
