import type { BehavioralCheck } from '@cratylus/runtime';
import {
  type Scenario as BaseScenario,
  type Recording,
  assess as baseAssess,
  check as baseCheck,
  parseAnswers as baseParse,
  rubricPrompt as baseRubric,
} from '../../execution-roles/check.js';
export type { Recording };
export type Scenario = Omit<BaseScenario, 'role'> & {
  role: BaseScenario['role'] | 'film-agent';
  ref: string;
  setup: string[][];
  noSkills?: boolean;
  history?: { user: string; assistant: string }[];
};
// The reused predicates compare role names as strings; their narrow role union
// predates consumer agents. No installed declaration is replaced by this adapter.
const compatible = (scenario: Scenario) => scenario as BaseScenario;
export function assess(scenario: Scenario, record: Recording) {
  const result = baseAssess(compatible(scenario), record);
  if (scenario.role === 'assayer')
    result['installed-role'] &&= record.wiring.active.includes('bash');
  return result;
}
export function check(scenario: Scenario): BehavioralCheck<Recording> {
  return {
    ...baseCheck(compatible(scenario)),
    judge: (record) => assess(scenario, record),
  };
}
export const parseAnswers = (text: string, scenario: Scenario) =>
  baseParse(text, compatible(scenario));
export const rubricPrompt = (scenario: Scenario, record: Recording) =>
  baseRubric(compatible(scenario), record);

export function assignment(
  scenario: Scenario,
): Record<string, unknown> | undefined {
  if (scenario.role === 'film-agent') return undefined; // Consumer identity has no workflow contract.
  const blocks = [
    ...scenario.prompt.matchAll(/```assignment\s*\n([\s\S]*?)\n```/g),
  ];
  if (blocks.length !== 1)
    throw new Error(`${scenario.role} assignment: expected one typed block`);
  const value = JSON.parse(blocks[0]![1]!);
  const fields =
    scenario.role === 'assayer'
      ? ['cut', 'workPackages', 'examples', 'decisions']
      : ['cut', 'concepts', 'examples', 'decisions'];
  for (const field of fields) {
    const valid =
      field === 'cut'
        ? typeof value[field] === 'string' && value[field].length > 0
        : Array.isArray(value[field]) &&
          value[field].every(
            (v: unknown) => typeof v === 'string' && v.length > 0,
          ) &&
          (value[field].length > 0 ||
            (scenario.role === 'assayer' && field === 'decisions'));
    if (!valid)
      throw new Error(
        `${scenario.role} assignment is missing or ill-typed: ${field}`,
      );
  }
  return value;
}
