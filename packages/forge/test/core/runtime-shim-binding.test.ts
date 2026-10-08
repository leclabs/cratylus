// The RUNTIME-SHIM BINDING seam.
//
// The defect this pins: the projection emitted `scripts/<capability>.mjs` beside a
// SKILL.md but NOTHING bound that path INTO the body. A cell declaring `runtime:`
// carried a script it could not name, so every skill fell back to embedding the
// `cratylus` bin name as prose in its formal block — which is why zero cells
// ever declared `runtime:`, and why the bin name (an explicit PLACEHOLDER pending
// the brand derivation) became a contract pasted across generated markdown.
//
// The binding is RELATIVE to the skill's base directory, which the harness supplies
// at invocation. That keeps a deployed artifact free of any absolute or checkout
// path — an invariant the deploy census established and this test defends.

import { CLI_BIN } from '@cratylus/runtime/bin-name';
import { describe, expect, it } from 'vitest';
import { type ResolvedSkill, skillBody } from '../../src/core/body.js';
import { renderSkillCellBody } from '../../src/core/exemplify/skill-cell.js';

const BLOCK = 'a ≜ b\na ⇒ b';

function resolved(over: Partial<ResolvedSkill> = {}): ResolvedSkill {
  return {
    name: 'wake',
    trigger: '/wake',
    description: 'reconstitute an agent at session start',
    formalBlock: BLOCK,
    composedFrom: [],
    ...over,
  };
}

describe('runtime-shim binding', () => {

  it('emits NO binding when runtime is absent — the unchanged path', () => {
    const body = renderSkillCellBody({ verb: 'Wake', block: BLOCK });
    expect(body).not.toContain('scripts/');
    expect(body).not.toMatch(/Runtime capability/);
  });


  it('names the declared capability, not a hardcoded one', () => {
    const body = renderSkillCellBody({
      verb: 'Tap',
      block: BLOCK,
      runtime: { capability: 'eventTap' },
    });
    expect(body).toContain('scripts/eventTap.mjs');

  it('leaks NO absolute path, checkout path, or bin name into the body', () => {
    const body = skillBody(resolved({ runtime: { capability: 'eventTap' } }));
    // The whole point of the seam: the bin name has ONE home (the shim emitter),
    // never the projected markdown. A rebrand must not have to touch cells.
    expect(body).not.toContain(CLI_BIN);
    expect(body).not.toMatch(/(^|[\s`])\//m);
    expect(body).not.toContain('packages/');
  });

});
