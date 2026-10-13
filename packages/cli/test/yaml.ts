import { load } from 'js-yaml';

/** A YAML document read in-process as plain JSON data; a malformed document throws. */
export function parseYaml(text: string): unknown {
  return JSON.parse(JSON.stringify(load(text) ?? null));
}
