import { isDeepStrictEqual } from 'node:util';

export type RubricAssertion = Readonly<{
  kind: 'output-equals';
  path: string;
  value: unknown;
}>;
export type ExampleCheck =
  | Readonly<{
      kind: 'execution';
      execute: () => unknown | Promise<unknown>;
      expect: unknown;
    }>
  | Readonly<{
      kind: 'output-assertion';
      path: string;
      operator: 'equals' | 'contains' | 'truthy';
      value?: unknown;
      produce: () => unknown | Promise<unknown>;
    }>
  | Readonly<{
      kind: 'rubric';
      rubric: readonly Readonly<{
        id: string;
        points: number;
        assertion: RubricAssertion;
      }>[];
      produce: () => unknown | Promise<unknown>;
    }>;

export type Example = Readonly<{
  id: string;
  concept: string;
  situation: string;
  trigger: string;
  outcome: string;
  /** Run where a check is cheap and repeatable; absent, the example is judged
   *  by reading (decisions 0142, 0145). */
  check?: ExampleCheck;
}>;
export type CheckResult = Readonly<{
  /** `unchecked`: the example has no mechanical check and is judged by reading. */
  status: 'pass' | 'fail' | 'unchecked';
  shortfall?: string;
  score?: number;
  maxScore?: number;
  rubric?: readonly Readonly<{
    id: string;
    points: number;
    assertion: RubricAssertion;
  }>[];
}>;

export async function checkExample(example: Example): Promise<CheckResult> {
  validateExample(example);
  try {
    return await runCheck(example);
  } catch {
    return {
      status: 'fail',
      shortfall: 'the check could not produce a valid result',
    };
  }
}

async function runCheck(example: Example): Promise<CheckResult> {
  const check = example.check;
  if (check === undefined) return { status: 'unchecked' };
  switch (check.kind) {
    case 'execution': {
      const actual = await check.execute();
      return isDeepStrictEqual(actual, check.expect)
        ? { status: 'pass' }
        : {
            status: 'fail',
            shortfall: 'execution result did not match the expected outcome',
          };
    }
    case 'output-assertion': {
      const output = await check.produce();
      return assertionMatches(
        readPath(output, check.path),
        check.operator,
        check.value,
      )
        ? { status: 'pass' }
        : {
            status: 'fail',
            shortfall: `output assertion failed at ${check.path}`,
          };
    }
    case 'rubric': {
      const rubric = deepFreeze(clone(check.rubric));
      const output = await check.produce();
      const maxScore = rubric.reduce(
        (sum, criterion) => sum + criterion.points,
        0,
      );
      const score = rubric.reduce(
        (sum, criterion) =>
          sum +
          (assertionMatches(
            readPath(output, criterion.assertion.path),
            'equals',
            criterion.assertion.value,
          )
            ? criterion.points
            : 0),
        0,
      );
      return {
        status: score === maxScore ? 'pass' : 'fail',
        ...(score === maxScore
          ? {}
          : { shortfall: `fixed rubric scored ${score}/${maxScore}` }),
        score,
        maxScore,
        rubric,
      };
    }
  }
}

export function validateExample(example: Example): void {
  if (typeof example.outcome !== 'string' || example.outcome.trim() === '') {
    throw new Error(
      `Example ${example.id} has an unspecified outcome; state the outcome it shows.`,
    );
  }
  const check = example.check;
  if (check === undefined) return;
  if (typeof check !== 'object' || check === null)
    throw new Error(
      `Example ${example.id} has a check that is not one; give a mechanical check, or none to judge it by reading.`,
    );
  if (check.kind === 'execution') {
    if (typeof check.execute !== 'function' || !('expect' in check))
      throw new Error(
        `Example ${example.id} has an unspecified outcome: execution requires a callable check and an explicit expected result.`,
      );
    return;
  }
  if (check.kind === 'output-assertion') {
    if (
      typeof check.produce !== 'function' ||
      !check.path.trim() ||
      !['equals', 'contains', 'truthy'].includes(check.operator)
    )
      throw new Error(
        `Example ${example.id} has an unspecified outcome: output assertion is not mechanically checkable.`,
      );
    return;
  }
  if (check.kind === 'rubric') {
    if (
      typeof check.produce !== 'function' ||
      check.rubric.length === 0 ||
      check.rubric.some(
        (criterion) =>
          !criterion.id.trim() ||
          !Number.isFinite(criterion.points) ||
          criterion.points <= 0 ||
          criterion.assertion.kind !== 'output-equals' ||
          !criterion.assertion.path.trim(),
      )
    )
      throw new Error(
        `Example ${example.id} has an unspecified outcome: the fixed rubric is not mechanically checkable.`,
      );
    return;
  }
  throw new Error(
    `Example ${example.id} has a check of no kind it knows: give execution, output-assertion or rubric, or none to judge it by reading.`,
  );
}

export type FrozenExample = Readonly<{
  example: Example;
  history: readonly Readonly<{ reason: string; approvedBy: string }>[];
}>;
export type ApprovedExampleChange = Readonly<{
  example: Example;
  history: readonly Readonly<{ reason: string; approvedBy: string }>[];
}>;
export type ExampleBuilderAccess = Readonly<{
  examples: () => readonly Example[];
  get: (id: string) => Example | undefined;
  check: (id: string) => Promise<CheckResult>;
}>;
export type ArchitectAccess = Readonly<{
  confirm: (id: string) => Promise<FrozenExample>;
  approveChange: (
    id: string,
    reason: string,
    change: Partial<Omit<Example, 'id'>>,
  ) => ApprovedExampleChange;
  refreeze: (change: ApprovedExampleChange) => Promise<FrozenExample>;
}>;
export type ExampleLedger = Readonly<{
  builder: ExampleBuilderAccess;
  architect: ArchitectAccess;
}>;

type PendingChange = Readonly<{
  ledger: object;
  id: string;
  confirmed: FrozenExample;
}>;
const pendingExampleChanges = new WeakMap<object, PendingChange>();

export function createExampleLedger(
  examples: readonly Example[],
  architect: string,
): ExampleLedger {
  if (!architect.trim()) throw new Error('An architect identity is required.');
  const drafts = new Map<string, Example>();
  const confirmed = new Map<string, FrozenExample>();
  for (const source of examples) {
    validateExample(source);
    if (drafts.has(source.id))
      throw new Error(`Example id ${source.id} is duplicated.`);
    drafts.set(source.id, deepFreeze(clone(source)));
  }
  const ledger = {};
  const currentExample = (id: string): Example => {
    const frozen = confirmed.get(id);
    const draft = drafts.get(id);
    const example = frozen?.example ?? draft;
    if (!example) throw new Error(`No example with id ${id}.`);
    return example;
  };
  const builder: ExampleBuilderAccess = Object.freeze({
    examples: () =>
      deepFreeze(
        clone([
          ...drafts.values(),
          ...[...confirmed.values()].map(({ example }) => example),
        ]),
      ),
    get: (id) => {
      const example = confirmed.get(id)?.example ?? drafts.get(id);
      return example ? deepFreeze(clone(example)) : undefined;
    },
    check: (id) => checkExample(currentExample(id)),
  });
  const architectAccess: ArchitectAccess = Object.freeze({
    confirm: async (id) => {
      const example = drafts.get(id);
      if (!example) throw new Error(`No unconfirmed example with id ${id}.`);
      await showCanFail(example, 'confirm');
      const frozen = deepFreeze({
        example: clone(example),
        history: [],
      });
      drafts.delete(id);
      confirmed.set(id, frozen);
      return frozen;
    },
    approveChange: (id, reason, change) => {
      const frozen = confirmed.get(id);
      if (!frozen) throw new Error(`No confirmed example with id ${id}.`);
      if (!reason.trim())
        throw new Error('A reason is required to change a confirmed example.');
      const example = { ...clone(frozen.example), ...clone(change) };
      validateExample(example);
      const history = [...frozen.history, { approvedBy: architect, reason }];
      const approved = deepFreeze({ example, history });
      pendingExampleChanges.set(approved, {
        ledger,
        id,
        confirmed: frozen,
      });
      return approved;
    },
    refreeze: async (change) => {
      const pending = pendingExampleChanges.get(change);
      if (!pending || pending.ledger !== ledger)
        throw new Error(
          'Refreeze requires a change approved by this architect.',
        );
      if (confirmed.get(pending.id) !== pending.confirmed)
        throw new Error('The confirmed example changed after this approval.');
      await showCanFail(change.example, 'refreeze');
      const frozen = deepFreeze({
        example: clone(change.example),
        history: clone(change.history),
      });
      confirmed.set(pending.id, frozen);
      pendingExampleChanges.delete(change);
      return frozen;
    },
  });
  return Object.freeze({ builder, architect: architectAccess });
}

// A check is frozen only once it is shown it can fail, by running it; an example
// with no mechanical check is judged by reading, so there is nothing to run.
async function showCanFail(
  example: Example,
  action: 'confirm' | 'refreeze',
): Promise<void> {
  if (example.check === undefined) return;
  const result = await checkExample(example);
  if (result.status !== 'fail')
    throw new Error(
      action === 'confirm'
        ? 'Cannot confirm an example until its check has shown it can fail.'
        : 'Cannot refreeze an example until its changed check has shown it can fail.',
    );
}

export type HeldOutBuilderAccess = Readonly<{
  visible: () => readonly Example[];
}>;
export type HeldOutJudgmentAccess = Readonly<{
  judge: () => Promise<HeldOutReport>;
  revealFailure: (id: string) => Example;
  replaceRevealed: (id: string, replacement: Example) => void;
}>;
export type HeldOutSet = Readonly<{
  builderAccess: () => HeldOutBuilderAccess;
  judgmentAccess: () => HeldOutJudgmentAccess;
}>;
type HeldOutState = {
  hidden: Example[];
  visible: Example[];
  failedIds: Set<string>;
};
export type HeldOutReport = Readonly<{
  results: readonly Readonly<{ status: CheckResult['status'] }>[];
  failures: readonly Readonly<{ concept: string; shortfall: string }>[];
}>;
export function createHeldOutSet(
  visible: readonly Example[],
  heldOut: readonly Example[],
): HeldOutSet {
  const ids = new Set<string>();
  for (const example of [...visible, ...heldOut]) {
    validateExample(example);
    if (ids.has(example.id))
      throw new Error(
        `Example id ${example.id} is duplicated in judgment sets.`,
      );
    ids.add(example.id);
  }
  const state: HeldOutState = {
    hidden: [...clone(heldOut)].map((example) => deepFreeze(example)),
    visible: [...clone(visible)].map((example) => deepFreeze(example)),
    failedIds: new Set(),
  };
  const builder: HeldOutBuilderAccess = Object.freeze({
    visible: () => deepFreeze(clone(state.visible)),
  });
  const judgment: HeldOutJudgmentAccess = Object.freeze({
    judge: () => judgeHiddenCases(state),
    revealFailure: (id) => revealHiddenFailure(state, id),
    replaceRevealed: (id, replacement) =>
      replaceHiddenFailure(state, id, replacement),
  });
  return Object.freeze({
    builderAccess: () => builder,
    judgmentAccess: () => judgment,
  });
}
async function judgeHiddenCases(state: HeldOutState): Promise<HeldOutReport> {
  const results: { status: CheckResult['status'] }[] = [];
  const failures: { concept: string; shortfall: string }[] = [];
  state.failedIds.clear();
  for (const example of state.hidden) {
    const result = await checkExample(example);
    results.push({ status: result.status });
    if (result.status !== 'fail') continue;
    state.failedIds.add(example.id);
    failures.push({
      concept: example.concept,
      shortfall: result.shortfall ?? 'the outcome did not hold',
    });
  }
  return deepFreeze({ results, failures });
}
function revealHiddenFailure(state: HeldOutState, id: string): Example {
  if (!state.failedIds.has(id))
    throw new Error(`Held-out example ${id} has not failed in judgment.`);
  const example = state.hidden.find((candidate) => candidate.id === id);
  if (!example) throw new Error(`No held-out example with id ${id}.`);
  return clone(example);
}
function replaceHiddenFailure(
  state: HeldOutState,
  id: string,
  replacement: Example,
): void {
  const index = state.hidden.findIndex((example) => example.id === id);
  if (index < 0) throw new Error(`No held-out example with id ${id}.`);
  const revealed = revealHiddenFailure(state, id);
  validateExample(replacement);
  if (
    replacement.id === id ||
    state.hidden.some((example) => example.id === replacement.id) ||
    state.visible.some((example) => example.id === replacement.id)
  )
    throw new Error('Replacement must be a new held-out example.');
  state.visible.push(deepFreeze(clone(revealed)));
  state.hidden[index] = deepFreeze(clone(replacement));
  state.failedIds.delete(id);
}

function assertionMatches(
  actual: unknown,
  operator: 'equals' | 'contains' | 'truthy',
  expected: unknown,
): boolean {
  if (operator === 'equals') return isDeepStrictEqual(actual, expected);
  if (operator === 'truthy') return Boolean(actual);
  return typeof actual === 'string'
    ? actual.includes(String(expected))
    : Array.isArray(actual) &&
        actual.some((item) => isDeepStrictEqual(item, expected));
}
function readPath(value: unknown, path: string): unknown {
  let current = value;
  for (const part of path.split('.')) {
    if (Array.isArray(current)) {
      const index = Number(part);
      if (!Number.isInteger(index)) return undefined;
      current = current[index];
    } else if (
      current !== null &&
      typeof current === 'object' &&
      part in current
    ) {
      current = Reflect.get(current, part);
    } else {
      return undefined;
    }
  }
  return current;
}
function clone<T>(value: T): T {
  if (Array.isArray(value)) return value.map((entry) => clone(entry)) as T;
  if (value && typeof value === 'object') {
    const copy: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) copy[key] = clone(entry);
    return copy as T;
  }
  return value;
}
function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  const isReference =
    (typeof value === 'object' && value !== null) ||
    typeof value === 'function';
  if (!isReference) return value;
  const reference = value as object;
  if (seen.has(reference)) return value;
  seen.add(reference);
  for (const key of Reflect.ownKeys(reference)) {
    const descriptor = Object.getOwnPropertyDescriptor(reference, key);
    if (!descriptor) continue;
    if ('value' in descriptor) deepFreeze(descriptor.value, seen);
    else {
      if (descriptor.get) deepFreeze(descriptor.get, seen);
      if (descriptor.set) deepFreeze(descriptor.set, seen);
    }
  }
  Object.freeze(reference);
  return value;
}
