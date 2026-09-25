// ─────────────────────────────────────────────────────────────────────────────
// HELD NAMES — how a name addresses one entity, and how it prints.
//
// A name is a label an entity's payload carries; the store knows no payload and
// no domain, so each domain says which entities hold a name, and this module
// alone decides which one an input addresses. A name held by one entity
// addresses it. A name a merge left held by more than one addresses none: the
// input must carry the holder's identity beside the name, and that is the one
// place an identity is accepted. An identity beside a name held once refuses,
// because the name alone addresses it.
//
// The printed form and the accepted form are one form: `name`, or
// `name (identity <id>)`. `printed` writes it and `parsed` reads it back, so
// every name a refusal or a view prints is an input that addresses the same
// entity.
// ─────────────────────────────────────────────────────────────────────────────

/** A name as it addresses an entity: bare, or with its holder's identity where
 *  the name is held by more than one. */
export type Name =
  | string
  | { readonly name: string; readonly identity: string };

/** A record id, the identity an entity is minted with: a ULID. */
export const IDENTITY = /[0-9A-HJKMNP-TV-Z]{26}/;

/** The printed form of an identified name. */
const IDENTIFIED = new RegExp(`^(.*) \\(identity (${IDENTITY.source})\\)$`);

/** A name's printed form: `gamma`, or `gamma (identity <id>)`. */
export function printed(name: Name): string {
  return typeof name === 'string'
    ? name
    : `${name.name} (identity ${name.identity})`;
}

/** An input read back as a name: the printed form of an identified name, or a
 *  bare one. */
export function parsed(input: string): Name {
  const match = IDENTIFIED.exec(input);
  return match
    ? { name: match[1] as string, identity: match[2] as string }
    : input;
}

/** The bare name `name` carries. */
export function bare(name: Name): string {
  return typeof name === 'string' ? name : name.name;
}

/**
 * The one entity among `holders` — every entity holding `name`'s bare name —
 * that `name` addresses, `undefined` when none does. A bare name held by more
 * than one refuses, listing each holder (as `describe` draws it, else its
 * printed name); an identity is accepted only beside a name held by more than
 * one, and only for one of its holders. `what` is the kind of entity, singular.
 */
export function addressed(
  what: string,
  name: Name,
  holders: readonly string[],
  describe: (entity: string) => string = (identity) =>
    JSON.stringify(printed({ name: bare(name), identity })),
): string | undefined {
  if (typeof name === 'string') {
    if (holders.length > 1)
      throw new Error(
        `the ${what} name ${JSON.stringify(name)} is held by ${holders.length} ${what}s — ${holders
          .map(describe)
          .join('; ')}; name one of them with its identity`,
      );
    return holders[0];
  }
  if (holders.length === 1 && holders[0] === name.identity)
    throw new Error(
      `${JSON.stringify(printed(name))} refused — the ${what} name ${JSON.stringify(name.name)} alone addresses it; drop the identity`,
    );
  return holders.length > 1 && holders.includes(name.identity)
    ? name.identity
    : undefined;
}
