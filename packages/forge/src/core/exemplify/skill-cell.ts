/**
 * The one skill-cell body generator, serving the OMP adapter skill projection. A PURE MAP
 * from parts to markdown: a verb H1, optional intro prose, the fenced `text`
 * formal block, and an optional "Composed from …" provenance line. There is NO
 * parsing, NO ``ref`` projection, NO `## Harness` selection, NO `≜`-line strip
 * — the σ* `block` is emitted VERBATIM inside the fence (the thin-generator law:
 * SKILL.md = f(name, formalBlock, composition), never a stored/re-parsed body).
 */
export function renderSkillCellBody(parts: {
  readonly verb: string;
  readonly block: string;
  readonly intro?: string;
  readonly composedFrom?: readonly string[];
  /** OPTIONAL doctrine-agnostic leading block (verbatim), emitted directly under the
   *  verb H1, above the formal block — the cell's own `Skill.preamble`. */
  readonly preamble?: string;
  /** OPTIONAL runtime-capability binding. Renders the one line that makes the
   *  projected thin shim REACHABLE — the shim is emitted as `scripts/<capability>.mjs`
   *  beside this SKILL.md, and without a binding the cell carries a script it cannot
   *  name. The path is RELATIVE to the skill's base directory (which the harness
   *  supplies at invocation), so no absolute or checkout path enters a deployed
   *  artifact and the binding stays harness-agnostic. */
  readonly runtime?: { readonly capability: string };
}): string {
  const preamble = parts.preamble ? `${parts.preamble}\n\n` : '';
  const intro = parts.intro ? `${parts.intro}\n\n` : '';
  const runtime = parts.runtime
    ? `\nRuntime capability \`${parts.runtime.capability}\` → \`scripts/${parts.runtime.capability}.mjs\`, resolved against this skill's base directory.\n`
    : '';
  const composed = parts.composedFrom?.length
    ? `\nComposed from ${parts.composedFrom.join(' · ')}.\n`
    : '';
  return `# ${parts.verb}\n\n${preamble}${intro}\`\`\`text\n${parts.block}\n\`\`\`\n${runtime}${composed}`;
}
