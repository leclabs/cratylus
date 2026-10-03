import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { adapterByName } from '../../forge/src/adapters/registry/index.js';
import { projectPluginSet } from '../../forge/src/project/index.js';
import canon from '../src/index.js';
import { dispatch } from '../src/skills/dispatch/skill.js';
import type { ContractFixtures } from './support/dispatch-contract/contracts.js';
const prompt = readFileSync(new URL('./fixtures/generated/delegation-prompt.md', import.meta.url), 'utf8');

const schemas = JSON.parse(readFileSync(new URL('./fixtures/dispatch-contract/seams.json', import.meta.url), 'utf8')) as ContractFixtures;
const returned = readFileSync(new URL('./fixtures/generated/subagent-return.md', import.meta.url), 'utf8');

async function projectedSkill(harness: 'claude' | 'omp') {
  const tree = await projectPluginSet({ plugins: [canon], adapter: adapterByName(harness), warn: () => {} });
  const file = tree.files.find((entry) => entry.path.includes('dispatch') && entry.path.endsWith('SKILL.md'));
  if (!file) throw new Error(`${harness} projection omitted dispatch skill`);
  return file.content;
}

describe('invocation-owned dispatch contracts', () => {
  it('requires strict per-call contracts and consumes parsed structured data', () => {
    expect(dispatch.formalBlock).toContain('outputSchema ∧ schemaMode: strict');
    expect(dispatch.formalBlock).toContain('contract(invocation) ≻ inherited ∨ session ∨ role defaults');
    expect(dispatch.formalBlock).toContain('consume parsed structuredOutput.data');
    expect(dispatch.formalBlock).toContain('unit(return) = unit(named by caller)');
  });

  it('projects the canonical skill through both supported adapters', async () => {
    for (const harness of ['claude', 'omp'] as const) {
      const text = await projectedSkill(harness);
      expect(text).toContain('outputSchema');
      expect(text).toContain('schemaMode: strict');
      expect(text).toContain('structuredOutput.data');
      expect(text).toContain('failed-dispatch');
      expect(text).toContain('automatic redispatch');
      expect(text).toContain('native Agent calls lack omp');
      expect(text).toContain('caller-owned intent');
      expect(text).toContain('defaults neither required nor authoritative');
    }
  });

  it('covers branch-specific closed schemas and unit pins', () => {
    const contracts = Object.values(schemas).flatMap((role) => Object.values(role));
    expect(contracts).toHaveLength(10);
    for (const schema of contracts) {
      expect(schema.type).toBe('object');
      expect(schema.additionalProperties).toBe(false);
      expect(schema.required.length).toBeGreaterThan(0);
    }
    for (const name of ['landed', 'blocked', 'achieved', 'not-achieved', 'whole', 'red']) {
      const schema = schemas.implementer[name] ?? schemas.assayer[name] ?? schemas.integrator[name];
      expect(schema.properties.unit?.const).toBe('strict-dispatch-returns');
    }
    expect(schemas.implementer.landed.required).toContain('commit');
    expect(schemas.implementer.blocked.required).toContain('reason');
    expect(schemas.assayer['not-achieved'].required).toContain('missing');
    expect(schemas.integrator.red.required).toContain('check');
    expect(schemas.integrator['plan-close'].required).toContain('releaseDisposition');
  });
  it('labels wrong-unit, missing-field, extra-property, and prose controls by the schema law', () => {
    const controls = readFileSync(new URL('./fixtures/dispatch-contract/controls.json', import.meta.url), 'utf8');
    expect(controls).toContain('"properties.unit.const"');
    expect(controls).toContain('"required.reason"');
    expect(controls).toContain('"additionalProperties.false"');
    expect(controls).toContain('"type.object"');
  });

  it('routes mismatches to the dispatcher without retry or lifecycle interpretation', () => {
    for (const text of [dispatch.formalBlock, prompt]) {
      expect(text).toContain('failed-dispatch');
      expect(text).toContain('automatic redispatch');
      expect(text).toContain('design note');
      expect(text).toContain('whole failure');
      expect(text).toContain('semantic assay verdict');
    }
  });

  it('preserves loop branches and explicitly names Claude enforcement limits', () => {
    for (const text of [dispatch.formalBlock, prompt]) {
      for (const branch of ['waiting', 'ready', 'closed', 'landed', 'blocked', 'achieved', 'not-achieved', 'whole', 'red', 'plan-close']) {
        expect(text).toContain(branch);
      }
      expect(text).toContain('lack omp');
      expect(text).toContain('--json-schema');
    }
  });

  it('keeps the return example structured and unit-addressed', () => {
    const value = JSON.parse(returned);
    expect(value).toEqual({ unit: 'strict-dispatch-returns', status: 'landed', commit: expect.any(String) });
  });
});
